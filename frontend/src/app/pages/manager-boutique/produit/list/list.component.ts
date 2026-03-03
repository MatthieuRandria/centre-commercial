// manager-produits-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { ProduitsService } from '../../../../services/produits.service';
import { BoutiqueService } from '../../../../services/boutique.service';

interface Variante {
   type?: string;
   valeur?: string;
   prix: number;
   stock: number;
}

interface Produit {
   _id: string;
   nom: string;
   prix: number;
   description?: string;
   variantes?: Variante[];
   categories?: { nom: string }[];
   actif: boolean;
   images?: string[];
   boutique?: string | any;
   vues?: number;
   // Champs optionnels legacy
   prix_promo?: number;
   promotion_active?: boolean;
   pourcentage_reduction?: number;
   nombre_vues?: number;
   categorie?: { _id: string; nom: string };
   [key: string]: any;
}

interface Categorie {
   _id: string;
   nom: string;
}

interface Pagination {
   total: number;
   page: number;
   limit: number;
   totalPages: number;
   hasNextPage: boolean;
   hasPrevPage: boolean;
}

@Component({
   selector: 'app-manager-produits-list',
   standalone: true,
   imports: [CommonModule, RouterModule, ReactiveFormsModule, DecimalPipe, DatePipe, SlicePipe],
   templateUrl: './list.component.html',
   styleUrl: './list.component.scss'
})
export class ManagerProduitsListComponent implements OnInit, OnDestroy {

   private destroy$ = new Subject<void>();

   // ── État ──────────────────────────────────────────────────────────────────
   produits: Produit[] = [];
   categories: Categorie[] = [];
   isLoading = false;
   isDeleting = false;
   errorMessage = '';
   today = new Date();

   // ── Boutique du manager ───────────────────────────────────────────────────
   boutiqueId = '';
   boutiqueName = '';
   boutiqueInitiale = '';

   // ── KPIs ──────────────────────────────────────────────────────────────────
   totalActifs = 0;
   totalEnPromo = 0;
   totalStockFaible = 0;
   totalRupture = 0;

   // ── Pagination ────────────────────────────────────────────────────────────
   pagination: Pagination = {
      total: 0, page: 1, limit: 10,
      totalPages: 0, hasNextPage: false, hasPrevPage: false
   };

   get pageNumbers(): number[] {
      const total = this.pagination.totalPages;
      const current = this.pagination.page;
      const pages: number[] = [];
      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
   }

   get showFrom(): number {
      return (this.pagination.page - 1) * this.pagination.limit + 1;
   }

   get showTo(): number {
      return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
   }

   // ── Sélection multiple ────────────────────────────────────────────────────
   selectedIds = new Set<string>();

   get allSelected(): boolean {
      return this.produits.length > 0 && this.produits.every(p => this.selectedIds.has(p._id));
   }

   // ── Modale suppression ────────────────────────────────────────────────────
   deleteModalOpen = false;
   deleteTargetId = '';
   deleteTargetName = '';

   // ── Formulaire filtres ────────────────────────────────────────────────────
   filterForm!: FormGroup;

   constructor(
      private fb: FormBuilder,
      private router: Router,
      private authService: AuthService,
      private produitsService: ProduitsService,
      private boutiqueService: BoutiqueService
   ) { }

