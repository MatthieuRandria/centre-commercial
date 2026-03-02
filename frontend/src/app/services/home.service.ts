// home.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Produit } from '../shared/produit.model';
import { environment } from '../../environments/environment';

// ─── Interfaces ────────────────────────────────────────────────────────────
export interface HomeData {
  vedettes:    Produit[];
  nouveautes:  Produit[];
  boutiques:   BoutiqueHome[];
  categories:  CategorieHome[];
}

export interface BoutiqueHome {
  _id:       string;
  nom:       string;
  slug?:     string;
  etage?:    string;
  categorie?: { _id: string; nom: string; icone?: string } | string;
  nombre_produits?: number;
  actif?:    boolean;
  initiale:  string;        // calculée côté client
  couleurBg: string;        // calculée côté client
  couleurTx: string;
}

export interface CategorieHome {
  _id:    string;
  nom:    string;
  slug?:  string;
  icone?: string;           // emoji ou URL
}

// Slides statiques du carousel hero
export interface HeroSlide {
  tag:       string;
  title:     string;
  subtitle:  string;
  ctaLabel:  string;
  ctaLink:   string;
  ctaSecondaryLabel?: string;
  ctaSecondaryLink?:  string;
  emoji:     string;
  bgClass:   string;
}

// Bannières promo statiques
export interface PromoBanner {
  tagLabel:  string;
  pct:       string;
  title:     string;
  subtitle:  string;
  link:      string;
  bgClass:   string;
}

// Événements statiques (pas de backend événements dans le projet)
export interface EventItem {
  day:     string;
  month:   string;
  type:    string;
  title:   string;
  desc:    string;
  time:    string;
  lieu:    string;
  btnLabel:string;
  emoji:   string;
  bgGrad:  string;
}

