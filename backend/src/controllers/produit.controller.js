const Produit = require('../models/Produit');

/**
 * @desc    GET tous les produits
 * @route   GET /api/produits
 * @access  Public
 */
exports.getAllProduits = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 10,
         boutiqueId,
         categorie,
         prixMin,
         prixMax,
         enPromotion,
         sort = 'date_desc'
      } = req.query;

      const query = {};

      // 🔎 Filtres
      if (boutiqueId) query.boutique = boutiqueId;

      if (categorie) {
         query["categories.nom"] = categorie;
      }

      if (prixMin || prixMax) {
         query["variantes.prix"] = {};
         if (prixMin) query["variantes.prix"].$gte = Number(prixMin);
         if (prixMax) query["variantes.prix"].$lte = Number(prixMax);
      }

      if (enPromotion !== undefined) {
         query.enPromotion = enPromotion === "true";
      }

      // 🔽 TRI
      let sortOption = { createdAt: -1 };

      switch (sort) {
         case 'prix_asc':
            sortOption = { "variantes.prix": 1 };
            break;
         case 'prix_desc':
            sortOption = { "variantes.prix": -1 };
            break;
         case 'vues_desc':
            sortOption = { vues: -1 };
            break;
         case 'date_asc':
            sortOption = { createdAt: 1 };
            break;
         default:
            sortOption = { createdAt: -1 };
      }

      const produits = await Produit.find(query)
         .populate('boutique', 'nom')
         .sort(sortOption)
         .skip((page - 1) * limit)
         .limit(Number(limit));

      const total = await Produit.countDocuments(query);

      res.status(200).json({
         success: true,
         total,
         page: Number(page),
         pages: Math.ceil(total / limit),
         data: produits
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
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
         .populate('boutique', 'nom description');

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
         message: error.message
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
      // 📸 Upload images (multer)
      let images = [];
      if (req.files && req.files.length > 0) {
         images = req.files.map(file => file.path);
      }

      const produitData = {
         ...req.body,
         images,
         variantes: req.body.variantes
            ? JSON.parse(req.body.variantes)
            : []
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