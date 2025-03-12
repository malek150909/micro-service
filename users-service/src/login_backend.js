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
        const [user] = await db.query('SELECT * FROM user WHERE matricule = ?', [matricule]);
        return user.length > 0 ? user[0] : null;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        throw error;
    }
}

app.get('/login' , (req,res) => {
    res.send("login interface");
})

app.post('/login', async (req, res) => {
    const { matricule, password } = req.body;

    try {
        // 🔍 Récupérer l'utilisateur depuis la table `user`
        const [rows] = await db.query(
            `SELECT * FROM user WHERE matricule = ?`,
            [matricule]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Utilisateur non trouvé" });
        }

        const user = rows[0];

        if (user.password !== password) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        // 🔍 Vérifier dans quelle table se trouve l'utilisateur
        let role = null;
        let additionalInfo = {};

        const [etudiant] = await db.query(
            `SELECT * FROM etudiant WHERE matricule = ?`,
            [matricule]
        );
        if (etudiant.length > 0) {
            role = "etudiant";
            additionalInfo = etudiant[0]; // Ajouter les infos spécifiques
        }

        const [enseignant] = await db.query(
            `SELECT * FROM enseignant WHERE matricule = ?`,
            [matricule]
        );
        if (enseignant.length > 0) {
            role = "enseignant";
            additionalInfo = enseignant[0];
        }

        const [admin] = await db.query(
            `SELECT * FROM admin WHERE matricule = ?`,
            [matricule]
        );
        if (admin.length > 0) {
            role = "admin";
            additionalInfo = admin[0];
        }

        if (!role) {
            return res.status(403).json({ error: "Votre rôle n'a pas été identifié" });
        }

        // 🔥 Retourner toutes les informations de l'utilisateur
        res.json({
            message: "Connexion réussie",
            user: {
                ...user, // Toutes les infos de `user`
                role,
                ...additionalInfo // Toutes les infos spécifiques à `etudiant`, `enseignant` ou `admin`
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
