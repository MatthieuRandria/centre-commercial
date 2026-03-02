const express = require('express');
const router  = express.Router();
const { auth, checkRole } = require('../middlewares/auth.middleware');
const { createPromotion,getActivePromotions,validatePromoCode,deletePromotion,} = require('../controllers/promotion.controller');

router.post('/', checkRole(['admin']), createPromotion);
router.get('/active',getActivePromotions);
router.post('/validate',auth, validatePromoCode);
router.delete('/:id',checkRole(['admin']), deletePromotion);

module.exports = router;