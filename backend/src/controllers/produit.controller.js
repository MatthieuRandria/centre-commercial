const Produit   = require('../models/Produit');
const mongoose  = require('mongoose');

<<<<<<< Updated upstream
exports.getProduitCategories = async (req, res) => {
  try {
    const categories = await Produit.distinct('categories', { actif: true });
    res.json({ data: categories.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllProduits = async (req, res) => {
  try {
    const {
      q,
      boutiqueId,
      categorie,
      prixMin,
      prixMax,
      enStock,
      sortBy = 'date',
      order  = 'desc',
      page   = 1,
      limit  = 12
    } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    // ── Filtres ────────────────────────────────────────────────────────────
    const match = { actif: true };

    if (q) {
      match.$or = [
        { nom:         { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (boutiqueId && mongoose.Types.ObjectId.isValid(boutiqueId)) {
      match.boutique = boutiqueId;
    }

    // categories est un array d'objets { nom } dans le modèle Produit
    if (categorie) {
      match['categories.nom'] = { $regex: categorie, $options: 'i' };
    }

    if (prixMin || prixMax) {
      match['variantes.prix'] = {};
      if (prixMin) match['variantes.prix'].$gte = Number(prixMin);
      if (prixMax) match['variantes.prix'].$lte = Number(prixMax);
    }

    if (enStock === 'true') {
      match['variantes.stock'] = { $gt: 0 };
    }

    // ── Tri ────────────────────────────────────────────────────────────────
    const sortFields = { prix: 'variantes.prix', date: 'createdAt', vues: 'vues' };
    const sortField   = sortFields[sortBy] ?? 'createdAt';
    const sortOptions = { [sortField]: order === 'asc' ? 1 : -1 };

    // ── Requête ────────────────────────────────────────────────────────────
    const [produits, total] = await Promise.all([
      Produit.find(match)
        .populate('boutique', 'nom infos.logo_url')
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Produit.countDocuments(match)
    ]);

    res.json({
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
      data:  produits
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    GET produit par ID
 * @route   GET /produits/:id
 * @access  Public
 */
exports.getProduitById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const produit = await Produit.findById(req.params.id)
      .populate('boutique', 'nom infos.logo_url infos.description');

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    produit.vues = (produit.vues || 0) + 1;
    await produit.save();

    res.status(200).json({ success: true, data: produit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    CREATE produit
 * @route   POST /produits
 * @access  Manager/Admin
 */
exports.createProduit = async (req, res) => {
  try {
    const images = req.files?.length ? req.files.map(f => f.path) : [];
    const produitData = {
      ...req.body,
      images,
      variantes:  req.body.variantes  ? JSON.parse(req.body.variantes)  : [],
      categories: req.body.categories ? JSON.parse(req.body.categories) : []
    };
    const produit = await Produit.create(produitData);
    res.status(201).json({ success: true, data: produit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * @desc    UPDATE produit
 * @route   PUT /produits/:id
 * @access  Manager/Admin
 */
exports.updateProduit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    const updateData = { ...req.body };
    if (req.files?.length)    updateData.images     = req.files.map(f => f.path);
    if (req.body.variantes)   updateData.variantes  = JSON.parse(req.body.variantes);
    if (req.body.categories)  updateData.categories = JSON.parse(req.body.categories);

    const produit = await Produit.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true
    });
    if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    res.status(200).json({ success: true, data: produit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * @desc    DELETE produit
 * @route   DELETE /produits/:id
 * @access  Manager/Admin
 */
exports.deleteProduit = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    const produit = await Produit.findByIdAndDelete(req.params.id);
    if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
=======
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
>>>>>>> Stashed changes
};