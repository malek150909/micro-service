const pool = require('../config/db');

// Récupérer les annonces de l'administration destinées directement aux enseignants
const getAdminAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;

        // Récupérer les informations de l'enseignant (faculté et département)
        const [enseignantInfo] = await pool.query(
            `SELECT e.ID_faculte, e.ID_departement
             FROM Enseignant e
             WHERE e.Matricule = ?`,
            [matricule]
        );

        if (enseignantInfo.length === 0) {
            return res.status(404).json({ error: 'Enseignant non trouvé' });
        }

        const { ID_faculte, ID_departement } = enseignantInfo[0];

        // Récupérer tous les champs des annonces destinées aux enseignants
        const [enseignantAnnonces] = await pool.query(
            `SELECT *
             FROM annonce a
             WHERE a.admin_matricule IS NOT NULL 
             AND a.target_type = 'Enseignants'
             ORDER BY a.created_at DESC`
        );

        // Ajuster l'URL de l'image si nécessaire
        const annoncesWithAdjustedUrls = enseignantAnnonces.map(annonce => {
            let image_url = annonce.image_url || '';
            if (image_url && !image_url.startsWith('http')) {
                image_url = annonce.event_id
                    ? `http://localhost:5000${image_url}`
                    : `http://localhost:5001${image_url}`;
                console.log(`Annonce ID ${annonce.id} - event_id: ${annonce.event_id}, URL ajustée: ${image_url}`);
            } else {
                console.log(`Annonce ID ${annonce.id} - URL inchangée: ${image_url}`);
            }
            return { ...annonce, image_url };
        });

        // Filtrer les annonces selon les critères de target_filter
        const filteredAnnonces = annoncesWithAdjustedUrls.filter(annonce => {
            const targetFilter = typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter;

            // Si "tous" est true, l'annonce est destinée à tous les enseignants
            if (targetFilter.tous) {
                return true;
            }

            // Sinon, vérifier les filtres (faculté et département)
            let matchesFaculte = true;
            let matchesDepartement = true;

            if (targetFilter.faculte) {
                matchesFaculte = parseInt(targetFilter.faculte) === ID_faculte;
            }
            if (targetFilter.departement) {
                matchesDepartement = parseInt(targetFilter.departement) === ID_departement;
            }

            return matchesFaculte && matchesDepartement;
        });

        res.json(filteredAnnonces);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les annonces créées par l'enseignant
const getTeacherAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;
        const [annonces] = await pool.query(
            `SELECT a.id, a.title, a.content, a.created_at, a.target_filter
             FROM annonce a
             WHERE a.enseignant_matricule = ? AND a.target_type = 'Etudiants'
             ORDER BY a.created_at DESC`,
            [matricule]
        );
        res.json(annonces);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces enseignant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les sections de l'enseignant
