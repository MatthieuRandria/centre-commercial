import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../shared/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitsService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) { }

  getProduits(filters: any): Observable<{total: number; page: number; pages: number; data: Produit[] }>{
    let params = new HttpParams();

    Object.keys(filters || {}).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<{ total: number; page: number; pages: number; data: Produit[] }>(
      this.apiUrl,
      { params }
    );
  }

  searchProduits(query: string): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  getProduitById(id: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${id}`);
  }

  createProduit(formData: FormData): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, formData);
  }

  updateProduit(id: string, formData: FormData): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/${id}`, formData);
  }


}
