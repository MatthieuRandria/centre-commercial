/* ===============================
   Variante
=============================== */
export interface Variante {
  nom: string;
  prix: number;
  stock: number;
  sku?: string;
}


/* ===============================
   Boutique (simplifié)
   👉 Ajuste selon ton model boutique
=============================== */
export interface Boutique {
  _id: string;
  nom: string;
  logo?: string;
  description?: string;
}


/* ===============================
   Produit
=============================== */
export interface Produit {
  _id: string;
  nom: string;
  description: string;
  images?: string[];
  variantes?: Variante[];
  boutique: any;
  categorie?: string;
  enPromotion?: boolean;
  vues?: number;
  createdAt?: string;
}