const mongoose = require('mongoose');
const Commande = require('../models/Commande');
const Panier   = require('../models/Panier');
const Produit  = require('../models/Produit');

class CommandeService {

  async createCommande(acheteurId, modeRetrait) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const panier = await Panier.findOne({ user: acheteurId })
        .populate('articles.produit')
        .session(session);

      if (!panier || panier.articles.length === 0) throw new Error('Panier vide');

      let total = 0;
      const articlesCommande = [];

      for (const article of panier.articles) {
        const produit = article.produit;
        if (produit.stock < article.quantite)
          throw new Error(`Stock insuffisant pour ${produit.nom}`);

        const sousTotal = produit.prix * article.quantite;
        total += sousTotal;

        articlesCommande.push({
          produit:      produit._id,
          boutique:     produit.boutique,
          nomProduit:   produit.nom,
          prixUnitaire: produit.prix,
          quantite:     article.quantite,
          sousTotal
        });

        produit.stock -= article.quantite;
        await produit.save({ session });
      }

      const numeroCommande = Commande.generateNumero();
      const commande = await Commande.create([{
        numeroCommande, acheteur: acheteurId,
        articles: articlesCommande, total, modeRetrait
      }], { session });

      panier.articles = [];
      await panier.save({ session });
      await session.commitTransaction();
      session.endSession();
      return commande[0];

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // ─── Liste paginée + filtre statuts 
  async getMyCommandes(userId, { page = 1, limit = 8, statuts = [] } = {}) {
    const query = { acheteur: userId };
    if (statuts.length > 0) query.statut = { $in: statuts };

    const [commandes, total] = await Promise.all([
      Commande.find(query)
        .populate('articles.boutique', 'nom slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Commande.countDocuments(query)
    ]);

    return {
      commandes,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    };
  }

  async getCommandeById(id) {
    return Commande.findById(id)
      .populate('articles.produit')
      .populate('articles.boutique')
      .populate('acheteur', 'nom prenom email telephone');
  }

  async updateStatut(id, statut) {
    return Commande.updateStatut(id, statut);
  }
}

module.exports = new CommandeService();