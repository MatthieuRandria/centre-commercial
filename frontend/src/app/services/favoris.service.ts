// services/favoris.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Produit } from '../shared/produit.model';
import { PanierFullService, PanierService } from './panier.service';
// import { environment } from '../../environments/environment';

export interface FavoriItem {
  _id:       string;
  produit:   Produit;
  createdAt: string;
}

export type SortFavoris = 'recent' | 'price-asc' | 'price-desc' | 'name';

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private base = "http://localhost:3000";
  
  private headers(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Expose le nombre de favoris (pour badge topbar)
  private countSubject = new BehaviorSubject<number>(0);
  count$ = this.countSubject.asObservable();

  constructor(private http: HttpClient, private authService:AuthService, private panierService:PanierFullService) {}

  // GET /favoris/check/:produitId
  checkFavori(produitId: string): Observable<{ isFavori: boolean }> {
    return this.http.get<{ isFavori: boolean }>(`${this.base}/favoris/check/${produitId}`,{
      headers: this.headers()
    });
  }

  getFavoris(): Observable<FavoriItem[]> {
    return this.http.get<FavoriItem[]>(
      `${this.base}/favoris/me`,
      { headers: this.headers() }
    ).pipe(
      tap(list => this.countSubject.next(list.length)),
      catchError(() => of([]))
    );
  }

  // POST /favoris  { userId, produitId }
  addFavori(userId: string, produitId: string): Observable<any> {
    return this.http.post(`${this.base}/favoris`, { userId, produitId },{
      headers:this.headers()
    });
  }

  // DELETE /favoris/:produitId
  removeFavori(produitId: string): Observable<any> {
    return this.http.delete(`${this.base}/favoris/${produitId}`,{
      headers:this.headers()
    });
  }

  // POST /panier  { produitId, quantite }
  addToCart(produitId: string): Observable<any> {
    return this.panierService.addArticle(produitId,1);
  }

   // ─── Tri côté client ────────────────────────────────────────────
  sortItems(items: FavoriItem[], sort: SortFavoris): FavoriItem[] {
    const list = [...items];
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => this.getPrix(a.produit) - this.getPrix(b.produit));
      case 'price-desc':
        return list.sort((a, b) => this.getPrix(b.produit) - this.getPrix(a.produit));
      case 'name':
        return list.sort((a, b) => a.produit.nom.localeCompare(b.produit.nom));
      default: // recent = ordre du serveur (déjà trié createdAt -1)
        return list;
    }
  }

  // ─── Helpers produit ────────────────────────────────────────────
  getPrix(p: Produit): number {
    return p.variantes?.[0]?.prix ?? p.prix ?? 0;
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
      ?? (p as any).stock
      ?? 0;
  }

  getStockClass(p: Produit): string {
    const s = this.getStock(p);
    return s === 0 ? 'stock-out' : s <= 5 ? 'stock-low' : 'stock-in';
  }

  getStockLabel(p: Produit): string {
    const s = this.getStock(p);
    return s === 0 ? 'Rupture de stock' : s <= 5 ? `Reste ${s}` : `En stock (${s})`;
  }

  getBoutiqueName(p: Produit): string {
    const b = p.boutique;
    return typeof b === 'object' ? (b as any).nom ?? '—' : '—';
  }

  getBoutiqueId(p: Produit): string {
    const b = p.boutique;
    return typeof b === 'object' ? (b as any)._id ?? '' : b ?? '';
  }

  getFirstImage(p: Produit): string | null {
    return p.images?.[0] ?? null;
  }

  formatMontant(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR') + ' Ar';
  }

  private getUserId(): string | null {
    try {
      const u = JSON.parse(localStorage.getItem('user') ?? '{}');
      return u.id ?? u._id ?? null;
    } catch { return null; }
  }
}