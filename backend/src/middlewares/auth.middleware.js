const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(' ')[1]; // format "Bearer TOKEN"

  jwt.verify(token, "SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token invalide" });
    }
    req.user = decoded; // contient id et email
    next();
  });
}

module.exports = verifyToken;
