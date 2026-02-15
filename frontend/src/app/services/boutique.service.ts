import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// INTERFACES

export interface Localisation {
   etage: string;
   numero_local: string;
   zone?: string;
   coordonnees_gps?: {
      latitude: number;
      longitude: number;
   };
}

export interface Infos {
   description: string;
   telephone: string;
   email: string;
   site_web?: string;
   reseaux_sociaux?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
   };
   logo_url?: string;
   images?: string[];
   superficie?: number;
   capacite_accueil?: number;
}

export interface Horaire {
   jour: string;
   ouvert: boolean;
   heures: {
      ouverture: string;
      fermeture: string;
   };
   pause_dejeuner?: {
      actif: boolean;
      debut?: string;
      fin?: string;
   };
}

export interface CentreCommercial {
   _id: string;
   nom: string;
   slug?: string;
   adresse?: {
      rue?: string;
      ville: string;
      code_postal?: string;
      pays?: string;
   };
}

export interface BoutiqueCategorie {
   _id: string;
   nom: string;
   slug?: string;
   icone: string;
   couleur?: string;
   description?: string;
}

export interface Boutique {
   _id: string;
   nom: string;
   slug: string;
   centre_commercial: CentreCommercial | string;
   categorie: BoutiqueCategorie | string;
   localisation: Localisation;
   infos: Infos;
   horaires: Horaire[];
   statut: 'active' | 'inactive' | 'en_travaux' | 'fermee_definitivement';
   date_ouverture?: Date | string;
   note_moyenne: number;
   nombre_avis: number;
   nombre_vues: number;
   nombre_favoris: number;
   tags?: string[];
   createdAt?: Date | string;
   updatedAt?: Date | string;
   // Champs calculés (virtuals)
   url?: string;
   est_ouvert_maintenant?: boolean;
   prochains_horaires?: {
      aujourdhui: Horaire;
      semaine: Horaire[];
   };
}

export interface BoutiqueFilters {
   centreId?: string;
   categorieId?: string;
   statut?: string;
   page?: number;
   limit?: number;
   sort?: string;
   order?: 'asc' | 'desc';
   search?: string;
   etage?: string;
   noteMin?: number;
}

export interface PaginationInfo {
   total: number;
   page: number;
   limit: number;
   totalPages: number;
   hasNextPage: boolean;
   hasPrevPage: boolean;
}

export interface BoutiquesResponse {
   success: boolean;
   data: {
      boutiques: Boutique[];
      pagination: PaginationInfo;
   };
}

export interface BoutiqueResponse {
   success: boolean;
   data: Boutique;
   message?: string;
}

export interface BoutiqueStats {
   vues_total: number;
   favoris_total: number;
   note_moyenne: number;
   nombre_avis: number;
   statut: string;
   date_ouverture?: Date | string;
   anciennete_jours: number;
}

export interface StatsResponse {
   success: boolean;
   data: BoutiqueStats;
}

// SERVICE
@Injectable({
   providedIn: 'root'
})
export class BoutiqueService {
   private apiUrl = `${environment.apiUrl}/boutiques`;

   private boutiquesSubject = new BehaviorSubject<Boutique[]>([]);
   public boutiques$ = this.boutiquesSubject.asObservable();

   private currentBoutiqueSubject = new BehaviorSubject<Boutique | null>(null);
   public currentBoutique$ = this.currentBoutiqueSubject.asObservable();

   private loadingSubject = new BehaviorSubject<boolean>(false);
   public loading$ = this.loadingSubject.asObservable();

   private errorSubject = new BehaviorSubject<string | null>(null);
   public error$ = this.errorSubject.asObservable();

   constructor(private http: HttpClient) { }

   // MÉTHODES PRINCIPALES
   getBoutiques(filters?: BoutiqueFilters): Observable<{ boutiques: Boutique[], total: number, pagination: PaginationInfo }> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      let params = new HttpParams();

      if (filters) {
         if (filters.centreId) {
            params = params.set('centreId', filters.centreId);
         }
         if (filters.categorieId) {
            params = params.set('categorieId', filters.categorieId);
         }
         if (filters.statut) {
            params = params.set('statut', filters.statut);
         }
         if (filters.page) {
            params = params.set('page', filters.page.toString());
         }
         if (filters.limit) {
            params = params.set('limit', filters.limit.toString());
         }
         if (filters.sort) {
            params = params.set('sort', filters.sort);
         }
         if (filters.order) {
            params = params.set('order', filters.order);
         }
         if (filters.search) {
            params = params.set('search', filters.search);
         }
         if (filters.etage) {
            params = params.set('etage', filters.etage);
         }
         if (filters.noteMin !== undefined) {
            params = params.set('noteMin', filters.noteMin.toString());
         }
      }

