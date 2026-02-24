const BoutiqueCategorie = require('../models/BoutiqueCategorie');

/**
 * @desc    Créer une catégorie
 * @route   POST /api/categories
 */
exports.createCategorie = async (req, res) => {
   try {
      const categorie = new BoutiqueCategorie(req.body);
      const saved = await categorie.save();

      res.status(201).json({
         success: true,
         data: saved
      });
   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Récupérer toutes les catégories (pagination + filtres)
 * @route   GET /api/categories
 */
exports.getAllCategories = async (req, res) => {
   try {
      const { page = 1, limit = 10, active, search, parent } = req.query;

      const query = {};

      if (active !== undefined) query.active = active === 'true';
      if (parent) query.parent = parent;
      if (search) query.$text = { $search: search };

      const categories = await BoutiqueCategorie.find(query)
         .populate('parent', 'nom slug')
         .sort({ ordre: 1, nom: 1 })
         .skip((page - 1) * limit)
         .limit(Number(limit));

      const total = await BoutiqueCategorie.countDocuments(query);

      res.status(200).json({
         success: true,
         total,
         page: Number(page),
         pages: Math.ceil(total / limit),
         data: categories
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Récupérer une catégorie par ID ou slug
 * @route   GET /api/categories/:idOrSlug
 */
exports.getCategorieByIdOrSlug = async (req, res) => {
   try {
      const { idOrSlug } = req.params;
      let categorie;

      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
         categorie = await BoutiqueCategorie.findById(idOrSlug)
            .populate('parent', 'nom slug');
      } else {
         categorie = await BoutiqueCategorie.findOne({ slug: idOrSlug })
            .populate('parent', 'nom slug');
      }

      if (!categorie) {
         return res.status(404).json({
            success: false,
            message: 'Catégorie non trouvée'
         });
      }

      res.status(200).json({
         success: true,
         data: categorie
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Mettre à jour une catégorie
 * @route   PUT /api/categories/:id
 */
exports.updateCategorie = async (req, res) => {
   try {
      const categorie = await BoutiqueCategorie.findByIdAndUpdate(
         req.params.id,
         req.body,
         { new: true, runValidators: true }
      );

      if (!categorie) {
         return res.status(404).json({
            success: false,
            message: 'Catégorie non trouvée'
         });
      }

      res.status(200).json({
         success: true,
         data: categorie
      });

   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Supprimer une catégorie
 * @route   DELETE /api/categories/:id
 */
exports.deleteCategorie = async (req, res) => {
   try {
      const categorie = await BoutiqueCategorie.findByIdAndDelete(req.params.id);

      if (!categorie) {
         return res.status(404).json({
            success: false,
            message: 'Catégorie non trouvée'
         });
      }

      res.status(200).json({
         success: true,
         message: 'Catégorie supprimée avec succès'
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};