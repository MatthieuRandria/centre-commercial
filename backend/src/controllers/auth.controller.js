const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userService = require("../services/User")

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
      { id: user._id, email: user.email,role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.register = async (req, res) => {
  const { email,telephone,motDePasse,role,nom,prenom } = req.body;

  try {
    const user = await userService.createUser(email,telephone,motDePasse,role,nom,prenom);
    // Générer token JWT
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token,user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};