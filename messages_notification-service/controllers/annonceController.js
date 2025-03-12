const db = require('../config/db');

exports.getAllAnnonces = (req, res) => {
    const sql = 'SELECT * FROM Annonce';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des annonces :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        const annoncesWithFullUrl = results.map(annonce => {
            if (!annonce.image_url) return { ...annonce, image_url: '' };

            // Si l’annonce est liée à un événement (port 5000)
            if (annonce.event_id) {
                return {
                    ...annonce,
                    image_url: annonce.image_url.startsWith('http') 
                        ? annonce.image_url 
                        : `http://localhost:8084${annonce.image_url}`
                };
            }

            // Sinon, l’image vient du service Annonce (port 5001)
            return {
                ...annonce,
                image_url: annonce.image_url.startsWith('http') 
                    ? annonce.image_url 
                    : `http://localhost:8082${annonce.image_url}`
            };
        });

        console.log('Annonces renvoyées :', annoncesWithFullUrl);
        res.json(annoncesWithFullUrl);
    });
};

exports.createAnnonce = (req, res) => {
    const { title, content, admin_id, image_url } = req.body;
    const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const finalImageUrl = uploadedImageUrl || image_url || '';

    const sql = 'INSERT INTO Annonce (title, content, image_url, admin_id) VALUES (?, ?, ?, ?)';
    const values = [title, content, finalImageUrl, admin_id || 0];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de la création de l\'annonce :', err);
            return res.status(500).json({ message: 'Erreur serveur', error: err.message });
        }
        res.status(201).json({ message: 'Annonce créée avec succès', id: result.insertId });
    });
};

exports.updateAnnonce = (req, res) => {
    const { id } = req.params;
    const { title, content, image_url, admin_id } = req.body;

    const sql = 'UPDATE Annonce SET title = ?, content = ?, image_url = ?, admin_id = ? WHERE id = ?';
    db.query(sql, [title, content, image_url, admin_id || 0, id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour de l\'annonce :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Annonce mise à jour avec succès' });
    });
};

exports.deleteAnnonce = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM Annonce WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'annonce :', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ message: 'Annonce supprimée avec succès' });
    });
};