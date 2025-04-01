const pool = require('../config/db');

// Créer un sondage
const createSondage = async (req, res) => {
    const { title, question, options, target_filter, matricule } = req.body;
    if (!title || !question || !options || !Array.isArray(options) || options.length < 2 || !target_filter || !target_filter.sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis, et il doit y avoir au moins 2 options' });
    }

    // Valider que chaque option est une chaîne (peut contenir n'importe quel caractère)
    if (!options.every(opt => typeof opt === 'string')) {
        return res.status(400).json({ error: 'Toutes les options doivent être des chaînes' });
    }

    const sections = target_filter.sections;
    const groupes = target_filter.groupes || {};

    try {
        console.log('target_filter avant enregistrement:', target_filter);
        console.log('Options avant sérialisation:', options);

        // Vérifier si des groupes spécifiques sont sélectionnés
        let sendToAllStudents = true;
        for (const sectionId of sections) {
            const sectionGroupes = groupes[sectionId] || [];
            console.log(`Section ${sectionId} - Groupes sélectionnés:`, sectionGroupes);
            if (sectionGroupes.length > 0 && sectionGroupes[0] !== "") {
                sendToAllStudents = false;
                break;
            }
        }
        console.log('sendToAllStudents:', sendToAllStudents);

        // Récupérer les étudiants associés aux sections ciblées
        let etudiants = [];
        if (sections.length > 0) {
            const sectionIds = sections.map(id => parseInt(id, 10));
            console.log('Sections pour la requête SQL:', sectionIds);

            if (sendToAllStudents) {
                [etudiants] = await pool.query(
                    `SELECT DISTINCT e.Matricule
                     FROM Etudiant e
                     JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                     WHERE g.ID_section IN (?)`,
                    [sectionIds]
                );
            } else {
                let allEtudiants = [];
                for (const sectionId of sectionIds) {
                    const sectionGroupes = groupes[sectionId] || [];
                    if (sectionGroupes.length === 0 || sectionGroupes[0] === "") {
                        const [sectionEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ?`,
                            [parseInt(sectionId)]
                        );
                        allEtudiants.push(...sectionEtudiants);
                    } else {
                        const groupeIds = sectionGroupes.map(id => parseInt(id));
                        console.log(`Groupes pour la section ${sectionId}:`, groupeIds);
                        const [groupeEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ? AND e.ID_groupe IN (?)`,
                            [parseInt(sectionId), groupeIds]
                        );
                        allEtudiants.push(...groupeEtudiants);
                    }
                }
                etudiants = [...new Map(allEtudiants.map(e => [e.Matricule, e])).values()];
            }
        }

        console.log('Étudiants trouvés pour les sections ciblées:', etudiants);

        if (etudiants.length === 0) {
            console.log('Aucun étudiant trouvé pour les sections ciblées:', sections);
            if (!sendToAllStudents) {
                console.log('Aucun étudiant trouvé dans les groupes sélectionnés.');
            }
            return res.status(400).json({ error: 'Aucun étudiant trouvé pour les sections et groupes sélectionnés' });
        }

        // Sérialiser les options
        const serializedOptions = JSON.stringify(options);
        console.log('Options après sérialisation:', serializedOptions);

        // Créer le sondage
        const [result] = await pool.query(
            `INSERT INTO Sondage (title, question, options, enseignant_matricule, target_type, target_filter)
             VALUES (?, ?, ?, ?, 'Etudiants', ?)`,
            [title, question, serializedOptions, matricule, JSON.stringify(target_filter)]
        );

        const sondageId = result.insertId;
        console.log(`Sondage créé avec l'ID: ${sondageId}`);

        // Envoyer une notification à chaque étudiant (seulement le titre)
        console.log(`Envoi des notifications pour le sondage ID ${sondageId} à ${etudiants.length} étudiants:`, etudiants);
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`Sondage: ${title}`, matricule, etudiant.Matricule]
            );
            console.log(`Notification créée pour l'étudiant ${etudiant.Matricule} - Contenu: Sondage: ${title}`);
        }

        res.status(201).json({ id: sondageId, title, question, options, target_filter });
    } catch (error) {
        console.error('Erreur lors de la création du sondage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les sondages créés par un enseignant
const getTeacherSondages = async (req, res) => {
    try {
        const { matricule } = req.params;
        const [sondages] = await pool.query(
            `SELECT * FROM Sondage WHERE enseignant_matricule = ? ORDER BY created_at DESC`,
            [matricule]
        );
        res.status(200).json(sondages);
    } catch (error) {
        console.error('Erreur lors de la récupération des sondages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les résultats d'un sondage
const getSondageResults = async (req, res) => {
    const { id } = req.params;
    try {
        // Récupérer le sondage
        const [sondages] = await pool.query(
            `SELECT * FROM Sondage WHERE id = ?`,
            [id]
        );
        if (sondages.length === 0) {
            return res.status(404).json({ error: 'Sondage non trouvé' });
        }

        const sondage = sondages[0];
        let options;

        // Gérer le champ options qui peut être une chaîne JSON ou un objet
        if (typeof sondage.options === 'string') {
            try {
                options = JSON.parse(sondage.options);
            } catch (error) {
                console.error('Erreur lors du parsing des options (chaîne):', error, 'Valeur:', sondage.options);
                return res.status(500).json({ error: 'Les options du sondage sont mal formées' });
            }
        } else if (Array.isArray(sondage.options)) {
            // Si mysql2 a déjà parsé les options en tableau
            options = sondage.options;
        } else {
            console.error('Les options ne sont ni une chaîne ni un tableau:', sondage.options);
            return res.status(500).json({ error: 'Les options du sondage sont mal formées' });
        }

        // Valider que les options sont un tableau
        if (!Array.isArray(options)) {
            console.error('Les options ne sont pas un tableau après parsing:', options);
            return res.status(500).json({ error: 'Les options doivent être un tableau' });
        }

        // Récupérer les réponses
        const [reponses] = await pool.query(
            `SELECT reponse, COUNT(*) as count
             FROM Reponse_Sondage
             WHERE sondage_id = ?
             GROUP BY reponse`,
            [id]
        );

        // Construire les résultats
        const resultats = options.map(option => {
            const reponse = reponses.find(r => r.reponse === option) || { count: 0 };
            return { option, count: reponse.count };
        });

        res.status(200).json({ sondage, resultats });
    } catch (error) {
        console.error('Erreur lors de la récupération des résultats du sondage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Modifier un sondage
const updateSondage = async (req, res) => {
    const { id } = req.params;
    const { title, question, options, target_filter, matricule } = req.body;

    if (!title || !question || !options || !Array.isArray(options) || options.length < 2 || !target_filter || !target_filter.sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis, et il doit y avoir au moins 2 options' });
    }

    // Valider que chaque option est une chaîne
    if (!options.every(opt => typeof opt === 'string')) {
        return res.status(400).json({ error: 'Toutes les options doivent être des chaînes' });
    }

    const sections = target_filter.sections;
    const groupes = target_filter.groupes || {};

    try {
        // Vérifier si le sondage existe et appartient à l'enseignant
        const [sondages] = await pool.query(
            `SELECT * FROM Sondage WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (sondages.length === 0) {
            return res.status(404).json({ error: 'Sondage non trouvé ou non autorisé' });
        }

        const oldSondage = sondages[0];

        // Vérifier si des groupes spécifiques sont sélectionnés
        let sendToAllStudents = true;
        for (const sectionId of sections) {
            const sectionGroupes = groupes[sectionId] || [];
            if (sectionGroupes.length > 0 && sectionGroupes[0] !== "") {
                sendToAllStudents = false;
                break;
            }
        }

        // Récupérer les étudiants associés aux sections ciblées
        let etudiants = [];
        if (sections.length > 0) {
            const sectionIds = sections.map(id => parseInt(id, 10));
            if (sendToAllStudents) {
                [etudiants] = await pool.query(
                    `SELECT DISTINCT e.Matricule
                     FROM Etudiant e
                     JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                     WHERE g.ID_section IN (?)`,
                    [sectionIds]
                );
            } else {
                let allEtudiants = [];
                for (const sectionId of sectionIds) {
                    const sectionGroupes = groupes[sectionId] || [];
                    if (sectionGroupes.length === 0 || sectionGroupes[0] === "") {
                        const [sectionEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ?`,
                            [parseInt(sectionId)]
                        );
                        allEtudiants.push(...sectionEtudiants);
                    } else {
                        const groupeIds = sectionGroupes.map(id => parseInt(id));
                        const [groupeEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ? AND e.ID_groupe IN (?)`,
                            [parseInt(sectionId), groupeIds]
                        );
                        allEtudiants.push(...groupeEtudiants);
                    }
                }
                etudiants = [...new Map(allEtudiants.map(e => [e.Matricule, e])).values()];
            }
        }

        if (etudiants.length === 0) {
            return res.status(400).json({ error: 'Aucun étudiant trouvé pour les sections et groupes sélectionnés' });
        }

        // Mettre à jour le sondage
        const serializedOptions = JSON.stringify(options);
        await pool.query(
            `UPDATE Sondage
             SET title = ?, question = ?, options = ?, target_filter = ?
             WHERE id = ? AND enseignant_matricule = ?`,
            [title, question, serializedOptions, JSON.stringify(target_filter), id, matricule]
        );

        // Supprimer les anciennes notifications
        await pool.query(
            `DELETE FROM Notification
             WHERE contenu LIKE ? AND expediteur = ?`,
            [`Sondage: ${oldSondage.title}`, matricule]
        );

        // Créer de nouvelles notifications
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`Sondage: ${title}`, matricule, etudiant.Matricule]
            );
        }

        res.status(200).json({ id, title, question, options, target_filter });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du sondage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteSondage = async (req, res) => {
    const { id } = req.params;
    const { matricule } = req.body;
    if (!matricule) {
        return res.status(400).json({ error: 'Matricule requis' });
    }

    try {
        const [sondages] = await pool.query(
            `SELECT title, target_filter
             FROM Sondage
             WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (sondages.length === 0) {
            return res.status(404).json({ error: 'Sondage non trouvé ou non autorisé' });
        }

        const { title, target_filter } = sondages[0];
        let sections = [];
        let groupes = {};

        // Parser target_filter
        if (target_filter) {
            if (typeof target_filter === 'string' && target_filter.trim() !== '') {
                try {
                    const targetFilterParsed = JSON.parse(target_filter);
                    sections = targetFilterParsed.sections || [];
                    groupes = targetFilterParsed.groupes || {};
                } catch (error) {
                    console.error('Erreur lors du parsing de target_filter dans deleteSondage:', error);
                    sections = [];
                    groupes = {};
                }
            } else if (typeof target_filter === 'object' && target_filter !== null) {
                sections = target_filter.sections || [];
                groupes = target_filter.groupes || {};
            }
        }

        // Récupérer les étudiants associés aux sections et groupes ciblés
        let etudiants = [];
        if (sections.length > 0) {
            const sectionIds = sections.map(id => parseInt(id, 10));
            let sendToAllStudents = true;
            for (const sectionId of sectionIds) {
                const sectionGroupes = groupes[sectionId] || [];
                if (sectionGroupes.length > 0 && sectionGroupes[0] !== "") {
                    sendToAllStudents = false;
                    break;
                }
            }

            if (sendToAllStudents) {
                [etudiants] = await pool.query(
                    `SELECT DISTINCT e.Matricule
                     FROM Etudiant e
                     JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                     WHERE g.ID_section IN (?)`,
                    [sectionIds]
                );
            } else {
                let allEtudiants = [];
                for (const sectionId of sectionIds) {
                    const sectionGroupes = groupes[sectionId] || [];
                    if (sectionGroupes.length === 0 || sectionGroupes[0] === "") {
                        const [sectionEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ?`,
                            [parseInt(sectionId)]
                        );
                        allEtudiants.push(...sectionEtudiants);
                    } else {
                        const groupeIds = sectionGroupes.map(id => parseInt(id));
                        const [groupeEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ? AND e.ID_groupe IN (?)`,
                            [parseInt(sectionId), groupeIds]
                        );
                        allEtudiants.push(...groupeEtudiants);
                    }
                }
                etudiants = [...new Map(allEtudiants.map(e => [e.Matricule, e])).values()];
            }
        }

        const etudiantMatricules = etudiants.map(e => e.Matricule);

        // Supprimer les notifications associées
        if (etudiantMatricules.length > 0) {
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND destinataire IN (?) AND contenu LIKE 'Sondage:%'`,
                [matricule, etudiantMatricules]
            );
        } else {
            // Si aucun étudiant n'est trouvé, supprimer toutes les notifications de cet expéditeur qui commencent par "Sondage:"
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND contenu LIKE 'Sondage:%'`,
                [matricule]
            );
        }

        const [result] = await pool.query(
            `DELETE FROM Sondage
             WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sondage non trouvé ou non autorisé' });
        }

        res.json({ message: 'Sondage supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du sondage:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    createSondage,
    getTeacherSondages,
    getSondageResults,
    updateSondage,
    deleteSondage
};