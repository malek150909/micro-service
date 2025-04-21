const pool = require('../config/db');

// Récupérer les annonces de l'administration destinées aux étudiants
const getAdminAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;

        // Récupérer les sections de l'étudiant
        const [etudiantSections] = await pool.query(
            `
            SELECT es.ID_section
            FROM Etudiant_Section es
            WHERE es.Matricule = ?
            `,
            [matricule]
        );

        const sectionIds = etudiantSections.map(section => section.ID_section);
        if (sectionIds.length === 0) {
            return res.json([]);
        }

        // Récupérer tous les champs des annonces destinées aux étudiants
        const [annonces] = await pool.query(
            `
            SELECT *
            FROM annonce a
            WHERE a.admin_matricule IS NOT NULL 
            AND a.target_type = 'Etudiants'
            ORDER BY a.created_at DESC
            `
        );

        // Ajuster l'URL de l'image si nécessaire
        const annoncesWithAdjustedUrls = annonces.map(annonce => {
            let image_url = annonce.image_url || '';
            if (image_url && !image_url.startsWith('http')) {
                image_url = annonce.event_id
                    ? `http://events.localhost${image_url}`
                    : `http://messaging.localhost${image_url}`;
            }
            return { ...annonce, image_url };
        });

        // Filtrer les annonces selon les critères de target_filter
        const filteredAnnonces = annoncesWithAdjustedUrls.filter(annonce => {
            const targetFilter = typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter;

            if (targetFilter.tous) {
                return true;
            }

            if (targetFilter.sections) {
                const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
                return matchesSection;
            }

            return false;
        });

        res.json(filteredAnnonces);
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des annonces administratives. Veuillez réessayer plus tard.' });
    }
};

// Récupérer les annonces des enseignants destinées aux étudiants
const getTeacherAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;

        // Récupérer les sections de l'étudiant
        const [etudiantSections] = await pool.query(
            `
            SELECT es.ID_section
            FROM Etudiant_Section es
            WHERE es.Matricule = ?
            `,
            [matricule]
        );

        const sectionIds = etudiantSections.map(section => section.ID_section);
        if (sectionIds.length === 0) {
            return res.json([]);
        }

        // Récupérer les annonces des enseignants avec le nom et prénom de l'enseignant
        const [annonces] = await pool.query(
            `
            SELECT a.*, u.nom, u.prenom
            FROM annonce a
            JOIN User u ON a.enseignant_matricule = u.Matricule
            WHERE a.enseignant_matricule IS NOT NULL 
            AND a.target_type = 'Etudiants'
            ORDER BY a.created_at DESC
            `
        );

        // Supprimer l'image_url et ajouter le nom complet de l'enseignant
        const formattedAnnonces = annonces.map(annonce => {
            const { image_url, ...rest } = annonce;
            return {
                ...rest,
                enseignant_nom: `${annonce.nom} ${annonce.prenom}`
            };
        });

        // Filtrer les annonces selon les sections de l'étudiant
        const filteredAnnonces = formattedAnnonces.filter(annonce => {
            const targetFilter = typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter;

            if (targetFilter.sections) {
                const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
                return matchesSection;
            }

            return false;
        });

        res.json(filteredAnnonces);
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des annonces des enseignants. Veuillez réessayer plus tard.' });
    }
};

