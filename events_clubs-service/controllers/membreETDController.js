// club-evenement-service/backend/controllers/membreController.js
const pool = require('../config/db');

// Récupérer les membres d'un club
const getMembresClub = async (req, res) => {
  const { clubId } = req.params;

  try {
    console.log('Requête reçue pour getMembresClub:', clubId);
    const [membres] = await pool.query(
      `
      SELECT u.Matricule, u.nom, u.prenom
      FROM MembreClub mc
      JOIN User u ON mc.matricule_etudiant = u.Matricule
      WHERE mc.ID_club = ?
    `,
      [clubId]
    );
    res.json(membres);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des membres' });
  }
};

// Supprimer un membre d'un club
const supprimerMembre = async (req, res) => {
  const { clubId, matricule } = req.params;

  try {
    console.log('Requête reçue pour supprimerMembre:', { clubId, matricule });
    const [result] = await pool.query(
      'DELETE FROM MembreClub WHERE ID_club = ? AND matricule_etudiant = ?',
      [clubId, matricule]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du membre' });
  }
};

module.exports = { getMembresClub, supprimerMembre };