const db = require("../config/db");

const User = {
    findByEmail: async (email) => {
        const [rows] = await db.query(
            "SELECT Matricule, nom, prenom, email FROM User WHERE email = ?",
            [email]
        );
        return rows[0];
    },
};

module.exports = User;