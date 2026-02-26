const CentreCommercial = require('../models/CentreCommercial');

/**
 * @desc    Créer un centre commercial
 * @route   POST /api/centres-commerciaux
 */
exports.createCentre = async (req, res) => {
   try {
      const centre = new CentreCommercial(req.body);
      const savedCentre = await centre.save();

      res.status(201).json({
         success: true,
         data: savedCentre
      });
   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Récupérer tous les centres (avec pagination + filtres)
 * @route   GET /api/centres-commerciaux
 */
exports.getAllCentres = async (req, res) => {
   try {
      const { page = 1, limit = 10, ville, statut, search } = req.query;

      const query = {};

      if (ville) query['adresse.ville'] = new RegExp(ville, 'i');
      if (statut) query.statut = statut;
      if (search) query.$text = { $search: search };

      const centres = await CentreCommercial.find(query)
         .skip((page - 1) * limit)
         .limit(Number(limit))
         .sort({ createdAt: -1 });

      const total = await CentreCommercial.countDocuments(query);

      res.status(200).json({
         success: true,
         total,
         page: Number(page),
         pages: Math.ceil(total / limit),
         data: centres
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Récupérer un centre par ID ou slug
 * @route   GET /api/centres-commerciaux/:idOrSlug
 */
exports.getCentreByIdOrSlug = async (req, res) => {
   try {
      const { idOrSlug } = req.params;

      let centre;

      if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
         centre = await CentreCommercial.findById(idOrSlug);
      } else {
         centre = await CentreCommercial.findOne({ slug: idOrSlug });
      }

      if (!centre) {
         return res.status(404).json({
            success: false,
            message: 'Centre commercial non trouvé'
         });
      }

      res.status(200).json({
         success: true,
         data: centre
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Mettre à jour un centre
 * @route   PUT /api/centres-commerciaux/:id
 */
exports.updateCentre = async (req, res) => {
   try {
      const centre = await CentreCommercial.findByIdAndUpdate(
         req.params.id,
         req.body,
         {
            new: true,
            runValidators: true
         }
      );

      if (!centre) {
         return res.status(404).json({
            success: false,
            message: 'Centre commercial non trouvé'
         });
      }

      res.status(200).json({
         success: true,
         data: centre
      });

   } catch (error) {
      res.status(400).json({
         success: false,
         message: error.message
      });
   }
};


/**
 * @desc    Supprimer un centre
 * @route   DELETE /api/centres-commerciaux/:id
 */
exports.deleteCentre = async (req, res) => {
   try {
      const centre = await CentreCommercial.findByIdAndDelete(req.params.id);

      if (!centre) {
         return res.status(404).json({
            success: false,
            message: 'Centre commercial non trouvé'
         });
      }

      res.status(200).json({
         success: true,
         message: 'Centre commercial supprimé avec succès'
      });

   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message
      });
   }
};