// backend/controllers/evenementController.js
const db = require('../config/db');

exports.getAllEvenements = (req, res) => {
    const sql = 'SELECT * FROM Evenement';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des événements :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const evenementsWithFullUrl = results.map(evenement => ({
            ...evenement,
            image_url: evenement.image_url?.startsWith('http') 
                ? evenement.image_url 
                : `http://localhost:5000${evenement.image_url || ''}`
        }));

        res.json(evenementsWithFullUrl);
    });
};

exports.createEvenement = (req, res) => {
    const { nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    const eventSql = `
        INSERT INTO Evenement (nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const eventValues = [nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin];

    db.query(eventSql, eventValues, (err, result) => {
        if (err) {
            console.error('Erreur lors de la création de l\'événement :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const eventId = result.insertId;

        const annonceSql = `
            INSERT INTO Annonce (title, content, image_url, event_id, admin_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const annonceValues = [nom_evenement, 'Nouveau événement est là !', image_url || '', eventId, organisateur_admin || 0];

        db.query(annonceSql, annonceValues, (err, annonceResult) => {
            if (err) {
                console.error('Erreur lors de la création de l\'annonce :', err);
            }

            res.status(201).json({ 
                message: 'Événement créé avec succès', 
                eventId: eventId,
                image_url: image_url ? `http://localhost:5000${image_url}` : ''
            });
        });
    });
};

exports.updateEvenement = (req, res) => {
    const { id } = req.params;
    const { nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    const sql = `
        UPDATE Evenement 
        SET nom_evenement = ?, description_evenement = ?, date_evenement = ?, lieu = ?, capacite = ?, organisateur_admin = ?, image_url = ? 
        WHERE ID_evenement = ?
    `;

    const values = [nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin, image_url, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de l\'événement :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Événement mis à jour avec succès' });
    });
};

exports.deleteEvenement = (req, res) => {
    const { id } = req.params;

    const deleteAnnonceSql = 'DELETE FROM Annonce WHERE event_id = ?';
    db.query(deleteAnnonceSql, [id], (err, annonceResult) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'annonce :', err);
        }

        const deleteEventSql = 'DELETE FROM Evenement WHERE ID_evenement = ?';
        db.query(deleteEventSql, [id], (err, result) => {
            if (err) {
                console.error('Erreur lors de la suppression de l\'événement :', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ message: 'Événement et annonce supprimés avec succès' });
        });
    });
};