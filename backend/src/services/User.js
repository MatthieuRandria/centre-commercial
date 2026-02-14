const User=require('../models/User');

exports.findByEmail = async (email)=>{
  const res = User.findOne({email});
  if (!res){throw new Error("User introuvable");}
  return res;
};

exports.createUser = async (email, telephone, motDePasse, role, nom, prenom, image="null")=>{
    try {
        // Validation mot de passe
        if (!motDePasse || motDePasse.length < 8) {
            throw new Error("Le mot de passe doit contenir au minimum 8 caractères.");
        }
        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Format d'email invalide.");
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("Email est deja utilise par un autre compte");
        }
        const user = new User({ email,telephone,motDePasse,role, nom,prenom,image });
        await user.save();
        return user;

    } catch (error) {
        throw error;
    }
};