// Récupérer les sondages des enseignants destinées aux étudiants
const getTeacherSondages = async (req, res) => {
    try {
        const { matricule } = req.params;

        // Récupérer les sections et groupes de l'étudiant
        const [etudiantInfo] = await pool.query(
            `
            SELECT es.ID_section, e.ID_groupe
            FROM Etudiant_Section es
            JOIN Etudiant e ON es.Matricule = e.Matricule
            WHERE es.Matricule = ?
            `,
            [matricule]
        );

        const sectionIds = etudiantInfo.map(info => info.ID_section);
        const groupeIds = etudiantInfo.map(info => info.ID_groupe);

        if (sectionIds.length === 0) {
            return res.json([]);
        }

        // Récupérer les sondages des enseignants avec le nom et prénom de l'enseignant
        const [sondages] = await pool.query(
            `
            SELECT s.*, u.nom, u.prenom
            FROM Sondage s
            JOIN User u ON s.enseignant_matricule = u.Matricule
            WHERE s.enseignant_matricule IS NOT NULL 
            AND s.target_type = 'Etudiants'
            ORDER BY s.created_at DESC
            `,
            []
        );

        // Ajouter le nom complet de l'enseignant
        const formattedSondages = sondages.map(sondage => {
            return {
                ...sondage,
                enseignant_nom: `${sondage.nom} ${sondage.prenom}`,
                options: typeof sondage.options === 'string' ? JSON.parse(sondage.options) : sondage.options,
                target_filter: typeof sondage.target_filter === 'string' ? JSON.parse(sondage.target_filter) : sondage.target_filter
            };
        });

        // Filtrer les sondages selon les sections et groupes de l'étudiant
        const filteredSondages = formattedSondages.filter(sondage => {
            const targetFilter = sondage.target_filter;

            if (!targetFilter.sections) {
                return false;
            }

            // Vérifier si l'étudiant appartient à une section ciblée
            const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
            if (!matchesSection) {
                return false;
            }

            // Vérifier les groupes si spécifiés
            const sectionGroupes = targetFilter.groupes || {};
            let matchesGroupe = true;

            // Vérifier pour chaque section ciblée si des groupes spécifiques sont définis
            for (const sectionId of targetFilter.sections) {
                const groupesForSection = sectionGroupes[sectionId] || [];
                if (groupesForSection.length > 0 && groupesForSection[0] !== "") {
                    matchesGroupe = groupesForSection.some(groupeId => groupeIds.includes(parseInt(groupeId)));
                    if (!matchesGroupe) {
                        return false;
                    }
                }
            }

            return true;
        });

        res.json(filteredSondages);
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des sondages. Veuillez réessayer plus tard.' });
    }
};

// Soumettre une réponse à un sondage
const submitSondageResponse = async (req, res) => {
    const { sondageId, matricule, reponse } = req.body;

    if (!sondageId || !matricule || !reponse) {
        return res.status(400).json({ error: 'Veuillez fournir toutes les informations nécessaires pour soumettre votre réponse.' });
    }

    try {
        // Vérifier si l'étudiant a déjà répondu à ce sondage
        const [existingResponse] = await pool.query(
            `
            SELECT * FROM reponse_sondage
            WHERE sondage_id = ? AND matricule_etudiant = ?
            `,
            [sondageId, matricule]
        );

        if (existingResponse.length > 0) {
            return res.status(400).json({ error: 'Vous avez déjà répondu à ce sondage.' });
        }

        // Vérifier si le sondage existe et si l'étudiant est autorisé à y répondre
        const [sondage] = await pool.query(
            `
            SELECT * FROM Sondage
            WHERE id = ?
            `,
            [sondageId]
        );

        if (sondage.length === 0) {
            return res.status(404).json({ error: 'Ce sondage n\'existe pas ou n\'est plus disponible.' });
        }

        const targetFilter = typeof sondage[0].target_filter === 'string' ? JSON.parse(sondage[0].target_filter) : sondage[0].target_filter;

        // Récupérer les sections et groupes de l'étudiant
        const [etudiantInfo] = await pool.query(
            `
            SELECT es.ID_section, e.ID_groupe
            FROM Etudiant_Section es
            JOIN Etudiant e ON es.Matricule = e.Matricule
            WHERE es.Matricule = ?
            `,
            [matricule]
        );

        const sectionIds = etudiantInfo.map(info => info.ID_section);
        const groupeIds = etudiantInfo.map(info => info.ID_groupe);

        const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
        if (!matchesSection) {
            return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à répondre à ce sondage.' });
        }

        const sectionGroupes = targetFilter.groupes || {};
        let matchesGroupe = true;
        for (const sectionId of targetFilter.sections) {
            const groupesForSection = sectionGroupes[sectionId] || [];
            if (groupesForSection.length > 0 && groupesForSection[0] !== "") {
                matchesGroupe = groupesForSection.some(groupeId => groupeIds.includes(parseInt(groupeId)));
                if (!matchesGroupe) {
                    return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à répondre à ce sondage.' });
                }
            }
        }

        // Vérifier si la réponse est valide (elle doit être dans les options du sondage)
        const options = typeof sondage[0].options === 'string' ? JSON.parse(sondage[0].options) : sondage[0].options;
        if (!options.includes(reponse)) {
            return res.status(400).json({ error: 'La réponse sélectionnée n\'est pas valide. Veuillez choisir une option parmi celles proposées.' });
        }

        // Enregistrer la réponse
        await pool.query(
            `
            INSERT INTO reponse_sondage (sondage_id, matricule_etudiant, reponse)
            VALUES (?, ?, ?)
            `,
            [sondageId, matricule, reponse]
        );

        res.status(201).json({ message: 'Votre réponse a été enregistrée avec succès ! Merci de votre participation.' });
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de la soumission de votre réponse. Veuillez réessayer plus tard.' });
    }
};

