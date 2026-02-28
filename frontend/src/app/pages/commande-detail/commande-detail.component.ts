import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';

export interface ArticleDetail {
  produit:      string | { _id: string; nom: string; images?: string[] };
  boutique:     string | { _id: string; nom: string; localisation?: any };
  nomProduit:   string;
  prixUnitaire: number;
  quantite:     number;
  sousTotal:    number;
  variante?:    string; // ex: "Taille M — Beige"
}

export interface CommandeDetail {
  _id:            string;
  numeroCommande: string;
  createdAt:      string;
  articles:       ArticleDetail[];
  total:          number;
  modeRetrait:    'livraison' | 'retrait_boutique';
  statut:         'en_attente' | 'validee' | 'preparee' | 'expediee' | 'livree' | 'annulee';
  acheteur?: {
    _id: string; nom: string; prenom: string;
    email: string; telephone?: string;
  };
}

// ─── Étapes de la timeline
export interface TimelineStep {
  statut:  string;
  label:   string;
  icon:    string;
  state:   'done' | 'active' | 'pending';
}

@Component({
  selector: 'app-commande-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './commande-detail.component.html',
  styleUrl: './commande-detail.component.scss'
})
export class CommandeDetailComponent implements OnInit, OnDestroy{
  private destroy$ = new Subject<void>();

  commande: CommandeDetail | null = null;
  isLoading     = false;
  isAnnulation  = false;
  confirmCancel = false;
  errorMessage  = '';

  // ─── Statut → badge CSS 
  readonly statutClass: Record<string, string> = {
    en_attente: 's-attente', validee: 's-payee', preparee: 's-preparee',
    expediee: 's-prete', livree: 's-livree', annulee: 's-annulee'
  };

  readonly statutLabels: Record<string, string> = {
    en_attente: 'En attente', validee: 'Validée',
    preparee: 'En préparation', expediee: 'Prête au retrait',
    livree: 'Retirée', annulee: 'Annulée'
  };

  // ─── Définition des étapes timeline 
  private readonly STEPS: { statut: string; label: string; icon: string }[] = [
    { statut: 'en_attente', label: 'En attente',        icon: '1' },
    { statut: 'validee',    label: 'Validée',           icon: '2' },
    { statut: 'preparee',   label: 'En préparation',    icon: '3' },
    { statut: 'expediee',   label: 'Prête au retrait',  icon: '4' },
    { statut: 'livree',     label: 'Retirée',           icon: '5' },
  ];

  private readonly ORDRE = ['en_attente','validee','preparee','expediee','livree'];

  constructor(
    private route:  ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadCommande(id);
    else this.errorMessage = 'Identifiant de commande manquant.';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement 
  private loadCommande(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Appel direct à l'API (via fetch natif ou HttpClient)
    // On importe HttpClient inline pour garder le composant léger
    const url = `http://localhost:3000/commande/${id}`;

    fetch(url, {
      headers: this.getAuthHeaders()
    })
      .then(r => r.json())
      .then(data => {
        this.commande = data.data ?? data;
        this.isLoading = false;
      })
      .catch(() => {
        this.errorMessage = 'Impossible de charger la commande.';
        this.isLoading = false;
      });
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ─── Timeline
  get timeline(): TimelineStep[] {
    if (!this.commande) return [];
    const statutActuel = this.commande.statut;
    const idx = this.ORDRE.indexOf(statutActuel);

    return this.STEPS.map((step, i) => ({
      ...step,
      state: i < idx ? 'done' : i === idx ? 'active' : 'pending'
    }));
  }

  get isAnnulee(): boolean {
    return this.commande?.statut === 'annulee';
  }

  get peutAnnuler(): boolean {
    return ['en_attente', 'validee'].includes(this.commande?.statut ?? '');
  }

  get factureDisponible(): boolean {
    return this.commande?.statut === 'livree';
  }

  //  Annulation 
  demandeAnnulation(): void { this.confirmCancel = true; }
  annulerConfirm():    void { this.confirmCancel = false; }

  confirmerAnnulation(): void {
    if (!this.commande) return;
    this.isAnnulation = true;

    fetch(`http://localhost:3000/commande/${this.commande._id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ statut: 'annulee' })
    })
      .then(r => r.json())
      .then(() => {
        if (this.commande) this.commande.statut = 'annulee';
        this.confirmCancel = false;
        this.isAnnulation  = false;
      })
      .catch(() => {
        this.errorMessage  = 'Erreur lors de l\'annulation.';
        this.isAnnulation  = false;
        this.confirmCancel = false;
      });
  }

  // Helpers 
  getBoutiqueName(a: ArticleDetail): string {
    return typeof a.boutique === 'object' ? a.boutique.nom : '—';
  }

  getProductName(a: ArticleDetail): string {
    return a.nomProduit
      ?? (typeof a.produit === 'object' ? a.produit.nom : '—');
  }

  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatModeRetrait(mode: string): string {
    return mode === 'retrait_boutique' ? 'Click & Collect' : 'Livraison';
  }

  retour(): void {
    this.router.navigate(['/commandes']);
  }

}
