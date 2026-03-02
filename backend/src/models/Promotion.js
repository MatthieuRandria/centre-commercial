const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['pourcentage', 'fixe'],
      required: true,
    },
    valeur: {
      type: Number,
      required: true,
      min: 0,
    },
    montantMinCommande: {
      type: Number,
      default: 0,
    },
    remiseMax: {
      type: Number,
      default: null,
    },
    dateDebut: {
      type: Date,
      required: true,
    },
    dateFin: {
      type: Date,
      required: true,
    },
    limiteUtilisation: {
      type: Number,
      default: null,
    },
    nombreUtilisations: {
      type: Number,
      default: 0,
    },
    actif: {
      type: Boolean,
      default: true,
    },
    creePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'promotions',
  }
);

// Index pour les performances
promotionSchema.index({ code: 1 });
promotionSchema.index({ dateDebut: 1, dateFin: 1, actif: 1 });

/**
 * findActive() - Retourne toutes les promotions en cours
 */
promotionSchema.statics.findActive = function () {
  const maintenant = new Date();
  return this.find({
    actif: true,
    dateDebut: { $lte: maintenant },
    dateFin: { $gte: maintenant },
    $or: [
      { limiteUtilisation: null },
      { $expr: { $lt: ['$nombreUtilisations', '$limiteUtilisation'] } },
    ],
  }).sort({ createdAt: -1 });
};

/**
 * validateCode(code) - Vérifie qu'un code promo est valide
 * Retourne la promotion si valide, sinon lève une erreur
 */
promotionSchema.statics.validateCode = async function (code) {
  if (!code) throw new Error('Code promo manquant');

  const maintenant = new Date();
  const promotion = await this.findOne({
    code: code.toUpperCase().trim(),
    actif: true,
    dateDebut: { $lte: maintenant },
    dateFin: { $gte: maintenant },
  });

  if (!promotion) throw new Error('Code promo invalide ou expiré');

  if (
    promotion.limiteUtilisation !== null &&
    promotion.nombreUtilisations >= promotion.limiteUtilisation
  ) {
    throw new Error("Ce code promo a atteint sa limite d'utilisation");
  }

  return promotion;
};

/**
 * applyPromotion(code, montant) - Applique un code promo sur un montant
 * Retourne { promotion, remise, montantFinal }
 */
promotionSchema.statics.applyPromotion = async function (code, montant) {
  const promotion = await this.validateCode(code);

  if (montant < promotion.montantMinCommande) {
    throw new Error(`Montant minimum requis: ${promotion.montantMinCommande}€`);
  }

  let remise = 0;

  if (promotion.type === 'pourcentage') {
    remise = (montant * promotion.valeur) / 100;
    if (promotion.remiseMax !== null) {
      remise = Math.min(remise, promotion.remiseMax);
    }
  } else if (promotion.type === 'fixe') {
    remise = promotion.valeur;
  }

  remise = Math.min(remise, montant);
  const montantFinal = parseFloat((montant - remise).toFixed(2));

  return {
    promotion,
    remise: parseFloat(remise.toFixed(2)),
    montantFinal,
  };
};

module.exports = mongoose.model('Promotion', promotionSchema);