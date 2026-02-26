import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Boutique, BoutiquePagination, BoutiqueFilters } from '../models/boutique.model';

@Injectable({ providedIn: 'root' })
export class BoutiqueService {
   private apiUrl = 'http://localhost:3000/boutiques';

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
}
