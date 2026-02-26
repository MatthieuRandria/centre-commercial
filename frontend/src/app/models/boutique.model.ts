export interface Categorie {
   _id: string;
   nom: string;
   icone: string;
   couleur: string;
   slug: string;
}

export interface CentreCommercial {
   _id: string;
   nom: string;
   adresse: { ville: string; code_postal?: string };
   slug: string;
}

export interface Horaire {
   jour: string;
   ouvert: boolean;
   heures: { ouverture: string; fermeture: string };
   pause_dejeuner: { actif: boolean; debut?: string; fin?: string };
}

export interface Boutique {
   _id: string;
   nom: string;
   slug: string;
   centre_commercial: CentreCommercial;
   categorie: Categorie;
   localisation: {
      etage: string;
      numero_local: string;
      zone?: string;
   };
   infos: {
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
   };
   horaires: Horaire[];
   statut: 'active' | 'inactive' | 'en_travaux' | 'fermee_definitivement';
   note_moyenne: number;
   nombre_avis: number;
   nombre_vues: number;
   nombre_favoris: number;
   tags: string[];
   est_ouvert_maintenant?: boolean;
   createdAt: string;
   updatedAt: string;
}

export interface BoutiquePagination {
   boutiques: Boutique[];
   pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
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
