const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cors = require('cors');
const enseignantRoutes = require('../routes/enseignantRoute');
const etudiantRoutes = require('../routes/etudiantRoute');


const app = express();
app.use(express.json());
app.use(cors());
app.use('/api', enseignantRoutes);
app.use('/api', etudiantRoutes);

const PORT = 8081;
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

// Fonction pour récupérer un utilisateur avec toutes ses données
async function getUserWithRole(matricule) {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
                u.motdepasse, 
                u.Created_at,
                a.poste,
                e.niveau, 
                e.ID_specialite, 
                e.annee_inscription AS etudiant_annee_inscription, 
                e.etat,
                ens.annee_inscription AS enseignant_annee_inscription,
                CASE 
                    WHEN a.Matricule IS NOT NULL THEN 'admin'
                    WHEN e.Matricule IS NOT NULL THEN 'etudiant'
                    WHEN ens.Matricule IS NOT NULL THEN 'enseignant'
                    ELSE NULL
                END AS role
            FROM User u
            LEFT JOIN admin a ON u.Matricule = a.Matricule
            LEFT JOIN Etudiant e ON u.Matricule = e.Matricule
            LEFT JOIN Enseignant ens ON u.Matricule = ens.Matricule
            WHERE u.Matricule = ?
        `, [matricule]);

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        throw error;
    }
}

app.get('/login', (req, res) => {
    res.send("login interface");
});

app.post('/login', async (req, res) => {
    const { matricule, password } = req.body;

    if (!matricule || !password) {
        return res.status(400).json({ error: "Matricule et mot de passe requis" });
    }

    try {
        // Récupérer l'utilisateur avec toutes ses données
        const user = await getUserWithRole(matricule);

        if (!user) {
            return res.status(401).json({ error: "Utilisateur non trouvé" });
        }

        // Vérifier le mot de passe (en clair, comme demandé)
        if (user.motdepasse !== password) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        if (!user.role) {
            return res.status(403).json({ error: "Rôle non identifié" });
        }

        // Préparer les données à renvoyer
        const userData = {
            Matricule: user.Matricule,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            Created_at: user.Created_at,
            role: user.role,
            ...(user.role === 'admin' && { poste: user.poste }),
            ...(user.role === 'etudiant' && {
                niveau: user.niveau,
                ID_specialite: user.ID_specialite,
                annee_inscription: user.etudiant_annee_inscription,
                etat: user.etat
            }),
            ...(user.role === 'enseignant' && { annee_inscription: user.enseignant_annee_inscription })
        };

        // Générer un token JWT (optionnel, mais recommandé)
        const token = jwt.sign(
            { matricule: user.Matricule, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: "Connexion réussie",
            token, // Ajout du token pour une gestion sécurisée côté frontend
            user: userData
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/update-password', async (req, res) => {
    const { matricule, newPassword } = req.body;

    if (!matricule || !newPassword) {
        return res.status(400).json({ error: "Matricule et nouveau mot de passe requis" });
    }

    try {
        const [result] = await db.query(
            'UPDATE user SET motdepasse = ? WHERE Matricule = ?',
            [newPassword, matricule]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.json({ message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du mot de passe:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});