import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Produit } from '../../shared/produit.model';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PanierFullService } from '../../services/panier.service';
import { BoutiqueHome, HeroSlide, PromoBanner, EventItem, HomeService, HomeData } from '../../services/home.service';
import { FavorisService } from '../../services/favoris.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {

  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  // ─── Données ───────────────────────────────────────────────────────────────
  vedettes:   Produit[]      = [];
  nouveautes: Produit[]      = [];
  boutiques:  BoutiqueHome[] = [];

  heroSlides:    HeroSlide[]    = [];
  promoBanners:  PromoBanner[]  = [];
  events:        EventItem[]    = [];
  searchTags:    { label: string; q: string }[] = [];
  categories:    { emoji: string; label: string; slug: string }[] = [];

  // ─── Chargement ────────────────────────────────────────────────────────────
  isLoading = true;

  // ─── Carousel ──────────────────────────────────────────────────────────────
  currentSlide  = 0;
  private autoplayTimer: any;

  // ─── Panier & favoris ──────────────────────────────────────────────────────
  addingCartId:  string | null = null;
  cartSuccessId: string | null = null;
  favSet         = new Set<string>();
  panierCount    = 0;

  // ─── Recherche ────────────────────────────────────────────────────────────
  searchQuery = '';

  // ─── User ──────────────────────────────────────────────────────────────────
  isLoggedIn = false;

  // Toast
  toastMsg     = '';
  toastVisible = false;
  toastType: 'success' | 'info' = 'success';
  private toastTimer: any;

  readonly skeletonArr = Array(8).fill(0);
  readonly skeletonArr4 = Array(4).fill(0);

  constructor(
    private homeService:    HomeService,
    private panierService:  PanierFullService,
    private favorisService: FavorisService,
    private http:           HttpClient,
    private router:         Router,
    private zone:           NgZone
  ) {
    this.apiUrl = environment.apiUrl;
  }

  private apiUrl: string;

  ngOnInit(): void {
    this.checkAuth();
    this.heroSlides   = this.homeService.getHeroSlides();
    this.promoBanners = this.homeService.getPromoBanners();
    this.events       = this.homeService.getEvents();
    this.searchTags   = this.homeService.getSearchTags();
    this.categories   = this.homeService.getCategoriesStatic();
    this.loadData();

    // Badge panier
    this.panierService.count$.pipe(takeUntil(this.destroy$))
      .subscribe(n => this.panierCount = n);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoplay();
    clearTimeout(this.toastTimer);
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────
  private checkAuth(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  // ─── Chargement données ────────────────────────────────────────────────────
  loadData(): void {
    this.isLoading = true;
    this.homeService.loadHomeData().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false),
      catchError(() => of({ vedettes: [], nouveautes: [], boutiques: [], categories: [] }))
    ).subscribe((data: HomeData) => {
      // console.log("data",data);
      this.vedettes   = data.vedettes;
      this.nouveautes = data.nouveautes;
      this.boutiques  = data.boutiques;
    });
  }

  // ─── Carousel ──────────────────────────────────────────────────────────────
  goSlide(n: number): void {
    this.currentSlide = ((n % this.heroSlides.length) + this.heroSlides.length) % this.heroSlides.length;
  }

  prevSlide(): void { this.goSlide(this.currentSlide - 1); }
  nextSlide(): void { this.goSlide(this.currentSlide + 1); }

  private startAutoplay(): void {
    this.zone.runOutsideAngular(() => {
      this.autoplayTimer = setInterval(() => {
        this.zone.run(() => this.nextSlide());
      }, 4500);
    });
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) clearInterval(this.autoplayTimer);
  }

  onHeroMouseEnter(): void { this.stopAutoplay(); }
  onHeroMouseLeave(): void { this.startAutoplay(); }

  get slideTransform(): string {
    return `translateX(-${this.currentSlide * 100}%)`;
  }

  // ─── Recherche ────────────────────────────────────────────────────────────
  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/produits'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  onSearchTag(q: string): void {
    this.router.navigate(['/produits'], { queryParams: { q } });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSearch();
  }

  // ─── Helpers produit ──────────────────────────────────────────────────────
  getPrix(p: Produit):         number        { return this.homeService.getPrix(p); }
  getPrixPromo(p: Produit):    number | null { return this.homeService.getPrixPromo(p); }
  isEnPromotion(p: Produit):   boolean       { return this.homeService.isEnPromotion(p); }
  getPromoPercent(p: Produit): number        { return this.homeService.getPromoPercent(p); }
  getStock(p: Produit):        number        { return this.homeService.getStock(p); }
  getStockClass(p: Produit):   string        { return this.homeService.getStockClass(p); }
  getStockLabel(p: Produit):   string        { return this.homeService.getStockLabel(p); }
  getBoutiqueName(p: Produit): string        { return this.homeService.getBoutiqueName(p); }
  getFirstImage(p: Produit):   string | null { return this.homeService.getFirstImage(p); }
  formatMontant(n: number):    string        { return this.homeService.formatMontant(n); }
  getCategorieNom(b: BoutiqueHome): string   { return this.homeService.getCategorieNom(b); }

  // ─── Panier ───────────────────────────────────────────────────────────────
  addToCart(event: Event, p: Produit): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }
    if (this.addingCartId === p._id) return;

    this.addingCartId = p._id;
    this.panierService.addArticle(p._id, 1).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.addingCartId = null),
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        this.cartSuccessId = p._id;
        this.showToast('🛒 Ajouté au panier !', 'success');
        setTimeout(() => {
          if (this.cartSuccessId === p._id) this.cartSuccessId = null;
        }, 1800);
      }
    });
  }

  // ─── Favoris ──────────────────────────────────────────────────────────────
  toggleFavori(event: Event, p: Produit): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isLoggedIn) { this.router.navigate(['/login']); return; }

    const isFav = this.favSet.has(p._id);
    const token = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('token') ?? '')
      : '';
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    if (!isFav) {
      this.http.post(
        `${this.apiUrl}/favoris`,
        { produitId: p._id },
        { headers }
      ).pipe(takeUntil(this.destroy$), catchError(() => of(null)))
       .subscribe(res => { if (res !== null) this.favSet.add(p._id); });
    } else {
      this.favorisService.removeFavori(p._id)
        .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
        .subscribe(res => { if (res !== null) this.favSet.delete(p._id); });
    }
  }

  isFavori(id: string): boolean { return this.favSet.has(id); }

  // ─── Navigation ───────────────────────────────────────────────────────────
  navigateProduit(id: string): void { this.router.navigate(['/produits', id]); }

  navigateCatalogue(params: Record<string, string> = {}): void {
    this.router.navigate(['/produits'], { queryParams: params });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  private showToast(msg: string, type: 'success' | 'info' = 'success'): void {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg; this.toastType = type; this.toastVisible = true;
    this.toastTimer = setTimeout(() => this.toastVisible = false, 2500);
  }

  // trackBy
  trackById(_: number, item: any): string { return item._id ?? item.slug ?? String(_); }
  trackByIdx(i: number): number { return i; }

  parseQueryParams(url: string): Record<string, string> {
    const qIdx = url.indexOf('?');
    if (qIdx === -1) return {};
    const params: Record<string, string> = {};
    url.slice(qIdx + 1).split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) params[k] = v ?? 'true';
    });
    return params;
  }
}