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

exports.checkRole = (req,res,roles,next)=>{
  if (!req.user.role in roles){
    return res.status(403).json({message:"Non autorisé"});
  }
  next();
}

// module.exports = verifyToken;
