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

// Récupérer les sections et groupes associés à l'enseignant
const getTeacherSections = async (req, res) => {
    try {
        const { matricule } = req.params;
        const matriculeNumber = Number(matricule);
        if (isNaN(matriculeNumber)) {
            return res.status(400).json({ error: 'Matricule doit être un nombre' });
        }

        // Récupérer les sections
        const [sections] = await pool.query(
            `SELECT s.ID_section, s.niveau, sp.nom_specialite
             FROM Section s
             JOIN Enseignant_Section es ON s.ID_section = es.ID_section
             JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
             WHERE es.Matricule = ?`,
            [matriculeNumber]
        );

        // Pour chaque section, récupérer les groupes associés
        const sectionsWithGroups = await Promise.all(
            sections.map(async (section) => {
                const [groupes] = await pool.query(
                    `SELECT g.ID_groupe, g.num_groupe AS nom_groupe
                     FROM Groupe g
                     WHERE g.ID_section = ?`,
                    [section.ID_section]
                );
                // Formater nom_groupe pour qu'il soit plus descriptif (par exemple, "Groupe 1")
                const formattedGroupes = groupes.map(groupe => ({
                    ...groupe,
                    nom_groupe: `Groupe ${groupe.nom_groupe}` // Ajouter "Groupe" devant le numéro
                }));
                return {
                    ...section,
                    groupes: formattedGroupes || []
                };
            })
        );

        console.log('Sections avec groupes:', sectionsWithGroups);
        res.json(sectionsWithGroups);
    } catch (error) {
        console.error('Erreur lors de la récupération des sections et groupes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Créer une annonce
const createAnnonce = async (req, res) => {
    const { title, content, target_filter, matricule } = req.body;
    if (!title || !content || !target_filter || !target_filter.sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const sections = target_filter.sections; // Sections ciblées
    const groupes = target_filter.groupes || {}; // Groupes ciblés par section

    try {
        console.log('target_filter avant enregistrement:', target_filter);

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
                // Si "Tous les groupes" est sélectionné, récupérer tous les étudiants de la section
                [etudiants] = await pool.query(
                    `SELECT DISTINCT e.Matricule
                     FROM Etudiant e
                     JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                     WHERE g.ID_section IN (?)`,
                    [sectionIds]
                );
            } else {
                // Si un groupe spécifique est sélectionné, filtrer les étudiants par groupe
                let allEtudiants = [];
                for (const sectionId of sectionIds) {
                    const sectionGroupes = groupes[sectionId] || [];
                    if (sectionGroupes.length === 0 || sectionGroupes[0] === "") {
                        // Si aucun groupe spécifique, récupérer tous les étudiants de la section
                        const [sectionEtudiants] = await pool.query(
                            `SELECT DISTINCT e.Matricule
                             FROM Etudiant e
                             JOIN Groupe g ON e.ID_groupe = g.ID_groupe
                             WHERE g.ID_section = ?`,
                            [parseInt(sectionId)]
                        );
                        allEtudiants.push(...sectionEtudiants);
                    } else {
                        // Filtrer les étudiants par groupe
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
                // Éliminer les doublons d'étudiants
                etudiants = [...new Map(allEtudiants.map(e => [e.Matricule, e])).values()];
            }
        }

        console.log('Étudiants trouvés pour les sections ciblées:', etudiants);

        // Si aucun étudiant n'est trouvé, renvoyer une erreur sans créer l'annonce
        if (etudiants.length === 0) {
            console.log('Aucun étudiant trouvé pour les sections ciblées:', sections);
            if (!sendToAllStudents) {
                console.log('Aucun étudiant trouvé dans les groupes sélectionnés.');
            }
            return res.status(400).json({ error: 'Aucun étudiant trouvé pour les sections et groupes sélectionnés' });
        }

        // Créer l'annonce
        const [result] = await pool.query(
            `INSERT INTO annonce (title, content, enseignant_matricule, target_type, target_filter)
             VALUES (?, ?, ?, 'Etudiants', ?)`,
            [title, content, matricule, JSON.stringify(target_filter)]
        );

        const annonceId = result.insertId;
        console.log(`Annonce créée avec l'ID: ${annonceId}`);

        // Créer une notification pour chaque étudiant avec le nouveau format
        console.log(`Envoi des notifications pour l'annonce ID ${annonceId} à ${etudiants.length} étudiants:`, etudiants);
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`Nouvelle annonce : ${title}`, matricule, etudiant.Matricule]
            );
            console.log(`Notification créée pour l'étudiant ${etudiant.Matricule} - Contenu: Nouvelle annonce : ${title}`);
        }

        res.status(201).json({ id: annonceId, title, content, target_filter });
    } catch (error) {
        console.error('Erreur lors de la création de l\'annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Mettre à jour une annonce
const updateAnnonce = async (req, res) => {
    const { id } = req.params;
    const { title, content, target_filter, matricule } = req.body;

    if (!title || !content || !target_filter || !target_filter.sections || !matricule) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const sections = target_filter.sections;
    const groupes = target_filter.groupes || {};

    try {
        console.log('target_filter avant mise à jour:', target_filter);

        // Vérifier si l'annonce existe et appartient à l'enseignant
        const [annonces] = await pool.query(
            `SELECT * FROM annonce WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (annonces.length === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

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

        // Mettre à jour l'annonce
        await pool.query(
            `UPDATE annonce
             SET title = ?, content = ?, target_filter = ?
             WHERE id = ? AND enseignant_matricule = ?`,
            [title, content, JSON.stringify(target_filter), id, matricule]
        );

        console.log(`Annonce ID ${id} mise à jour`);

        // Supprimer les anciennes notifications avec le nouveau format
        await pool.query(
            `DELETE FROM Notification
             WHERE contenu LIKE ? AND expediteur = ?`,
            [`Nouvelle annonce : ${annonces[0].title}`, matricule]
        );

        // Créer de nouvelles notifications avec le nouveau format
        console.log(`Envoi des notifications pour l'annonce ID ${id} à ${etudiants.length} étudiants:`, etudiants);
        for (const etudiant of etudiants) {
            await pool.query(
                `INSERT INTO Notification (contenu, expediteur, destinataire)
                 VALUES (?, ?, ?)`,
                [`Nouvelle annonce : ${title}`, matricule, etudiant.Matricule]
            );
            console.log(`Notification créée pour l'étudiant ${etudiant.Matricule} - Contenu: Nouvelle annonce : ${title}`);
        }

        res.status(200).json({ id, title, content, target_filter });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'annonce:', error);
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
        let sections = [];

        // Vérifier si target_filter est un objet ou une chaîne JSON
        if (target_filter) {
            if (typeof target_filter === 'string' && target_filter.trim() !== '') {
                try {
                    const targetFilterParsed = JSON.parse(target_filter);
                    sections = targetFilterParsed.sections || [];
                } catch (error) {
                    console.error('Erreur lors du parsing de target_filter dans deleteAnnonce:', error, 'Valeur:', target_filter);
                    sections = [];
                }
            } else if (typeof target_filter === 'object' && target_filter !== null) {
                sections = target_filter.sections || [];
            } else {
                console.warn('target_filter est vide ou invalide dans deleteAnnonce:', target_filter);
                sections = [];
            }
        } else {
            console.warn('target_filter est vide ou invalide dans deleteAnnonce:', target_filter);
            sections = [];
        }

        // Récupérer les étudiants associés aux sections ciblées (sans filtrage par groupe)
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

        // Supprimer les notifications associées à cette annonce pour ces étudiants avec le nouveau format
        if (etudiantMatricules.length > 0) {
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND destinataire IN (?) AND contenu LIKE ?`,
                [matricule, etudiantMatricules, `Nouvelle annonce : ${title}`]
            );
        }

        // Supprimer les commentaires associés à l'annonce
        await pool.query(
            `DELETE FROM Commentaire_Annonce
             WHERE ID_annonce = ?`,
            [id]
        );

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

// Récupérer les commentaires d'une annonce
const getCommentsForAnnonce = async (req, res) => {
    const { annonceId } = req.params;

    try {
        const [comments] = await pool.query(
            `
            SELECT ca.*, u.nom, u.prenom
            FROM Commentaire_Annonce ca
            JOIN Etudiant e ON ca.matricule_etudiant = e.Matricule
            JOIN User u ON e.Matricule = u.Matricule
            WHERE ca.ID_annonce = ?
            ORDER BY ca.date_commentaire DESC
            `,
            [annonceId]
        );

        console.log(`Commentaires pour annonce ${annonceId} :`, comments);
        res.json(comments);
    } catch (error) {
        console.error('Erreur dans getCommentsForAnnonce:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des commentaires. Veuillez réessayer plus tard.' });
    }
};

// Répondre à un commentaire (pour les enseignants)
const replyToComment = async (req, res) => {
    const { commentaireId, enseignantMatricule, reponse } = req.body;

    if (!commentaireId || !enseignantMatricule || !reponse) {
        return res.status(400).json({ error: 'Veuillez fournir toutes les informations nécessaires pour répondre au commentaire.' });
    }

    try {
        // Vérifier si le commentaire existe et est lié à une annonce de l'enseignant
        const [commentaire] = await pool.query(
            `
            SELECT ca.*, a.enseignant_matricule
            FROM Commentaire_Annonce ca
            JOIN annonce a ON ca.ID_annonce = a.id
            WHERE ca.ID_commentaire = ?
            `,
            [commentaireId]
        );

        if (commentaire.length === 0) {
            return res.status(404).json({ error: 'Commentaire non trouvé.' });
        }

        if (commentaire[0].enseignant_matricule !== enseignantMatricule) {
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à répondre à ce commentaire.' });
        }

        // Mettre à jour le commentaire avec la réponse
        await pool.query(
            `
            UPDATE Commentaire_Annonce
            SET reponse_enseignant = ?, date_reponse = CURRENT_TIMESTAMP
            WHERE ID_commentaire = ?
            `,
            [reponse, commentaireId]
        );

        res.json({ message: 'Votre réponse a été enregistrée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la réponse:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'enregistrement de votre réponse. Veuillez réessayer plus tard.' });
    }
};

module.exports = {
    getAdminAnnonces,
    getTeacherAnnonces,
    getTeacherSections,
    createAnnonce,
    updateAnnonce,
    deleteAnnonce,
    getCommentsForAnnonce,
    replyToComment
};