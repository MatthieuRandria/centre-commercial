// services/panier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

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
  private base = "http://localhost:3000";

  constructor(private http: HttpClient) {}

  // POST /panier
  addToCart(payload: AddPanierPayload): Observable<any> {
    return this.http.post(`${this.base}/panier`, payload);
  }
}