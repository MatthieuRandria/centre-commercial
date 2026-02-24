const panierService = require("../services/panier.service");

exports.getPanier = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await panierService.getPanierWithTotal(userId);

        res.json({
            success: true,
            panier: result.panier,
            total: result.total
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addToPanier = async (req, res) => {
    try {
        const { produitId, quantite } = req.body;

        const panier = await panierService.addArticle(
            req.user.id,
            produitId,
            quantite
        );

        res.json({ success: true, panier });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateQuantite = async (req, res) => {
    try {
        const { produitId, quantite } = req.body;

        const panier = await panierService.updateQuantite(
            req.user.id,
            produitId,
            quantite
        );

        res.json({ success: true, panier });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.removeFromPanier = async (req, res) => {
    try {
        const { produitId } = req.params;

        const panier = await panierService.removeArticle(
            req.user.id,
            produitId
        );

        res.json({ success: true, panier });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.clearPanier = async (req, res) => {
    try {
        const panier = await panierService.clearPanier(req.user.id);

        res.json({ success: true, panier });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};