import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject, takeUntil } from 'rxjs';
import { Boutique, Produit } from '../../shared/produit.model';
import { CatalogueService } from '../../services/catalogue.service';
import { PanierService } from '../../services/panier.service';
import { FavorisService } from '../../services/favoris.service';
import { Categorie } from '../../models/boutique.model';

export interface FilterState {
  search:      string;
  categories:  string[];
  boutiques:   string[];
  prixMin:     number | null;
  prixMax:     number | null;
  enPromotion: boolean;
  enStock:     boolean;
  sortBy:      'date' | 'prix' | 'vues';
  order:       'asc' | 'desc';
  page:        number;
  limit:       number;
}

@Component({
  selector: 'app-catalogue',
  standalone:true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss'
})
export class CatalogueComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ─── Data ─────────────────────────────────────────────────────────────────
  produits:     Produit[] = [];
  boutiques:    Boutique[] = [];
  categories:   Categorie[] = [];
  totalProduits = 0;
  totalPages    = 0;

  // ─── Stats header ─────────────────────────────────────────────────────────
  statsTotal  = 0;
  statsBoutiques = 0;
  statsPromos = 0;

  // ─── UI ───────────────────────────────────────────────────────────────────
  isLoading       = false;
  isLoadingSidebar = false;
  sidebarOpen     = false;
  isMobile        = false;
  cartSuccessId:  string | null = null;
  addingCartId:   string | null = null;

  // ─── Favoris (local state) ────────────────────────────────────────────────
  favorisSet = new Set<string>();

  // ─── Recherche boutiques dans sidebar ────────────────────────────────────
  boutiqueSearch = '';

  // ─── Filtres ──────────────────────────────────────────────────────────────
  filters: FilterState = {
    search:      '',
    categories:  [],
    boutiques:   [],
    prixMin:     null,
    prixMax:     null,
    enPromotion: false,
    enStock:     false,
    sortBy:      'date',
    order:       'desc',
    page:        1,
    limit:       12
  };

  // ─── User ─────────────────────────────────────────────────────────────────
  currentUser: { id: string } | null = null;

  readonly sortOptions = [
    { value: 'date:desc',  label: 'Nouveautés' },
    { value: 'vues:desc',  label: 'Populaires' },
    { value: 'prix:asc',   label: 'Prix croissant ↑' },
    { value: 'prix:desc',  label: 'Prix décroissant ↓' },
  ];
  selectedSort = 'date:desc';

  constructor(
    private catalogueService: CatalogueService,
    private panierService:    PanierService,
    private favorisService:   FavorisService,
    private router:           Router,
    private route:            ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkMobile();
    this.loadUser();
    this.initSearchDebounce();
    this.initFromQueryParams();
    this.loadSidebarData();
    this.loadProduits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void { this.checkMobile(); }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 900;
  }

  private loadUser(): void {
    try {
      const s = localStorage.getItem('user');
      if (s) { const u = JSON.parse(s); this.currentUser = { id: u.id ?? u._id }; }
    } catch { /* ignore */ }
  }

  // ─── Debounce search ──────────────────────────────────────────────────────
  private initSearchDebounce(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadProduits();
    });
  }

  // ─── Init depuis URL params ───────────────────────────────────────────────
  private initFromQueryParams(): void {
    const p = this.route.snapshot.queryParams;
    if (p['q'])          this.filters.search      = p['q'];
    if (p['categorie'])  this.filters.categories  = [p['categorie']];
    if (p['promo'])      this.filters.enPromotion = true;
    if (p['boutique'])   this.filters.boutiques   = [p['boutique']];
  }

  // ─── Chargement sidebar ───────────────────────────────────────────────────
  private loadSidebarData(): void {
    this.isLoadingSidebar = true;
    this.catalogueService.loadSidebarData().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoadingSidebar = false)
    ).subscribe(({ boutiques, categories }) => {
      this.boutiques  = boutiques;
      this.categories = categories;
      this.statsBoutiques = boutiques.length;
    });
  }

  // ─── Chargement produits ──────────────────────────────────────────────────
  loadProduits(): void {
    this.isLoading = true;
    const [sortBy, order] = this.selectedSort.split(':') as ['date' | 'prix' | 'vues', 'asc' | 'desc'];
    this.filters.sortBy = sortBy;
    this.filters.order  = order;

    this.catalogueService.getProduits(this.filters).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false),
      catchError(() => of({ data: [], total: 0, page: 1, pages: 0 }))
    ).subscribe(res => {
      this.produits      = res.data ?? [];
      this.totalProduits = res.total ?? 0;
      this.totalPages    = res.pages ?? 0;
      this.statsTotal    = res.total ?? 0;
      this.statsPromos   = this.produits.filter(p => (p as any).enPromotion).length;
    });
  }

  // ─── Getters ──────────────────────────────────────────────────────────────
  get filteredBoutiques(): Boutique[] {
    if (!Array.isArray(this.boutiques)) return [];

    if (!this.boutiqueSearch) return this.boutiques;

    const q = this.boutiqueSearch.toLowerCase();
    return this.boutiques.filter(b =>
      b.nom?.toLowerCase().includes(q)
    );
  }

  get activeFilterCount(): number {
    return this.filters.categories.length
      + this.filters.boutiques.length
      + (this.filters.prixMin || this.filters.prixMax ? 1 : 0)
      + (this.filters.enPromotion ? 1 : 0)
      + (this.filters.enStock     ? 1 : 0)
      + (this.filters.search      ? 1 : 0);
  }

  get hasFilters(): boolean { return this.activeFilterCount > 0; }

  get activeChips(): { label: string; type: string; value: string }[] {
    const chips: { label: string; type: string; value: string }[] = [];
    if (this.filters.search) chips.push({ label: `"${this.filters.search}"`, type: 'search', value: '' });
    this.filters.categories.forEach(c => chips.push({ label: c, type: 'categorie', value: c }));
    this.filters.boutiques.forEach(id => {
      const b = this.boutiques.find(x => x._id === id);
      if (b) chips.push({ label: b.nom, type: 'boutique', value: id });
    });
    if (this.filters.prixMin || this.filters.prixMax) {
      const l = [this.filters.prixMin ? `min ${this.formatMontant(this.filters.prixMin)}` : '',
                 this.filters.prixMax ? `max ${this.formatMontant(this.filters.prixMax)}` : ''].filter(Boolean).join(' – ');
      chips.push({ label: l, type: 'prix', value: '' });
    }
    if (this.filters.enPromotion) chips.push({ label: 'En promotion', type: 'promo', value: '' });
    if (this.filters.enStock)     chips.push({ label: 'En stock',     type: 'stock', value: '' });
    return chips;
  }

  get paginationPages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const cur = this.filters.page;
    const total = this.totalPages;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - cur) <= 1) {
        pages.push(i);
      } else if (Math.abs(i - cur) === 2) {
        pages.push('...');
      }
    }
    // Déduplique les '...' consécutifs
    return pages.filter((v, i, arr) => !(v === '...' && arr[i-1] === '...'));
  }

  // ─── Actions filtres 
  onSearchInput(val: string): void {
    this.filters.search = val;
    this.searchSubject.next(val);
  }

  clearSearch(): void {
    this.filters.search = '';
    this.filters.page   = 1;
    this.loadProduits();
  }

  toggleCategory(nom: string): void {
    const idx = this.filters.categories.indexOf(nom);
    this.filters.categories = idx >= 0
      ? this.filters.categories.filter(c => c !== nom)
      : [...this.filters.categories, nom];
    this.filters.page = 1;
    this.loadProduits();
  }

  toggleBoutique(id: string): void {
    const idx = this.filters.boutiques.indexOf(id);
    this.filters.boutiques = idx >= 0
      ? this.filters.boutiques.filter(b => b !== id)
      : [...this.filters.boutiques, id];
    this.filters.page = 1;
    this.loadProduits();
  }

  onPrixChange(): void {
    this.filters.page = 1;
    this.loadProduits();
  }

  togglePromo(): void {
    this.filters.enPromotion = !this.filters.enPromotion;
    this.filters.page = 1;
    this.loadProduits();
  }

  toggleStock(): void {
    this.filters.enStock = !this.filters.enStock;
    this.filters.page = 1;
    this.loadProduits();
  }

  onSortChange(): void {
    this.filters.page = 1;
    this.loadProduits();
  }

  removeChip(chip: { type: string; value: string }): void {
    switch (chip.type) {
      case 'search':    this.clearSearch(); break;
      case 'categorie': this.toggleCategory(chip.value); break;
      case 'boutique':  this.toggleBoutique(chip.value); break;
      case 'prix':      this.filters.prixMin = null; this.filters.prixMax = null; this.filters.page = 1; this.loadProduits(); break;
      case 'promo':     this.togglePromo();  break;
      case 'stock':     this.toggleStock();  break;
    }
  }

  resetAll(): void {
    this.filters = {
      search: '', categories: [], boutiques: [],
      prixMin: null, prixMax: null,
      enPromotion: false, enStock: false,
      sortBy: 'date', order: 'desc', page: 1, limit: 12
    };
    this.selectedSort    = 'date:desc';
    this.boutiqueSearch  = '';
    this.loadProduits();
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  goPage(page: number | '...'): void {
    if (page === '...') return;
    this.filters.page = page;
    this.loadProduits();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Sidebar mobile ───────────────────────────────────────────────────────
  openSidebar():  void { this.sidebarOpen = true;  document.body.style.overflow = 'hidden'; }
  closeSidebar(): void { this.sidebarOpen = false; document.body.style.overflow = ''; }

  // ─── Panier ───────────────────────────────────────────────────────────────
  addToCart(event: Event, produit: Produit): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.currentUser) { this.router.navigate(['/login']); return; }
    this.addingCartId = produit._id;

    this.panierService.addToCart({
      userId:   this.currentUser.id,
      produitId: produit._id,
      quantite: 1
    }).pipe(takeUntil(this.destroy$), finalize(() => this.addingCartId = null))
      .subscribe({
        next: () => {
          this.cartSuccessId = produit._id;
          setTimeout(() => this.cartSuccessId = null, 1800);
        },
        error: () => {}
      });
  }

  // ─── Favoris ──────────────────────────────────────────────────────────────
  toggleFavori(event: Event, produit: Produit): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.currentUser) { this.router.navigate(['/login']); return; }

    const isFav = this.favorisSet.has(produit._id);
    const obs = isFav
      ? this.favorisService.removeFavori(produit._id)
      : this.favorisService.addFavori(this.currentUser.id, produit._id);

    obs.pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe(() => {
        isFav ? this.favorisSet.delete(produit._id) : this.favorisSet.add(produit._id);
      });
  }

  isFavori(id: string): boolean { return this.favorisSet.has(id); }

  // ─── Helpers produit ──────────────────────────────────────────────────────
  getPrix(p: Produit): number {
    const v = p.variantes?.[0];
    return v?.prix ?? p.prix ?? 0;
  }

  getPrixPromo(p: Produit): number | null {
    const va = p.variantes ?? [];
    const minPrix = va.length ? Math.min(...va.map(v => v.prix)) : p.prix;
    return (p as any).prixPromo ?? ((p as any).enPromotion ? minPrix : null);
  }

  isEnPromotion(p: Produit): boolean { return !!(p as any).enPromotion; }

  getPromoPercent(p: Produit): number {
    const orig  = this.getPrix(p);
    const promo = this.getPrixPromo(p);
    if (!promo || !orig) return 0;
    return Math.round(((orig - promo) / orig) * 100);
  }

  getStock(p: Produit): number {
    return p.variantes?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? 0;
  }

  getStockClass(p: Produit): string {
    const s = this.getStock(p);
    return s === 0 ? 'sb-out' : s <= 5 ? 'sb-low' : 'sb-in';
  }

  getStockLabel(p: Produit): string {
    const s = this.getStock(p);
    return s === 0 ? 'Rupture' : s <= 5 ? `Reste ${s}` : 'En stock';
  }

  getBoutiqueName(p: Produit): string {
    return typeof p.boutique === 'object' ? (p.boutique as any).nom : '—';
  }

  getFirstImage(p: Produit): string | null {
    return p.images?.[0] ?? null;
  }

  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  navigateProduit(id: string): void {
    this.router.navigate(['/produits', id]);
  }

  // Skeleton array
  skeletonArr = Array(12).fill(0);

}
