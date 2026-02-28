import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { filter, finalize, Subject, takeUntil } from 'rxjs';
Chart.register(...registerables);

import {
  AdminService,
  DashboardKpis, CaPoint,
  TopBoutiqueApi, TopProduitApi, CommandeRecente
} from '../../services/admin.service';

// ─── Interfaces VM (ViewModel) ────────────────────────────────────────────
export interface KpiCard {
  label: string; value: string; trend: string;
  trendUp: boolean; icon: string; iconClass: string;
}
export interface TopBoutiqueVM {
  rank: number; nom: string; ca: string; commandes: number; isTop: boolean;
}
export interface TopProduitVM {
  nom: string; boutique: string; ventes: number; barPct: number;
}
export interface CommandeVM {
  id:string;
  numero: string; date: string; client: string;
  boutique: string; montant: string;
  statut: string; statutLabel: string;
}
export interface NavItem {
  icon: string; label: string; route: string; active?: boolean; badge?: number;
}
export interface NavSection { label: string; items: NavItem[]; }



@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('caChart') caChartRef!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;

  today = new Date();
  activePeriod: '6m' | '12m' = '12m';

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen   = false;   // mobile: fermée par défaut
  isMobile      = false;
  commandeBadge = 0;

  navSections: NavSection[] = [
    { label: 'Principal', items: [
      { icon: '⊞',  label: 'Dashboard',   route: '/admin',             active: true },
      { icon: '🏪', label: 'Boutiques',   route: '/admin/boutiques'                 },
      { icon: '📦', label: 'Produits',    route: '/admin/produits'                  },
      { icon: '📋', label: 'Commandes',   route: '/admin/commandes'                 },
    ]},
    { label: 'Gestion', items: [
      { icon: '👥', label: 'Utilisateurs', route: '/admin/utilisateurs' },
      { icon: '🎉', label: 'Événements',   route: '/admin/evenements'   },
      { icon: '🏷️', label: 'Promotions',  route: '/admin/promotions'   },
    ]},
    { label: 'Système', items: [
      { icon: '⚙️', label: 'Paramètres',  route: '/admin/parametres'   },
      { icon: '📊', label: 'Statistiques',route: '/admin/statistiques'  },
    ]},
  ];

  // ─── Données ──────────────────────────────────────────────────────────────
  kpis:          KpiCard[]       = [];
  topBoutiques:  TopBoutiqueVM[] = [];
  topProduits:   TopProduitVM[]  = [];
  recentCommandes: CommandeVM[]  = [];

  // ─── États de chargement ──────────────────────────────────────────────────
  loadingKpis      = false;
  loadingChart     = false;
  loadingBoutiques = false;
  loadingProduits  = false;
  loadingCommandes = false;
  errorMessage     = '';

  private statutLabels: Record<string, string> = {
    en_attente: 'En attente', validee: 'Validée', preparee: 'En préparation',
    expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée'
  };

  constructor(
    private dashboardService: AdminService,
    private router: Router
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.checkMobile();
    this.loadAll();
    this.loadCommandeBadge();

    // Fermer sidebar au changement de route sur mobile
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isMobile) this.sidebarOpen = false;
    });
  }

  ngAfterViewInit(): void {
    // Le chart est construit après que les données CA sont chargées
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
  }

  // ─── Responsive ───────────────────────────────────────────────────────────
  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    // Sur desktop, la sidebar est toujours visible
    if (!this.isMobile) this.sidebarOpen = true;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeOnOverlay(): void {
    if (this.isMobile) this.sidebarOpen = false;
  }

  // ─── Chargement données ────────────────────────────────────────────────────
  loadAll(): void {
    this.errorMessage = '';
    this.loadKpis();
    this.loadCa();
    this.loadTopBoutiques();
    this.loadTopProduits();
    this.loadCommandes();
  }

  private loadKpis(): void {
    this.loadingKpis = true;
    this.dashboardService.getKpis().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingKpis = false)
    ).subscribe({
      next: data => this.kpis = this.mapKpis(data),
      error: () => this.errorMessage = 'Erreur lors du chargement des KPIs.'
    });
  }

  private loadCa(): void {
    this.loadingChart = true;
    this.dashboardService.getCaEvolution(this.activePeriod).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingChart = false)
    ).subscribe({
      next: data => this.buildChart(data),
      error: () => { /* chart reste vide */ }
    });
  }

  private loadTopBoutiques(): void {
    this.loadingBoutiques = true;
    this.dashboardService.getTopBoutiques().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingBoutiques = false)
    ).subscribe({
      next: data => this.topBoutiques = this.mapTopBoutiques(data),
      error: () => {}
    });
  }

  private loadTopProduits(): void {
    this.loadingProduits = true;
    this.dashboardService.getTopProduits().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingProduits = false)
    ).subscribe({
      next: data => this.topProduits = this.mapTopProduits(data),
      error: () => {}
    });
  }

  private loadCommandes(): void {
    this.loadingCommandes = true;
    this.dashboardService.getRecentCommandes().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingCommandes = false)
    ).subscribe({
      next: data => this.recentCommandes = this.mapCommandes(data),
      error: () => {}
    });
  }

  private loadCommandeBadge(): void {
    this.dashboardService.getCommandesBadge().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: badge => {
        this.commandeBadge = badge.en_attente;
        // Mettre à jour le badge dans la nav
        const nav = this.navSections[0].items.find(i => i.label === 'Commandes');
        if (nav) nav.badge = badge.en_attente;
      },
      error: () => {}
    });
  }

  // ─── Changement de période ─────────────────────────────────────────────────
  setPeriod(period: '6m' | '12m'): void {
    if (this.activePeriod === period) return;
    this.activePeriod = period;
    this.loadCa();
  }

  // ─── Mappers API → ViewModel ───────────────────────────────────────────────
  private mapKpis(d: DashboardKpis): KpiCard[] {
    const fmt = (n: number) => n >= 1_000_000
      ? (n / 1_000_000).toFixed(0) + 'M Ar'
      : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K' : String(n);

    return [
      {
        label: 'Boutiques actives',
        value: String(d.boutiques_actives.total),
        trend: `${d.boutiques_actives.variation >= 0 ? '+' : ''}${d.boutiques_actives.variation} ${d.boutiques_actives.periode}`,
        trendUp: d.boutiques_actives.variation >= 0,
        icon: '🏪', iconClass: 'boutiques'
      },
      {
        label: 'Produits référencés',
        value: d.produits_references.total.toLocaleString('fr-FR'),
        trend: `${d.produits_references.variation >= 0 ? '+' : ''}${d.produits_references.variation} ${d.produits_references.periode}`,
        trendUp: d.produits_references.variation >= 0,
        icon: '📦', iconClass: 'produits'
      },
      {
        label: 'Commandes totales',
        value: d.commandes_totales.total.toLocaleString('fr-FR'),
        trend: `${d.commandes_totales.variation >= 0 ? '+' : ''}${d.commandes_totales.variation} ${d.commandes_totales.periode}`,
        trendUp: d.commandes_totales.variation >= 0,
        icon: '📋', iconClass: 'commandes'
      },
      {
        label: 'CA total',
        value: fmt(d.ca_total.valeur),
        trend: `${d.ca_total.variation_pct >= 0 ? '+' : ''}${d.ca_total.variation_pct}% vs mois dern.`,
        trendUp: d.ca_total.variation_pct >= 0,
        icon: '💰', iconClass: 'ca'
      },
    ];
  }

  private mapTopBoutiques(data: TopBoutiqueApi[]): TopBoutiqueVM[] {
    return data.map(b => ({
      rank:      b.rang,
      nom:       b.boutique.nom,
      ca:        b.ca >= 1_000_000 ? (b.ca / 1_000_000).toFixed(0) + 'M Ar' : b.ca + ' Ar',
      commandes: b.commandes,
      isTop:     b.rang <= 3
    }));
  }

  private mapTopProduits(data: TopProduitApi[]): TopProduitVM[] {
    const max = data[0]?.ventes ?? 1;
    return data.map(p => ({
      nom:      p.produit.nom,
      boutique: p.boutique.nom,
      ventes:   p.ventes,
      barPct:   Math.round((p.ventes / max) * 100)
    }));
  }

  private mapCommandes(data: CommandeRecente[]): CommandeVM[] {
    return data.map(c => ({
      id: c._id,
      numero:   c.numero,
      date:     new Date(c.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }),
      client:   `${c.client.prenom} ${c.client.nom}`,
      boutique: c.boutique.nom,
      montant:  c.montant.toLocaleString('fr-FR') + ' Ar',
      statut:   c.statut,
      statutLabel: this.statutLabels[c.statut] ?? c.statut
    }));
  }

  // ─── Chart ────────────────────────────────────────────────────────────────
  private buildChart(points: CaPoint[]): void {
    if (!this.caChartRef) return;
    this.chart?.destroy();

    const labels = points.map(p => p.mois);
    const data   = points.map(p => p.valeur);
    const ctx    = this.caChartRef.nativeElement.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(45,74,62,0.18)');
    grad.addColorStop(1, 'rgba(45,74,62,0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'CA (Millions Ar)',
          data,
          borderColor: '#2d4a3e',
          backgroundColor: grad,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#2d4a3e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a18', padding: 10, cornerRadius: 8,
            callbacks: { label: c => ` ${c.parsed.y}M Ar` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#5c5c57' } },
          y: { grid: { color: '#f0ede8' }, border: { display: false },
               ticks: { font: { family: 'DM Sans', size: 11 }, color: '#5c5c57', callback: v => `${v}M` } }
        }
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  statutClass(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 's-attente', validee: 's-payee', preparee: 's-preparee',
      expediee: 's-prete', livree: 's-livree', annulee: 's-annulee'
    };
    return map[statut] ?? '';
  }

  viewCommande(cmd: CommandeVM): void {
    this.router.navigate(['/admin/commandes', cmd.id]);
  }

  // Skeleton array helper
  skeletonRows(n: number): number[] { return Array(n).fill(0); }

  get isPageLoading(): boolean {
    return this.loadingKpis || this.loadingChart || this.loadingBoutiques || this.loadingProduits || this.loadingCommandes;
  }
}
