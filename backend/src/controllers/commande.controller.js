const commandeService = require("../services/commande.service");

exports.createCommande = async (req, res) => {
    try {
        const { userId,modeRetrait } = req.body;

        const commande = await commandeService.createCommande(
            userId,
            modeRetrait
        );

        res.status(201).json({
            success: true,
            commande
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMyCommandes = async (req, res) => {
    try {
        const commandes = await commandeService.getMyCommandes(req.user.id);
        res.json(commandes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCommandeById = async (req, res) => {
    try {
        const commande = await commandeService.getCommandeById(req.params.id);

        if (!commande) return res.status(404).json({ message: "Introuvable" });

        res.json(commande);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStatut = async (req, res) => {
    try {
        const { statut } = req.body;

        const commande = await commandeService.updateStatut(
            req.params.id,
            statut
        );

        res.json(commande);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};