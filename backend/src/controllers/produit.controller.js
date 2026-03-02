const Produit = require('../models/Produit');

/**
 * @desc    GET tous les produits (avec filtres, tri, pagination)
 * @route   GET /produits
 * @access  Public
 */
exports.getAllProduits = async (req, res, next) => {
  try {
    const {
      q,                        // recherche textuelle (ajout)
      boutiqueId,
      categorie,
      prixMin,
      prixMax,
      enPromotion,
      enStock,                  // filtre stock (ajout)
      sortBy = 'date',
      order  = 'desc',
      page   = 1,
      limit  = 12               // aligné sur defaultPageSize frontend
    } = req.query;

    const filters = { actif: true };

    // Recherche textuelle sur nom et description
    if (q) {
      filters.$or = [
        { nom:         { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (boutiqueId) filters.boutique  = boutiqueId;
    if (categorie)  filters.categorie = categorie;

    if (prixMin || prixMax) {
      filters['variantes.prix'] = {};
      if (prixMin) filters['variantes.prix'].$gte = Number(prixMin);
      if (prixMax) filters['variantes.prix'].$lte = Number(prixMax);
    }

    if (enPromotion === 'true') {
      filters.enPromotion = true;
    }

    // Filtre en stock : au moins une variante avec stock > 0
    if (enStock === 'true') {
      filters['variantes.stock'] = { $gt: 0 };
    }

    // TRI
    const sortFields = {
      prix: 'variantes.prix',
      date: 'createdAt',
      vues: 'vues'
    };
    const sortField = sortFields[sortBy] || 'createdAt';
    const sortOptions = { [sortField]: order === 'asc' ? 1 : -1 };

    // PAGINATION
    const pageNum  = Number(page);
    const limitNum = Number(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [produits, total] = await Promise.all([
      Produit.find(filters)
        .populate('boutique')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Produit.countDocuments(filters)
    ]);

    res.json({
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
      data:  produits
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @desc    GET produit par ID
 * @route   GET /produits/:id
 * @access  Public
 */
exports.getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id).populate('boutique');

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    produit.vues = (produit.vues || 0) + 1;
    await produit.save();

    res.status(200).json({ success: true, data: produit });

  } catch (error) {
    res.status(500).json({ success: false, message: `Impossible de récupérer le produit : ${error.message}` });
  }
};

/**
 * @desc    CREATE produit
 * @route   POST /produits
 * @access  Manager/Admin
 */
exports.createProduit = async (req, res) => {
  try {
    let images = [];
    if (req.files?.length) {
      images = req.files.map(file => file.path);
    }

    const produitData = {
      ...req.body,
      images,
      variantes: req.body.variantes ? JSON.parse(req.body.variantes) : []
    };

    const produit = await Produit.create(produitData);
    res.status(201).json({ success: true, data: produit });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    UPDATE produit
 * @route   PUT /produits/:id
 * @access  Manager/Admin
 */
exports.updateProduit = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files?.length) {
      updateData.images = req.files.map(file => file.path);
    }
    if (req.body.variantes) {
      updateData.variantes = JSON.parse(req.body.variantes);
    }

    const produit = await Produit.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.status(200).json({ success: true, data: produit });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    DELETE produit
 * @route   DELETE /produits/:id
 * @access  Manager/Admin
 */
exports.deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findByIdAndDelete(req.params.id);

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
