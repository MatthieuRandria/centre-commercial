const Boutique = require('../models/Boutique');
const CentreCommercial = require('../models/CentreCommercial');
const BoutiqueCategorie = require('../models/BoutiqueCategorie');
const UserBoutique = require('../models/UserBoutique');

const getAllBoutiques = async (req, res) => {
   try {
      const { centreId, categorieId, statut, page = 1, limit = 20, sort = 'nom', order = 'asc', search, etage, noteMin } = req.query;

      // Construction de la query de filtrage
      const query = {};

      // Filtre par centre commercial
      if (centreId) {
         query.centre_commercial = centreId;
      }

      // Filtre par catégorie
      if (categorieId) {
         query.categorie = categorieId;
      }

      // Filtre par statut
      if (statut) {
         query.statut = statut;
      } else {
         // Par défaut, ne pas afficher les boutiques fermées définitivement
         query.statut = { $ne: 'fermee_definitivement' };
      }

      // Filtre par étage
      if (etage) {
         query['localisation.etage'] = etage;
      }

      // Filtre par note minimale
      if (noteMin) {
         query.note_moyenne = { $gte: parseFloat(noteMin) };
      }

      // Recherche textuelle
      if (search) {
         query.$or = [
         { nom: { $regex: search, $options: 'i' } },
         { 'infos.description': { $regex: search, $options: 'i' } },
         { tags: { $in: [new RegExp(search, 'i')] } }
         ];
      }

      // Options de tri
      const sortOrder = order === 'desc' ? -1 : 1;
      const sortOptions = {};
      sortOptions[sort] = sortOrder;

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Compter le total de documents
      const total = await Boutique.countDocuments(query);

      // Récupérer les boutiques avec populate
      const boutiques = await Boutique.find(query)
         .populate('centre_commercial', 'nom adresse.ville adresse.code_postal slug')
         .populate('categorie', 'nom icone couleur slug')
         .sort(sortOptions)
         .limit(limitNum)
         .skip(skip)
         .select('-metadata') // Exclure metadata pour alléger la réponse
         .lean(); // Convertir en plain objects pour performance

      // Calculer le nombre de pages
      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
         success: true,
         data: {
         boutiques,
         pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
         }
         }
      });

   } catch (error) {
      console.error('Erreur getAllBoutiques:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la récupération des boutiques',
         error: error.message
      });
   }
};

const getBoutiqueById = async (req, res) => {
   try {
      const { id } = req.params;

      // Vérifier la validité de l'ID
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
         return res.status(400).json({
         success: false,
         message: 'ID de boutique invalide'
         });
      }

      // Récupérer la boutique avec toutes les références
      const boutique = await Boutique.findById(id)
         .populate('centre_commercial')
         .populate('categorie');

      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Incrémenter le nombre de vues
      await boutique.incrementerVues();

      // Récupérer les informations supplémentaires
      const data = {
         ...boutique.toObject(),
         est_ouvert_maintenant: boutique.est_ouvert_maintenant,
         prochains_horaires: boutique.prochainsHoraires()
      };

      res.status(200).json({
         success: true,
         data: data
      });

   } catch (error) {
      console.error('Erreur getBoutiqueById:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la récupération de la boutique',
         error: error.message
      });
   }
};

const getBoutiqueBySlug = async (req, res) => {
   try {
      const { slug } = req.params;

      const boutique = await Boutique.findOne({ slug })
         .populate('centre_commercial')
         .populate('categorie');

      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Incrémenter le nombre de vues
      await boutique.incrementerVues();

      const data = {
         ...boutique.toObject(),
         est_ouvert_maintenant: boutique.est_ouvert_maintenant,
         prochains_horaires: boutique.prochainsHoraires()
      };

      res.status(200).json({
         success: true,
         data: data
      });

   } catch (error) {
      console.error('Erreur getBoutiqueBySlug:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la récupération de la boutique',
         error: error.message
      });
   }
};

