const Produit = require('../models/Produit');

/**
 * @desc    GET tous les produits
 * @route   GET /api/produits
 * @access  Public
 */
exports.getAllProduits = async (req, res, next) => {
   try {
      const {
         boutiqueId,
         categorie,
         prixMin,
         prixMax,
         enPromotion,
         sortBy = "date",
         order = "desc",
         page = 1,
         limit = 10
      } = req.query;

      const filters = { actif: true };

      if (boutiqueId) filters.boutique = boutiqueId;
      if (categorie) filters.categorie = categorie;

      if (prixMin || prixMax) {
         filters["variantes.prix"] = {};
         if (prixMin) filters["variantes.prix"].$gte = Number(prixMin);
         if (prixMax) filters["variantes.prix"].$lte = Number(prixMax);
      }

      if (enPromotion === "true") {
         filters.enPromotion = true;
      }

      // TRI
      let sortOptions = {};
      const sortFields = {
         prix: "variantes.prix",
         date: "createdAt",
         vues: "vues"
      };

      const field = sortFields[sortBy] || "createdAt";
      sortOptions[field] = order === "asc" ? 1 : -1;

      // PAGINATION
      const skip = (page - 1) * limit;

      const produits = await Produit.find(filters)
         .populate("boutique")
         .sort(sortOptions)
         .skip(skip)
         .limit(Number(limit));

      const total = await Produit.countDocuments(filters);

      res.json({
         total,
         page: Number(page),
         pages: Math.ceil(total / limit),
         data: produits
      });

   } catch (err) {
      next(err);
   }
};

/**
 * @desc    GET produit par ID
 * @route   GET /api/produits/:id
 * @access  Public
 */
exports.getProduitById = async (req, res) => {
   try {
      const produit = await Produit.findById(req.params.id)
         .populate('boutique');

      if (!produit) {
         return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
         });
      }

      // 🔥 Incrémenter vues
      produit.vues = (produit.vues || 0) + 1;
      await produit.save();

      res.status(200).json({
         success: true,
         data: produit
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: `Impossible de recuperer Produit: `+error.message
      });
   }
};


/**
 * @desc    CREATE produit
 * @route   POST /api/produits
 * @access  Manager/Admin
 */
exports.createProduit = async (req, res) => {
   try {
      let images = [];

      if (req.files && req.files.length > 0) {
         images = req.files.map(file => file.path);
      }

      let variantes = [];

      if (req.body.variantes) {
         if (typeof req.body.variantes === "string") {
            variantes = JSON.parse(req.body.variantes);
         } else {
            variantes = req.body.variantes;
         }
      }

      const produitData = {
         ...req.body,
         images,
         variantes
      };

      const produit = await Produit.create(produitData);

      res.status(201).json({
         success: true,
         data: produit
      });

   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    UPDATE produit
 * @route   PUT /api/produits/:id
 * @access  Manager/Admin
 */
exports.updateProduit = async (req, res) => {
   try {
      const updateData = { ...req.body };

      if (req.files && req.files.length > 0) {
         updateData.images = req.files.map(file => file.path);
      }

      if (req.body.variantes) {
         updateData.variantes = JSON.parse(req.body.variantes);
      }

      const produit = await Produit.findByIdAndUpdate(
         req.params.id,
         updateData,
         { new: true, runValidators: true }
      );

      if (!produit) {
         return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
         });
      }

      res.status(200).json({
         success: true,
         data: produit
      });

   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    DELETE produit
 * @route   DELETE /api/produits/:id
 * @access  Manager/Admin
 */
exports.deleteProduit = async (req, res) => {
   try {
      const produit = await Produit.findByIdAndDelete(req.params.id);

      if (!produit) {
         return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
         });
      }

      res.status(200).json({
         success: true,
         message: 'Produit supprimé avec succès'
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};