const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log("Token reçu:", token); // Log pour débogage

  if (!token) {
    console.error("Aucun token fourni");
    return res.status(401).json({ error: 'Accès non autorisé - Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Erreur de vérification du token:", err.message);
      return res.status(403).json({ 
        error: 'Token invalide',
        details: err.message
      });
    }
    
    console.log("Utilisateur authentifié:", user);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;