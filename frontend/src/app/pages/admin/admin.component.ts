import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectorRef,
  Component, ElementRef,
  OnDestroy, OnInit,
  ViewChild
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { finalize, Subject, takeUntil } from 'rxjs';
Chart.register(...registerables);

import {
  AdminService,
  DashboardKpis, CaPoint,
  TopBoutiqueApi, TopProduitApi, CommandeRecente
} from '../../services/admin.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

// ─── View-model interfaces ────────────────────────────────────────────────────

export interface KpiCard {
  label: string;
  value: string;
  trendValue: string;
  trendLabel: string;
  trendUp: boolean;
  iconKey: 'boutique' | 'produit' | 'commande' | 'ca';
  color: string;
  bgColor: string;
  strokeColor: string;
}

export interface TopBoutiqueVM {
  rank: number;
  nom: string;
  ca: string;
  commandes: number;
  isTop: boolean;
}

export interface TopProduitVM {
  nom: string;
  boutique: string;
  ventes: number;
  barPct: number;
}

export interface CommandeVM {
  id: string;
  numero: string;
  date: string;
  client: string;
  boutique: string;
  montant: string;
  statut: string;
  statutLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin',
  standalone: true,
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
  commandeBadge = 0;
  errorMessage = '';

  // ─── Data ──────────────────────────────────────────────────────────────────
  kpis: KpiCard[] = [];
  topBoutiques: TopBoutiqueVM[] = [];
  topProduits: TopProduitVM[] = [];
  recentCommandes: CommandeVM[] = [];

  // ─── Loading flags ─────────────────────────────────────────────────────────
  loadingKpis = false;
  loadingChart = false;
  loadingBoutiques = false;
  loadingProduits = false;
  loadingCommandes = false;

