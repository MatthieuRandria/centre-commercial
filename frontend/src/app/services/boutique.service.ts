import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Boutique, BoutiquePagination, BoutiqueFilters, Categorie, CentreCommercial } from '../models/boutique.model';

@Injectable({ providedIn: 'root' })
export class BoutiqueService {
   private base = environment.apiUrl;
   private apiUrl = `${environment.apiUrl}/boutiques`;

   constructor(private http: HttpClient) { }

   getAll(filters: BoutiqueFilters = {}): Observable<BoutiquePagination> {
      let params = new HttpParams();
      Object.entries(filters).forEach(([key, val]) => {
         if (val !== undefined && val !== null && val !== '') {
            params = params.set(key, String(val));
         }
      });
      return this.http.get<any>(this.apiUrl, { params }).pipe(map(r => r.data));
   }

   getById(id: string): Observable<Boutique> {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
   }

   getBySlug(slug: string): Observable<Boutique> {
      return this.http.get<any>(`${this.apiUrl}/slug/${slug}`).pipe(map(r => r.data));
   }

   create(boutique: Partial<Boutique>): Observable<Boutique> {
      return this.http.post<Boutique>(this.apiUrl, boutique);
   }

   update(id: string, boutique: Partial<Boutique>): Observable<Boutique> {
      return this.http.put<Boutique>(`${this.apiUrl}/${id}`, boutique);
   }

   delete(id: string): Observable<void> {
      return this.http.delete<void>(`${this.apiUrl}/${id}`);
   }

   exportCsv(filters: BoutiqueFilters = {}): Observable<Blob> {
      let params = new HttpParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
      return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
   }

   // ─── Référentiels ──────────────────────────────────────────────────────────
   getCategories(): Observable<Categorie[]> {
      return this.http.get<Categorie[]>(`${this.base}/boutiquesCateg`);
   }

   getCentres(): Observable<CentreCommercial[]> {
      return this.http.get<CentreCommercial[]>(`${this.base}/centres`);
   }

   getBoutiquesByUser(userId: string): Observable<Boutique[]> {
      return this.http.get<any>(`${this.base}/boutiques`, {
         params: new HttpParams().set('userId', userId)
      }).pipe(map(r => r.data?.boutiques ?? r.data ?? []));
   }
}
