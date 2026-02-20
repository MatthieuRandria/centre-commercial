const jwt = require("jsonwebtoken");

exports.auth= (req, res, next)=> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(' ')[1]; // format "Bearer TOKEN"

  jwt.verify(token, "SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token invalide" });
    }
    req.user = decoded; // contient id et email sy role
    next();
  });
}

exports.checkRole= (roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit: rôle non autorisé' });
    }

    next();
  };
}

// module.exports = verifyToken;