@Injectable({ providedIn: 'root' })
export class HomeService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Chargement parallèle de toutes les données home ──────────────────────
  loadHomeData(): Observable<HomeData> {
    return forkJoin({
      vedettes:   this.getVedettes(),
      nouveautes: this.getNouveautes(),
      boutiques:  this.getBoutiques(),
      categories: this.getCategories(),
    });
  }

  // GET /produits?sortBy=vues&order=desc&limit=8 (produits vedettes)
  private getVedettes(): Observable<Produit[]> {
    const params = new HttpParams()
      .set('sortBy', 'vues')
      .set('order',  'desc')
      .set('limit',  '8');
    return this.http.get<any>(`${this.base}/produits`, { params }).pipe(
      map(r => r.data ?? r ?? []),
      catchError(() => of([]))
    );
  }

  // GET /produits?sortBy=date&order=desc&limit=4 (nouveautés)
  private getNouveautes(): Observable<Produit[]> {
    const params = new HttpParams()
      .set('sortBy', 'date')
      .set('order',  'desc')
      .set('limit',  '4');
    return this.http.get<any>(`${this.base}/produits`, { params }).pipe(
      map(r => r.data ?? r ?? []),
      catchError(() => of([]))
    );
  }

  // GET /boutiques?limit=6&sort=nom
  private getBoutiques(): Observable<BoutiqueHome[]> {
    const params = new HttpParams()
        .set('limit', '6')
        .set('sort', 'nom');

    return this.http.get<any>(`${this.base}/boutiques`, { params }).pipe(
        map(response => {
        let list: any[] = [];

        if (Array.isArray(response)) {
            list = response;
        } else if (Array.isArray(response?.data)) {
            list = response.data;
        } else if (Array.isArray(response?.boutiques)) {
            list = response.boutiques;
        } else if (Array.isArray(response?.data?.boutiques)) {
            list = response.data.boutiques;
        }

        return list
            .slice(0, 6)
            .map(b => this.enrichBoutique(b));
        }),
        catchError(error => {
        console.error('Erreur getBoutiques:', error);
        return of([]);
        })
    );
    }

  // GET /boutique-categories
  private getCategories(): Observable<CategorieHome[]> {
    return this.http.get<any>(`${this.base}/boutiquesCateg`).pipe(
      map(r => Array.isArray(r) ? r : (r.data ?? [])),
      catchError(() => of([]))
    );
  }

  // ─── Enrichissement boutique ───────────────────────────────────────────────
  private enrichBoutique(b: any): BoutiqueHome {
    const palettes = [
      { bg: '#e8f0ec', tx: '#2d4a3e' },
      { bg: '#e8f0ff', tx: '#1e40af' },
      { bg: '#fef0e8', tx: '#92400e' },
      { bg: '#f3e8ff', tx: '#7c3aed' },
      { bg: '#fee2e2', tx: '#991b1b' },
      { bg: '#e0f2fe', tx: '#0369a1' },
    ];
    const idx = (b.nom?.charCodeAt(0) ?? 0) % palettes.length;
    return {
      _id:              b._id,
      nom:              b.nom ?? '—',
      slug:             b.slug,
      etage:            b.etage,
      categorie:        b.categorie,
      nombre_produits:  b.nombre_produits ?? b.nbProduits,
      actif:            b.actif ?? true,
      initiale:         (b.nom?.[0] ?? '?').toUpperCase(),
      couleurBg:        palettes[idx].bg,
      couleurTx:        palettes[idx].tx,
    };
  }

  // ─── Helpers produit ───────────────────────────────────────────────────────
  getPrix(p: Produit): number {
    return p.variantes?.[0]?.prix ?? (p as any).prix ?? 0;
  }

  getPrixPromo(p: Produit): number | null {
    return (p as any).prixPromo ?? null;
  }

  isEnPromotion(p: Produit): boolean {
    return !!(p as any).enPromotion;
  }

  getPromoPercent(p: Produit): number {
    const orig  = this.getPrix(p);
    const promo = this.getPrixPromo(p);
    if (!promo || !orig) return 0;
    return Math.round(((orig - promo) / orig) * 100);
  }

  getStock(p: Produit): number {
    return p.variantes?.reduce((s, v) => s + (v.stock ?? 0), 0)
      ?? (p as any).stock ?? 0;
  }

  getStockClass(p: Produit): 'sb-in' | 'sb-low' | 'sb-out' {
    const s = this.getStock(p);
    return s === 0 ? 'sb-out' : s <= 5 ? 'sb-low' : 'sb-in';
  }

  getStockLabel(p: Produit): string {
    const s = this.getStock(p);
    return s === 0 ? 'Rupture' : s <= 5 ? `Reste ${s}` : 'En stock';
  }

  getBoutiqueName(p: Produit): string {
    const b = p.boutique;
    return typeof b === 'object' ? (b as any).nom ?? '—' : '—';
  }

  getFirstImage(p: Produit): string | null {
    return p.images?.[0] ?? null;
  }

  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  getCategorieNom(b: BoutiqueHome): string {
    const c = b.categorie;
    return typeof c === 'object' ? (c as any).nom ?? '' : '';
  }

  // ─── Données statiques ─────────────────────────────────────────────────────
  getHeroSlides(): HeroSlide[] {
    return [
      {
        tag: 'Nouveautés Printemps 2026',
        title: 'Votre mode,<br>votre style',
        subtitle: 'Découvrez les derniers trends au Galaxy Mall.<br>+48 boutiques, un seul endroit.',
        ctaLabel: 'Explorer le catalogue', ctaLink: '/produits',
        ctaSecondaryLabel: 'Nos boutiques',  ctaSecondaryLink: '/boutiques',
        emoji: '👔', bgClass: 'slide-bg-1',
      },
      {
        tag: 'Tech & Électronique',
        title: 'Innovation<br>au quotidien',
        subtitle: 'Les meilleurs produits tech vous attendent.<br>Apple, Samsung, et bien plus.',
        ctaLabel: 'Voir les produits', ctaLink: '/produits?categorie=electronique',
        ctaSecondaryLabel: 'Offres spéciales', ctaSecondaryLink: '/produits?promo=true',
        emoji: '📱', bgClass: 'slide-bg-2',
      },
      {
        tag: 'Soldes — Jusqu\'à -40%',
        title: 'Soldes<br>en cours !',
        subtitle: 'Profitez de remises exceptionnelles sur<br>des centaines de produits sélectionnés.',
        ctaLabel: 'Voir les promos', ctaLink: '/produits?promo=true',
        ctaSecondaryLabel: 'Toutes les boutiques', ctaSecondaryLink: '/boutiques',
        emoji: '🎁', bgClass: 'slide-bg-3',
      },
    ];
  }

  getPromoBanners(): PromoBanner[] {
    return [
      { tagLabel: 'SOLDES MODE', pct: '-40%', title: 'Collection Mode<br>Printemps',   subtitle: "Jusqu'à -40% sur la mode femme et homme", link: '/produits?promo=true',                          bgClass: 'promo-banner-1' },
      { tagLabel: 'TECH DEALS',  pct: '-20%', title: 'High-Tech<br>en promo',          subtitle: 'Apple, Samsung, accessoires',               link: '/produits?categorie=electronique&promo=true', bgClass: 'promo-banner-2' },
      { tagLabel: 'SPORT & FITNESS', pct: '-30%', title: 'Nike, Adidas,<br>Puma',      subtitle: 'Chaussures et vêtements de sport',          link: '/produits?categorie=sport&promo=true',        bgClass: 'promo-banner-3' },
    ];
  }

  getEvents(): EventItem[] {
    return [
      { day:'28', month:'Fév', type:'Vente privée',    title:'Soldes Exclusives — Membres VIP',     desc:"Accès prioritaire aux meilleures promotions pour nos membres fidélité. Jusqu'à -50%.", time:'10h00 – 18h00', lieu:'Galaxy Mall',   btnLabel:"S'inscrire", emoji:'🎪', bgGrad:'linear-gradient(135deg,#e8f0ec,#c5ddd0)' },
      { day:'05', month:'Mar', type:'Live Experience', title:'Fête de la Mode — Spring Edition',     desc:'Défilé de mode, showcases, musique live et animations tout au long de la journée.',    time:'09h00 – 20h00', lieu:'Atrium Central', btnLabel:'En savoir +', emoji:'🎶', bgGrad:'linear-gradient(135deg,#fef0e8,#fdd5b5)' },
      { day:'12', month:'Mar', type:'Lancement Produit', title:'Apple — Keynote Madagascar',         desc:"Présentation en avant-première des nouveaux produits Apple avec des offres exclusives.", time:'14h00 – 17h00', lieu:'Apple Store',   btnLabel:'Réserver',  emoji:'📱', bgGrad:'linear-gradient(135deg,#e0f2fe,#bae6fd)' },
    ];
  }

  getSearchTags(): { label: string; q: string }[] {
    return [
      { label: 'Robe',     q: 'robe' },
      { label: 'Sneakers', q: 'sneakers' },
      { label: 'iPhone',   q: 'iphone' },
      { label: 'Parfum',   q: 'parfum' },
      { label: 'Jean',     q: 'jean' },
      { label: 'Sac',      q: 'sac' },
      { label: 'Montre',   q: 'montre' },
    ];
  }

  getCategoriesStatic(): { emoji: string; label: string; slug: string }[] {
    return [
      { emoji: '👔', label: 'Mode',         slug: 'mode' },
      { emoji: '📱', label: 'Électronique', slug: 'electronique' },
      { emoji: '⚽', label: 'Sport',        slug: 'sport' },
      { emoji: '💄', label: 'Beauté',       slug: 'beaute' },
      { emoji: '🍕', label: 'Alimentation', slug: 'alimentation' },
      { emoji: '🏠', label: 'Maison',       slug: 'maison' },
      { emoji: '🎮', label: 'Jouets',       slug: 'jouets' },
      { emoji: '📚', label: 'Livres',       slug: 'livres' },
    ];
  }
}