// Vérifier si un étudiant a déjà répondu à un sondage
const checkSondageResponse = async (req, res) => {
    const { sondageId, matricule } = req.params;

    try {
        const [response] = await pool.query(
            `
            SELECT * FROM reponse_sondage
            WHERE sondage_id = ? AND matricule_etudiant = ?
            `,
            [sondageId, matricule]
        );

        if (response.length > 0) {
            res.json({ hasResponded: true, reponse: response[0].reponse });
        } else {
            res.json({ hasResponded: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de votre réponse. Veuillez réessayer plus tard.' });
    }
};

// Ajouter un commentaire sur une annonce (pour les étudiants)
const addCommentToAnnonce = async (req, res) => {
    const { annonceId, matricule, contenu } = req.body;

    if (!annonceId || !matricule || !contenu) {
        return res.status(400).json({ error: 'Veuillez fournir toutes les informations nécessaires pour ajouter un commentaire.' });
    }

    try {
        // Vérifier si l'annonce existe
        const [annonce] = await pool.query(
            `
            SELECT * FROM annonce
            WHERE id = ?
            `,
            [annonceId]
        );

        if (annonce.length === 0) {
            return res.status(404).json({ error: 'Annonce non trouvée.' });
        }

        // Vérifier si l'étudiant existe
        const [etudiant] = await pool.query(
            `
            SELECT * FROM Etudiant
            WHERE Matricule = ?
            `,
            [matricule]
        );

        if (etudiant.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé.' });
        }

        // Ajouter le commentaire
        await pool.query(
            `
            INSERT INTO Commentaire_Annonce (ID_annonce, matricule_etudiant, contenu)
            VALUES (?, ?, ?)
            `,
            [annonceId, matricule, contenu]
        );

        res.status(201).json({ message: 'Votre commentaire a été ajouté avec succès.' });
    } catch (error) {
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout de votre commentaire. Veuillez réessayer plus tard.' });
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
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'enregistrement de votre réponse. Veuillez réessayer plus tard.' });
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

// Ajouter un événement administratif au calendrier de l'étudiant
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

        // Vérifier si l'étudiant existe
        const [etudiant] = await pool.query(
            `
            SELECT Matricule
            FROM Etudiant
            WHERE Matricule = ?
            `,
            [matricule]
        );

        if (etudiant.length === 0) {
            return res.status(404).json({ error: 'Étudiant non trouvé.' });
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
    getTeacherSondages,
    submitSondageResponse,
    checkSondageResponse,
    addCommentToAnnonce,
    replyToComment,
    getCommentsForAnnonce,
    addAdminEventToCalendar,
    checkCalendarEvent
};