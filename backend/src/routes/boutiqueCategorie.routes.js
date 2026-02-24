const express = require('express');
const router = express.Router();
const controller = require('../controllers/boutiqueCategorie.controller');

router.post('/', controller.createCategorie);
router.get('/', controller.getAllCategories);
router.get('/:idOrSlug', controller.getCategorieByIdOrSlug);
router.put('/:id', controller.updateCategorie);
router.delete('/:id', controller.deleteCategorie);

module.exports = router;