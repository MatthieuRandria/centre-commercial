const avisService = require("../services/avis.service");
const Avis = require("../models/Avis");

exports.createAvis = async (req, res) => {
    try {
        const { userId,type, cibleId, note, commentaire } = req.body;

        const avis = await avisService.createAvis(
            userId,
            type,
            cibleId,
            note,
            commentaire
        );

        res.status(201).json(avis);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAvisProduit = async (req, res) => {
    const avis = await Avis.findByProduit(req.params.id);
    res.json(avis);
};

exports.getAvisBoutique = async (req, res) => {
    const avis = await Avis.findByBoutique(req.params.id);
    res.json(avis);
};

exports.deleteAvis = async (req, res) => {
    try {
        await avisService.deleteAvis(req.user.id, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};