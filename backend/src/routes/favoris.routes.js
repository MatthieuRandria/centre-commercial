const express = require("express");
const router = express.Router();

const controller = require("../controllers/favoris.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/", auth.auth, 
    controller.addFavori);

router.delete("/:produitId", auth.auth,
     controller.removeFavori);

router.get("/me", auth.auth,
     controller.getUserFavoris);

router.get("/check/:produitId", auth.auth,
     controller.checkFavori);

module.exports = router;