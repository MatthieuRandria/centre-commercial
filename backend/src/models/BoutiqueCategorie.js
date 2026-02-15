const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boutiqueCategorieSchema = new Schema({
   nom: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 50, index: true },
   slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
   description: { type: String, trim: true, maxlength: 500 },
   icone: { type: String, required: true, trim: true },
   couleur: { type: String, trim: true, match: /^#[0-9A-Fa-f]{6}$/, default: '#6366f1' },
   parent: { type: Schema.Types.ObjectId, ref: 'BoutiqueCategorie', default: null },
   ordre: { type: Number, default: 0 },
   active: { type: Boolean, default: true },
   nombre_boutiques: { type: Number, default: 0, min: 0 },
   metadata: { type: Map, of: Schema.Types.Mixed }
   
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// INDEX
boutiqueCategorieSchema.index({ nom: 'text', description: 'text' });
boutiqueCategorieSchema.index({ parent: 1, ordre: 1 });

// VIRTUALS
boutiqueCategorieSchema.virtual('url').get(function() {
   return `/categories/${this.slug}`;
});

// MIDDLEWARE
boutiqueCategorieSchema.pre('save', function(next) {
   if (this.isModified('nom') && !this.slug) {
      this.slug = this.nom
         .toLowerCase()
         .replace(/[^\w\s-]/g, '')
         .replace(/\s+/g, '-')
         .replace(/-+/g, '-')
         .trim();
   }
   next();
});

// METHODES STATIQUES
boutiqueCategorieSchema.statics.getCategoriesPrincipales = async function() {
   return await this.find({ parent: null, active: true })
      .sort({ ordre: 1, nom: 1 })
      .exec();
};

boutiqueCategorieSchema.statics.getSousCategories = async function(parentId) {
   return await this.find({ parent: parentId, active: true })
      .sort({ ordre: 1, nom: 1 })
      .exec();
};

boutiqueCategorieSchema.statics.getArborescence = async function() {
   const principales = await this.getCategoriesPrincipales();
   
   const arborescence = await Promise.all(
      principales.map(async (categorie) => {
         const sousCategories = await this.getSousCategories(categorie._id);
         return {
         ...categorie.toObject(),
         sous_categories: sousCategories
         };
      })
   );
   
   return arborescence;
};

boutiqueCategorieSchema.statics.updateNombreBoutiques = async function(categorieId) {
   const Boutique = mongoose.model('Boutique');
   
   const count = await Boutique.countDocuments({ 
      categorie: categorieId,
      statut: { $in: ['active', 'en_travaux'] }
   });
   
   await this.findByIdAndUpdate(categorieId, { nombre_boutiques: count });
};

// METHODES D'INSTANCE 
boutiqueCategorieSchema.methods.getBoutiques = async function(options = {}) {
   const Boutique = mongoose.model('Boutique');
   
   const query = { 
      categorie: this._id,
      statut: options.statut || { $in: ['active', 'en_travaux'] }
   };
   
   return await Boutique.find(query)
      .populate('centre_commercial', 'nom ville')
      .sort(options.sort || { nom: 1 })
      .limit(options.limit || 0)
      .exec();
};

const BoutiqueCategorie = mongoose.model('BoutiqueCategorie', boutiqueCategorieSchema);

module.exports = BoutiqueCategorie;