      return this.http.get<BoutiquesResponse>(this.apiUrl, { params }).pipe(
         map(response => {
            if (response.success) {
               this.boutiquesSubject.next(response.data.boutiques);
               this.loadingSubject.next(false);
               return {
                  boutiques: response.data.boutiques,
                  total: response.data.pagination.total,
                  pagination: response.data.pagination
               };
            }
            throw new Error('Réponse invalide du serveur');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   getBoutiqueById(id: string): Observable<Boutique> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.get<BoutiqueResponse>(`${this.apiUrl}/${id}`).pipe(
         map(response => {
            if (response.success) {
               this.currentBoutiqueSubject.next(response.data);
               this.loadingSubject.next(false);
               return response.data;
            }
            throw new Error('Boutique non trouvée');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   getBoutiqueBySlug(slug: string): Observable<Boutique> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.get<BoutiqueResponse>(`${this.apiUrl}/slug/${slug}`).pipe(
         map(response => {
            if (response.success) {
               this.currentBoutiqueSubject.next(response.data);
               this.loadingSubject.next(false);
               return response.data;
            }
            throw new Error('Boutique non trouvée');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   createBoutique(data: Partial<Boutique>): Observable<Boutique> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.post<BoutiqueResponse>(this.apiUrl, data).pipe(
         map(response => {
            if (response.success) {
               this.loadingSubject.next(false);
               this.refreshBoutiques();
               return response.data;
            }
            throw new Error(response.message || 'Erreur lors de la création');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   updateBoutique(id: string, data: Partial<Boutique>): Observable<Boutique> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.put<BoutiqueResponse>(`${this.apiUrl}/${id}`, data).pipe(
         map(response => {
            if (response.success) {
               this.currentBoutiqueSubject.next(response.data);
               this.loadingSubject.next(false);
               this.refreshBoutiques();
               return response.data;
            }
            throw new Error(response.message || 'Erreur lors de la mise à jour');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   patchBoutique(id: string, field: string, value: any): Observable<Boutique> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.patch<BoutiqueResponse>(`${this.apiUrl}/${id}`, { field, value }).pipe(
         map(response => {
            if (response.success) {
               this.currentBoutiqueSubject.next(response.data);
               this.loadingSubject.next(false);
               return response.data;
            }
            throw new Error(response.message || 'Erreur lors de la mise à jour');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   deleteBoutique(id: string): Observable<{ success: boolean; message: string }> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`).pipe(
         tap(response => {
            if (response.success) {
               this.loadingSubject.next(false);
               // Recharger la liste des boutiques
               this.refreshBoutiques();
               // Réinitialiser la boutique courante si c'est celle qui a été supprimée
               if (this.currentBoutiqueSubject.value?._id === id) {
                  this.currentBoutiqueSubject.next(null);
               }
            }
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   getBoutiqueStats(id: string): Observable<BoutiqueStats> {
      return this.http.get<StatsResponse>(`${this.apiUrl}/${id}/stats`).pipe(
         map(response => {
            if (response.success) {
               return response.data;
            }
            throw new Error('Erreur lors de la récupération des statistiques');
         }),
         catchError(error => {
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   searchBoutiques(filters: any): Observable<Boutique[]> {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      return this.http.post<{ success: boolean; data: { boutiques: Boutique[]; total: number } }>(
         `${this.apiUrl}/search`,
         filters
      ).pipe(
         map(response => {
            if (response.success) {
               this.loadingSubject.next(false);
               return response.data.boutiques;
            }
            throw new Error('Erreur lors de la recherche');
         }),
         catchError(error => {
            this.loadingSubject.next(false);
            this.errorSubject.next(this.handleError(error));
            return throwError(() => error);
         })
      );
   }

   // MÉTHODES UTILITAIRES
   private refreshBoutiques(): void {
      this.getBoutiques().subscribe();
   }

   clearCurrentBoutique(): void {
      this.currentBoutiqueSubject.next(null);
   }

   clearError(): void {
      this.errorSubject.next(null);
   }

   isOpen(boutique: Boutique): boolean {
      if (boutique.est_ouvert_maintenant !== undefined) {
         return boutique.est_ouvert_maintenant;
      }

      const now = new Date();
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const currentDay = dayNames[now.getDay()];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const todaySchedule = boutique.horaires.find(h => h.jour === currentDay);

      if (!todaySchedule || !todaySchedule.ouvert) {
         return false;
      }

      return currentTime >= todaySchedule.heures.ouverture &&
         currentTime <= todaySchedule.heures.fermeture;
   }

   formatHoraire(horaire: Horaire): string {
      if (!horaire.ouvert) {
         return 'Fermé';
      }
      return `${horaire.heures.ouverture} - ${horaire.heures.fermeture}`;
   }

   getTodaySchedule(boutique: Boutique): Horaire | null {
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const currentDay = dayNames[new Date().getDay()];
      return boutique.horaires.find(h => h.jour === currentDay) || null;
   }

   private handleError(error: any): string {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
         // Erreur côté client
         errorMessage = `Erreur: ${error.error.message}`;
      } else {
         // Erreur côté serveur
         if (error.error?.message) {
            errorMessage = error.error.message;
         } else if (error.error?.errors) {
            errorMessage = error.error.errors.join(', ');
         } else if (error.status === 404) {
            errorMessage = 'Ressource non trouvée';
         } else if (error.status === 403) {
            errorMessage = 'Accès refusé';
         } else if (error.status === 401) {
            errorMessage = 'Non authentifié';
         } else if (error.status === 500) {
            errorMessage = 'Erreur serveur';
         } else {
            errorMessage = `Erreur ${error.status}: ${error.statusText}`;
         }
      }

      console.error('Erreur BoutiqueService:', error);
      return errorMessage;
   }

   filterByStatus(statut: string): Observable<Boutique[]> {
      return this.boutiques$.pipe(
         map(boutiques => boutiques.filter(b => b.statut === statut))
      );
   }

   filterByCategory(categorieId: string): Observable<Boutique[]> {
      return this.boutiques$.pipe(
         map(boutiques => boutiques.filter(b =>
            typeof b.categorie === 'string' ? b.categorie === categorieId : b.categorie._id === categorieId
         ))
      );
   }

   getTopRated(limit: number = 5): Observable<Boutique[]> {
      return this.boutiques$.pipe(
         map(boutiques =>
            [...boutiques]
               .sort((a, b) => b.note_moyenne - a.note_moyenne)
               .slice(0, limit)
         )
      );
   }

   getMostPopular(limit: number = 5): Observable<Boutique[]> {
      return this.boutiques$.pipe(
         map(boutiques =>
            [...boutiques]
               .sort((a, b) => b.nombre_vues - a.nombre_vues)
               .slice(0, limit)
         )
      );
   }
}