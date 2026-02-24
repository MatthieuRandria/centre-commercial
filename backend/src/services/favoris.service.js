const Favoris = require("../models/Favoris");
const Produit = require("../models/Produit");

class FavorisService {

    async addFavori(userId, produitId) {
        const produit = await Produit.findById(produitId);
        if (!produit) throw new Error("Produit introuvable");

        return Favoris.addFavori(userId, produitId);
    }

    async removeFavori(userId, produitId) {
        return Favoris.removeFavori(userId, produitId);
    }

    async getUserFavoris(userId) {
        return Favoris.getUserFavoris(userId);
    }

    async isFavorite(userId, produitId) {
        return Favoris.isFavorite(userId, produitId);
    }

    async toggleFavori(userId, produitId) {
        const exists = await Favoris.isFavorite(userId, produitId);

        if (exists) {
            await Favoris.removeFavori(userId, produitId);
            return { isFavorite: false };
        }

        await Favoris.addFavori(userId, produitId);
        return { isFavorite: true };
    }
}

module.exports = new FavorisService();