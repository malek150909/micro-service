const pool = require('../config/db'); // Utilisation de mysql2/promise

// Get all announcements
exports.getAllAnnonces = async (req, res) => {
    try {
        const sql = 'SELECT * FROM Annonce';
        const [results] = await pool.query(sql);
        
        // Add the full URL to the image_url only if it doesn't already have it
        const annoncesWithFullUrl = results.map(annonce => ({
            ...annonce,
            image_url: annonce.image_url?.startsWith('http') 
                ? annonce.image_url 
                : `http://localhost:8082${annonce.image_url}`
        }));

        res.json(annoncesWithFullUrl);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create an announcement
exports.createAnnonce = async (req, res) => {
    try {
        const { title, content, image_url = null, admin_id = null } = req.body;

        if (admin_id && isNaN(admin_id)) {
            return res.status(400).json({ message: 'admin_id must be a valid integer' });
        }

        const sql = 'INSERT INTO Annonce (title, content, image_url, admin_id) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(sql, [title, content, image_url, admin_id]);
        
        res.json({ message: 'Announcement created successfully', id: result.insertId });
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an announcement
exports.updateAnnonce = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url } = req.body;
        const sql = 'UPDATE Annonce SET title = ?, content = ?, image_url = ? WHERE id = ?';
        await pool.query(sql, [title, content, image_url, id]);
        
        res.json({ message: 'Announcement updated successfully' });
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an announcement
exports.deleteAnnonce = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM Annonce WHERE id = ?';
        await pool.query(sql, [id]);
        
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
