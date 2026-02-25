const favorisService = require("../services/favoris.service");

exports.addFavori = async (req, res) => {
    try {
        const { produitId } = req.body;
        const favori = await favorisService.addFavori(req.user.id, produitId);
        res.status(201).json(favori);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.removeFavori = async (req, res) => {
    try {
        await favorisService.removeFavori(req.user.id, req.params.produitId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getUserFavoris = async (req, res) => {
    try {
        const favoris = await favorisService.getUserFavoris(req.user.id);
        res.json(favoris);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkFavori = async (req, res) => {
    try {
        const isFavorite = await favorisService.isFavorite(
            req.user.id,
            req.params.produitId
        );

        res.json({ isFavorite });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};