const getTeacherSections = async (req, res) => {
    try {
        const { matricule } = req.params;
        const [sections] = await pool.query(
            `SELECT s.ID_section, s.niveau, sp.nom_specialite
             FROM Section s
             JOIN Enseignant_Section es ON s.ID_section = es.ID_section
             JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
             WHERE es.Matricule = ?`,
            [matricule]
        );
        res.json(sections);
    } catch (error) {
        console.error('Erreur lors de la récupération des sections:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Créer une annonce
const createAnnonce = async (req, res) => {
    const { title, content, sections, matricule } = req.body;
    if (!title || !content || !sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const targetFilter = { sections };
        const [result] = await pool.query(
            `INSERT INTO annonce (title, content, enseignant_matricule, target_type, target_filter)
             VALUES (?, ?, ?, 'Etudiants', ?)`,
            [title, content, matricule, JSON.stringify(targetFilter)]
        );

        const annonceId = result.insertId;
        console.log(`Annonce créée avec l'ID: ${annonceId}`);

        // Récupérer les étudiants associés aux sections ciblées
        let etudiants = [];
        if (sections.length > 0) {
            [etudiants] = await pool.query(
                `SELECT DISTINCT es.Matricule
                 FROM Etudiant_Section es
                 WHERE es.ID_section IN (?)`,
                [sections]
            );
        }

        console.log('Étudiants trouvés pour les sections ciblées:', etudiants);

        if (etudiants.length === 0) {
            console.log('Aucun étudiant trouvé pour les sections ciblées:', sections);
        }

        // Créer une notification pour chaque étudiant avec le titre et le contenu
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`${title} - ${content}`, matricule, etudiant.Matricule] // Sans l'ID
            );
        }

        res.status(201).json({ id: annonceId, title, content, target_filter: targetFilter });
    } catch (error) {
        console.error('Erreur lors de la création de l\'annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Modifier une annonce
const updateAnnonce = async (req, res) => {
    const { id } = req.params;
    const { title, content, sections, matricule } = req.body;
    if (!title || !content || !sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const targetFilter = { sections };

        // Récupérer l'ancien titre et target_filter de l'annonce
        const [oldAnnonce] = await pool.query(
            `SELECT title, target_filter
             FROM annonce
             WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (oldAnnonce.length === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

        const oldTitle = oldAnnonce[0].title;
        let oldTargetFilter;
        let oldSections = [];

        // Vérifier si target_filter est une chaîne non vide avant de parser
        if (oldAnnonce[0].target_filter && typeof oldAnnonce[0].target_filter === 'string' && oldAnnonce[0].target_filter.trim() !== '') {
            try {
                oldTargetFilter = JSON.parse(oldAnnonce[0].target_filter);
                oldSections = oldTargetFilter.sections || [];
            } catch (error) {
                console.error('Erreur lors du parsing de target_filter:', error, 'Valeur:', oldAnnonce[0].target_filter);
                // Si le parsing échoue, on continue avec oldSections comme tableau vide
                oldSections = [];
            }
        } else {
            console.warn('target_filter est vide ou invalide:', oldAnnonce[0].target_filter);
            oldSections = [];
        }

        // Récupérer les anciens étudiants associés aux sections ciblées
        let oldEtudiants = [];
        if (oldSections.length > 0) {
            [oldEtudiants] = await pool.query(
                `SELECT DISTINCT es.Matricule
                 FROM Etudiant_Section es
                 WHERE es.ID_section IN (?)`,
                [oldSections]
            );
        }

        const oldEtudiantMatricules = oldEtudiants.map(e => e.Matricule);

        // Supprimer les anciennes notifications pour ces étudiants, en utilisant l'ancien titre
        if (oldEtudiantMatricules.length > 0) {
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND destinataire IN (?) AND contenu LIKE ?`,
                [matricule, oldEtudiantMatricules, `%${oldTitle}%`]
            );
        }

        // Mettre à jour l'annonce
        const [result] = await pool.query(
            `UPDATE annonce
             SET title = ?, content = ?, target_filter = ?
             WHERE id = ? AND enseignant_matricule = ?`,
            [title, content, JSON.stringify(targetFilter), id, matricule]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

        // Récupérer les nouveaux étudiants associés aux sections ciblées
        let etudiants = [];
        if (sections.length > 0) {
            [etudiants] = await pool.query(
                `SELECT DISTINCT es.Matricule
                 FROM Etudiant_Section es
                 WHERE es.ID_section IN (?)`,
                [sections]
            );
        }

        // Créer de nouvelles notifications pour les étudiants avec le titre et le contenu
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`${title} - ${content}`, matricule, etudiant.Matricule] // Sans l'ID
            );
        }

        res.json({ id, title, content, target_filter: targetFilter });
    } catch (error) {
        console.error('Erreur lors de la modification de l\'annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Supprimer une annonce
const deleteAnnonce = async (req, res) => {
    const { id } = req.params;
    const { matricule } = req.body;
    if (!matricule) {
        return res.status(400).json({ error: 'Matricule requis' });
    }

    try {
        // Récupérer les informations de l'annonce pour supprimer les notifications associées
        const [annonces] = await pool.query(
            `SELECT title, content, target_filter
             FROM annonce
             WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (annonces.length === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

        const { title, content, target_filter } = annonces[0];
        let targetFilterParsed;
        let sections = [];

        // Vérifier si target_filter est une chaîne non vide avant de parser
        if (target_filter && typeof target_filter === 'string' && target_filter.trim() !== '') {
            try {
                targetFilterParsed = JSON.parse(target_filter);
                sections = targetFilterParsed.sections || [];
            } catch (error) {
                console.error('Erreur lors du parsing de target_filter dans deleteAnnonce:', error, 'Valeur:', target_filter);
                sections = [];
            }
        } else {
            console.warn('target_filter est vide ou invalide dans deleteAnnonce:', target_filter);
            sections = [];
        }

        // Récupérer les étudiants associés aux sections ciblées
        let etudiants = [];
        if (sections.length > 0) {
            [etudiants] = await pool.query(
                `SELECT DISTINCT es.Matricule
                 FROM Etudiant_Section es
                 WHERE es.ID_section IN (?)`,
                [sections]
            );
        }

        const etudiantMatricules = etudiants.map(e => e.Matricule);

        // Supprimer les notifications associées à cette annonce pour ces étudiants
        if (etudiantMatricules.length > 0) {
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND destinataire IN (?) AND contenu LIKE ?`,
                [matricule, etudiantMatricules, `%${title}%`]
            );
        }

        // Supprimer l'annonce
        const [result] = await pool.query(
            `DELETE FROM annonce
             WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

        res.json({ message: 'Annonce supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getAdminAnnonces,
    getTeacherAnnonces,
    getTeacherSections,
    createAnnonce,
    updateAnnonce,
    deleteAnnonce
};