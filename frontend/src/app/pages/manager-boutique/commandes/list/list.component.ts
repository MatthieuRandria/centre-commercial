// manager-commandes-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { BoutiqueService } from '../../../../services/boutique.service';
<<<<<<< Updated upstream
import { environment } from '../../../../../environments/environment';
=======
>>>>>>> Stashed changes

interface Article {
   produit: string;
   boutique: string;
   nomProduit: string;
   prixUnitaire: number;
   quantite: number;
   sousTotal: number;
}

interface Acheteur {
   _id: string;
   nom: string;
   prenom?: string;
   email: string;
   telephone?: string;
}

interface Commande {
   _id: string;
   numeroCommande: string;
   acheteur: Acheteur;
   articles: Article[];
   total: number;
   modeRetrait: 'livraison' | 'retrait_boutique';
   statut: 'en_attente' | 'validee' | 'preparee' | 'expediee' | 'livree' | 'annulee';
   createdAt: string;
}

interface Pagination {
   total: number;
   page: number;
   totalPages: number;
}

@Component({
   selector: 'app-manager-commandes-list',
   standalone: true,
   imports: [CommonModule, RouterModule, FormsModule, DatePipe, DecimalPipe],
   templateUrl: './list.component.html',
   styleUrl: './list.component.scss'
})
export class ManagerCommandesListComponent implements OnInit, OnDestroy {

<<<<<<< Updated upstream
   private readonly API = environment.apiUrl;
=======
   private readonly API = 'http://localhost:3000';
>>>>>>> Stashed changes
   private destroy$ = new Subject<void>();

   commandes: Commande[] = [];
   isLoading = false;
   errorMessage = '';
   toastMessage = '';
   toastVisible = false;
   private toastTimer: any;

   boutiqueId = '';
   boutiqueName = '';

   // Filtres
   activeStatut = '';
   searchQuery = '';
   sortOrder = 'desc';
   private searchSubject = new Subject<string>();

   // Pagination
   pagination: Pagination = { total: 0, page: 1, totalPages: 1 };
   readonly limit = 10;

   // KPIs
   kpiTotal = 0;
   kpiAttente = 0;
   kpiPreparation = 0;
   kpiTerminees = 0;

   // Statut en cours de mise à jour
   updatingId = '';

   readonly tabs = [
      { label: 'Toutes', statut: '', count: 0 },
      { label: 'En attente', statut: 'en_attente', count: 0 },
      { label: 'Validées', statut: 'validee', count: 0 },
      { label: 'En préparation', statut: 'preparee', count: 0 },
      { label: 'Expédiées', statut: 'expediee', count: 0 },
      { label: 'Livrées', statut: 'livree', count: 0 },
      { label: 'Annulées', statut: 'annulee', count: 0 },
   ];

   readonly statutLabels: Record<string, string> = {
      en_attente: 'En attente',
      validee: 'Validée',
      preparee: 'En préparation',
      expediee: 'Expédiée',
      livree: 'Livrée',
      annulee: 'Annulée',
   };

   readonly nextStatut: Record<string, string> = {
      en_attente: 'validee',
      validee: 'preparee',
      preparee: 'expediee',
      expediee: 'livree',
   };

   readonly nextStatutLabel: Record<string, string> = {
      en_attente: 'Valider',
      validee: 'Marquer préparée',
      preparee: 'Marquer expédiée',
      expediee: 'Marquer livrée',
   };

   constructor(
      private http: HttpClient,
      private router: Router,
      private authService: AuthService,
      private boutiqueService: BoutiqueService
   ) { }

   ngOnInit(): void {
      this.initBoutique();
      this.searchSubject.pipe(
         debounceTime(350),
         distinctUntilChanged(),
         takeUntil(this.destroy$)
      ).subscribe(() => { this.pagination.page = 1; this.loadCommandes(); });
   }

   ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

