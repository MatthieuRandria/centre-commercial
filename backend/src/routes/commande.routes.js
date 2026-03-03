const express = require("express");
const router  = express.Router();
const controller = require("../controllers/commande.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/", auth.auth,
    controller.createCommande);
router.get("/me", auth.auth,
    controller.getMyCommandes);
router.get("/:id", auth.auth, 
    controller.getCommandeById);
router.put("/:id/statut", auth.auth, 
    controller.updateStatut);
router.get("/boutique/:boutiqueId", auth.auth, 
    controller.getCommandesByBoutique);

module.exports = router;