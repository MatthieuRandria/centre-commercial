const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userService = require("../services/User");

exports.login = async (req, res) => {
  const { email, motDePasse } = req.body;

  try {
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Email incorrect" });
    }

    const isMatch = bcrypt.compareSync(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.register = async (req, res) => {
  const { email, telephone, motDePasse, role, nom, prenom } = req.body;

  try {
    const user = await userService.createUser(
      email,
      telephone,
      motDePasse,
      role,
      nom,
      prenom
    );

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getInfo = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.json({
      id: user._id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.update = async (req, res) => {
  const userId = req.user.id; // depuis middleware JWT
  const { nom, prenom, email, telephone } = req.body;
  
  if (!nom || !prenom || !email) {
    return res.status(400).json({ message: "Nom, prenom et email sont obligatoires" });
  }
  
  try {
    const updatedUser = await userService.updateUser(userId, { nom, prenom, email, telephone });
    console.log(updatedUser);
    res.json(updatedUser); // renvoie l'objet utilisateur mis à jour
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPw, newPw } = req.body;

  if (!oldPw || !newPw) {
    return res.status(400).json({ message: "Les deux mots de passe sont requis" });
  }

  if (newPw.length < 8) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit faire au moins 8 caractères" });
  }

  try {
    const user = await userService.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const isMatch = bcrypt.compareSync(oldPw, user.motDePasse);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe actuel incorrect" });

    // Hash du nouveau mot de passe
    user.motDePasse = newPw;

    await user.save();
    return res.json({ success: true, message: "Mot de passe mis à jour" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};