const express = require("express");
const router = express.Router();

const panierController = require("../controllers/panier.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// GET mon panier
router.get("/", //authMiddleware.checkRole(["client"]),
 panierController.getPanier);

// Ajouter article
router.post("/", //authMiddleware.checkRole(["client"]),
 panierController.addToPanier);

// Modifier quantité
router.put("/update", //authMiddleware.checkRole(["client"]),
 panierController.updateQuantite);

// Retirer article
router.delete("/remove/:produitId", //authMiddleware.checkRole(["client"]),
 panierController.removeFromPanier);

// Vider panier
router.delete("/clear", //authMiddleware.checkRole(["client"]),
 panierController.clearPanier);

module.exports = router;