   private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token')
         || localStorage.getItem('auth_token')
         || localStorage.getItem('access_token')
         || '';
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
   }

   private initBoutique(): void {
      const user = this.authService.getCurrentUser();
      const userId = user?._id || user?.id || '';
      this.boutiqueName = user?.prenom || user?.nom || 'Ma Boutique';

      if (userId) {
         this.boutiqueService.getBoutiquesByUser(userId).subscribe({
            next: (boutiques: any[]) => {
               if (boutiques.length > 0) {
                  this.boutiqueId = boutiques[0]._id;
                  this.boutiqueName = boutiques[0].nom;
               }
               this.loadCommandes();
               this.loadKpis();
            },
            error: () => { this.loadCommandes(); this.loadKpis(); }
         });
      } else {
         this.loadCommandes();
         this.loadKpis();
      }
   }

   loadCommandes(): void {
      this.isLoading = true;
      this.errorMessage = '';

      let url = `${this.API}/commande/boutique/${this.boutiqueId}?page=${this.pagination.page}&limit=${this.limit}&order=${this.sortOrder}`;
      if (this.activeStatut) url += `&statut=${this.activeStatut}`;
      if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;

      this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
         next: (res) => {
            this.commandes = res.commandes ?? res.data ?? [];
            this.pagination.total = res.total ?? 0;
            this.pagination.totalPages = res.totalPages ?? 1;
            this.isLoading = false;
         },
         error: (err) => {
            this.errorMessage = err.error?.message || 'Erreur lors du chargement des commandes.';
            this.isLoading = false;
         }
      });
   }

   private loadKpis(): void {
      const base = `${this.API}/commande/boutique/${this.boutiqueId}?limit=1`;
      this.http.get<any>(base, { headers: this.getHeaders() }).subscribe({
         next: (r) => { this.kpiTotal = r.total ?? 0; }
      });
      this.http.get<any>(`${base}&statut=en_attente`, { headers: this.getHeaders() }).subscribe({
         next: (r) => { this.kpiAttente = r.total ?? 0; }
      });
      this.http.get<any>(`${base}&statut=preparee`, { headers: this.getHeaders() }).subscribe({
         next: (r) => { this.kpiPreparation = r.total ?? 0; }
      });
      this.http.get<any>(`${base}&statut=livree`, { headers: this.getHeaders() }).subscribe({
         next: (r) => { this.kpiTerminees = r.total ?? 0; }
      });
   }

   // ── Filtres ───────────────────────────────────────────────────────────────
   setTab(statut: string): void {
      this.activeStatut = statut;
      this.pagination.page = 1;
      this.loadCommandes();
   }

   onSearch(val: string): void { this.searchSubject.next(val); }

   onSortChange(): void { this.pagination.page = 1; this.loadCommandes(); }

   // ── Pagination ────────────────────────────────────────────────────────────
   get pageNumbers(): number[] {
      const pages: number[] = [];
      const start = Math.max(1, this.pagination.page - 2);
      const end = Math.min(this.pagination.totalPages, this.pagination.page + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
   }

   goToPage(p: number): void {
      if (p < 1 || p > this.pagination.totalPages) return;
      this.pagination.page = p;
      this.loadCommandes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }

   // ── Statut ────────────────────────────────────────────────────────────────
   updateStatut(commande: Commande, statut: string): void {
      this.updatingId = commande._id;
      this.http.put<any>(
         `${this.API}/commande/${commande._id}/statut`,
         { statut },
         { headers: this.getHeaders() }
      ).subscribe({
         next: () => {
            commande.statut = statut as any;
            this.updatingId = '';
            this.showToast(`Commande ${commande.numeroCommande} → ${this.statutLabels[statut]}`);
            this.loadKpis();
         },
         error: (err) => {
            this.updatingId = '';
            this.showToast('Erreur : ' + (err.error?.message || 'impossible de mettre à jour'));
         }
      });
   }

   hasNextStatut(statut: string): boolean { return !!this.nextStatut[statut]; }

   // ── Navigation ────────────────────────────────────────────────────────────
   voirDetail(id: string): void { this.router.navigate(['/boutique/commandes', id]); }

   // ── Helpers ───────────────────────────────────────────────────────────────
   getArticlesLabel(c: Commande): string {
      const noms = c.articles.slice(0, 2).map(a => a.nomProduit).join(', ');
      return c.articles.length > 2 ? `${noms}...` : noms;
   }

   getClientName(c: Commande): string {
      if (!c.acheteur) return '—';
      return [c.acheteur.prenom, c.acheteur.nom].filter(Boolean).join(' ');
   }

   // ── Toast ─────────────────────────────────────────────────────────────────
   showToast(msg: string): void {
      clearTimeout(this.toastTimer);
      this.toastMessage = msg;
      this.toastVisible = true;
      this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3000);
   }
}