const createBoutique = async (req, res) => {
   try {
      const { nom, centre_commercial, categorie, localisation, infos, horaires, statut, date_ouverture, tags } = req.body;

      // Validation des champs requis
      if (!nom || !centre_commercial || !categorie || !localisation || !infos) {
         return res.status(400).json({
         success: false,
         message: 'Champs requis manquants: nom, centre_commercial, categorie, localisation, infos'
         });
      }

      // Vérifier que le centre commercial existe
      const centreExists = await CentreCommercial.findById(centre_commercial);
      if (!centreExists) {
         return res.status(404).json({
         success: false,
         message: 'Centre commercial non trouvé'
         });
      }

      // Vérifier que la catégorie existe
      const categorieExists = await BoutiqueCategorie.findById(categorie);
      if (!categorieExists) {
         return res.status(404).json({
         success: false,
         message: 'Catégorie non trouvée'
         });
      }

      // Générer les horaires par défaut si non fournis
      let horairesFinaux = horaires;
      if (!horaires || horaires.length === 0) {
         const joursDefaut = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
         horairesFinaux = joursDefaut.map(jour => ({
         jour: jour,
         ouvert: jour !== 'Dimanche',
         heures: {
            ouverture: '09:00',
            fermeture: '19:00'
         },
         pause_dejeuner: {
            actif: false
         }
         }));
      }

      // Vérifier que les horaires contiennent bien 7 jours
      if (horairesFinaux.length !== 7) {
         return res.status(400).json({
         success: false,
         message: 'Les horaires doivent contenir exactement 7 jours'
         });
      }

      // Créer la boutique
      const boutique = new Boutique({
         nom,
         centre_commercial,
         categorie,
         localisation,
         infos,
         horaires: horairesFinaux,
         statut: statut || 'active',
         date_ouverture: date_ouverture || new Date(),
         tags: tags || []
      });

      await boutique.save();

      // Mettre à jour le compteur de la catégorie
      await BoutiqueCategorie.updateNombreBoutiques(categorie);

      // Mettre à jour le compteur du centre commercial
      await CentreCommercial.findByIdAndUpdate(
         centre_commercial,
         { $inc: { nombre_boutiques: 1 } }
      );

      // Récupérer la boutique avec populate
      const boutiqueComplete = await Boutique.findById(boutique._id)
         .populate('centre_commercial', 'nom adresse.ville')
         .populate('categorie', 'nom icone');

      res.status(201).json({
         success: true,
         message: 'Boutique créée avec succès',
         data: boutiqueComplete
      });

   } catch (error) {
      console.error('Erreur createBoutique:', error);
      
      // Erreur de validation Mongoose
      if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
         success: false,
         message: 'Erreur de validation',
         errors: messages
         });
      }

      // Erreur de duplication (slug unique)
      if (error.code === 11000) {
         return res.status(400).json({
         success: false,
         message: 'Une boutique avec ce nom existe déjà'
         });
      }

      res.status(500).json({
         success: false,
         message: 'Erreur lors de la création de la boutique',
         error: error.message
      });
   }
};

const updateBoutique = async (req, res) => {
   try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier la validité de l'ID
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
         return res.status(400).json({
         success: false,
         message: 'ID de boutique invalide'
         });
      }

      // Récupérer la boutique existante
      const boutique = await Boutique.findById(id);
      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Vérifier les permissions (si middleware auth disponible)
      // Note: À adapter selon votre système d'authentification
      if (req.user && req.user.role !== 'admin') {
         const hasPermission = await UserBoutique.aPermission(
         req.user.id,
         id,
         'modifier_informations'
         );
         
         if (!hasPermission) {
         return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas la permission de modifier cette boutique'
         });
         }
      }

      // Champs qui ne peuvent pas être modifiés directement
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.nombre_vues;
      delete updateData.nombre_favoris;
      delete updateData.note_moyenne;
      delete updateData.nombre_avis;

      // Si le centre commercial change, vérifier qu'il existe
      if (updateData.centre_commercial && updateData.centre_commercial !== boutique.centre_commercial.toString()) {
         const centreExists = await CentreCommercial.findById(updateData.centre_commercial);
         if (!centreExists) {
         return res.status(404).json({
            success: false,
            message: 'Centre commercial non trouvé'
         });
         }
         
         // Mettre à jour les compteurs
         await CentreCommercial.findByIdAndUpdate(
         boutique.centre_commercial,
         { $inc: { nombre_boutiques: -1 } }
         );
         await CentreCommercial.findByIdAndUpdate(
         updateData.centre_commercial,
         { $inc: { nombre_boutiques: 1 } }
         );
      }

      // Si la catégorie change, vérifier qu'elle existe
      if (updateData.categorie && updateData.categorie !== boutique.categorie.toString()) {
         const categorieExists = await BoutiqueCategorie.findById(updateData.categorie);
         if (!categorieExists) {
         return res.status(404).json({
            success: false,
            message: 'Catégorie non trouvée'
         });
         }
         
         // Mettre à jour les compteurs
         await BoutiqueCategorie.updateNombreBoutiques(boutique.categorie);
         await BoutiqueCategorie.updateNombreBoutiques(updateData.categorie);
      }

      // Si les horaires sont fournis, vérifier qu'il y a 7 jours
      if (updateData.horaires && updateData.horaires.length !== 7) {
         return res.status(400).json({
         success: false,
         message: 'Les horaires doivent contenir exactement 7 jours'
         });
      }

      // Mettre à jour la boutique
      Object.assign(boutique, updateData);
      await boutique.save();

      // Récupérer la boutique mise à jour avec populate
      const boutiqueUpdated = await Boutique.findById(id)
         .populate('centre_commercial', 'nom adresse.ville')
         .populate('categorie', 'nom icone');

      res.status(200).json({
         success: true,
         message: 'Boutique mise à jour avec succès',
         data: boutiqueUpdated
      });

   } catch (error) {
      console.error('Erreur updateBoutique:', error);
      
      if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(err => err.message);
         return res.status(400).json({
         success: false,
         message: 'Erreur de validation',
         errors: messages
         });
      }

      res.status(500).json({
         success: false,
         message: 'Erreur lors de la mise à jour de la boutique',
         error: error.message
      });
   }
};

