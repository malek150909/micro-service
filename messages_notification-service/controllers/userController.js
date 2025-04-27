const User = require("../models/userModel")

const userController = {
  searchUser: async (req, res) => {
    const { email } = req.query
    try {
      const [user] = await User.findByEmail(email)
      if (user) {
        // Ajouter le rôle depuis le token JWT
        const userWithRole = {
          ...user,
          role: req.user.role, // Le rôle est déjà disponible dans req.user grâce au middleware d'authentification
        }
        res.json(userWithRole)
      } else {
        res.status(404).json({ message: "Utilisateur non trouvé" })
      }
    } catch (error) {
      console.error("Erreur lors de la recherche de l'utilisateur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
}

module.exports = userController
