import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, takeUntil } from 'rxjs';
import { GroupeBoutique, PanierArticle, PanierFullService } from '../../services/panier.service';

@Component({
  selector: 'app-panier',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.scss'
})
export class PanierComponent implements OnInit,OnDestroy {
  private destroy$ = new Subject<void>();

  // ─── Data 
  articles:      PanierArticle[] = [];
  groupes:       GroupeBoutique[] = [];
  total          = 0;

  // ─── UI state
  isLoading          = false;
  isViding           = false;
  modalViderOpen     = false;
  removingId:        string | null = null;
  updatingId:        string | null = null;
  commandeLoading    = false;
  commandeSuccess    = false;
  errorMessage       = '';

  // Quantités locales (modifiées en live, synchro avec debounce)
  qtyMap = new Map<string, number>();
  private qtySubject = new Subject<{ produitId: string; quantite: number }>();

  constructor(
    private panierService: PanierFullService,
    private router:        Router
  ) {}

  ngOnInit(): void {
    this.initQtyDebounce();
    this.loadPanier();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Debounce mise à jour quantité
  private initQtyDebounce(): void {
    this.qtySubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((a, b) => a.produitId === b.produitId && a.quantite === b.quantite)
    ).subscribe(({ produitId, quantite }) => {
      this.syncQuantite(produitId, quantite);
    });
  }

  // ─── Chargement
  loadPanier(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.panierService.getPanier().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false),
      catchError(() => {
        this.errorMessage = 'Impossible de charger le panier.';
        return of(null);
      })
    ).subscribe(res => {
      if (!res) return;
      this.articles = res.panier?.articles ?? [];
      this.total    = res.total ?? this.panierService.getTotal(this.articles);
      this.rebuildGroupes();
      // Initialise les quantités locales
      this.articles.forEach(a => this.qtyMap.set(a.produit._id, a.quantite));
    });
  }

  private rebuildGroupes(): void {
    this.groupes = this.panierService.groupByBoutique(this.articles);
  }

  // ─── Getters 
  get isEmpty(): boolean { return this.articles.length === 0; }

  get totalArticles(): number {
    return this.panierService.getTotalArticles(this.articles);
  }

  get totalFormatted(): string {
    return this.formatMontant(this.total);
  }

  getQty(produitId: string): number {
    return this.qtyMap.get(produitId) ?? 1;
  }

  getPrix(art: PanierArticle): number {
    return this.panierService.getPrix(art);
  }

  getSousTotal(art: PanierArticle): number {
    return this.getPrix(art) * this.getQty(art.produit._id);
  }

  getFirstImage(art: PanierArticle): string | null {
    return this.panierService.getFirstImage(art);
  }

  // ─── Quantité
  changeQty(produitId: string, delta: number): void {
    const current = this.getQty(produitId);
    const next    = Math.max(1, current + delta);
    this.qtyMap.set(produitId, next);
    this.recalcTotal();
    this.qtySubject.next({ produitId, quantite: next });
  }

  onQtyInput(produitId: string, value: string): void {
    const n = Math.max(1, parseInt(value) || 1);
    this.qtyMap.set(produitId, n);
    this.recalcTotal();
    this.qtySubject.next({ produitId, quantite: n });
  }

  private syncQuantite(produitId: string, quantite: number): void {
    this.updatingId = produitId;
    this.panierService.updateQuantite(produitId, quantite).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.updatingId = null),
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        this.articles = res.panier?.articles ?? this.articles;
        this.rebuildGroupes();
      }
    });
  }

  private recalcTotal(): void {
    this.total = this.articles.reduce((s, a) => {
      return s + this.getPrix(a) * this.getQty(a.produit._id);
    }, 0);
  }

  // ─── Supprimer article 
  removeArticle(produitId: string): void {
    this.removingId = produitId;

    this.panierService.removeArticle(produitId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.removingId = null),
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        this.articles = res.panier?.articles ?? [];
        this.rebuildGroupes();
        this.recalcTotal();
        this.qtyMap.delete(produitId);
      }
    });
  }

  // ─── Vider panier
  openModalVider():  void { this.modalViderOpen = true;  }
  closeModalVider(): void { this.modalViderOpen = false; }

  confirmerVider(): void {
    this.isViding = true;
    this.panierService.clearPanier().pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isViding = false; this.modalViderOpen = false; }),
      catchError(() => of(null))
    ).subscribe(() => {
      this.articles = [];
      this.groupes  = [];
      this.total    = 0;
      this.qtyMap.clear();
    });
  }

  // ─── Passer commande
  passerCommande(): void {
    this.commandeLoading = true;
    this.errorMessage    = '';

    this.panierService.passerCommande('retrait_boutique').pipe(
      takeUntil(this.destroy$),
      finalize(() => this.commandeLoading = false),
      catchError(err => {
        this.errorMessage = err.error?.message ?? 'Erreur lors de la commande.';
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.commandeSuccess = true;
        const commandeId = res.data?._id ?? res._id;
        setTimeout(() => {
          this.router.navigate(['/commandes', commandeId]);
        }, 1200);
      }
    });
  }

  // ─── Helper format
  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  navigateProduit(id: string): void {
    this.router.navigate(['/produits', id]);
  }

}
