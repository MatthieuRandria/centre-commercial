const express = require("express");
const router = express.Router();

const controller = require("../controllers/avis.controller");
const auth = require("../middlewares/auth.middleware");

// Produit
router.post("/produit", //auth, 
    (req, res) => {
    req.body.type = "produit";
    controller.createAvis(req, res);
});

router.get("/produit/:id", controller.getAvisProduit);

// Boutique
router.post("/boutique", //auth, 
    (req, res) => {
    req.body.type = "boutique";
    controller.createAvis(req, res);
});

router.get("/boutique/:id", controller.getAvisBoutique);

// Delete
router.delete("/:id", //auth, 
    controller.deleteAvis);

module.exports = router;