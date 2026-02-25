const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const centreCommercialSchema = new Schema({
   nom:         { type: String, required: true, trim: true, unique: true },
   slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
   adresse: {
      rue:    { type: String, required: true, trim: true },
      ville:  { type: String, required: true, trim: true },
      pays:   { type: String, default: 'Madagascar', trim: true }
   },
   description: { type: String, trim: true },
   telephone:   { type: String, trim: true },
   email:       { type: String, trim: true },
   site_web:    { type: String, trim: true },
   image:       { type: String, trim: true },
   statut:      { type: String, enum: ['ouvert', 'ferme', 'en_renovation'], default: 'ouvert' },
   nombre_boutiques: { type: Number, default: 0 }

}, { timestamps: true });

// INDEX TEXT pour le paramètre `search` du controller
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