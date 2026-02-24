const Avis = require("../models/Avis");
const Commande = require("../models/Commande");
const Produit = require("../models/Produit");
const Boutique = require("../models/Boutique");

class AvisService {

    async verifyPurchase(userId, type, cibleId) {
        const commandes = await Commande.find({
            acheteur: userId,
            statut: "livree"
        });

        if (type === "produit") {
            return commandes.some(cmd =>
                cmd.articles.some(a =>
                    a.produit.toString() === cibleId
                )
            );
        }

        if (type === "boutique") {
            return commandes.some(cmd =>
                cmd.articles.some(a =>
                    a.boutique.toString() === cibleId
                )
            );
        }

        return false;
    }

    async createAvis(userId, type, cibleId, note, commentaire) {

        const canReview = await Avis.canUserReview(userId, type, cibleId);
        if (!canReview) throw new Error("Déjà noté");

        const hasPurchased = await this.verifyPurchase(userId, type, cibleId);
        if (!hasPurchased) throw new Error("Achat requis pour noter");

        const cibleModel = type === "produit" ? "Produit" : "Boutique";

        const avis = await Avis.create({
            user: userId,
            type,
            cibleId,
            cibleModel,
            note,
            commentaire
        });

        const stats = await Avis.getAverageNote(type, cibleId);

        if (type === "produit") {
            await Produit.findByIdAndUpdate(cibleId, {
                noteMoyenne: stats.average,
                nombreAvis: stats.count
            });
        }

        if (type === "boutique") {
            await Boutique.findByIdAndUpdate(cibleId, {
                noteMoyenne: stats.average,
                nombreAvis: stats.count
            });
        }

        return avis;
    }

    async deleteAvis(userId, avisId) {
        const avis = await Avis.findById(avisId);
        if (!avis) throw new Error("Introuvable");

        if (avis.user.toString() !== userId.toString()) {
            throw new Error("Non autorisé");
        }

        await avis.deleteOne();

        const stats = await Avis.getAverageNote(avis.type, avis.cibleId);

        if (avis.type === "produit") {
            await Produit.findByIdAndUpdate(avis.cibleId, {
                noteMoyenne: stats.average,
                nombreAvis: stats.count
            });
        }

        if (avis.type === "boutique") {
            await Boutique.findByIdAndUpdate(avis.cibleId, {
                noteMoyenne: stats.average,
                nombreAvis: stats.count
            });
        }

        return true;
    }
}

module.exports = new AvisService();