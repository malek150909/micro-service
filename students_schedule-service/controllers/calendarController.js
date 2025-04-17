import pool from '../config/db.js';
import { format } from 'date-fns';

const getCalendarEvents = async (req, res) => {

  console.log("Headers reçus:", req.headers);
  console.log("Utilisateur:", req.user);

    const { startDate, endDate } = req.params; // Plage de dates au format yyyy-MM-dd
    const matricule = req.user.matricule;
    console.log(`Récupération des événements pour ${matricule} entre ${startDate} et ${endDate}`);

    try {
        const [userType] = await pool.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matricule]);
        const isStudent = userType.length > 0;
        const isTeacher = !isStudent ? (await pool.query('SELECT * FROM Enseignant WHERE Matricule = ?', [matricule])).length > 0 : false;

        let events = [];

        // 1. Récupérer les événements de la table CalendarEvent
        const [calendarEvents] = await pool.query(
            'SELECT * FROM CalendarEvent WHERE matricule = ? AND event_date BETWEEN ? AND ?',
            [matricule, startDate, endDate]
        );
        console.log('Événements de CalendarEvent récupérés:', calendarEvents);
        events = [...calendarEvents.map(event => ({
            ...event,
            type: event.title === 'Événements administratifs' ? 'administratif' : 'personal', // Identifier les événements administratifs
            event_date: format(new Date(event.event_date), 'yyyy-MM-dd'),
            canDelete: true, // Les événements administratifs peuvent être supprimés par l'utilisateur
            canEdit: event.title !== 'Événements administratifs' // Les événements administratifs ne peuvent pas être modifiés
        }))];

        // 2. Récupérer les séances supplémentaires
        if (isTeacher) {
            const [suppSessions] = await pool.query(
                `SELECT ss.*, m.nom_module, GROUP_CONCAT(ssg.ID_groupe) AS group_ids, s.nom_section
                 FROM Seance_Supp ss 
                 JOIN Module m ON ss.ID_module = m.ID_module 
                 LEFT JOIN Seance_Supp_Groupe ssg ON ss.ID_seance_supp = ssg.ID_seance_supp
                 LEFT JOIN Section s ON ss.ID_section = s.ID_section
                 WHERE ss.Matricule = ? AND ss.date_seance BETWEEN ? AND ?
                 GROUP BY ss.ID_seance_supp`,
                [matricule, startDate, endDate]
            );
            console.log('Séances supplémentaires (enseignant) récupérées:', suppSessions);
            events = [...events, ...suppSessions.map(session => ({
                ...session,
                type: 'supp_session',
                title: `Séance supplémentaire (${session.nom_module})`, // Ajuster le titre
                date_seance: format(new Date(session.date_seance), 'yyyy-MM-dd'),
                content: `Module: ${session.nom_module}, Type: ${session.type_seance}, Mode: ${session.mode}${session.ID_salle ? `, Salle: ${session.ID_salle}` : ''}${session.group_ids ? `, Groupes: ${session.group_ids}` : ''}${session.nom_section ? `, Section: ${session.nom_section}` : ''}`,
                canDelete: session.date_seance < format(new Date(), 'yyyy-MM-dd'),
                canEdit: false
            }))];
        } else if (isStudent) {
            const [studentSections] = await pool.query(
                'SELECT ID_section FROM Etudiant_Section WHERE Matricule = ?',
                [matricule]
            );
            const sectionIds = studentSections.map(s => s.ID_section);
            const [studentGroups] = await pool.query(
                'SELECT ID_groupe FROM Etudiant WHERE Matricule = ?',
                [matricule]
            );
            const groupIds = studentGroups.map(g => g.ID_groupe);

            const [suppSessions] = await pool.query(
                `SELECT ss.*, m.nom_module, GROUP_CONCAT(ssg.ID_groupe) AS group_ids, s.nom_section
                 FROM Seance_Supp ss 
                 JOIN Module m ON ss.ID_module = m.ID_module
                 LEFT JOIN Seance_Supp_Groupe ssg ON ss.ID_seance_supp = ssg.ID_seance_supp
                 LEFT JOIN Section s ON ss.ID_section = s.ID_section
                 WHERE (ss.ID_section IN (?) OR ssg.ID_groupe IN (?)) AND ss.date_seance BETWEEN ? AND ?
                 GROUP BY ss.ID_seance_supp`,
                [sectionIds, groupIds, startDate, endDate]
            );
            console.log('Séances supplémentaires (étudiant) récupérées:', suppSessions);
            events = [...events, ...suppSessions.map(session => ({
                ...session,
                type: 'supp_session',
                title: `Séance supplémentaire (${session.nom_module})`, // Ajuster le titre
                date_seance: format(new Date(session.date_seance), 'yyyy-MM-dd'),
                content: `Module: ${session.nom_module}, Type: ${session.type_seance}, Mode: ${session.mode}${session.ID_salle ? `, Salle: ${session.ID_salle}` : ''}${session.group_ids ? `, Groupes: ${session.group_ids}` : ''}${session.nom_section ? `, Section: ${session.nom_section}` : ''}`,
                canDelete: session.date_seance < format(new Date(), 'yyyy-MM-dd'),
                canEdit: false
            }))];
        }

        // 3. Récupérer les événements de club (uniquement pour les étudiants)
        if (isStudent) {
            const [clubEvents] = await pool.query(
                `SELECT ce.*, c.nom AS club_name, c.gerant_matricule
                 FROM ClubEvenement ce
                 JOIN MembreClub mc ON ce.ID_club = mc.ID_club
                 JOIN Club c ON ce.ID_club = c.ID_club
                 WHERE mc.matricule_etudiant = ? AND DATE(ce.date_evenement) BETWEEN ? AND ?
                 `,
                [parseInt(matricule), startDate, endDate]
            );
            console.log('Paramètres de la requête pour les événements de club:', { matricule, startDate, endDate });
            console.log('Événements de club récupérés:', clubEvents);

            clubEvents.forEach(event => {
                const timeSlots = event.time_slots ? event.time_slots.split(',') : ['08:00 - 09:30'];
                timeSlots.forEach(timeSlot => {
                    events.push({
                        ...event,
                        type: 'club_event',
                        date_evenement: format(new Date(event.date_evenement), 'yyyy-MM-dd'),
                        time_slot: timeSlot.trim(),
                        title: `Événement du club ${event.club_name}`,
                        content: event.gerant_matricule === parseInt(matricule)
                            ? `Votre événement ${event.nom_evenement} de votre club ${event.club_name} aura lieu ce jour-là`
                            : `Événement ${event.nom_evenement} organisé par ${event.club_name} aura lieu ce jour-là`,
                        canDelete: event.gerant_matricule !== parseInt(matricule) && event.organisateur_admin !== parseInt(matricule),
                        canEdit: false
                    });
                });
            });
        }

        console.log('Tous les événements renvoyés:', events);
        res.json(events);
    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

