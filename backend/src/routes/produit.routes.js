const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/produit.controller');

router.get('/categories', controller.getProduitCategories);
router.get('/m/', controller.getAllProduits);
router.get('/', controller.getAllProduitsMahery);
router.post('/', controller.createProduit);
router.get('/:id', controller.getProduitById);
router.put('/:id', controller.updateProduit);
router.delete('/:id', controller.deleteProduit);

module.exports = router;