   ngOnInit(): void {
      this.buildForm();
      this.watchFilters();
      this.loadCategories();
      this.initBoutiqueInfo(); // loadProduits() appelé à l'intérieur
   }

   ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
   }

   // ── Init boutique ─────────────────────────────────────────────────────────
   private initBoutiqueInfo(): void {
      const user = this.authService.getCurrentUser();
      const userId = user?._id || user?.id || '';
      const nom = user?.prenom || user?.nom || 'Ma Boutique';
      this.boutiqueName = nom;
      this.boutiqueInitiale = nom.charAt(0).toUpperCase();

      if (!userId) {
         this.loadProduits();
         return;
      }

      this.boutiqueService.getBoutiquesByUser(userId).subscribe({
         next: (boutiques: any[]) => {
            if (boutiques.length > 0) {
               this.boutiqueId = boutiques[0]._id;
               this.boutiqueName = boutiques[0].nom;
               this.boutiqueInitiale = boutiques[0].nom.charAt(0).toUpperCase();
            }
            this.loadProduits();
         },
         error: () => { this.loadProduits(); }
      });
   }

   // ── Formulaire ────────────────────────────────────────────────────────────
   private buildForm(): void {
      this.filterForm = this.fb.group({
         search: [''],
         categorie: [''],
         sort: ['createdAt'],
         enPromo: [false],
         enStock: [false],
         actifSeulement: [false]
      });
   }

   private watchFilters(): void {
      this.filterForm.valueChanges.pipe(
         debounceTime(400),
         distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
         takeUntil(this.destroy$)
      ).subscribe(() => {
         this.pagination.page = 1;
         this.loadProduits();
      });
   }

   // ── Chargement ────────────────────────────────────────────────────────────
   loadProduits(): void {
      this.isLoading = true;
      this.errorMessage = '';

      const f = this.filterForm.value;
      const filters: any = {
         page: this.pagination.page,
         limit: this.pagination.limit,
         sortBy: f.sort === 'createdAt' ? 'date' : f.sort,
         order: 'desc'
      };

      if (this.boutiqueId) filters['boutiqueId'] = this.boutiqueId;
      if (f.search) filters['search'] = f.search;
      if (f.categorie) filters['categorie'] = f.categorie;
      if (f.enPromo) filters['enPromotion'] = true;
      if (f.enStock) filters['enStock'] = true;

      this.produitsService.getProduits(filters).subscribe({
         next: (res: any) => {
            this.produits = res.data ?? [];
            this.pagination.total = res.total ?? 0;
            this.pagination.totalPages = res.pages ?? 1;
            this.pagination.hasNextPage = this.pagination.page < (res.pages ?? 1);
            this.pagination.hasPrevPage = this.pagination.page > 1;
            this.isLoading = false;
            this.computeKpis();
         },
         error: (err: any) => {
            this.errorMessage = err.error?.message || 'Erreur lors du chargement des produits.';
            this.isLoading = false;
         }
      });
   }

   private loadCategories(): void {
      this.boutiqueService.getCategories().subscribe({
         next: (cats) => { this.categories = cats as any[]; },
         error: () => { }
      });
   }

   // ── Stock calculé depuis variantes ────────────────────────────────────────
   getTotalStock(p: Produit): number {
      if (!p.variantes || p.variantes.length === 0) return 0;
      return p.variantes.reduce((sum, v) => sum + (v.stock ?? 0), 0);
   }

   getPrixMin(p: Produit): number {
      if (!p.variantes || p.variantes.length === 0) return p.prix;
      return Math.min(...p.variantes.map(v => v.prix));
   }

   // ── KPIs ──────────────────────────────────────────────────────────────────
   private computeKpis(): void {
      this.totalActifs = this.produits.filter(p => p.actif).length;
      this.totalEnPromo = this.produits.filter(p => p.promotion_active || p['enPromotion']).length;
      this.totalStockFaible = this.produits.filter(p => { const s = this.getTotalStock(p); return s > 0 && s <= 5; }).length;
      this.totalRupture = this.produits.filter(p => this.getTotalStock(p) === 0).length;
   }

   // ── Helpers affichage ─────────────────────────────────────────────────────
   getInitial(nom: string): string {
      return (nom?.trim().charAt(0) ?? '?').toUpperCase();
   }

   // stockClass et stockLabel reçoivent le stock déjà calculé (number)
   // pour ne pas modifier le HTML existant
   stockClass(stock: number | undefined): string {
      const s = stock ?? 0;
      if (s === 0) return 'stock-zero';
      if (s <= 5) return 'stock-low';
      return 'stock-ok';
   }

   stockLabel(stock: number | undefined): string {
      const s = stock ?? 0;
      if (s === 0) return 'Rupture';
      if (s <= 5) return `${s} restant${s > 1 ? 's' : ''}`;
      return `${s} en stock`;
   }

   // ── Navigation ────────────────────────────────────────────────────────────
   goToAdd(): void {
      this.router.navigate(['/boutique/produits/ajouter']);
   }

   editProduit(p: Produit): void {
      this.router.navigate(['/boutique/produits', p._id, 'modifier']);
   }

   // ── Sélection ─────────────────────────────────────────────────────────────
   toggleSelect(id: string): void {
      if (this.selectedIds.has(id)) this.selectedIds.delete(id);
      else this.selectedIds.add(id);
   }

   toggleAll(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      if (checked) this.produits.forEach(p => this.selectedIds.add(p._id));
      else this.selectedIds.clear();
   }

   openBulkDelete(): void {
      const ids = [...this.selectedIds];
      if (!ids.length) return;
      if (!confirm(`Supprimer ${ids.length} produit(s) ?`)) return;
   }

   // ── Toggle actif ──────────────────────────────────────────────────────────
   toggleActif(p: Produit): void {
      const newVal = !p.actif;
      const formData = new FormData();
      formData.append('actif', String(newVal));
      this.produitsService.updateProduit(p._id, formData).subscribe({
         next: () => { p.actif = newVal; this.computeKpis(); },
         error: () => { this.errorMessage = 'Erreur lors de la mise à jour.'; }
      });
   }

   // ── Suppression ───────────────────────────────────────────────────────────
   openDeleteModal(p: Produit): void {
      this.deleteTargetId = p._id;
      this.deleteTargetName = p.nom;
      this.deleteModalOpen = true;
   }

   closeDeleteModal(): void {
      this.deleteModalOpen = false;
      this.deleteTargetId = '';
      this.deleteTargetName = '';
   }

   confirmDelete(): void {
      if (!this.deleteTargetId) return;
      this.isDeleting = true;
      this.produitsService.deleteProduit(this.deleteTargetId).subscribe({
         next: () => {
            this.isDeleting = false;
            this.closeDeleteModal();
            this.loadProduits();
         },
         error: (err: any) => {
            this.isDeleting = false;
            this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
            this.closeDeleteModal();
         }
      });
   }

   // ── Pagination ────────────────────────────────────────────────────────────
   goToPage(page: number): void {
      if (page < 1 || page > this.pagination.totalPages) return;
      this.pagination.page = page;
      this.loadProduits();
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }

   // ── Filtres ───────────────────────────────────────────────────────────────
   resetFilters(): void {
      this.filterForm.reset({
         search: '', categorie: '', sort: 'createdAt',
         enPromo: false, enStock: false, actifSeulement: false
      });
   }

   // ── Export CSV ────────────────────────────────────────────────────────────
   exportCsv(): void {
      const headers = ['ID', 'Nom', 'Prix', 'Stock', 'Actif', 'Vues'];
      const rows = this.produits.map(p => [
         p._id, p.nom, this.getPrixMin(p), this.getTotalStock(p),
         p.actif ? 'Oui' : 'Non', p.vues ?? p.nombre_vues ?? 0
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'produits.csv'; a.click();
      URL.revokeObjectURL(url);
   }
}