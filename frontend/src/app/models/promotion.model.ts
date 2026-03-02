export type TypePromotion = 'pourcentage' | 'fixe';

export type StatutPromotion = 'active' | 'a_venir' | 'expiree' | 'suspendue';

export interface Promotion {
  _id: string;
  code: string;
  description: string;
  type: TypePromotion;
  valeur: number;
  montantMinCommande: number;
  remiseMax: number | null;
  dateDebut: string;
  dateFin: string;
  limiteUtilisation: number | null;
  nombreUtilisations: number;
  actif: boolean;
  creePar: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionDto {
  code: string;
  description: string;
  type: TypePromotion;
  valeur: number;
  montantMinCommande?: number;
  remiseMax?: number | null;
  dateDebut: string;
  dateFin: string;
  limiteUtilisation?: number | null;
}

export interface ValidateCodeDto {
  code: string;
  montant?: number;
}

export interface ValidateCodeResponse {
  success: boolean;
  valide: boolean;
  message: string;
  promotion?: Promotion;
  remise?: number;
  montantFinal?: number;
}

export interface PromotionStats {
  total: number;
  actives: number;
  aVenir: number;
  expirees: number;
}