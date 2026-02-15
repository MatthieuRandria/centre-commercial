const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const centreCommercialSchema = new Schema({
   nom: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 100, index: true },
   slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
   adresse: {
      rue: { type: String, required: true, trim: true },
      ville: { type: String, required: true, trim: true, index: true },
      code_postal: { type: String, required: true, trim: true },
      pays: { type: String, required: true, default: 'France' },
      coordonnees_gps: { latitude: Number, longitude: Numbe    }
   },
   description: { type: String, trim: true, maxlength: 2000 },
   superficie: { type: Number, min: 0 },
   nombre_etages: { type: Number, default: 1, min: 1 },
   nombre_boutiques: { type: Number, default: 0, min: 0 },
   places_parking: { type: Number, min: 0 },
   horaires_generaux: {
      lundi_vendredi: { ouverture:  String, fermeture: String },
      samedi: { ouverture: String, fermeture: String },
      dimanche: { ouverture: String, fermeture: String }
   },
   contact: { telephone: String, email: String, site_web: String },
   images: [{ type: String, trim: true }],
   services: [{
      type: String,
      enum: ['wifi', 'parking_gratuit', 'parking_payant', 'toilettes', 
            'espace_enfants', 'restaurants', 'cinema', 'atm', 
            'acces_handicapes', 'consigne', 'conciergerie']
   }],
   
   statut: { type: String, enum: ['ouvert', 'ferme', 'en_construction', 'en_renovation'], default: 'ouvert' },
   date_ouverture: { type: Date }
   
   }, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

centreCommercialSchema.index({ nom: 'text', 'adresse.ville': 'text' });

centreCommercialSchema.pre('save', function(next) {
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

const CentreCommercial = mongoose.model('CentreCommercial', centreCommercialSchema);

module.exports = CentreCommercial;