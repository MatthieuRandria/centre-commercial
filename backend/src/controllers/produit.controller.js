const Produit = require('../models/Produit');

exports.getProduitCategories = async (req, res) => {
  try {
    const categories = await Produit.distinct('categories', { actif: true });
    res.json({ data: categories.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllProduits = async (req, res, next) => {
   try {
      const {
         boutiqueId, categorie, prixMin, prixMax,
         sortBy = "date", order = "desc", page = 1, limit = 10
      } = req.query;

      const filters = { actif: true };
      if (boutiqueId) filters.boutique = boutiqueId;
      if (categorie)  filters['categories.nom'] = categorie;
      if (prixMin || prixMax) {
         filters["variantes.prix"] = {};
         if (prixMin) filters["variantes.prix"].$gte = Number(prixMin);
         if (prixMax) filters["variantes.prix"].$lte = Number(prixMax);
      }

      const sortFields = { prix: "variantes.prix", date: "createdAt", vues: "vues" };
      const sortOptions = { [sortFields[sortBy] || "createdAt"]: order === "asc" ? 1 : -1 };
      const skip = (Number(page) - 1) * Number(limit);

      const produits = await Produit.find(filters)
         .populate("boutique").sort(sortOptions).skip(skip).limit(Number(limit));
      const total = await Produit.countDocuments(filters);

      res.json({ total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: produits });
   } catch (err) { next(err); }
};

exports.getProduitById = async (req, res) => {
   try {
      const produit = await Produit.findById(req.params.id).populate('boutique');
      if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      produit.vues = (produit.vues || 0) + 1;
      await produit.save();
      res.status(200).json({ success: true, data: produit });
   } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createProduit = async (req, res) => {
  try {
      const body = req.body || {};

      // variantes : tableau si JSON body, string si FormData — on gère les deux
      let variantes = body.variantes ?? [];
      if (typeof variantes === 'string') {
         try { variantes = JSON.parse(variantes); } catch { variantes = []; }
      }

      // categories : idem
      let categories = body.categories ?? [];
      if (typeof categories === 'string') {
         try { categories = JSON.parse(categories); } catch { categories = []; }
      }

      let images = [];
      if (req.files && req.files.length > 0) images = req.files.map(f => f.path);

      const produit = await Produit.create({
         nom:         body.nom,
         description: body.description || '',
         prix:        Number(body.prix),
         boutique:    body.boutique,
         actif:       body.actif === 'false' ? false : body.actif !== false,
         categories,
         variantes,
         images
      });

      res.status(201).json({ success: true, data: produit });
   } catch (error) {
      res.status(400).json({ success: false, message: error.message });
   }
};

exports.updateProduit = async (req, res) => {
   try {
      const body = req.body || {};
      const updateData = { ...body };

      if (typeof updateData.variantes === 'string') {
         try { updateData.variantes = JSON.parse(updateData.variantes); } catch { delete updateData.variantes; }
      }
      if (typeof updateData.categories === 'string') {
         try { updateData.categories = JSON.parse(updateData.categories); } catch { delete updateData.categories; }
      }
      if (req.files && req.files.length > 0) updateData.images = req.files.map(f => f.path);

      const produit = await Produit.findByIdAndUpdate(
         req.params.id, updateData, { new: true, runValidators: true }
      );
      if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      res.status(200).json({ success: true, data: produit });
   } catch (error) {
      res.status(400).json({ success: false, message: error.message });
   }
};

exports.deleteProduit = async (req, res) => {
   try {
      const produit = await Produit.findByIdAndDelete(req.params.id);
      if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};