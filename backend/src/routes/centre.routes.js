const express = require('express');
const router = express.Router();
const controller = require('../controllers/centre.controller');

router.post('/', controller.createCentre);
router.get('/', controller.getAllCentres);
router.get('/:idOrSlug', controller.getCentreByIdOrSlug);
router.put('/:id', controller.updateCentre);
router.delete('/:id', controller.deleteCentre);

module.exports = router;