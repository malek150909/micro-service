// student-annonces/backend/controllers/annonceEtudiantController.js
const pool = require('../config/db');

// Récupérer les annonces de l'administration destinées aux étudiants
const getAdminAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;
        console.log('Récupération des annonces admin pour matricule:', matricule);

        // Récupérer les sections de l'étudiant
        const [etudiantSections] = await pool.query(
            `
            SELECT es.ID_section
            FROM Etudiant_Section es
            WHERE es.Matricule = ?
            `,
            [matricule]
        );
        console.log('Sections de l\'étudiant:', etudiantSections);

        const sectionIds = etudiantSections.map(section => section.ID_section);
        console.log('IDs des sections:', sectionIds);
        if (sectionIds.length === 0) {
            console.log('Aucune section trouvée pour cet étudiant, renvoi d\'un tableau vide');
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
        console.log('Annonces brutes:', annonces);

        // Ajuster l'URL de l'image si nécessaire
        const annoncesWithAdjustedUrls = annonces.map(annonce => {
            let image_url = annonce.image_url || '';
            if (image_url && !image_url.startsWith('http')) {
                image_url = annonce.event_id
                    ? `http://localhost:9000${image_url}`
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
            console.log(`Annonce ID ${annonce.id} - target_filter:`, targetFilter);

            if (targetFilter.tous) {
                console.log(`Annonce ID ${annonce.id} - tous: true, annonce incluse`);
                return true;
            }

            if (targetFilter.sections) {
                const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
                console.log(`Annonce ID ${annonce.id} - Correspondance avec sections:`, matchesSection);
                return matchesSection;
            }

            console.log(`Annonce ID ${annonce.id} - Aucune correspondance, annonce exclue`);
            return false;
        });

        console.log('Annonces filtrées:', filteredAnnonces);
        res.json(filteredAnnonces);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les annonces des enseignants destinées aux étudiants
const getTeacherAnnonces = async (req, res) => {
    try {
        const { matricule } = req.params;
        console.log('Récupération des annonces enseignants pour matricule:', matricule);

        // Récupérer les sections de l'étudiant
        const [etudiantSections] = await pool.query(
            `
            SELECT es.ID_section
            FROM Etudiant_Section es
            WHERE es.Matricule = ?
            `,
            [matricule]
        );
        console.log('Sections de l\'étudiant:', etudiantSections);

        const sectionIds = etudiantSections.map(section => section.ID_section);
        console.log('IDs des sections:', sectionIds);
        if (sectionIds.length === 0) {
            console.log('Aucune section trouvée pour cet étudiant, renvoi d\'un tableau vide');
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
        console.log('Annonces brutes:', annonces);

        // Supprimer l'image_url et ajouter le nom complet de l'enseignant
        const formattedAnnonces = annonces.map(annonce => {
            const { image_url, ...rest } = annonce; // Exclure image_url
            return {
                ...rest,
                enseignant_nom: `${annonce.nom} ${annonce.prenom}` // Ajouter le nom complet
            };
        });

        // Filtrer les annonces selon les sections de l'étudiant
        const filteredAnnonces = formattedAnnonces.filter(annonce => {
            const targetFilter = typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter;
            console.log(`Annonce ID ${annonce.id} - target_filter:`, targetFilter);

            if (targetFilter.sections) {
                const matchesSection = targetFilter.sections.some(sectionId => sectionIds.includes(parseInt(sectionId)));
                console.log(`Annonce ID ${annonce.id} - Correspondance avec sections:`, matchesSection);
                return matchesSection;
            }

            console.log(`Annonce ID ${annonce.id} - Aucune correspondance, annonce exclue`);
            return false;
        });

        console.log('Annonces filtrées:', filteredAnnonces);
        res.json(filteredAnnonces);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces enseignants:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getAdminAnnonces,
    getTeacherAnnonces,
};