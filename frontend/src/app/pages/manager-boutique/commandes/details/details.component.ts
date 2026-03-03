// manager-commandes-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
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
   updatedAt: string;
}

@Component({
   selector: 'app-manager-commande-detail',
   standalone: true,
   imports: [CommonModule, RouterModule, FormsModule, DatePipe, DecimalPipe],
   templateUrl: './details.component.html',
   styleUrl: './details.component.scss'
})
export class ManagerCommandeDetailComponent implements OnInit, OnDestroy {

<<<<<<< Updated upstream
   private readonly API = environment.apiUrl;
=======
   private readonly API = 'http://localhost:3000';
>>>>>>> Stashed changes
   private destroy$ = new Subject<void>();

   commande: Commande | null = null;
   isLoading = false;
   isUpdating = false;
   errorMessage = '';
   toastMessage = '';
   toastVisible = false;
   private toastTimer: any;

   selectedStatut = '';

   readonly statutLabels: Record<string, string> = {
      en_attente: 'En attente',
      validee: 'Validée',
      preparee: 'En préparation',
      expediee: 'Expédiée',
      livree: 'Livrée',
      annulee: 'Annulée',
   };

   // Ordre des étapes pour la timeline
   readonly timelineSteps = [
      { statut: 'en_attente', label: 'En attente' },
      { statut: 'validee', label: 'Validée' },
      { statut: 'preparee', label: 'En préparation' },
      { statut: 'expediee', label: 'Expédiée' },
      { statut: 'livree', label: 'Livrée' },
   ];

   readonly statutOrder = ['en_attente', 'validee', 'preparee', 'expediee', 'livree'];

   readonly nextStatut: Record<string, string> = {
      en_attente: 'validee',
      validee: 'preparee',
      preparee: 'expediee',
      expediee: 'livree',
   };

   readonly nextStatutLabel: Record<string, string> = {
      en_attente: 'Valider la commande',
      validee: 'Marquer en préparation',
      preparee: 'Marquer expédiée',
      expediee: 'Marquer livrée',
   };

   constructor(
      private http: HttpClient,
      private router: Router,
      private route: ActivatedRoute,
      private authService: AuthService
   ) { }

   ngOnInit(): void {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.loadCommande(id);
   }

   ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

   private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token')
         || localStorage.getItem('auth_token')
         || localStorage.getItem('access_token')
         || '';
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
   }

   loadCommande(id: string): void {
      this.isLoading = true;
      this.errorMessage = '';
      this.http.get<Commande>(`${this.API}/commande/${id}`, { headers: this.getHeaders() })
         .pipe(takeUntil(this.destroy$))
         .subscribe({
            next: (c) => { this.commande = c; this.isLoading = false; },
            error: (err) => {
               this.errorMessage = err.error?.message || 'Impossible de charger la commande.';
               this.isLoading = false;
            }
         });
   }

   // ── Timeline helpers ─────────────────────────────────────────────────────
   getStepIndex(statut: string): number {
      return this.statutOrder.indexOf(statut);
   }

   isStepDone(stepStatut: string): boolean {
      if (!this.commande) return false;
      if (this.commande.statut === 'annulee') return false;
      return this.getStepIndex(stepStatut) < this.getStepIndex(this.commande.statut);
   }

   isStepActive(stepStatut: string): boolean {
      return this.commande?.statut === stepStatut;
   }

   // ── Statut actions ───────────────────────────────────────────────────────
   hasNextStatut(): boolean {
      return !!(this.commande && this.nextStatut[this.commande.statut]);
   }

   updateStatutQuick(): void {
      if (!this.commande) return;
      const next = this.nextStatut[this.commande.statut];
      if (!next) return;
      this.doUpdateStatut(next);
   }

   updateStatutSelect(): void {
      if (!this.selectedStatut || !this.commande) return;
      this.doUpdateStatut(this.selectedStatut);
   }

   annulerCommande(): void {
      if (!this.commande) return;
      if (!confirm(`Confirmer l'annulation de ${this.commande.numeroCommande} ?`)) return;
      this.doUpdateStatut('annulee');
   }

   private doUpdateStatut(statut: string): void {
      if (!this.commande) return;
      this.isUpdating = true;
      this.http.put<any>(
         `${this.API}/commande/${this.commande._id}/statut`,
         { statut },
         { headers: this.getHeaders() }
      ).subscribe({
         next: () => {
            this.commande!.statut = statut as any;
            this.selectedStatut = '';
            this.isUpdating = false;
            this.showToast(`Statut mis à jour : ${this.statutLabels[statut]}`);
         },
         error: (err) => {
            this.isUpdating = false;
            this.showToast('Erreur : ' + (err.error?.message || 'impossible de mettre à jour'));
         }
      });
   }

   // ── Helpers ───────────────────────────────────────────────────────────────
   getClientName(): string {
      if (!this.commande?.acheteur) return '—';
      return [this.commande.acheteur.prenom, this.commande.acheteur.nom].filter(Boolean).join(' ');
   }

   goBack(): void { this.router.navigate(['/boutique/commandes']); }

   // ── Toast ─────────────────────────────────────────────────────────────────
   showToast(msg: string): void {
      clearTimeout(this.toastTimer);
      this.toastMessage = msg;
      this.toastVisible = true;
      this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3000);
   }
}