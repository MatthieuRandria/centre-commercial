// services/manager-commandes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
<<<<<<< Updated upstream
import { environment } from '../../environments/environment';
=======
>>>>>>> Stashed changes

export type CommandeStatut =
   | 'en_attente'
   | 'validee'
   | 'preparee'
   | 'expediee'
   | 'livree'
   | 'annulee';

export type ManagerFiltreStatut = 'toutes' | 'en_attente' | 'a_preparer' | 'pretes' | 'terminees';

export interface ArticleCommande {
   produit: string;
   boutique: string | { _id: string; nom: string };
   nomProduit: string;
   prixUnitaire: number;
   quantite: number;
   sousTotal: number;
}

export interface Acheteur {
   _id: string;
   nom: string;
   prenom: string;
   email: string;
   telephone?: string;
}

export interface CommandeManager {
   _id: string;
   numeroCommande: string;
   createdAt: string;
   articles: ArticleCommande[];
   total: number;
   modeRetrait: 'livraison' | 'retrait_boutique';
   statut: CommandeStatut;
   acheteur: Acheteur;
}

export interface CommandesPaginee {
   commandes: CommandeManager[];
   total: number;
   page: number;
   totalPages: number;
}

// Correspondance filtre UI → statuts API
const FILTRE_TO_STATUTS: Record<ManagerFiltreStatut, CommandeStatut[]> = {
   toutes: [],
   en_attente: ['en_attente'],
   a_preparer: ['validee'],
   pretes: ['preparee', 'expediee'],
   terminees: ['livree', 'annulee'],
};

@Injectable({ providedIn: 'root' })
export class ManagerCommandesService {
<<<<<<< Updated upstream
   private base = environment.apiUrl;
   
=======
   private base = 'http://localhost:3000';
>>>>>>> Stashed changes

   constructor(private http: HttpClient, private authServ: AuthService) { }

   // ─── Commandes de la boutique paginées + filtrées ────────────────────────
   getCommandesBoutique(opts: {
      filtre?: ManagerFiltreStatut;
      page?: number;
      limit?: number;
   } = {}): Observable<CommandesPaginee> {
      const statuts = FILTRE_TO_STATUTS[opts.filtre ?? 'toutes'];

      let params = new HttpParams()
         .set('page', String(opts.page ?? 1))
         .set('limit', String(opts.limit ?? 8));

      if (statuts.length > 0) {
         params = params.set('statuts', statuts.join(','));
      }

      const token = this.authServ.getToken();
      return this.http
         .get<any>(`${this.base}/commande/me`, {
            params,
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         })
         .pipe(
            map(r => {
               const raw: CommandeManager[] = Array.isArray(r) ? r : (r.data ?? r.commandes ?? []);

               const page = opts.page ?? 1;
               const limit = opts.limit ?? 8;

               const filtered = statuts.length > 0
                  ? raw.filter(c => statuts.includes(c.statut))
                  : raw;

               return {
                  commandes: filtered.slice((page - 1) * limit, page * limit),
                  total: filtered.length,
                  page,
                  totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
               };
            })
         );
   }

   // ─── Compter par filtre (pour les KPI) ───────────────────────────────────
   getKpi(): Observable<{ total: number; en_attente: number; a_preparer: number; terminees: number }> {
      const token = this.authServ.getToken();
      return this.http
         .get<any>(`${this.base}/commande/me`, {
            headers: { Authorization: `Bearer ${token}` },
         })
         .pipe(
            map(r => {
               const all: CommandeManager[] = Array.isArray(r) ? r : (r.data ?? r.commandes ?? []);
               return {
                  total: all.length,
                  en_attente: all.filter(c => c.statut === 'en_attente').length,
                  a_preparer: all.filter(c => ['validee', 'preparee'].includes(c.statut)).length,
                  terminees: all.filter(c => ['livree', 'annulee'].includes(c.statut)).length,
               };
            })
         );
   }

   // ─── Mettre à jour le statut d'une commande ──────────────────────────────
   updateStatut(id: string, statut: CommandeStatut): Observable<CommandeManager> {
      const token = this.authServ.getToken();
      return this.http
         .put<any>(
            `${this.base}/commande/${id}/statut`,
            { statut },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
         )
         .pipe(map(r => r.data ?? r));
   }
}