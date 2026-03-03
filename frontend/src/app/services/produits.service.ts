import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Produit } from '../shared/produit.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProduitsService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) { }

  getProduits(filters: any): Observable<{ total: number; page: number; pages: number; data: Produit[] }> {
    let params = new HttpParams();
    Object.keys(filters || {}).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<{ total: number; page: number; pages: number; data: Produit[] }>(this.apiUrl, { params });
  }

  searchProduits(query: string): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }

  getProduitById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(r => r.data ?? r)  // unwrap { success, data } → produit directement
    );
  }

  createProduit(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      map(r => r.data ?? r)
    );
  }

  updateProduit(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
      map(r => r.data ?? r)
    );
  }

  deleteProduit(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}