import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const authenticateProfessor = async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      console.log('Auth Header:', authHeader);
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant ou invalide' });
      }
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded);
  
      const [rows] = await pool.execute('SELECT * FROM Enseignant WHERE Matricule = ?', [decoded.matricule]);
      console.log('DB Rows:', rows);
      if (rows.length === 0) {
        return res.status(403).json({ error: 'Non autorisé : Pas un professeur' });
      }
  
      req.professor = rows[0];
      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

export default authenticateProfessor;