// Mettre à jour partiellement une boutique (PATCH)
const patchBoutique = async (req, res) => {
   try {
      const { id } = req.params;
      const { field, value } = req.body;

      if (!field) {
         return res.status(400).json({
         success: false,
         message: 'Le champ à modifier doit être spécifié'
         });
      }

      const boutique = await Boutique.findById(id);
      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Vérifier les permissions pour les champs spécifiques
      if (req.user && req.user.role !== 'admin') {
         const permissionMap = {
         'horaires': 'modifier_horaires',
         'infos': 'modifier_informations',
         'localisation': 'modifier_informations'
         };

         const requiredPermission = permissionMap[field] || 'modifier_informations';
         const hasPermission = await UserBoutique.aPermission(
         req.user.id,
         id,
         requiredPermission
         );

         if (!hasPermission) {
         return res.status(403).json({
            success: false,
            message: 'Permission insuffisante pour modifier ce champ'
         });
         }
      }

      // Appliquer la modification
      boutique[field] = value;
      await boutique.save();

      res.status(200).json({
         success: true,
         message: 'Champ mis à jour avec succès',
         data: boutique
      });

   } catch (error) {
      console.error('Erreur patchBoutique:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la mise à jour partielle',
         error: error.message
      });
   }
};

const deleteBoutique = async (req, res) => {
   try {
      const { id } = req.params;

      const boutique = await Boutique.findById(id);
      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Soft delete: changer le statut au lieu de supprimer
      boutique.statut = 'fermee_definitivement';
      await boutique.save();

      // Mettre à jour les compteurs
      await BoutiqueCategorie.updateNombreBoutiques(boutique.categorie);
      await CentreCommercial.findByIdAndUpdate(
         boutique.centre_commercial,
         { $inc: { nombre_boutiques: -1 } }
      );

      res.status(200).json({
         success: true,
         message: 'Boutique supprimée avec succès'
      });

   } catch (error) {
      console.error('Erreur deleteBoutique:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la suppression de la boutique',
         error: error.message
      });
   }
};

const getBoutiqueStats = async (req, res) => {
   try {
      const { id } = req.params;

      const boutique = await Boutique.findById(id);
      if (!boutique) {
         return res.status(404).json({
         success: false,
         message: 'Boutique non trouvée'
         });
      }

      // Vérifier les permissions
      if (req.user && req.user.role !== 'admin') {
         const hasPermission = await UserBoutique.aPermission(
         req.user.id,
         id,
         'voir_statistiques'
         );

         if (!hasPermission) {
         return res.status(403).json({
            success: false,
            message: 'Permission insuffisante'
         });
         }
      }

      const stats = {
         vues_total: boutique.nombre_vues,
         favoris_total: boutique.nombre_favoris,
         note_moyenne: boutique.note_moyenne,
         nombre_avis: boutique.nombre_avis,
         statut: boutique.statut,
         date_ouverture: boutique.date_ouverture,
         anciennete_jours: boutique.date_ouverture 
         ? Math.floor((new Date() - boutique.date_ouverture) / (1000 * 60 * 60 * 24))
         : 0
      };

      res.status(200).json({
         success: true,
         data: stats
      });

   } catch (error) {
      console.error('Erreur getBoutiqueStats:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la récupération des statistiques',
         error: error.message
      });
   }
};

const searchBoutiques = async (req, res) => {
   try {
      const filtres = req.body;
      
      const boutiques = await Boutique.searchByCriteria(filtres);

      res.status(200).json({
         success: true,
         data: {
         boutiques,
         total: boutiques.length
         }
      });

   } catch (error) {
      console.error('Erreur searchBoutiques:', error);
      res.status(500).json({
         success: false,
         message: 'Erreur lors de la recherche',
         error: error.message
      });
   }
};

module.exports = {
   getAllBoutiques,
   getBoutiqueById,
   getBoutiqueBySlug,
   createBoutique,
   updateBoutique,
   patchBoutique,
   deleteBoutique,
   getBoutiqueStats,
   searchBoutiques
};