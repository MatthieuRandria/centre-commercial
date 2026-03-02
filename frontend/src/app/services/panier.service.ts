// services/panier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PanierProduit {
  _id:         string;
  nom:         string;
  prix:        number;
  images?:     string[];
  boutique?:   { _id: string; nom: string } | string;
  variantes?:  { type: string; valeur: string; prix: number; stock: number }[];
}

export interface PanierArticle {
  produit:   PanierProduit;
  quantite:  number;
}

export interface PanierResponse {
  success: boolean;
  panier:  { _id: string; user: string; articles: PanierArticle[] };
  total:   number;
}

export interface GroupeBoutique {
  boutiqueId:   string;
  boutiqueName: string;
  boutiqueLogo: string;
  articles:     PanierArticle[];
  sousTotal:    number;
}


export interface PanierItem {
  produit:  string;
  quantite: number;
  varianteIdx?: number;
}

export interface AddPanierPayload {
  userId:     string;
  produitId:  string;
  quantite:   number;
  varianteIdx?: number;
}

@Injectable({ providedIn: 'root' })
export class PanierService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}
  private getHeaders(): { Authorization?: string } {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // POST /panier
  addToCart(payload: AddPanierPayload): Observable<any> {
    return this.http.post(`${this.base}/panier`, payload, {headers:this.getHeaders()});
  }
}

@Injectable({ providedIn: 'root' })
export class PanierFullService {
  private base = environment.apiUrl;

  // Badge panier partagé dans l'app
  private countSubject = new BehaviorSubject<number>(0);
  count$ = this.countSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): { Authorization?: string } {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // GET /panier
  getPanier(): Observable<PanierResponse> {
    return this.http.get<PanierResponse>(`${this.base}/panier`, {
      headers: this.getHeaders() as any
    }).pipe(
      tap(r => this.countSubject.next(
        r?.panier?.articles?.reduce((s, a) => s + a.quantite, 0) ?? 0
      ))
    );
  }

  // POST /panier  { produitId, quantite }
  addArticle(produitId: string, quantite: number): Observable<PanierResponse> {
    return this.http.post<PanierResponse>(`${this.base}/panier`,
      { produitId, quantite },
      { headers: this.getHeaders() as any }
    ).pipe(
      tap(r => this.countSubject.next(
        r?.panier?.articles?.reduce((s, a) => s + a.quantite, 0) ?? 0
      ))
    );
  }

  // PUT /panier/update  { produitId, quantite }
  updateQuantite(produitId: string, quantite: number): Observable<PanierResponse> {
    return this.http.put<PanierResponse>(`${this.base}/panier/update`,
      { produitId, quantite },
      { headers: this.getHeaders() as any }
    );
  }

  // DELETE /panier/remove/:produitId
  removeArticle(produitId: string): Observable<PanierResponse> {
    return this.http.delete<PanierResponse>(
      `${this.base}/panier/remove/${produitId}`,
      { headers: this.getHeaders() as any }
    ).pipe(
      tap(r => this.countSubject.next(
        r?.panier?.articles?.reduce((s, a) => s + a.quantite, 0) ?? 0
      ))
    );
  }

  // DELETE /panier/clear
  clearPanier(): Observable<PanierResponse> {
    return this.http.delete<PanierResponse>(
      `${this.base}/panier/clear`,
      { headers: this.getHeaders() as any }
    ).pipe(tap(() => this.countSubject.next(0)));
  }

  // POST /commande  { modeRetrait }
  passerCommande(modeRetrait: 'livraison' | 'retrait_boutique'): Observable<any> {
    return this.http.post(`${this.base}/commande`,
      { modeRetrait },
      { headers: this.getHeaders() as any }
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────
  groupByBoutique(articles: PanierArticle[]): GroupeBoutique[] {
    const map = new Map<string, GroupeBoutique>();

    articles.forEach(art => {
      const b = art.produit.boutique;
      const boutiqueId   = typeof b === 'object' ? b._id  : (b ?? 'inconnu');
      const boutiqueName = typeof b === 'object' ? b.nom  : 'Boutique';
      const boutiqueLogo = boutiqueName[0]?.toUpperCase() ?? 'B';

      if (!map.has(boutiqueId)) {
        map.set(boutiqueId, { boutiqueId, boutiqueName, boutiqueLogo, articles: [], sousTotal: 0 });
      }

      const group = map.get(boutiqueId)!;
      group.articles.push(art);
      group.sousTotal += art.quantite * (art.produit?.prix ?? 0);
    });

    return Array.from(map.values());
  }

  getPrix(art: PanierArticle): number {
    return art.produit?.variantes?.[0]?.prix ?? art.produit?.prix ?? 0;
  }

  getSousTotal(art: PanierArticle): number {
    return this.getPrix(art) * art.quantite;
  }

  getTotal(articles: PanierArticle[]): number {
    return articles.reduce((s, a) => s + this.getSousTotal(a), 0);
  }

  getTotalArticles(articles: PanierArticle[]): number {
    return articles.reduce((s, a) => s + a.quantite, 0);
  }

  getFirstImage(art: PanierArticle): string | null {
    return art.produit?.images?.[0] ?? null;
  }
}