const addPersonalEvent = async (req, res) => {
    const { title, content, event_date, time_slot } = req.body;
    const matricule = req.user.matricule;

    try {
        await pool.query(
            'INSERT INTO CalendarEvent (matricule, title, content, event_date, time_slot) VALUES (?, ?, ?, ?, ?)',
            [matricule, title, content, event_date, time_slot]
        );
        res.status(201).json({ message: 'Événement ajouté' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

const updatePersonalEvent = async (req, res) => {
    const { id } = req.params;
    const { title, content, event_date, time_slot } = req.body;
    const matricule = req.user.matricule;

    try {
        const [event] = await pool.query('SELECT * FROM CalendarEvent WHERE ID_event = ? AND matricule = ?', [id, matricule]);
        if (!event.length) return res.status(404).json({ message: 'Événement non trouvé' });

        await pool.query(
            'UPDATE CalendarEvent SET title = ?, content = ?, event_date = ?, time_slot = ? WHERE ID_event = ?',
            [title, content, event_date, time_slot, id]
        );
        res.json({ message: 'Événement mis à jour' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

const deletePersonalEvent = async (req, res) => {
    const { id } = req.params;
    const matricule = req.user.matricule;

    try {
        const [event] = await pool.query('SELECT * FROM CalendarEvent WHERE ID_event = ? AND matricule = ?', [id, matricule]);
        if (!event.length) return res.status(404).json({ message: 'Événement non trouvé' });

        await pool.query('DELETE FROM CalendarEvent WHERE ID_event = ?', [id]);
        res.json({ message: 'Événement supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

const deleteSupplementarySession = async (req, res) => {
    const { id } = req.params;
    const matricule = req.user.matricule;

    try {
        const [session] = await pool.query('SELECT * FROM Seance_Supp WHERE ID_seance_supp = ?', [id]);
        if (!session.length) return res.status(404).json({ message: 'Séance non trouvée' });

        const today = format(new Date(), 'yyyy-MM-dd');
        if (session[0].date_seance >= today) {
            return res.status(403).json({ message: 'Impossible de supprimer une séance non passée' });
        }

        await pool.query('DELETE FROM Seance_Supp WHERE ID_seance_supp = ?', [id]);
        res.json({ message: 'Séance supplémentaire supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

const deleteClubEvent = async (req, res) => {
    const { id } = req.params;
    const matricule = req.user.matricule;

    try {
        const [event] = await pool.query(
            `SELECT ce.*, c.gerant_matricule
             FROM ClubEvenement ce
             JOIN Club c ON ce.ID_club = c.ID_club
             JOIN MembreClub mc ON ce.ID_club = mc.ID_club
             WHERE ce.ID_club_evenement = ? AND mc.matricule_etudiant = ?`,
            [id, parseInt(matricule)]
        );
        if (!event.length) return res.status(404).json({ message: 'Événement non trouvé' });

        if (event[0].gerant_matricule === parseInt(matricule) || event[0].organisateur_admin === parseInt(matricule)) {
            return res.status(403).json({ message: 'Impossible de supprimer votre propre événement de club' });
        }

        await pool.query('DELETE FROM ClubEvenement WHERE ID_club_evenement = ?', [id]);
        res.json({ message: 'Événement de club supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

export {
    getCalendarEvents,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    deleteSupplementarySession,
    deleteClubEvent,
};