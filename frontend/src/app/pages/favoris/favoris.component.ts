import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';
import { FavoriItem, FavorisService, SortFavoris } from '../../services/favoris.service';

export interface Toast {
  message: string;
  type: 'success' | 'removed' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-favoris',
  imports: [CommonModule,RouterModule, FormsModule],
  templateUrl: './favoris.component.html',
  styleUrl: './favoris.component.scss'
})
export class FavorisComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private toastTimer: any;

  // ─── Data ─────────────────────────────────────────────────────────────────
  allFavoris:    FavoriItem[] = [];   // source brute du serveur
  displayFavoris: FavoriItem[] = [];  // triés et affichés
  sortValue: SortFavoris = 'recent';

  // ─── UI ───────────────────────────────────────────────────────────────────
  isLoading         = false;
  removingId:       string | null = null;   // produitId en cours de suppression
  addingCartId:     string | null = null;   // produitId en cours d'ajout panier
  cartSuccessId:    string | null = null;

  // Modal confirmation suppression
  modalOpen         = false;
  pendingRemoveItem: FavoriItem | null = null;

  // Toast
  toast: Toast = { message: '', type: 'success', visible: false };

  // Utilisateur connecté
  currentUser: { nom: string; prenom: string; email: string; initiale: string } | null = null;

  readonly sortOptions: { value: SortFavoris; label: string }[] = [
    { value: 'recent',     label: 'Ajoutés récemment' },
    { value: 'price-asc',  label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'name',       label: 'Nom A–Z' },
  ];

  constructor(
    private favorisService: FavorisService,
    private router:         Router
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadFavoris();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ─── Chargement utilisateur ────────────────────────────────────────────────
  private loadUser(): void {
    try {
      const u = JSON.parse(localStorage.getItem('user') ?? '{}');
      const nom    = u.nom    ?? '';
      const prenom = u.prenom ?? '';
      const email  = u.email  ?? '';
      const initiale = (prenom[0] ?? nom[0] ?? '?').toUpperCase();
      this.currentUser = { nom, prenom, email, initiale };
    } catch { /* ignore */ }
  }

  get displayName(): string {
    if (!this.currentUser) return '';
    return [this.currentUser.prenom, this.currentUser.nom].filter(Boolean).join(' ') || 'Utilisateur';
  }

  // ─── Chargement favoris ────────────────────────────────────────────────────
  loadFavoris(): void {
    this.isLoading = true;
    this.favorisService.getFavoris().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe(list => {
      this.allFavoris = list;
      this.applySort();
    });
  }

  // ─── Tri ──────────────────────────────────────────────────────────────────
  applySort(): void {
    this.displayFavoris = this.favorisService.sortItems(this.allFavoris, this.sortValue);
  }

  onSortChange(): void { this.applySort(); }

  // ─── Getters UI ───────────────────────────────────────────────────────────
  get isEmpty(): boolean { return !this.isLoading && this.displayFavoris.length === 0; }

  get countLabel(): string {
    const n = this.displayFavoris.length;
    return `(${n} produit${n > 1 ? 's' : ''})`;
  }

  // ─── Helpers délégués au service ─────────────────────────────────────────
  getPrix(item: FavoriItem):         number         { return this.favorisService.getPrix(item.produit); }
  getPrixPromo(item: FavoriItem):    number | null  { return this.favorisService.getPrixPromo(item.produit); }
  isEnPromotion(item: FavoriItem):   boolean        { return this.favorisService.isEnPromotion(item.produit); }
  getPromoPercent(item: FavoriItem): number         { return this.favorisService.getPromoPercent(item.produit); }
  getStock(item: FavoriItem):        number         { return this.favorisService.getStock(item.produit); }
  getStockClass(item: FavoriItem):   string         { return this.favorisService.getStockClass(item.produit); }
  getStockLabel(item: FavoriItem):   string         { return this.favorisService.getStockLabel(item.produit); }
  getBoutiqueName(item: FavoriItem): string         { return this.favorisService.getBoutiqueName(item.produit); }
  getFirstImage(item: FavoriItem):   string | null  { return this.favorisService.getFirstImage(item.produit); }
  formatMontant(n: number):          string         { return this.favorisService.formatMontant(n); }

  // ─── Suppression ──────────────────────────────────────────────────────────
  openModalRemove(item: FavoriItem): void {
    this.pendingRemoveItem = item;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.pendingRemoveItem = null;
  }

  confirmRemove(): void {
    if (!this.pendingRemoveItem) return;
    const item = this.pendingRemoveItem;
    this.closeModal();
    this.executeRemove(item);
  }

  private executeRemove(item: FavoriItem): void {
    const produitId = item.produit._id;
    const nom       = item.produit.nom;
    this.removingId = produitId;

    this.favorisService.removeFavori(produitId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.removingId = null),
      catchError(() => {
        this.showToast(`Erreur lors de la suppression`, 'error');
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        // Supprime de la liste locale avec un délai pour l'animation
        setTimeout(() => {
          this.allFavoris    = this.allFavoris.filter(f => f.produit._id !== produitId);
          this.displayFavoris = this.displayFavoris.filter(f => f.produit._id !== produitId);
          this.showToast(`✓ ${nom} retiré des favoris`, 'removed');
        }, 320);
      }
    });
  }

  // ─── Panier ───────────────────────────────────────────────────────────────
  addToCart(item: FavoriItem): void {
    const produitId = item.produit._id;
    if (this.addingCartId === produitId) return;

    this.addingCartId = produitId;
    this.favorisService.addToCart(produitId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.addingCartId = null),
      catchError(() => {
        this.showToast('Erreur lors de l\'ajout au panier', 'error');
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        this.cartSuccessId = produitId;
        this.showToast(`🛒 ${item.produit.nom} ajouté au panier`, 'success');
        setTimeout(() => {
          if (this.cartSuccessId === produitId) this.cartSuccessId = null;
        }, 1800);
      }
    });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  private showToast(message: string, type: Toast['type']): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type, visible: true };
    this.toastTimer = setTimeout(() => {
      this.toast = { ...this.toast, visible: false };
    }, 2800);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  navigateProduit(id: string): void {
    this.router.navigate(['/produits', id]);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Skeleton array
  skeletonArr = Array(6).fill(0);

  // trackBy pour *ngFor
  trackById(_: number, item: FavoriItem): string { return item._id; }
}
