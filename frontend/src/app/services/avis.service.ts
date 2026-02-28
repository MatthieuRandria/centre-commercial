// services/avis.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

export interface AvisUser { _id: string; nom: string; prenom?: string; }

export interface Avis {
  _id:         string;
  user:        AvisUser;
  type:        'produit' | 'boutique';
  cibleId:     string;
  note:        number;
  commentaire: string;
  createdAt:   string;
}

export interface CreateAvisPayload {
  userId:      string;
  cibleId:     string;
  note:        number;
  commentaire: string;
}

@Injectable({ providedIn: 'root' })
export class AvisService {
  private base = "http://localhost:3000";

  constructor(private http: HttpClient) {}

  // GET /avis/produit/:id
  getAvisProduit(produitId: string): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.base}/avis/produit/${produitId}`);
  }

  // POST /avis/produit
  createAvisProduit(payload: CreateAvisPayload): Observable<Avis> {
    return this.http.post<Avis>(`${this.base}/avis/produit`, {
      ...payload,
      type: 'produit'
    });
  }

  // DELETE /avis/:id
  deleteAvis(avisId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.base}/avis/${avisId}`);
  }
}