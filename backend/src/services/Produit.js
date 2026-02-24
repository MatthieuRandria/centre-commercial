const Produit=require("../models/Produit");

class ProduitService {

    async createProduit(data) {
        return Produit.create(data);
    }

    async getProduitsByBoutique(boutiqueId) {
        return Produit.find({ boutique: boutiqueId, actif: true });
    }

    async searchProduits(query) {
        if (!query || query.length < 2) {
            throw new Error("Recherche invalide");
        }
        return Produit.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });
    }

}

module.exports = ProduitService;