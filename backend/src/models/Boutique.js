const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const localisationSchema = new Schema({
   etage: { type: String, required: true,
      enum: ['RDC', '1er étage', '2ème étage', '3ème étage', 'Sous-sol'],
      default: 'RDC'
   },
   numero_local: { type: String, required: true, trim: true },
   zone: { type: String, required: false, trim: true },
   coordonnees_gps: {
      latitude: { type: Number, required: false, min: -90, max: 90 },
      longitude: { type: Number, required: false, min: -180, max: 180 }
   }
}, { _id: false });

const infosSchema = new Schema({
   description: { type: String, required: true, trim: true, maxlength: 2000 },
   telephone: { type: String, required: true, trim: true, match: /^[\d\s\-\+\(\)]+$/ },
   email: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
   site_web: { type: String, required: false, trim: true, match: /^https?:\/\/.+/ },
   reseaux_sociaux: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true }
   },
   logo_url: { type: String, required: false, trim: true },
   images: [{ type: String, trim: true }],
   superficie: { type: Number, required: false, min: 0 },
   capacite_accueil: { type: Number, required: false, min: 0 }
}, { _id: false });

const horaireSchema = new Schema({
   jour: { type: String, required: true,
      enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
   },
   ouvert: { type: Boolean, default: true },
   heures: {
      ouverture: {
         type: String,
         required: function() { return this.ouvert; },
         match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      fermeture: {
         type: String,
         required: function() { return this.ouvert; },
         match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
   },
   pause_dejeuner: {
      actif: { type: Boolean, default: false },
      debut: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      fin: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
   }
}, { _id: false });

const boutiqueSchema = new Schema({
   nom: { type: String, required: true, trim: true, index: true },
   slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
   centre_commercial: { type: Schema.Types.ObjectId, ref: 'CentreCommercial', required: true, index: true },
   categorie: {
      type: Schema.Types.ObjectId,
      ref: 'BoutiqueCategorie',
      required: [true, 'La catégorie est requise'],
      index: true
   },
   localisation: { type: localisationSchema, required: true },
   infos: { type: infosSchema, required: true },
   horaires: {
      type: [horaireSchema],
      required: true,
      validate: {
         validator: function(horaires) {
         return horaires.length === 7;
         },
         message: 'Les horaires doivent contenir exactement 7 jours'
      }
   },
   statut: {
      type: String,
      enum: ['active', 'inactive', 'en_travaux', 'fermee_definitivement'],
      default: 'active',
      index: true
   },
   date_ouverture: { type: Date, required: false },
   
   // Notation et avis
   note_moyenne: { type: Number, default: 0, min: 0, max: 5 },
   
   nombre_avis: { type: Number, default: 0, min: 0 },
   
   // Popularité
   nombre_vues: { type: Number, default: 0, min: 0 },
   nombre_favoris: { type: Number, default: 0, min: 0 },
   
   // Tags pour recherche
   tags: [{ type: String, trim: true, lowercase: true }],
   
   // Métadonnées
   metadata: { type: Map, of: Schema.Types.Mixed}
   
}, {
   timestamps: true, // Ajoute createdAt et updatedAt
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// ===== INDEX COMPOSES =====

boutiqueSchema.index({ nom: 'text', 'infos.description': 'text', tags: 'text' });
boutiqueSchema.index({ centre_commercial: 1, categorie: 1 });
boutiqueSchema.index({ statut: 1, centre_commercial: 1 });
boutiqueSchema.index({ note_moyenne: -1, nombre_avis: -1 });

// ===== VIRTUALS =====

boutiqueSchema.virtual('url').get(function() {
   return `/boutiques/${this.slug}`;
});

boutiqueSchema.virtual('est_ouvert_maintenant').get(function() {
   const maintenant = new Date();
   const jourActuel = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][maintenant.getDay()];
   const heureActuelle = `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}`;
   
   const horaireJour = this.horaires.find(h => h.jour === jourActuel);
   
   if (!horaireJour || !horaireJour.ouvert) {
      return false;
   }
   
   // Vérifier si l'heure actuelle est dans les horaires
   const estDansHoraires = heureActuelle >= horaireJour.heures.ouverture && 
                           heureActuelle <= horaireJour.heures.fermeture;
   
   // Vérifier la pause déjeuner
   if (estDansHoraires && horaireJour.pause_dejeuner.actif) {
      const estEnPause = heureActuelle >= horaireJour.pause_dejeuner.debut && 
                        heureActuelle <= horaireJour.pause_dejeuner.fin;
      return !estEnPause;
   }
   
   return estDansHoraires;
});

// ===== MIDDLEWARE PRE-SAVE =====

/**
 * Génère automatiquement le slug avant la sauvegarde
 */
boutiqueSchema.pre('save', function(next) {
   if (this.isModified('nom') && !this.slug) {
      this.slug = this.nom
         .toLowerCase()
         .replace(/[^\w\s-]/g, '') // Retirer les caractères spéciaux
         .replace(/\s+/g, '-')      // Remplacer espaces par tirets
         .replace(/-+/g, '-')       // Remplacer tirets multiples
         .trim();
   }
   next();
});

/**
 * Initialise les horaires par défaut si non fournis
 */
boutiqueSchema.pre('save', function(next) {
   if (this.isNew && (!this.horaires || this.horaires.length === 0)) {
      const joursDefaut = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      
      this.horaires = joursDefaut.map(jour => ({
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
   next();
});

// METHODES STATIQUES
boutiqueSchema.statics.findWithDetails = async function(boutiqueId) {
   try {
      const boutique = await this.findById(boutiqueId)
         .populate('centre_commercial', 'nom adresse ville code_postal')
         .populate('categorie', 'nom icone description')
         .exec();
      
      return boutique;
   } catch (error) {
      throw new Error(`Erreur lors de la recherche de la boutique: ${error.message}`);
   }
};

boutiqueSchema.statics.findByUser = async function(userId) {
   try {
      const UserBoutique = mongoose.model('UserBoutique');
      
      const userBoutiques = await UserBoutique.find({ 
         user: userId,
         statut: 'active' 
      }).select('boutique role');
      
      const boutiqueIds = userBoutiques.map(ub => ub.boutique);
      
      const boutiques = await this.find({ 
         _id: { $in: boutiqueIds },
         statut: { $in: ['active', 'en_travaux'] }
      })
      .populate('centre_commercial', 'nom adresse ville')
      .populate('categorie', 'nom icone')
      .sort({ nom: 1 })
      .exec();
      
      const boutiquesAvecRole = boutiques.map(boutique => {
         const userBoutique = userBoutiques.find(
         ub => ub.boutique.toString() === boutique._id.toString()
         );
         
         return {
         ...boutique.toObject(),
         role_utilisateur: userBoutique ? userBoutique.role : null
         };
      });
      
      return boutiquesAvecRole;
   } catch (error) {
      throw new Error(`Erreur lors de la recherche des boutiques de l'utilisateur: ${error.message}`);
   }
};

boutiqueSchema.statics.searchByCriteria = async function(filtres = {}) {
   const query = {};
   
   if (filtres.nom) {
      query.nom = { $regex: filtres.nom, $options: 'i' };
   }
   
   if (filtres.centre_commercial) {
      query.centre_commercial = filtres.centre_commercial;
   }
   
   if (filtres.categorie) {
      query.categorie = filtres.categorie;
   }
   
   if (filtres.statut) {
      query.statut = filtres.statut;
   } else {
      // Par défaut, exclure les boutiques fermées définitivement
      query.statut = { $ne: 'fermee_definitivement' };
   }
   
   if (filtres.etage) {
      query['localisation.etage'] = filtres.etage;
   }
   
   if (filtres.note_min) {
      query.note_moyenne = { $gte: parseFloat(filtres.note_min) };
   }
   
   if (filtres.recherche) {
      query.$text = { $search: filtres.recherche };
   }
   
   try {
      const boutiques = await this.find(query)
         .populate('centre_commercial', 'nom ville')
         .populate('categorie', 'nom icone')
         .sort(filtres.tri || { nom: 1 })
         .limit(filtres.limit || 50)
         .skip(filtres.skip || 0)
         .exec();
      
      return boutiques;
   } catch (error) {
      throw new Error(`Erreur lors de la recherche de boutiques: ${error.message}`);
   }
};

// METHODES D'INSTANCE 
boutiqueSchema.methods.updateNotesMoyenne = async function() {
   const Avis = mongoose.model('Avis');
   
   const stats = await Avis.aggregate([
      { $match: { boutique: this._id, statut: 'approuve' } },
      { 
         $group: { 
         _id: null, 
         moyenne: { $avg: '$note' },
         total: { $sum: 1 }
         } 
      }
   ]);
   
   if (stats.length > 0) {
      this.note_moyenne = Math.round(stats[0].moyenne * 10) / 10;
      this.nombre_avis = stats[0].total;
   } else {
      this.note_moyenne = 0;
      this.nombre_avis = 0;
   }
   
   await this.save();
};

boutiqueSchema.methods.incrementerVues = async function() {
   this.nombre_vues += 1;
   await this.save();
};

boutiqueSchema.methods.estOuvertA = function(date = new Date()) {
   const jour = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][date.getDay()];
   const heure = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
   
   const horaireJour = this.horaires.find(h => h.jour === jour);
   
   if (!horaireJour || !horaireJour.ouvert) {
      return false;
   }
   
   return heure >= horaireJour.heures.ouverture && heure <= horaireJour.heures.fermeture;
};

boutiqueSchema.methods.prochainsHoraires = function() {
   const maintenant = new Date();
   const jourActuel = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][maintenant.getDay()];
   
   const horaireAujourdhui = this.horaires.find(h => h.jour === jourActuel);
   
   return {
      aujourdhui: horaireAujourdhui,
      semaine: this.horaires
   };
};

const Boutique = mongoose.model('Boutique', boutiqueSchema);

module.exports = Boutique;