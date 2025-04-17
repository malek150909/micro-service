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
                    ? `http://localhost:8084${image_url}`
                    : `http://localhost:8082${image_url}`;
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
                // Formater nom_groupe pour qu'il soit plus descriptif
                const formattedGroupes = groupes.map(groupe => ({
                    ...groupe,
                    nom_groupe: `Groupe ${groupe.nom_groupe}`
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

    const sections = target_filter.sections;
    const groupes = target_filter.groupes || {};

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

        const [result] = await pool.query(
            `INSERT INTO annonce (title, content, enseignant_matricule, target_type, target_filter)
             VALUES (?, ?, ?, 'Etudiants', ?)`,
            [title, content, matricule, JSON.stringify(target_filter)]
        );

        const annonceId = result.insertId;
        console.log(`Annonce créée avec l'ID: ${annonceId}`);

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

        const [annonces] = await pool.query(
            `SELECT * FROM annonce WHERE id = ? AND enseignant_matricule = ?`,
            [id, matricule]
        );

        if (annonces.length === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée ou non autorisée' });
        }

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

        await pool.query(
            `UPDATE annonce
             SET title = ?, content = ?, target_filter = ?
             WHERE id = ? AND enseignant_matricule = ?`,
            [title, content, JSON.stringify(target_filter), id, matricule]
        );

        console.log(`Annonce ID ${id} mise à jour`);

        await pool.query(
            `DELETE FROM Notification
             WHERE contenu LIKE ? AND expediteur = ?`,
            [`Nouvelle annonce : ${annonces[0].title}`, matricule]
        );

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

        if (etudiantMatricules.length > 0) {
            await pool.query(
                `DELETE FROM Notification
                 WHERE expediteur = ? AND destinataire IN (?) AND contenu LIKE ?`,
                [matricule, etudiantMatricules, `Nouvelle annonce : ${title}`]
            );
        }

        await pool.query(
            `DELETE FROM Commentaire_Annonce
             WHERE ID_annonce = ?`,
            [id]
        );

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

// Répondre à un commentaire
const replyToComment = async (req, res) => {
    const { commentaireId, enseignantMatricule, reponse } = req.body;

    if (!commentaireId || !enseignantMatricule || !reponse) {
        return res.status(400).json({ error: 'Veuillez fournir toutes les informations nécessaires pour répondre au commentaire.' });
    }

    try {
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

// Ajouter un événement administratif au calendrier de l'enseignant
const addAdminEventToCalendar = async (req, res) => {
    const { annonceId, matricule, time_slot, event_date } = req.body;

    if (!annonceId || !matricule || !time_slot || !event_date) {
        return res.status(400).json({ error: 'Veuillez fournir toutes les informations nécessaires.' });
    }

    try {
        // Vérifier si l'annonce existe et est administrative
        const [annonce] = await pool.query(
            `
            SELECT title, content
            FROM annonce
            WHERE id = ? AND admin_matricule IS NOT NULL
            `,
            [annonceId]
        );

        if (annonce.length === 0) {
            return res.status(404).json({ error: 'Annonce administrative non trouvée.' });
        }

        // Vérifier si l'enseignant existe
        const [enseignant] = await pool.query(
            `
            SELECT Matricule
            FROM Enseignant
            WHERE Matricule = ?
            `,
            [matricule]
        );

        if (enseignant.length === 0) {
            return res.status(404).json({ error: 'Enseignant non trouvé.' });
        }

        // Vérifier si le time_slot est valide
        const validTimeSlots = [
            '08:00 - 09:30',
            '09:40 - 11:10',
            '11:20 - 12:50',
            '13:00 - 14:30',
            '14:40 - 16:10',
            '16:20 - 17:50'
        ];

        if (!validTimeSlots.includes(time_slot)) {
            return res.status(400).json({ error: 'Créneau horaire invalide.' });
        }

        // Formatter le titre et le contenu
        const title = 'Événements administratifs';
        const content = `L'événement administratif ${annonce[0].title} aura lieu ce jour-là`;

        // Insérer l'événement dans CalendarEvent
        await pool.query(
            `
            INSERT INTO CalendarEvent (matricule, title, content, event_date, time_slot)
            VALUES (?, ?, ?, ?, ?)
            `,
            [matricule, title, content, event_date, time_slot]
        );

        res.status(201).json({ message: 'Événement ajouté au calendrier avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout au calendrier:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout de l\'événement au calendrier.' });
    }
};

// Vérifier si un événement est déjà dans le calendrier
const checkCalendarEvent = async (req, res) => {
    const { annonceId, matricule } = req.params;

    try {
        const [events] = await pool.query(
            `
            SELECT ID_event
            FROM CalendarEvent
            WHERE matricule = ? AND content LIKE ?
            `,
            [matricule, `%L'événement administratif ${await getAnnonceTitle(annonceId)}%`]
        );

        res.json({ isAdded: events.length > 0 });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'événement:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de l\'événement.' });
    }
};

// Fonction utilitaire pour récupérer le titre de l'annonce
const getAnnonceTitle = async (annonceId) => {
    const [annonce] = await pool.query(
        `
        SELECT title
        FROM annonce
        WHERE id = ?
        `,
        [annonceId]
    );
    return annonce.length > 0 ? annonce[0].title : '';
};

module.exports = {
    getAdminAnnonces,
    getTeacherAnnonces,
    getTeacherSections,
    createAnnonce,
    updateAnnonce,
    deleteAnnonce,
    getCommentsForAnnonce,
    replyToComment,
    addAdminEventToCalendar,
    checkCalendarEvent
};