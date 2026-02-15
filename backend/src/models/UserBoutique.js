const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour la relation User-Boutique
 * Gestion des rôles et permissions des utilisateurs dans les boutiques
 */
const userBoutiqueSchema = new Schema({
   user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'L\'utilisateur est requis'], index: true },
   boutique: { type: Schema.Types.ObjectId, ref: 'Boutique', required: [true, 'La boutique est requise'], index: true },
   role: { type: String, required: true,
      enum: [
         'proprietaire',    // Propriétaire de la boutique
         'gerant',          // Gérant avec tous les droits
         'employe',         // Employé avec droits limités
         'moderateur',      // Peut modérer le contenu
         'lecteur'          // Lecture seule
      ],
      default: 'employe'
   },
   
   permissions: {
      gerer_produits: { type: Boolean, default: false },
      gerer_promotions: { type: Boolean, default: false },
      gerer_evenements: { type: Boolean, default: false },
      voir_commandes: { type: Boolean, default: false },
      traiter_commandes: { type: Boolean, default: false },
      repondre_avis: { type: Boolean, default: false },
      moderer_avis: { type: Boolean, default: false },
      voir_statistiques: { type: Boolean, default: false },
      modifier_informations: { type: Boolean, default: false },
      modifier_horaires: { type: Boolean, default: false },
      gerer_utilisateurs: { type: Boolean, default: false }
   },
   
   statut: { type: String, enum: ['active', 'suspendue', 'revoquee'], default: 'active', index: true },
   date_debut: { type: Date, default: Date.now },
   date_fin: { type: Date, default: null },
   notes: { type: String, trim: true, maxlength: 500 }
}, {
   timestamps: true
});

// INDEX COMPOSES
userBoutiqueSchema.index({ user: 1, boutique: 1, statut: 1 }, { unique: true });

// MIDDLEWARE
userBoutiqueSchema.pre('save', function(next) {
   if (this.isNew || this.isModified('role')) {
      switch (this.role) {
         case 'proprietaire':
         case 'gerant':
         // Tous les droits
         this.permissions = {
            gerer_produits: true,
            gerer_promotions: true,
            gerer_evenements: true,
            voir_commandes: true,
            traiter_commandes: true,
            repondre_avis: true,
            moderer_avis: true,
            voir_statistiques: true,
            modifier_informations: true,
            modifier_horaires: true,
            gerer_utilisateurs: this.role === 'proprietaire'
         };
         break;
         
         case 'employe':
         // Droits limités
         this.permissions = {
            gerer_produits: true,
            gerer_promotions: false,
            gerer_evenements: false,
            voir_commandes: true,
            traiter_commandes: true,
            repondre_avis: true,
            moderer_avis: false,
            voir_statistiques: false,
            modifier_informations: false,
            modifier_horaires: false,
            gerer_utilisateurs: false
         };
         break;
         
         case 'moderateur':
         // Modération uniquement
         this.permissions = {
            gerer_produits: false,
            gerer_promotions: false,
            gerer_evenements: false,
            voir_commandes: false,
            traiter_commandes: false,
            repondre_avis: true,
            moderer_avis: true,
            voir_statistiques: false,
            modifier_informations: false,
            modifier_horaires: false,
            gerer_utilisateurs: false
         };
         break;
         
         case 'lecteur':
         // Lecture seule
         this.permissions = {
            gerer_produits: false,
            gerer_promotions: false,
            gerer_evenements: false,
            voir_commandes: false,
            traiter_commandes: false,
            repondre_avis: false,
            moderer_avis: false,
            voir_statistiques: true,
            modifier_informations: false,
            modifier_horaires: false,
            gerer_utilisateurs: false
         };
         break;
      }
   }
   next();
});

// METHODES STATIQUES
userBoutiqueSchema.statics.aPermission = async function(userId, boutiqueId, permission) {
   const relation = await this.findOne({
      user: userId,
      boutique: boutiqueId,
      statut: 'active'
   });
   
   if (!relation) {
      return false;
   }
   
   return relation.permissions[permission] === true;
};

userBoutiqueSchema.statics.getBoutiquesByRole = async function(userId, role) {
   const relations = await this.find({
      user: userId,
      role: role,
      statut: 'active'
   }).populate('boutique');
   
   return relations.map(rel => rel.boutique);
};

userBoutiqueSchema.statics.getUsersByBoutique = async function(boutiqueId) {
   return await this.find({
      boutique: boutiqueId,
      statut: 'active'
   })
   .populate('user', 'nom prenom email')
   .sort({ role: 1, 'user.nom': 1 })
   .exec();
};

userBoutiqueSchema.statics.ajouterUtilisateur = async function(userId, boutiqueId, role = 'employe') {
   // Vérifier si la relation existe déjà
   const existant = await this.findOne({ user: userId, boutique: boutiqueId });
   
   if (existant) {
      if (existant.statut === 'revoquee') {
         // Réactiver la relation
         existant.statut = 'active';
         existant.role = role;
         existant.date_debut = new Date();
         await existant.save();
         return existant;
      } else {
         throw new Error('L\'utilisateur est déjà associé à cette boutique');
      }
   }
   
   // Créer une nouvelle relation
   const relation = new this({
      user: userId,
      boutique: boutiqueId,
      role: role,
      statut: 'active'
   });
   
   await relation.save();
   return relation;
};

userBoutiqueSchema.statics.revoquerUtilisateur = async function(userId, boutiqueId) {
   const relation = await this.findOne({ user: userId, boutique: boutiqueId });
   
   if (!relation) {
      throw new Error('Relation utilisateur-boutique introuvable');
   }
   
   relation.statut = 'revoquee';
   relation.date_fin = new Date();
   await relation.save();
   
   return relation;
};

// METHODES D'INSTANCE
userBoutiqueSchema.methods.estActive = function() {
   if (this.statut !== 'active') {
      return false;
   }
   
   const maintenant = new Date();
   
   if (this.date_fin && maintenant > this.date_fin) {
      return false;
   }
   
   return true;
};

userBoutiqueSchema.methods.changerRole = async function(nouveauRole) {
   this.role = nouveauRole;
   await this.save();
   return this;
};

userBoutiqueSchema.methods.togglePermission = async function(permission) {
   if (this.permissions[permission] !== undefined) {
      this.permissions[permission] = !this.permissions[permission];
      await this.save();
   }
   return this;
};

const UserBoutique = mongoose.model('UserBoutique', userBoutiqueSchema);

module.exports = UserBoutique;