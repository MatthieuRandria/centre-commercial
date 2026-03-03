import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BoutiqueService } from '../../services/boutique.service';
import { Boutique } from '../../models/boutique.model';
import { environment } from '../../../environments/environment';

interface Produit {
   _id: string;
   nom: string;
   description: string;
   prix: number;
   images: string[];
   variantes: { type: string; valeur: string; prix: number; stock: number }[];
   categories: { nom: string }[];
   actif: boolean;
}

@Component({
   selector: 'app-boutique-detail',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './boutique-details.component.html',
   styleUrl: './boutique-details.component.scss'
})
export class BoutiqueDetailComponent implements OnInit {

   boutique: Boutique | null = null;
   produits: Produit[] = [];
   loading = true;
   error = '';
   activeTab = 0;

   private platformId = inject(PLATFORM_ID);
   private route = inject(ActivatedRoute);
   private boutiqueService = inject(BoutiqueService);
   private http = inject(HttpClient);

   private apiProduits = `${environment.apiUrl}/produits`;

   ngOnInit(): void {
      const slug = this.route.snapshot.paramMap.get('slug');
      if (slug) {
         this.boutiqueService.getBySlug(slug).subscribe({
            next: (data) => {
               this.boutique = data;
               this.loading = false;
               this.loadProduits(data._id);
            },
            error: () => {
               this.error = 'Boutique introuvable.';
               this.loading = false;
            }
         });
      }
   }

   loadProduits(boutiqueId: string): void {
      this.http.get<any>(`${this.apiProduits}?boutiqueId=${boutiqueId}&limit=8`).subscribe({
         next: (res) => this.produits = res.data || [],
         error: () => this.produits = []
      });
   }

   switchTab(index: number): void {
      this.activeTab = index;
   }

   getInitiale(nom: string): string {
      return nom?.charAt(0).toUpperCase() || '?';
   }

   getStatutLabel(): string {
      if (!this.boutique) return '';
      const labels: Record<string, string> = {
         active: 'Ouvert maintenant',
         inactive: 'Fermé',
         en_travaux: 'En travaux',
         fermee_definitivement: 'Fermé définitivement'
      };
      return labels[this.boutique.statut] || this.boutique.statut;
   }

   isOpen(): boolean {
      return this.boutique?.statut === 'active';
   }

   getTodayHoraire(): string {
      if (!this.boutique) return '';
      if (!isPlatformBrowser(this.platformId)) return '';
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const today = jours[new Date().getDay()];
      const h = this.boutique.horaires.find(h => h.jour === today);
      if (!h || !h.ouvert) return 'Fermé aujourd\'hui';
      return `${h.heures.ouverture} - ${h.heures.fermeture}`;
   }

   getTodayName(): string {
      if (!isPlatformBrowser(this.platformId)) return '';
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return jours[new Date().getDay()];
   }

   isToday(jour: string): boolean {
      if (!isPlatformBrowser(this.platformId)) return false;
      const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return jours[new Date().getDay()] === jour;
   }

   getStars(note: number): boolean[] {
      return Array.from({ length: 5 }, (_, i) => i < Math.round(note));
   }

   getProduitPrice(produit: Produit): number {
      if (produit.variantes && produit.variantes.length > 0) {
         return Math.min(...produit.variantes.map(v => v.prix));
      }
      return produit.prix;
   }
}