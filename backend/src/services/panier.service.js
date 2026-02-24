const Panier = require("../models/Panier");
const Produit = require("../models/Produit");

class PanierService {

    async findOrCreateByUser(userId) {
        let panier = await Panier.findOne({ user: userId });

        if (!panier) {
            panier = await Panier.create({
                user: userId,
                articles: []
            });
        }

        return panier;
    }

    async addArticle(userId, produitId, quantite) {
        if(!userId || !produitId || !quantite) throw new Error("userId, produitId, quantite are required");
        const produit = await Produit.findById(produitId);
        if (!produit) throw new Error("Produit introuvable");

        if (produit.stock < quantite) {
            throw new Error("Stock insuffisant");
        }

        const panier = await this.findOrCreateByUser(userId);

        const articleIndex = panier.articles.findIndex(
            a => a.produit.toString() === produitId
        );

        if (articleIndex > -1) {
            panier.articles[articleIndex].quantite += quantite;
        } else {
            panier.articles.push({ produit: produitId, quantite });
        }

        await panier.save();
        return panier;
    }

    async updateQuantite(userId, produitId, quantite) {
        const panier = await this.findOrCreateByUser(userId);

        const article = panier.articles.find(
            a => a.produit.toString() === produitId
        );

        if (!article) throw new Error("Article non trouvé");

        const produit = await Produit.findById(produitId);
        if (produit.stock < quantite) {
            throw new Error("Stock insuffisant");
        }

        article.quantite = quantite;
        await panier.save();

        return panier;
    }

    async removeArticle(userId, produitId) {
        const panier = await this.findOrCreateByUser(userId);

        panier.articles = panier.articles.filter(
            a => a.produit.toString() !== produitId
        );

        await panier.save();
        return panier;
    }

    async clearPanier(userId) {
        const panier = await this.findOrCreateByUser(userId);
        panier.articles = [];
        await panier.save();

        return panier;
    }

    async getPanierWithTotal(userId) {
        const panier = await this.findOrCreateByUser(userId);

        await panier.populate("articles.produit");

        let total = 0;

        panier.articles.forEach(article => {
            total += article.quantite * article.produit.prix;
        });

        return { panier, total };
    }
}

module.exports = new PanierService();