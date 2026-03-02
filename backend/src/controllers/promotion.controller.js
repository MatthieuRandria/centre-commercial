const Promotion = require('../models/Promotion');

exports.createPromotion = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      valeur,
      montantMinCommande,
      remiseMax,
      dateDebut,
      dateFin,
      limiteUtilisation,
    } = req.body;

    if (!code || !description || !type || valeur === undefined || !dateDebut || !dateFin) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    if (new Date(dateDebut) >= new Date(dateFin)) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être postérieure à la date de début',
      });
    }

    const existant = await Promotion.findOne({ code: code.toUpperCase().trim() });
    if (existant) {
      return res.status(409).json({ success: false, message: 'Ce code promo existe déjà' });
    }

    const promotion = await Promotion.create({
      code,
      description,
      type,
      valeur,
      montantMinCommande,
      remiseMax,
      dateDebut,
      dateFin,
      limiteUtilisation,
      creePar: req.user.id,
    });

    return res.status(201).json({ success: true, promotion });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findActive();
    return res.status(200).json({ success: true, promotions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.validatePromoCode = async (req, res) => {
  try {
    const { code, montant } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code promo requis' });
    }

    // Si un montant est fourni, on applique la promotion
    if (montant !== undefined) {
      const montantNum = parseFloat(montant);
      if (isNaN(montantNum) || montantNum <= 0) {
        return res.status(400).json({ success: false, message: 'Montant invalide' });
      }

      const result = await Promotion.applyPromotion(code, montantNum);
      return res.status(200).json({
        success: true,
        valide: true,
        message: 'Code promo appliqué avec succès',
        ...result,
      });
    }

    // Sinon, validation simple
    const promotion = await Promotion.validateCode(code);
    return res.status(200).json({ success: true, valide: true, promotion });
  } catch (error) {
    return res.status(400).json({ success: false, valide: false, message: error.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion introuvable' });
    }

    await Promotion.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Promotion supprimée avec succès' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};