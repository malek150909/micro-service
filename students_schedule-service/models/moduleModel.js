import pool from '../config/db.js';

const Module = {
  async getModules(filters) {
    const { faculte, departement, niveau, specialite, section } = filters;
    let sql;
    const params = [];

    let semesters;
    if (niveau === 'L1') {
      semesters = ['1', '2'];
    } else if (niveau === 'L2') {
      semesters = ['3', '4'];
    } else if (niveau === 'L3') {
      semesters = ['5', '6'];
    } else {
      semesters = ['1', '2', '3', '4', "5", "6"];
    }

    if (section) {
      sql = `
        SELECT m.*, ms.semestre, sec.nom_section
        FROM Module m
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section sec ON ms.ID_section = sec.ID_section
        LEFT JOIN Specialite s ON m.ID_specialite = s.ID_specialite
        LEFT JOIN Departement d ON s.ID_departement = d.ID_departement
        LEFT JOIN Faculte f ON d.ID_faculte = f.ID_faculte
        WHERE ms.ID_section = ? 
        AND ms.semestre IN (${semesters.map(() => '?').join(',')})
      `;
      params.push(section, ...semesters);

      if (faculte) {
        sql += ' AND f.ID_faculte = ?';
        params.push(faculte);
      }
      if (departement) {
        sql += ' AND d.ID_departement = ?';
        params.push(departement);
      }
      if (niveau) {
        sql += ' AND sec.niveau = ?';
        params.push(niveau);
      }
      if (specialite) {
        sql += ' AND s.ID_specialite = ?';
        params.push(specialite);
      }
    } else {
      sql = `SELECT * FROM Module WHERE 1=0`;
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async addModule(moduleData) {
    const { nom_module, description_module, credit, coefficient, ID_specialite, sections, semestre, seances } = moduleData;

    if (!nom_module.trim() || credit === '' || coefficient === '' || 
        ID_specialite === '' || ID_specialite == null || !semestre || !sections || !seances || !Array.isArray(sections) || sections.length === 0) {
      throw new Error('Missing or invalid required fields');
    }

    if (!['1', '2', '3', '4', '5', '6'].includes(semestre.toString())) {
      throw new Error('Semestre must be between 1 and 6');
    }

    if (!['Cour', 'Cour/TD', 'Cour/TP', 'Cour/TD/TP', 'En Ligne'].includes(seances)) {
      throw new Error('Séances must be one of "Cours", "Cour/TD", "Cour/TP", "Cour/TD/TP", or "En Ligne"');
    }

    const creditNum = parseFloat(credit);
    const coefficientNum = parseFloat(coefficient);
    const specialiteNum = parseInt(ID_specialite);
    if (isNaN(creditNum) || isNaN(coefficientNum) || isNaN(specialiteNum)) {
      throw new Error('Invalid number format');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const sectionId of sections) {
        const [existing] = await connection.query(
          `SELECT 1 FROM Module m
           JOIN Module_Section ms ON m.ID_module = ms.ID_module
           WHERE m.nom_module = ? AND ms.ID_section = ?`,
          [nom_module, sectionId]
        );
        if (existing.length > 0) {
          throw new Error(`Un module avec le nom "${nom_module}" existe déjà dans la section ${sectionId}.`);
        }
      }

      const [moduleResult] = await connection.query(
        `INSERT INTO Module (nom_module, description_module, credit, coefficient, ID_specialite, seances)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nom_module, description_module || null, creditNum, coefficientNum, specialiteNum, seances]
      );

      const moduleId = moduleResult.insertId;

      for (const sectionId of sections) {
        await connection.query(
          `INSERT INTO Module_Section (ID_module, ID_section, semestre)
           VALUES (?, ?, ?)`,
          [moduleId, sectionId, semestre]
        );
      }

      await connection.commit();
      return { moduleId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateModule(id, moduleData) {
    const { nom_module, description_module, credit, coefficient, seances } = moduleData;

    if (!nom_module.trim() || credit === '' || coefficient === '' || !seances) {
      throw new Error('Missing required fields');
    }

    if (!['Cour', 'Cour/TD', 'Cour/TP', 'Cour/TD/TP', 'En Ligne'].includes(seances)) {
      throw new Error('Séances must be one of "Cours", "Cour/TD", "Cour/TP", "Cour/TD/TP", or "En Ligne"');
    }

    const creditNum = parseFloat(credit);
    const coefficientNum = parseFloat(coefficient);
    if (isNaN(creditNum) || isNaN(coefficientNum)) {
      throw new Error('Invalid number format');
    }

    const sql = `
      UPDATE Module 
      SET nom_module = ?, description_module = ?, credit = ?, coefficient = ?, seances = ?
      WHERE ID_module = ?
    `;
    const params = [nom_module, description_module || null, creditNum, coefficientNum, seances, id];

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      throw new Error('Module not found');
    }
  },

  async deleteModule(id, sectionId) {
    const [deleteResult] = await pool.query(
      `DELETE FROM Module_Section WHERE ID_module = ? AND ID_section = ?`,
      [id, sectionId]
    );

    if (deleteResult.affectedRows === 0) {
      throw new Error('Module not found in the specified section');
    }

    const [remainingSections] = await pool.query(
      `SELECT COUNT(*) as count FROM Module_Section WHERE ID_module = ?`,
      [id]
    );

    if (remainingSections[0].count === 0) {
      const [moduleDeleteResult] = await pool.query(
        `DELETE FROM Module WHERE ID_module = ?`,
        [id]
      );

      if (moduleDeleteResult.affectedRows === 0) {
        throw new Error('Module not found');
      }
    }

    return deleteResult;
  },

  async getFacultes() {
    try {
      const [rows] = await pool.query(`SELECT ID_faculte, nom_faculte FROM Faculte`);
      return rows;
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw new Error(`Failed to fetch faculties: ${error.message}`);
    }
  },

  async getDepartements(filters) {
    try {
      let sql = `SELECT ID_departement, Nom_departement FROM Departement`;
      const params = [];
      if (filters && filters.faculte) {
        sql += ' WHERE ID_faculte = ?';
        params.push(filters.faculte);
      }
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Error fetching departments:', {
        message: error.message,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        errno: error.errno,
        query: error.sql,
      });
      throw new Error(`Failed to fetch departments: ${error.message}`);
    }
  },

  async getNiveaux(filters) {
    let sql = `
      SELECT DISTINCT s.niveau 
      FROM Section s
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
    `;
    const params = [];
    if (filters && filters.departement) {
      sql += ' WHERE d.ID_departement = ?';
      params.push(filters.departement);
    }
    const [rows] = await pool.query(sql, params);
    return rows.map(result => ({ id: result.niveau, name: result.niveau }));
  },

  async getSpecialites(filters) {
    let sql = `
      SELECT DISTINCT sp.ID_specialite, sp.nom_specialite
      FROM Specialite sp
      JOIN Section s ON sp.ID_specialite = s.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
    `;
    const params = [];
    if (filters && filters.departement && filters.niveau) {
      sql += ' WHERE d.ID_departement = ? AND s.niveau = ?';
      params.push(filters.departement, filters.niveau);
    } else if (filters && filters.departement) {
      sql += ' WHERE d.ID_departement = ?';
      params.push(filters.departement);
    }
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getSections(filters) {
    let sql = `SELECT ID_section, nom_section FROM Section`;
    const params = [];
    if (filters) {
      const conditions = [];
      if (filters.specialite) {
        conditions.push('ID_specialite = ?');
        params.push(filters.specialite);
      }
      if (filters.niveau) {
        conditions.push('niveau = ?');
        params.push(filters.niveau);
      }
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getSemestres(filters) {
    let semesters;
    if (filters && filters.niveau) {
      if (filters.niveau === 'L1') {
        semesters = ['1', '2'];
      } else if (filters.niveau === 'L2') {
        semesters = ['3', '4'];
      } else if (filters.niveau === 'L3') {
        semesters = ['5', '6'];
      } else {
        semesters = ['1', '2', '3', '4', '5', '6'];
      }
    } else {
      semesters = ['1', '2', '3', '4', '5', '6'];
    }
    const query = semesters.map(semestre => `SELECT '${semestre}' AS semestre`).join(' UNION ');
    const [rows] = await pool.query(query);
    return rows;
  }
};

export default Module;
