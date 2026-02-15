const express = require('express');
const router = express.Router();
const {
   getAllBoutiques,
   getBoutiqueById,
   getBoutiqueBySlug,
   createBoutique,
   updateBoutique,
   patchBoutique,
   deleteBoutique,
   getBoutiqueStats,
   searchBoutiques
} = require('../controllers/boutique.controller');

router.get('/', getAllBoutiques);
router.post('/search', searchBoutiques);
router.get('/slug/:slug', getBoutiqueBySlug);
router.get('/:id', getBoutiqueById);
router.get('/:id/stats', getBoutiqueStats);
router.post('/', createBoutique);
router.put('/:id', updateBoutique);
router.patch('/:id', patchBoutique);
router.delete('/:id', deleteBoutique);

module.exports = router;