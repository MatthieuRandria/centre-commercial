import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CommandeClient, CommandesFiltreStatut, CommandesService } from '../../services/commandes.services';
import { ReactiveFormsModule } from '@angular/forms';

export interface FilterTab {
  label:  string;
  value:  CommandesFiltreStatut;
}

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './client-commande.component.html',
  styleUrls: ['./client-commande.component.scss']
})
export class ClientCommandeComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ─── Données ──────────────────────────────────────────────────────────────
  commandes: CommandeClient[] = [];
  totalCommandes = 0;

  // ─── Filtres ──────────────────────────────────────────────────────────────
  filtreActif: CommandesFiltreStatut = 'toutes';

  filterTabs: FilterTab[] = [
    { label: 'Toutes',    value: 'toutes'   },
    { label: 'En cours',  value: 'en_cours' },
    { label: 'Livrées',   value: 'livrees'  },
    { label: 'Annulées',  value: 'annulees' },
  ];

  // ─── Pagination ───────────────────────────────────────────────────────────
  page      = 1;
  limit     = 8;
  totalPages = 1;

  // ─── UI state ─────────────────────────────────────────────────────────────
  isLoading     = false;
  isAnnulation  = false; // spinner pendant annulation
  errorMessage  = '';
  confirmingId: string | null = null; // id de la commande en cours d'annulation

  // ─── Données utilisateur (depuis localStorage / AuthService) ──────────────
  user = { nom: '', prenom: '', email: '', initiale: '?' };

  // Labels statuts → affichage
  readonly statutLabels: Record<string, string> = {
    en_attente: 'En attente', validee: 'Validée',
    preparee:   'En préparation', expediee: 'Expédiée',
    livree:     'Livrée',     annulee:  'Annulée'
  };

  constructor(
    private commandesService: CommandesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadCommandes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement utilisateur ────────────────────────────────────────────────
  private loadUser(): void {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        this.user = {
          nom:      u.nom     ?? '',
          prenom:   u.prenom  ?? '',
          email:    u.email   ?? '',
          initiale: (u.prenom?.[0] ?? '').toUpperCase() || '?'
        };
      }
    } catch { /* ignore */ }
  }

  // ─── Chargement commandes ──────────────────────────────────────────────────
  loadCommandes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.commandesService.getMesCommandes({
      filtre: this.filtreActif,
      page:   this.page,
      limit:  this.limit
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ({ commandes, total, totalPages }) => {
        this.commandes     = commandes;
        this.totalCommandes = total;
        this.totalPages    = totalPages;
        this.updateTabCounts(total);
      },
      error: () => {
        this.errorMessage = 'Impossible de charger vos commandes.';
      }
    });
  }

  // ─── Filtre ───────────────────────────────────────────────────────────────
  setFiltre(filtre: CommandesFiltreStatut): void {
    if (this.filtreActif === filtre) return;
    this.filtreActif = filtre;
    this.page = 1;
    this.loadCommandes();
  }

  // Met à jour le label "Toutes (N)" du premier onglet
  private updateTabCounts(total: number): void {
    if (this.filtreActif === 'toutes') {
      this.filterTabs[0].label = `Toutes (${total})`;
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────
  goToDetail(cmd: CommandeClient): void {
    this.router.navigate(['/client/commandes', cmd._id]);
  }

  // ─── Annulation ───────────────────────────────────────────────────────────
  demandAnnulation(event: Event, cmd: CommandeClient): void {
    event.stopPropagation();
    this.confirmingId = cmd._id;
  }

  confirmerAnnulation(event: Event): void {
    event.stopPropagation();
    if (!this.confirmingId) return;
    this.isAnnulation = true;

    this.commandesService.annulerCommande(this.confirmingId).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isAnnulation = false; this.confirmingId = null; })
    ).subscribe({
      next: () => this.loadCommandes(),
      error: () => { this.errorMessage = 'Erreur lors de l\'annulation.'; }
    });
  }

  annulerConfirm(event: Event): void {
    event.stopPropagation();
    this.confirmingId = null;
  }

  peutAnnuler(cmd: CommandeClient): boolean {
    return ['en_attente', 'validee'].includes(cmd.statut);
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.loadCommandes();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  statutClass(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 's-attente', validee: 's-payee', preparee: 's-preparee',
      expediee: 's-prete', livree: 's-livree', annulee: 's-annulee'
    };
    return map[statut] ?? '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatMontant(n: number): string {
    return n.toLocaleString('fr-FR') + ' Ar';
  }

  articlesLabel(n: number): string {
    return n === 1 ? '1 article' : `${n} articles`;
  }

  deconnexion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}