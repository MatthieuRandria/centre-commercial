export interface Variante {
  valeur: string | null;
  type: string;
  nom: string;
  prix: number;
  stock: number;
  sku?: string;
}


export interface Boutique {
  _id: string;
  nom: string;
  logo?: string;
  description?: string;
}

export interface ProduitCategorie {
  _id?: string;
  nom: string;
}

/* ===============================
   Produit
=============================== */
export interface Produit {
  _id: string;
  nom: string;
  description?: string;
  prix: number;
  stock: number;
  boutique: string | Boutique;
  categories: ProduitCategorie[];
  images: string[];
  variantes: Variante[];
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}