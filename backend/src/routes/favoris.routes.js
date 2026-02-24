const express = require("express");
const router = express.Router();

const controller = require("../controllers/favoris.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/", //auth, 
    controller.addFavori);

router.delete("/:produitId", //auth,
     controller.removeFavori);

router.get("/me", //auth,
     controller.getUserFavoris);

router.get("/check/:produitId", //auth,
     controller.checkFavori);

module.exports = router;