// models/timetableModel.js
import pool from '../config/db.js';

const Timetable = {
  // models/timetableModel.js
  getTimetable: async (filters) => {
    try {
      const { sectionId } = filters; // Changé de section à sectionId
      console.log('Filters received:', filters);

      if (!sectionId) {
        throw new Error('sectionId is required');
      }

      const query = `
        SELECT s.ID_seance, s.jour, s.time_slot, s.type_seance,
               m.nom_module AS module, CONCAT(u.prenom, ' ', u.nom) AS teacher,
               s.ID_salle AS room, g.num_groupe AS "group"
        FROM Seance s
        LEFT JOIN Module m ON s.ID_module = m.ID_module
        LEFT JOIN User u ON s.Matricule = u.Matricule
        LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
        WHERE s.ID_section = ?
      `;
      const params = [sectionId];
      console.log('Executing query:', query);
      console.log('With params:', params);

      const [rows] = await pool.query(query, params);
      console.log('Query result:', rows);

      const timetable = {};
      rows.forEach(row => {
        if (!timetable[row.jour]) timetable[row.jour] = [];
        timetable[row.jour].push(row);
      });

      console.log('Fetched timetable from Seance:', timetable);
      return timetable;
    } catch (err) {
      console.error('Error in getTimetable:', err.message);
      throw err;
    }
  },

getFilterOptions: async ({ niveau = null, faculte = null, departement = null, specialite = null } = {}) => {
  try {
    const [niveaux] = await pool.query('SELECT DISTINCT niveau FROM Section ORDER BY niveau');
    
    let facultesQuery = 'SELECT ID_faculte, nom_faculte FROM faculte';
    const facultesParams = [];
    if (niveau) {
      facultesQuery = `
        SELECT DISTINCT f.ID_faculte, f.nom_faculte 
        FROM faculte f
        JOIN Departement d ON f.ID_faculte = d.ID_faculte
        JOIN Specialite sp ON d.ID_departement = sp.ID_departement
        JOIN Section s ON sp.ID_specialite = s.ID_specialite
        WHERE s.niveau = ?
      `;
      facultesParams.push(niveau);
    }
    facultesQuery += ' ORDER BY nom_faculte';
    const [facultes] = await pool.query(facultesQuery, facultesParams);

    let departementsQuery = 'SELECT ID_departement, Nom_departement FROM Departement';
    const departementsParams = [];
    if (niveau) {
      departementsQuery = `
        SELECT DISTINCT d.ID_departement, d.Nom_departement 
        FROM Departement d
        JOIN Specialite sp ON d.ID_departement = sp.ID_departement
        JOIN Section s ON sp.ID_specialite = s.ID_specialite
        WHERE s.niveau = ?
      `;
      departementsParams.push(niveau);
      if (faculte) {
        departementsQuery += ' AND d.ID_faculte = ?';
        departementsParams.push(faculte);
      }
    } else if (faculte) {
      departementsQuery += ' WHERE ID_faculte = ?';
      departementsParams.push(faculte);
    }
    departementsQuery += ' ORDER BY Nom_departement';
    const [departements] = await pool.query(departementsQuery, departementsParams);

    let specialitesQuery = 'SELECT ID_specialite, nom_specialite FROM Specialite';
    const specialitesParams = [];
    if (niveau) {
      specialitesQuery = `
        SELECT DISTINCT sp.ID_specialite, sp.nom_specialite 
        FROM Specialite sp
        JOIN Section s ON sp.ID_specialite = s.ID_specialite
        WHERE s.niveau = ?
      `;
      specialitesParams.push(niveau);
      if (departement) {
        specialitesQuery += ' AND sp.ID_departement = ?';
        specialitesParams.push(departement);
      }
    } else if (departement) {
      specialitesQuery += ' WHERE ID_departement = ?';
      specialitesParams.push(departement);
    }
    specialitesQuery += ' ORDER BY nom_specialite';
    const [specialites] = await pool.query(specialitesQuery, specialitesParams);

    let sectionsQuery = 'SELECT ID_section, num_section FROM Section';
    const sectionsParams = [];
    if (niveau) {
      sectionsQuery += ' WHERE niveau = ?';
      sectionsParams.push(niveau);
      if (specialite) {
        sectionsQuery += ' AND ID_specialite = ?';
        sectionsParams.push(specialite);
      }
    } else if (specialite) {
      sectionsQuery += ' WHERE ID_specialite = ?';
      sectionsParams.push(specialite);
    }
    sectionsQuery += ' ORDER BY num_section';
    const [sections] = await pool.query(sectionsQuery, sectionsParams);

    return {
      niveaux: niveaux.map(n => n.niveau),
      facultes,
      departements,
      specialites,
      sections
    };
  } catch (err) {
    console.error('Error in getFilterOptions:', err.message);
    throw err;
  }
},

  updateSession: async (id, { ID_salle, Matricule, type_seance, ID_groupe, ID_module }) => {
    try {
      await pool.query(
        'UPDATE Seance SET ID_salle = ?, Matricule = ?, type_seance = ?, ID_groupe = ?, ID_module = ? WHERE ID_seance = ?',
        [ID_salle, Matricule, type_seance, ID_groupe, ID_module, id]
      );
      return { success: true, message: 'Séance mise à jour avec succès' };
    } catch (err) {
      throw err;
    }
  },

  // models/timetableModel.js (extrait)
createSession: async ({ ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section }) => {
  try {
    console.log('Creating session with data:', { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section });
    if (!ID_section) {
      throw new Error('ID_section est requis');
    }
    const [result] = await pool.query(
      'INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section]
    );
    console.log('Insert result:', result);
    return { success: true, ID_seance: result.insertId, message: 'Séance ajoutée avec succès' };
  } catch (err) {
    console.error('Error in createSession:', err.message);
    throw err;
  }
},

deleteSession: async (id) => {
  try {
    if (!id) {
      throw new Error('ID_seance est requis');
    }
    console.log('Executing DELETE for ID_seance:', id);
    const [result] = await pool.query('DELETE FROM Seance WHERE ID_seance = ?', [id]);
    console.log('DELETE result:', result);
    if (result.affectedRows === 0) {
      throw new Error('Aucune séance trouvée avec cet ID');
    }
    return { success: true, message: 'Séance supprimée avec succès' };
  } catch (err) {
    console.error('Error in deleteSession:', err.message);
    throw err;
  }
},

  getSessionOptions: async (sectionId) => {
    try {
      console.log('Fetching session options for sectionId:', sectionId);

      // Récupérer la spécialité associée à la section
      const [section] = await pool.query(
        'SELECT ID_specialite FROM Section WHERE ID_section = ?',
        [sectionId]
      );
      if (!section.length) {
        console.log('No section found for sectionId:', sectionId);
        return { salles: [], groupes: [], modules: [], enseignants: [] };
      }
      const specialiteId = section[0].ID_specialite;
      console.log('Specialite ID:', specialiteId);

      // Vérifier si specialiteId est valide
      if (!specialiteId) {
        console.log('specialiteId is null or undefined');
        return { salles: [], groupes: [], modules: [], enseignants: [] };
      }

      // Toutes les salles
      const [salles] = await pool.query('SELECT ID_salle FROM Salle');
      console.log('Salles:', salles);

      // Groupes de la section
      const [groupes] = await pool.query(
        'SELECT ID_groupe, num_groupe FROM Groupe WHERE ID_section = ?',
        [sectionId]
      );
      console.log('Groupes:', groupes);

      // Modules de la spécialité
      const [modules] = await pool.query(
        'SELECT ID_module, nom_module FROM Module WHERE ID_specialite = ?',
        [specialiteId]
      );
      console.log('Modules:', modules);
      if (!modules.length) {
        console.log('No modules found for specialiteId:', specialiteId);
      }

      // Enseignants associés à la spécialité
      const [enseignants] = await pool.query(`
        SELECT DISTINCT u.Matricule, u.nom, u.prenom 
        FROM User u
        JOIN Enseignant e ON u.Matricule = e.Matricule
        JOIN Seance s ON e.Matricule = s.Matricule
        JOIN Module m ON s.ID_module = m.ID_module
        WHERE m.ID_specialite = ? `,
        [specialiteId]
      );
      console.log('Enseignants:', enseignants);

      return {
        salles: salles || [],
        groupes: groupes || [],
        modules: modules || [],
        enseignants: enseignants || []
      };
    } catch (err) {
      console.error('Error in getSessionOptions:', err.message);
      return { salles: [], groupes: [], modules: [], enseignants: [] };
    }
  }
};

export default Timetable;