import pool from '../config/db.js';

const studentModel = {
  validateMatricule: async (matricule) => {
    const query = `
      SELECT e.Matricule, g.ID_section, e.niveau
      FROM Etudiant e
      LEFT JOIN Groupe g ON e.ID_groupe = g.ID_groupe
      WHERE e.Matricule = ?
    `;
    try {
      const [results] = await pool.query(query, [matricule]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  getModulesBySemester: async (sectionId, semester) => {
    const query = `
      SELECT m.ID_module, m.nom_module
      FROM Module m
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      WHERE ms.ID_section = ? AND ms.semestre = ?
    `;
    try {
      const [results] = await pool.query(query, [sectionId, semester]);
      return results;
    } catch (err) {
      throw err;
    }
  },

  getResources: async (moduleId, sectionId, type) => {
    const query = `
      SELECT nom_ressource, fichier_url, description, date_upload
      FROM ressource
      WHERE ID_module = ? AND ID_section = ? AND type_ressource = ?
    `;
    try {
      const [results] = await pool.query(query, [moduleId, sectionId, type]);
      const formattedResults = results.map(resource => ({
        ...resource,
        date_upload: resource.date_upload 
          ? new Date(resource.date_upload).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }) 
          : 'Non spécifiée'
      }));
      return formattedResults;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  },
};

export default studentModel;