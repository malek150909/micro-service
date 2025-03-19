const User = require("../models/userModel");

const userController = {
    searchUser: async (req, res) => {
        const { email } = req.query;
        try {
            const user = await User.findByEmail(email);
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: "Utilisateur non trouvé" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },
};

module.exports = userController;