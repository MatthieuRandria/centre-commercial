// src/services/dashboard.service.js
const Boutique  = require('../models/Boutique');
const Commande  = require('../models/Commande');
const Produit   = require('../models/Produit');
const User      = require('../models/User');

class DashboardService {

  // ─── KPIs globaux ─────────────────────────────────────────────────────────
  async getKpis() {
    const maintenant = new Date();

    // Début du mois courant et du mois précédent
    const debutMoisCourant = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debutMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);

    // Début de la semaine courante (lundi)
    const debutSemaine = new Date(maintenant);
    debutSemaine.setDate(maintenant.getDate() - ((maintenant.getDay() + 6) % 7));
    debutSemaine.setHours(0, 0, 0, 0);

    const [
      boutiquesActives,
      boutiquesActivesMoisPrecedent,
      totalProduits,
      produitsSemaine,
      totalCommandes,
      commandesMoisCourant,
      commandesMoisPrecedent,
      caStats,
      caMoisPrecedentStats
    ] = await Promise.all([
      // Boutiques actives maintenant
      Boutique.countDocuments({ statut: 'active' }),

      // Boutiques actives en début de mois courant (approximation : créées avant ce mois)
      Boutique.countDocuments({
        statut: 'active',
        createdAt: { $lt: debutMoisCourant }
      }),

      // Total produits actifs
      Produit.countDocuments({ actif: true }),

      // Produits ajoutés cette semaine
      Produit.countDocuments({
        actif: true,
        createdAt: { $gte: debutSemaine }
      }),

      // Total commandes (hors annulées)
      Commande.countDocuments({ statut: { $ne: 'annulee' } }),

      // Commandes ce mois-ci
      Commande.countDocuments({
        statut: { $ne: 'annulee' },
        createdAt: { $gte: debutMoisCourant }
      }),

      // Commandes mois précédent
      Commande.countDocuments({
        statut: { $ne: 'annulee' },
        createdAt: { $gte: debutMoisPrecedent, $lt: debutMoisCourant }
      }),

      // CA mois courant
      Commande.aggregate([
        { $match: { statut: { $nin: ['annulee', 'en_attente'] }, createdAt: { $gte: debutMoisCourant } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // CA mois précédent
      Commande.aggregate([
        { $match: { statut: { $nin: ['annulee', 'en_attente'] }, createdAt: { $gte: debutMoisPrecedent, $lt: debutMoisCourant } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const caMoisCourant  = caStats[0]?.total ?? 0;
    const caMoisPrec     = caMoisPrecedentStats[0]?.total ?? 0;
    const variationCaPct = caMoisPrec > 0
      ? Math.round(((caMoisCourant - caMoisPrec) / caMoisPrec) * 100)
      : 0;

    return {
      boutiques_actives: {
        total:     boutiquesActives,
        variation: boutiquesActives - boutiquesActivesMoisPrecedent,
        periode:   'ce mois'
      },
      produits_references: {
        total:     totalProduits,
        variation: produitsSemaine,
        periode:   'cette semaine'
      },
      commandes_totales: {
        total:     totalCommandes,
        variation: commandesMoisCourant,
        periode:   'ce mois'
      },
      ca_total: {
        valeur:         caMoisCourant,
        unite:          'Ar',
        variation_pct:  variationCaPct
      }
    };
  }

  // ─── Évolution CA sur N mois ───────────────────────────────────────────────
  async getCaEvolution(periode = '12m') {
    const nbMois = periode === '6m' ? 6 : 12;
    const maintenant = new Date();

    // Date de début : 1er du mois il y a nbMois
    const dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - (nbMois - 1), 1);

    const pipeline = [
      {
        $match: {
          statut: { $nin: ['annulee', 'en_attente'] },
          createdAt: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: {
            annee: { $year: '$createdAt' },
            mois:  { $month: '$createdAt' }
          },
          total: { $sum: '$total' }
        }
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } }
    ];

    const resultats = await Commande.aggregate(pipeline);

    // Construire un tableau complet avec tous les mois (même ceux à 0)
    const moisFr = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const points = [];

    for (let i = nbMois - 1; i >= 0; i--) {
      const date  = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const annee = date.getFullYear();
      const mois  = date.getMonth() + 1; // 1-12

      const trouve = resultats.find(r => r._id.annee === annee && r._id.mois === mois);
      points.push({
        mois:   moisFr[mois - 1],
        valeur: trouve ? Math.round(trouve.total / 1_000_000 * 10) / 10 : 0  // en millions Ar
      });
    }

    return points;
  }

  // ─── Top boutiques par CA ──────────────────────────────────────────────────
  async getTopBoutiques(limit = 5) {
    const pipeline = [
      // Uniquement commandes finalisées
      { $match: { statut: { $nin: ['annulee', 'en_attente'] } } },
      // Dépiler les articles pour grouper par boutique
      { $unwind: '$articles' },
      {
        $group: {
          _id:       '$articles.boutique',
          ca:        { $sum: '$articles.sousTotal' },
          commandes: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          ca:        1,
          commandes: { $size: '$commandes' }
        }
      },
      { $sort: { ca: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from:         'boutiques',
          localField:   '_id',
          foreignField: '_id',
          as:           'boutique'
        }
      },
      { $unwind: { path: '$boutique', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          boutique: { _id: '$boutique._id', nom: '$boutique.nom', slug: '$boutique.slug' },
          ca:        1,
          commandes: 1
        }
      }
    ];

    const resultats = await Commande.aggregate(pipeline);

    return resultats.map((r, idx) => ({
      rang:      idx + 1,
      boutique:  r.boutique ?? { _id: r._id, nom: 'Boutique inconnue', slug: '' },
      ca:        r.ca ?? 0,
      commandes: r.commandes ?? 0
    }));
  }

  // ─── Top produits par ventes ───────────────────────────────────────────────
  async getTopProduits(limit = 5) {
    const pipeline = [
      { $match: { statut: { $nin: ['annulee', 'en_attente'] } } },
      { $unwind: '$articles' },
      {
        $group: {
          _id:    '$articles.produit',
          ventes: { $sum: '$articles.quantite' },
          // Garder le nom dénormalisé en fallback
          nomProduit: { $first: '$articles.nomProduit' },
          boutique:   { $first: '$articles.boutique'  }
        }
      },
      { $sort: { ventes: -1 } },
      { $limit: limit },
      // Lookup produit
      {
        $lookup: {
          from: 'produits', localField: '_id',
          foreignField: '_id', as: 'produitDoc'
        }
      },
      { $unwind: { path: '$produitDoc', preserveNullAndEmptyArrays: true } },
      // Lookup boutique
      {
        $lookup: {
          from: 'boutiques', localField: 'boutique',
          foreignField: '_id', as: 'boutiqueDoc'
        }
      },
      { $unwind: { path: '$boutiqueDoc', preserveNullAndEmptyArrays: true } }
    ];

    const resultats = await Commande.aggregate(pipeline);

    return resultats.map((r, idx) => ({
      rang:    idx + 1,
      produit: {
        _id: r._id,
        nom: r.produitDoc?.nom ?? r.nomProduit ?? 'Produit inconnu'
      },
      boutique: {
        nom: r.boutiqueDoc?.nom ?? 'Boutique inconnue'
      },
      ventes: r.ventes
    }));
  }

  // ─── Dernières commandes ──────────────────────────────────────────────────
  async getRecentCommandes(limit = 10) {
    const commandes = await Commande.find({ statut: { $ne: 'annulee' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('acheteur', 'nom prenom email')
      .populate('articles.boutique', 'nom')
      .lean();

    return commandes.map(c => ({
      _id:      c._id,
      numero:   c.numeroCommande,
      createdAt: c.createdAt,
      client: {
        nom:    c.acheteur?.nom    ?? '—',
        prenom: c.acheteur?.prenom ?? ''
      },
      // Boutique principale = celle du 1er article
      boutique: {
        nom: c.articles?.[0]?.boutique?.nom ?? '—'
      },
      montant: c.total ?? 0,
      statut:  c.statut
    }));
  }

  // ─── Badge commandes en attente ───────────────────────────────────────────
  async getCommandesBadge() {
    const en_attente = await Commande.countDocuments({ statut: 'en_attente' });
    return { en_attente };
  }
}

module.exports = new DashboardService();