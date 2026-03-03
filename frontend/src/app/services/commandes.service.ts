// services/mes-commandes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export type CommandesFiltreStatut = 'toutes' | 'en_cours' | 'livrees' | 'annulees';

export interface ArticleCommande {
  produit: string;
  boutique: string | { _id: string; nom: string };
  nomProduit: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export interface CommandeClient {
  _id: string;
  numeroCommande: string;
  createdAt: string;
  articles: ArticleCommande[];
  total: number;
  modeRetrait: 'livraison' | 'retrait_boutique';
  statut: 'en_attente' | 'validee' | 'preparee' | 'expediee' | 'livree' | 'annulee';
}

export interface CommandesPaginee {
  commandes: CommandeClient[];
  total: number;
  page: number;
  totalPages: number;
}

// Correspondance filtre UI → statuts API
const FILTRE_TO_STATUTS: Record<CommandesFiltreStatut, string[]> = {
  toutes: [],
  en_cours: ['en_attente', 'validee', 'preparee', 'expediee'],
  livrees: ['livree'],
  annulees: ['annulee']
};

@Injectable({ providedIn: 'root' })
export class CommandesService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private authServ: AuthService) { }

  // ─── Mes commandes paginées + filtrées
  getMesCommandes(opts: {
    filtre?: CommandesFiltreStatut;
    page?: number;
    limit?: number;
  } = {}): Observable<CommandesPaginee> {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('limit', String(opts.limit ?? 8));

    const statuts = FILTRE_TO_STATUTS[opts.filtre ?? 'toutes'];
    if (statuts.length > 0) {
      params = params.set('statuts', statuts.join(','));
    }

    const token = this.authServ.getToken();
    return this.http

      .get<any>(`${this.base}/commande/me`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      .pipe(map(r => {
        // Normalise la réponse : tableau brut ou { data: [...] }
        const raw: CommandeClient[] = Array.isArray(r) ? r : (r.data ?? r.commandes ?? []);

        // Pagination côté client si le backend renvoie tout
        const page = opts.page ?? 1;
        const limit = opts.limit ?? 8;
        const total = raw.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        // Filtre client sur statut si le backend ne filtre pas
        const filtered = statuts.length > 0
          ? raw.filter(c => statuts.includes(c.statut))
          : raw;

        const paginated = filtered.slice((page - 1) * limit, page * limit);

        return {
          commandes: paginated,
          total: filtered.length,
          page,
          totalPages: Math.max(1, Math.ceil(filtered.length / limit))
        };
      }));
  }

  // ─── Annuler une commande
  annulerCommande(id: string): Observable<CommandeClient> {
    const token = this.authServ.getToken();
    return this.http
      .put<any>(`${this.base}/commande/${id}/statut`, {
        statut: 'annulee'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .pipe(map(r => r.data ?? r));
  }
}