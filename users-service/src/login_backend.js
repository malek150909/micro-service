const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const cors = require('cors');
const authMiddleware = require('../middleware/auth'); // Middleware d'authentification (si nécessaire)
const enseignantRoutes = require('../routes/enseignantRoute');
const etudiantRoutes = require('../routes/etudiantRoute');
const teacherRoutes = require('../routes/etudiantENSRoute');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', enseignantRoutes);
app.use('/listeETD', etudiantRoutes);
app.use('/ENSlisteETD', teacherRoutes);

const PORT = 8081;
const JWT_SECRET = process.env.JWT_SECRET;

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
                s.nom_specialite,  -- Nom de la spécialité
                ens.annee_inscription AS enseignant_annee_inscription,
                ens.ID_faculte,
                ens.ID_departement,
                f.nom_faculte,
                d.Nom_departement
            FROM User u
            LEFT JOIN admin a ON u.Matricule = a.Matricule
            LEFT JOIN Etudiant e ON u.Matricule = e.Matricule
            LEFT JOIN specialite s ON e.ID_specialite = s.ID_specialite  -- Jointure avec specialite
            LEFT JOIN Enseignant ens ON u.Matricule = ens.Matricule
            LEFT JOIN faculte f ON ens.ID_faculte = f.ID_faculte
            LEFT JOIN departement d ON ens.ID_departement = d.ID_departement
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
        const user = await getUserWithRole(matricule);

        if (!user) {
            return res.status(401).json({ error: "Utilisateur non trouvé" });
        }

        if (user.motdepasse !== password) {
            return res.status(401).json({ error: "Mot de passe incorrect" });
        }

        if (!user.role) {
            const role = user.poste ? 'admin' : user.niveau ? 'etudiant' : user.enseignant_annee_inscription ? 'enseignant' : null;
            user.role = role;
        }

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
                ID_specialite: user.ID_specialite,  // Conserver l’ID
                annee_inscription: user.etudiant_annee_inscription,
                etat: user.etat,
                nom_specialite: user.nom_specialite  // Ajouter le nom
            }),
            ...(user.role === 'enseignant' && { 
                annee_inscription: user.enseignant_annee_inscription,
                ID_faculte: user.ID_faculte,
                ID_departement: user.ID_departement,
                nom_faculte: user.nom_faculte,
                Nom_departement: user.Nom_departement
            }),
        };

        const token = jwt.sign(
            { matricule: user.Matricule, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: userData
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post('/update-password', authMiddleware, async (req, res) => {
    const { matricule, oldPassword, newPassword } = req.body;

    if (!matricule || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "Matricule, ancien mot de passe et nouveau mot de passe requis" });
    }

    try {
        const user = await getUserWithRole(matricule);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        if (user.motdepasse !== oldPassword) {
            return res.status(401).json({ error: "Ancien mot de passe incorrect" });
        }

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
    console.log(`🚀 Server running on http://users.localhost`);
});