  // ─── Statut labels ─────────────────────────────────────────────────────────
  private readonly statutLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    preparee: 'En préparation',
    expediee: 'Expédiée',
    livree: 'Livrée',
    annulee: 'Annulée'
  };

  // ─── KPI colour palette ────────────────────────────────────────────────────
  private readonly kpiPalette: Record<KpiCard['iconKey'], Pick<KpiCard, 'color' | 'bgColor' | 'strokeColor'>> = {
    boutique: { color: '#10b981', bgColor: '#d1fae5', strokeColor: '#059669' },
    produit: { color: '#f59e0b', bgColor: '#fef3c7', strokeColor: '#d97706' },
    commande: { color: '#3b82f6', bgColor: '#dbeafe', strokeColor: '#2563eb' },
    ca: { color: '#8b5cf6', bgColor: '#f3e8ff', strokeColor: '#7c3aed' },
  };

  constructor(
    private adminService: AdminService,
    private router: Router
  ) { }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAll();
    this.loadCommandeBadge();
  }

  ngAfterViewInit(): void {
    // Chart is built once CA data arrives via loadCa()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
  }

  // ─── Data loading ──────────────────────────────────────────────────────────

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
    this.adminService.getKpis().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingKpis = false)
    ).subscribe({
      next: data => this.kpis = this.mapKpis(data),
      error: () => this.errorMessage = 'Erreur lors du chargement des KPIs.'
    });
  }

  private loadCa(): void {
    this.loadingChart = true;
    this.adminService.getCaEvolution(this.activePeriod).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingChart = false)
    ).subscribe({
      next: data => this.buildChart(data),
      error: () => { }
    });
  }

  private loadTopBoutiques(): void {
    this.loadingBoutiques = true;
    this.adminService.getTopBoutiques().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingBoutiques = false)
    ).subscribe({
      next: data => this.topBoutiques = this.mapTopBoutiques(data),
      error: () => { }
    });
  }

  private loadTopProduits(): void {
    this.loadingProduits = true;
    this.adminService.getTopProduits().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingProduits = false)
    ).subscribe({
      next: data => this.topProduits = this.mapTopProduits(data),
      error: () => { }
    });
  }

  private loadCommandes(): void {
    this.loadingCommandes = true;
    this.adminService.getRecentCommandes().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loadingCommandes = false)
    ).subscribe({
      next: data => this.recentCommandes = this.mapCommandes(data),
      error: () => { }
    });
  }

  private loadCommandeBadge(): void {
    this.adminService.getCommandesBadge().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: badge => this.commandeBadge = badge.en_attente,
      error: () => { }
    });
  }

  // ─── Period switch ─────────────────────────────────────────────────────────

  setPeriod(period: '6m' | '12m'): void {
    if (this.activePeriod === period) return;
    this.activePeriod = period;
    this.loadCa();
  }

  // ─── API → ViewModel mappers ───────────────────────────────────────────────

  private mapKpis(d: DashboardKpis): KpiCard[] {
    const fmt = (n: number): string =>
      n >= 1_000_000 ? (n / 1_000_000).toFixed(0) + 'M Ar'
        : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K'
          : String(n);

    const makeCard = (
      label: string,
      value: string,
      variation: number,
      periode: string,
      iconKey: KpiCard['iconKey']
    ): KpiCard => ({
      label,
      value,
      trendValue: `${variation >= 0 ? '+' : ''}${variation}`,
      trendLabel: periode,
      trendUp: variation >= 0,
      iconKey,
      ...this.kpiPalette[iconKey]
    });

    return [
      makeCard(
        'Boutiques actives',
        String(d.boutiques_actives.total),
        d.boutiques_actives.variation,
        d.boutiques_actives.periode,
        'boutique'
      ),
      makeCard(
        'Produits référencés',
        d.produits_references.total.toLocaleString('fr-FR'),
        d.produits_references.variation,
        d.produits_references.periode,
        'produit'
      ),
      makeCard(
        'Commandes totales',
        d.commandes_totales.total.toLocaleString('fr-FR'),
        d.commandes_totales.variation,
        d.commandes_totales.periode,
        'commande'
      ),
      {
        label: 'CA total',
        value: fmt(d.ca_total.valeur),
        trendValue: `${d.ca_total.variation_pct >= 0 ? '+' : ''}${d.ca_total.variation_pct}%`,
        trendLabel: 'vs mois dernier',
        trendUp: d.ca_total.variation_pct >= 0,
        iconKey: 'ca',
        ...this.kpiPalette['ca']
      }
    ];
  }

  private mapTopBoutiques(data: TopBoutiqueApi[]): TopBoutiqueVM[] {
    return data.map(b => ({
      rank: b.rang,
      nom: b.boutique.nom,
      ca: b.ca >= 1_000_000 ? (b.ca / 1_000_000).toFixed(0) + 'M Ar' : b.ca + ' Ar',
      commandes: b.commandes,
      isTop: b.rang <= 3
    }));
  }

  private mapTopProduits(data: TopProduitApi[]): TopProduitVM[] {
    const max = data[0]?.ventes ?? 1;
    return data.map(p => ({
      nom: p.produit.nom,
      boutique: p.boutique.nom,
      ventes: p.ventes,
      barPct: Math.round((p.ventes / max) * 100)
    }));
  }

  private mapCommandes(data: CommandeRecente[]): CommandeVM[] {
    return data.map(c => ({
      id: c._id,
      numero: c.numero,
      date: new Date(c.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }),
      client: `${c.client.prenom} ${c.client.nom}`,
      boutique: c.boutique.nom,
      montant: c.montant.toLocaleString('fr-FR') + ' Ar',
      statut: c.statut,
      statutLabel: this.statutLabels[c.statut] ?? c.statut
    }));
  }

  // ─── Chart ─────────────────────────────────────────────────────────────────

  private buildChart(points: CaPoint[]): void {
    if (!this.caChartRef) return;
    this.chart?.destroy();

    const ctx = this.caChartRef.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(45,74,62,0.18)');
    grad.addColorStop(1, 'rgba(45,74,62,0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.mois),
        datasets: [{
          label: 'CA (Millions Ar)',
          data: points.map(p => p.valeur),
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
            backgroundColor: '#1a1a18',
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: c => ` ${c.parsed.y}M Ar` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'DM Sans', size: 11 }, color: '#5c5c57' }
          },
          y: {
            grid: { color: '#f0ede8' },
            border: { display: false },
            ticks: { font: { family: 'DM Sans', size: 11 }, color: '#5c5c57', callback: v => `${v}M` }
          }
        }
      }
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  statutClass(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 's-attente',
      validee: 's-payee',
      preparee: 's-preparee',
      expediee: 's-prete',
      livree: 's-livree',
      annulee: 's-annulee'
    };
    return map[statut] ?? '';
  }

  viewCommande(cmd: CommandeVM): void {
    this.router.navigate(['/admin/commandes', cmd.id]);
  }

  skeletonRows(n: number): number[] {
    return Array(n).fill(0);
  }

  get isPageLoading(): boolean {
    return this.loadingKpis || this.loadingChart
      || this.loadingBoutiques || this.loadingProduits
      || this.loadingCommandes;
  }
}
