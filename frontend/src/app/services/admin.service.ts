import { environment } from '../../environments/environment';
// services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// ─── Interfaces API (miroir exact du backend) ─────────────────────────────

export interface DashboardKpis {
  boutiques_actives:   { total: number; variation: number; periode: string };
  produits_references: { total: number; variation: number; periode: string };
  commandes_totales:   { total: number; variation: number; periode: string };
  ca_total:            { valeur: number; unite: string; variation_pct: number };
}

export interface CaPoint {
  mois:   string;   // 'Jan', 'Fév', …
  valeur: number;   // millions Ar
}

export interface TopBoutiqueApi {
  rang:      number;
  boutique:  { _id: string; nom: string; slug: string };
  ca:        number;
  commandes: number;
}

export interface TopProduitApi {
  rang:     number;
  produit:  { _id: string; nom: string };
  boutique: { nom: string };
  ventes:   number;
}

export interface CommandeRecente {
  _id:       string;
  numero:    string;
  createdAt: string;
  client:    { nom: string; prenom: string };
  boutique:  { nom: string };
  montant:   number;
  statut:    'en_attente' | 'validee' | 'preparee' | 'expediee' | 'livree' | 'annulee';
}

export interface CommandesBadge {
  en_attente: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient,private authServ:AuthService) {}

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  // GET /dashboard/kpis
  getKpis(): Observable<DashboardKpis> {
    const token = this.authServ.getToken();
    return this.http
    .get<{ success: boolean; data: DashboardKpis }>(`${this.base}/dashboard/kpis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .pipe(map(r => r.data));
  }

  // ─── Évolution CA ─────────────────────────────────────────────────────────
  // GET /dashboard/ca-evolution?periode=12m
  getCaEvolution(periode: '6m' | '12m'): Observable<CaPoint[]> {
    const token = this.authServ.getToken();
    return this.http
      .get<{ success: boolean; data: CaPoint[] }>(`${this.base}/dashboard/ca-evolution`, {
        params: { periode },
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      },)
      .pipe(map(r => r.data));
  }

  // ─── Top boutiques ────────────────────────────────────────────────────────
  // GET /dashboard/top-boutiques?limit=5
  getTopBoutiques(limit = 5): Observable<TopBoutiqueApi[]> {
    const token = this.authServ.getToken();
    return this.http
      .get<{ success: boolean; data: TopBoutiqueApi[] }>(`${this.base}/dashboard/top-boutiques`, {
        params: { limit: String(limit) },
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      })
      .pipe(map(r => r.data));
  }

  // ─── Top produits 
  getTopProduits(limit = 5): Observable<TopProduitApi[]> {
    const token = this.authServ.getToken();
    return this.http
      .get<{ success: boolean; data: TopProduitApi[] }>(`${this.base}/dashboard/top-produits`, {
        params: { limit: String(limit) },
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      })
      .pipe(map(r => r.data));
  }

  // ─── Dernières commandes 
  getRecentCommandes(limit = 10): Observable<CommandeRecente[]> {
    const token = this.authServ.getToken();
    return this.http
      .get<{ success: boolean; data: CommandeRecente[] }>(`${this.base}/dashboard/commandes-recentes`, {
        params: { limit: String(limit) },
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      })
      .pipe(map(r => r.data));
  }

  // ─── Badge commandes en attente 
  getCommandesBadge(): Observable<CommandesBadge> {
    const token = this.authServ.getToken();
    return this.http
      .get<{ success: boolean; data: CommandesBadge }>(`${this.base}/dashboard/commandes-badge`,{
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      })
      .pipe(map(r => r.data));
  }
}