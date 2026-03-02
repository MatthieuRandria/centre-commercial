import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Produit } from '../shared/produit.model';
import { Boutique, Categorie } from '../models/boutique.model';

export interface ProduitPage {
  total: number;
  page:  number;
  pages: number;
  data:  Produit[];
}

export interface CatalogueFilters {
  search?:       string;
  categories?:   string[];
  boutiques?:    string[];
  prixMin?:      number | null;
  prixMax?:      number | null;
  enPromotion?:  boolean;
  enStock?:      boolean;
  sortBy?:       'date' | 'prix' | 'vues';
  order?:        'asc' | 'desc';
  page?:         number;
  limit?:        number;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProduits(filters: CatalogueFilters): Observable<ProduitPage> {
    let params = new HttpParams();

    if (filters.search)       params = params.set('q',           filters.search);
    if (filters.prixMin)      params = params.set('prixMin',     String(filters.prixMin));
    if (filters.prixMax)      params = params.set('prixMax',     String(filters.prixMax));
    if (filters.enPromotion)  params = params.set('enPromotion', 'true');
    if (filters.enStock)      params = params.set('enStock',     'true');
    if (filters.sortBy)       params = params.set('sortBy',      filters.sortBy);
    if (filters.order)        params = params.set('order',       filters.order);

    params = params.set('page',  String(filters.page  ?? 1));
    params = params.set('limit', String(filters.limit ?? environment.defaultPageSize));

    if (filters.boutiques?.length)  params = params.set('boutiqueId', filters.boutiques[0]);
    if (filters.categories?.length) params = params.set('categorie',  filters.categories[0]);

    return this.http.get<ProduitPage>(`${this.base}/produits`, { params });
  }

  getBoutiques(): Observable<Boutique[]> {
    return this.http.get<any>(`${this.base}/boutiques`).pipe(
      map(r => Array.isArray(r) ? r : (r.data ?? [])),
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<Categorie[]> {
    return this.http.get<any>(`${this.base}/produits/categories`).pipe(
      map(r => Array.isArray(r) ? r : (r.data ?? [])),
      catchError(() => of([]))
    );
  }

  loadSidebarData(): Observable<{ boutiques: Boutique[]; categories: Categorie[] }> {
    return forkJoin({
      boutiques:  this.getBoutiques(),
      categories: this.getCategories()
    });
  }
}
