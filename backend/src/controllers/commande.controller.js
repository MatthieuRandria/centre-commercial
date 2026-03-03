const commandeService = require('../services/commande.service');
const Commande = require('../models/Commande');

exports.createCommande = async (req, res) => {
  try {
    const { userId, modeRetrait } = req.body;
    const commande = await commandeService.createCommande(req.user.id, modeRetrait);
    res.status(201).json({ success: true, commande });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyCommandes = async (req, res) => {
  try {
    const userId     = req.user.id;
    const page       = Math.max(1, parseInt(req.query.page)  || 1);
    const limit      = Math.min(50, parseInt(req.query.limit) || 8);
    const statutsRaw = req.query.statuts;
    const statuts    = statutsRaw ? statutsRaw.split(',').map(s => s.trim()) : [];
    const result = await commandeService.getMyCommandes(userId, { page, limit, statuts });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommandeById = async (req, res) => {
  try {
    const commande = await commandeService.getCommandeById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Introuvable' });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const commande = await commandeService.updateStatut(req.params.id, statut);
    res.json(commande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── NOUVELLE ROUTE : commandes par boutique (pour le manager) ─────────────
exports.getCommandesByBoutique = async (req, res) => {
  try {
    const { boutiqueId } = req.params;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const statut = req.query.statut  || null;
    const search = req.query.search  || null;
    const order  = req.query.order === 'asc' ? 1 : -1;

    const query = { 'articles.boutique': boutiqueId };
    if (statut) query.statut = statut;

    // Recherche sur numéro de commande
    if (search) {
      query.numeroCommande = { $regex: search, $options: 'i' };
    }

    const [commandes, total] = await Promise.all([
      Commande.find(query)
        .populate('acheteur', 'nom prenom email telephone')
        .sort({ createdAt: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Commande.countDocuments(query)
    ]);

    res.json({
      commandes,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};