const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// email, telephone, motDePasse, role, nom, prenom, image
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String },
  nom: { type: String },
  role: { type: String },
  prenom: { type: String },
  Image: { type: String }
});

// Hash le mot de passe avant sauvegarde
userSchema.pre('save', function(next) {
  if (!this.isModified('motDePasse')) return next();
  this.motDePasse = bcrypt.hashSync(this.motDePasse, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
