import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/account.model';
import { AuthService } from './auth.service';

@Injectable({providedIn: 'root'})
export class UserService {
  private apiUrl = `http://localhost:3000/api/auth`;

private currentUser$ = new BehaviorSubject<UserProfile>({
    nom: 'Andriamaro',
    prenom: 'Rabe',
    email: 'rabe@example.mg',
    telephone: '34 12 345 67',
    photoUrl: undefined,
    fidelitePoints: 1240,
    fideliteNextLevel: 2000,
    fideliteNextLevelName: 'Or',
  });

  constructor(private http: HttpClient,private authServ:AuthService) {}

  getUser(): Observable<UserProfile> {
    return this.authServ.currentUser$;
    // return this.currentUser$.asObservable();
  }

  updateProfile(data: Partial<UserProfile>): Observable<UserProfile> {
    const token = this.authServ.getToken();
    return this.http.put<UserProfile>(this.apiUrl+'/me', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  changePassword(oldPw: string, newPw: string): Observable<{ success: boolean; message?: string }> {
    const token = this.authServ.getToken();
    return this.http.put<{ success: boolean; message?: string }>(
      `${this.apiUrl}/change-password`,
      { oldPw, newPw },
      { headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /** Simulates DELETE /api/users/me */
  deleteAccount(): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(800));
    // Real: return this.http.delete<{ success: boolean }>('/api/users/me');
  }

  get fidelitePercent(): number {
    const u = this.currentUser$.value;
    return Math.min(100, Math.round((u.fidelitePoints / u.fideliteNextLevel) * 100));
  }

  getDashboard(): Observable<any>{
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/dashboard`, { headers });
  }
}
