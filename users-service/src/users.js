const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 8081;
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";


async function getUserByMatricule(matricule) {
    try {
        const [user] = await db.query('SELECT * FROM users WHERE matricule = ?', [matricule]);
        return user.length > 0 ? user[0] : null;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        throw error;
    }
}

app.get('/auth/login' , (req,res) => {
    res.send("login interface");
})

app.post('/auth/login', async (req, res) => {
    const { matricule, password } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE matricule = ?', [matricule]);

        if (rows.length === 0) {
            return res.status(401).json({ error: "Utilisateur non trouvé" });
        }

        const user = rows[0];

        // ⚠ Comparaison directe sans bcrypt
        if (user.password !== password) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        res.json({ message: "Connexion réussie", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
