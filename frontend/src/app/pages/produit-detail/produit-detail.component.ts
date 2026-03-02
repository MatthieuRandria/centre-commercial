import { CommonModule, UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, Subject, takeUntil } from 'rxjs';
import { Produit, } from '../../shared/produit.model';
import { Avis, AvisService, CreateAvisPayload } from '../../services/avis.service';
import { ProduitsService } from '../../services/produits.service';
import { PanierService } from '../../services/panier.service';
import { FavorisService } from '../../services/favoris.service';

export type ActiveTab = 'description' | 'avis' | 'similaires';

export interface BarNote { label: number; pct: number; count: number; }

@Component({
  selector: 'app-produit-detail',
  imports: [CommonModule, RouterModule, FormsModule, UpperCasePipe],
  templateUrl: './produit-detail.component.html',
  styleUrl: './produit-detail.component.scss'
})
export class ProduitDetailComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // ─── Données
  produit:    Produit | null = null;
  avis:       Avis[]         = [];
  similaires: Produit[]      = [];

  // ─── UI state
  isLoading      = false;
  isLoadingAvis  = false;
  isAddingCart   = false;
  cartSuccess    = false;
  activeTab: ActiveTab = 'description';
  errorMessage   = '';

  // ─── Galerie
  activeImgIdx = 0;

  // ─── Variantes sélectionnées
  selectedTaille: string | null  = null;
  selectedCouleur: string | null = null;
  selectedVarianteIdx            = 0;
  quantite                       = 1;

  // ─── Favoris
  isFavori = false;

  // ─── Avis form
  newAvisNote       = 0;
  newAvisHover      = 0;
  newAvisCommentaire = '';
  isSubmittingAvis   = false;
  avisError          = '';
  avisSuccess        = false;

  // ─── Utilisateur connecté
  currentUser: { id: string; nom: string; prenom: string } | null = null;

  constructor(
    private route:           ActivatedRoute,
    public router:           Router,
    private produitsService: ProduitsService,
    private avisService:     AvisService,
    private panierService:   PanierService,
    private favorisService:  FavorisService,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) this.loadProduit(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement utilisateur
  private loadUser(): void {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        this.currentUser = { id: u.id ?? u._id, nom: u.nom ?? '', prenom: u.prenom ?? '' };
      }
    } catch { /* ignore */ }
  }

  // ─── Chargement produit
  private loadProduit(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.produitsService.getProduitById(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: raw => {
        // Normalise { success, data } ou objet direct
        this.produit = (raw as any).data ?? raw;
        this.selectedVarianteIdx = 0;
        this.initVariantes();
        this.loadAvis(id);
        this.loadSimilaires();
        this.checkFavori(id);
      },
      error: () => { this.errorMessage = 'Produit introuvable.'; }
    });
  }

  private loadAvis(produitId: string): void {
    this.isLoadingAvis = true;
    this.avisService.getAvisProduit(produitId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoadingAvis = false),
      catchError(() => of([]))
    ).subscribe(data => this.avis = data);
  }

  private loadSimilaires(): void {
    if (!this.produit) return;
    const boutiqueId = typeof this.produit.boutique === 'object'
      ? (this.produit.boutique as any)._id
      : this.produit.boutique;

    this.produitsService.getProduits({ boutiqueId, limit: 4 }).pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ data: [] } as any))
    ).subscribe(res => {
      this.similaires = (res.data ?? []).filter((p: Produit) => p._id !== this.produit?._id).slice(0, 4);
    });
  }

  private checkFavori(id: string): void {
    if (!this.currentUser) return;
    this.favorisService.checkFavori(id).pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ isFavori: false }))
    ).subscribe(r => this.isFavori = r.isFavori);
  }

  // ─── Initialise variantes sélectionnées ───────────────────────────────────
  private initVariantes(): void {
    if (!this.produit?.variantes?.length) return;
    const v = this.produit.variantes[0];
    if (v.type === 'taille')  this.selectedTaille  = v.valeur;
    if (v.type === 'couleur') this.selectedCouleur = v.valeur;
  }

  // ─── Getters UI─────────────
  get images(): string[] {
    return this.produit?.images?.length ? this.produit.images : [];
  }

  get hasImages(): boolean { return this.images.length > 0; }

  get tailles(): string[] {
    if (!this.produit?.variantes) return [];

    return [...new Set(
      this.produit.variantes
        .filter(v => v.type === 'taille' && v.valeur != null)
        .map(v => v.valeur as string)
    )];
  }
  get couleurs(): string[] {
    if (!this.produit?.variantes) return [];
    return [...new Set(
      this.produit.variantes.filter(v => v.type === 'couleur '&& v.valeur != null).map(v => v.valeur as string)
    )];
  }

  get prixActuel(): number {
    const v = this.produit?.variantes?.[this.selectedVarianteIdx];
    return v?.prix ?? this.produit?.prix ?? 0;
  }

  get stockActuel(): number {
    const v = this.produit?.variantes?.[this.selectedVarianteIdx];
    return v?.stock ?? 0;
  }

  get stockClass(): string {
    if (this.stockActuel === 0) return 'stock-zero';
    if (this.stockActuel <= 5) return 'stock-low';
    return 'stock-high';
  }

  get stockLabel(): string {
    if (this.stockActuel === 0) return 'Rupture de stock';
    if (this.stockActuel <= 5) return `Plus que ${this.stockActuel} en stock`;
    return `${this.stockActuel} disponibles`;
  }

  get boutiqueName(): string {
    const b = this.produit?.boutique;
    return typeof b === 'object' ? (b as any).nom ?? '—' : '—';
  }

  get boutiqueId(): string {
    const b = this.produit?.boutique;
    return typeof b === 'object' ? (b as any)._id ?? '' : b ?? '';
  }

  // ─── Statistiques avis──────
  get noteMoyenne(): number {
    if (!this.avis.length) return 0;
    return Math.round((this.avis.reduce((s, a) => s + a.note, 0) / this.avis.length) * 10) / 10;
  }

  get barsNotes(): BarNote[] {
    return [5, 4, 3, 2, 1].map(n => {
      const count = this.avis.filter(a => a.note === n).length;
      return { label: n, count, pct: this.avis.length ? Math.round((count / this.avis.length) * 100) : 0 };
    });
  }

  starsArray(note: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(note));
  }

  // ─── Galerie
  selectImage(idx: number): void { this.activeImgIdx = idx; }

  // ─── Variantes──────────────
  selectTaille(t: string): void {
    this.selectedTaille = t;
    this.updateVarianteIdx();
  }

  selectCouleur(c: string): void {
    this.selectedCouleur = c;
    this.updateVarianteIdx();
  }

  private updateVarianteIdx(): void {
    if (!this.produit?.variantes) return;
    const idx = this.produit.variantes.findIndex(v =>
      (!this.selectedTaille  || (v.type === 'taille'  && v.valeur === this.selectedTaille))
      && (!this.selectedCouleur || (v.type === 'couleur' && v.valeur === this.selectedCouleur))
    );
    this.selectedVarianteIdx = idx >= 0 ? idx : 0;
  }

  isStockZero(valeur: string, type: string): boolean {
    const v = this.produit?.variantes?.find(x => x.type === type && x.valeur === valeur);
    return v ? v.stock === 0 : false;
  }

  // ─── Quantité
  changeQty(delta: number): void {
    const max = this.stockActuel;
    const next = this.quantite + delta;
    if (next < 1 || next > max) return;
    this.quantite = next;
  }

  // ─── Panier─
  addToCart(): void {
    if (!this.produit || !this.currentUser || this.stockActuel === 0) {this.router.navigate(['/login']); return;}
    this.isAddingCart = true;

    this.panierService.addToCart({
      userId:      this.currentUser.id,
      produitId:   this.produit._id,
      quantite:    this.quantite,
      varianteIdx: this.selectedVarianteIdx
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isAddingCart = false)
    ).subscribe({
      next: () => {
        this.cartSuccess = true;
        setTimeout(() => this.cartSuccess = false, 3000);
      },
      error: () => { this.errorMessage = 'Erreur lors de l\'ajout au panier.'; }
    });
  }

  // ─── Favoris
  toggleFavori(): void {
    if (!this.currentUser || !this.produit) return;
    const obs = this.isFavori
      ? this.favorisService.removeFavori(this.produit._id)
      : this.favorisService.addFavori(this.currentUser.id, this.produit._id);

    obs.pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(() => { if (this.produit) this.isFavori = !this.isFavori; });
  }

  // ─── Onglets
  setTab(tab: ActiveTab): void { this.activeTab = tab; }

  // ─── Avis form──────────────
  setAvisNote(n: number):   void { this.newAvisNote  = n; }
  hoverStar(n: number):     void { this.newAvisHover = n; }
  leaveStar():              void { this.newAvisHover = 0; }

  starIsOn(i: number): boolean {
    return i <= (this.newAvisHover || this.newAvisNote);
  }

  submitAvis(): void {
    if (!this.currentUser || !this.produit) return;
    if (this.newAvisNote === 0) { this.avisError = 'Veuillez sélectionner une note.'; return; }
    if (!this.newAvisCommentaire.trim()) { this.avisError = 'Veuillez écrire un commentaire.'; return; }

    this.isSubmittingAvis = true;
    this.avisError = '';

    const payload: CreateAvisPayload = {
      userId:      this.currentUser.id,
      cibleId:     this.produit._id,
      note:        this.newAvisNote,
      commentaire: this.newAvisCommentaire.trim()
    };

    this.avisService.createAvisProduit(payload).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSubmittingAvis = false)
    ).subscribe({
      next: newAvis => {
        this.avis = [newAvis, ...this.avis];
        this.newAvisNote = 0;
        this.newAvisCommentaire = '';
        this.avisSuccess = true;
        setTimeout(() => this.avisSuccess = false, 4000);
      },
      error: err => {
        this.avisError = err.error?.message ?? 'Erreur lors de la publication.';
      }
    });
  }

  // ─── Helpers
  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  userInitiale(avis: Avis): string {
    return ((avis.user?.prenom?.[0] ?? '') + (avis.user?.nom?.[0] ?? '')).toUpperCase() || '?';
  }

  userName(avis: Avis): string {
    const p = avis.user?.prenom ?? '';
    const n = avis.user?.nom    ?? '';
    return (p + ' ' + n).trim() || 'Anonyme';
  }

  getCategoriesLabel(): string {
    return this.produit?.categories?.map(c => c.nom).join(', ') ?? '';
  }

  navigateSimilaire(id: string): void {
    this.router.navigate(['/produits', id]);
  }
}
