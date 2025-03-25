const pool = require('../config/db');

exports.getAllEvenements = async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM Evenement');

        const evenementsWithFullUrl = results.map(evenement => ({
            ...evenement,
            image_url: evenement.image_url?.startsWith('http') 
                ? evenement.image_url 
                : `http://localhost:8084${evenement.image_url || ''}`
        }));

        res.json(evenementsWithFullUrl);
    } catch (err) {
        console.error('Erreur lors de la récupération des événements :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createEvenement = async (req, res) => {
    const { nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    const eventSql = `
        INSERT INTO Evenement (nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const eventValues = [nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin];

    try {
        const [eventResult] = await pool.query(eventSql, eventValues);
        const eventId = eventResult.insertId;

        const annonceSql = `
            INSERT INTO Annonce (title, content, image_url, event_id, admin_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const annonceValues = [nom_evenement, 'Nouveau événement est là !', image_url || '', eventId, organisateur_admin || 0];

        await pool.query(annonceSql, annonceValues);

        res.status(201).json({ 
            message: 'Événement créé avec succès', 
            eventId: eventId,
            image_url: image_url ? `http://localhost:8084${image_url}` : ''
        });
    } catch (err) {
        console.error('Erreur lors de la création de l\'événement :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateEvenement = async (req, res) => {
    const { id } = req.params;
    const { nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    const sql = `
        UPDATE Evenement 
        SET nom_evenement = ?, description_evenement = ?, date_evenement = ?, lieu = ?, capacite = ?, organisateur_admin = ?, image_url = ? 
        WHERE ID_evenement = ?
    `;
    const values = [nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin, image_url, id];

    try {
        await pool.query(sql, values);
        res.json({ message: 'Événement mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'événement :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.deleteEvenement = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM Annonce WHERE event_id = ?', [id]);
        await pool.query('DELETE FROM Evenement WHERE ID_evenement = ?', [id]);
        res.json({ message: 'Événement et annonce supprimés avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression de l\'événement :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};