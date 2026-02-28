// services/favoris.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
// import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private base = "http://localhost:3000";

  constructor(private http: HttpClient, private authService:AuthService) {}

  // GET /favoris/check/:produitId
  checkFavori(produitId: string): Observable<{ isFavori: boolean }> {
    const token=this.authService.getToken();
    return this.http.get<{ isFavori: boolean }>(`${this.base}/favoris/check/${produitId}`,{
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // POST /favoris  { userId, produitId }
  addFavori(userId: string, produitId: string): Observable<any> {
    const token=this.authService.getToken();
    return this.http.post(`${this.base}/favoris`, { userId, produitId },{
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // DELETE /favoris/:produitId
  removeFavori(produitId: string): Observable<any> {
    const token=this.authService.getToken();
    return this.http.delete(`${this.base}/favoris/${produitId}`,{
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}