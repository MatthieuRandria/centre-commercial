// src/routes/dashboard.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboard.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

// Toutes les routes dashboard sont réservées aux admins
// Pour tester sans token, remplacer adminOnly par []
const adminOnly = [auth, checkRole(['admin'])];

router.get('/kpis',               ...adminOnly, ctrl.getKpis);
router.get('/ca-evolution',       ...adminOnly, ctrl.getCaEvolution);
router.get('/top-boutiques',      ...adminOnly, ctrl.getTopBoutiques);
router.get('/top-produits',       ...adminOnly, ctrl.getTopProduits);
router.get('/commandes-recentes', ...adminOnly, ctrl.getRecentCommandes);
router.get('/commandes-badge',    ...adminOnly, ctrl.getCommandesBadge);

module.exports = router;