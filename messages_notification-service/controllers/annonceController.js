// backend/controllers/annonceController.js
const db = require('../config/db');

// Get all announcements
exports.getAllAnnonces = (req, res) => {
    const sql = 'SELECT * FROM Annonce';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching announcements:', err);
        return res.status(500).json({ message: 'Server error' });
      }
  
      // Add the full URL to the image_url only if it doesn't already have it
      const annoncesWithFullUrl = results.map(annonce => ({
        ...annonce,
        image_url: annonce.image_url?.startsWith('http') 
          ? annonce.image_url 
          : `http://localhost:8082${annonce.image_url}`
      }));
  
      res.json(annoncesWithFullUrl);
    });
  };
exports.createAnnonce = (req, res) => {
    const { title, content, image_url = null, admin_id = null } = req.body;

    // If admin_id is provided, ensure it's a valid integer
    if (admin_id && isNaN(admin_id)) {
        return res.status(400).json({ message: 'admin_id must be a valid integer' });
    }

    const sql = 'INSERT INTO Annonce (title, content, image_url, admin_id) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, content, image_url, admin_id], (err, result) => {
        if (err) {
            console.error('Error creating announcement:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'Announcement created successfully', id: result.insertId });
    });
};
// Update an announcement
exports.updateAnnonce = (req, res) => {
    const { id } = req.params;
    const { title, content, image_url } = req.body;
    const sql = 'UPDATE Annonce SET title = ?, content = ?, image_url = ? WHERE id = ?';
    db.query(sql, [title, content, image_url, id], (err, result) => {
        if (err) {
            console.error('Error updating announcement:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'Announcement updated successfully' });
    });
};

// Delete an announcement
exports.deleteAnnonce = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Annonce WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'Announcement deleted successfully' });
    });
};