import pool from '../config/db.js';

const Module = {
  async getModules(filters) {
    const { faculte, departement, niveau, specialite, section, semestre } = filters;
    let sql;
    const params = [];

    if (section) {
      sql = `
        SELECT DISTINCT m.*, ms.semestre , sec.nom_section
        FROM Module m
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section sec ON ms.ID_section = sec.ID_section
        LEFT JOIN Specialite s ON m.ID_specialite = s.ID_specialite
        LEFT JOIN Departement d ON s.ID_departement = d.ID_departement
        LEFT JOIN Faculte f ON d.ID_faculte = f.ID_faculte
        WHERE ms.ID_section = ?
      `;
      params.push(section);

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
        if (niveau === 'L1') {
          sql += ' AND ms.semestre IN (1, 2)';
        } else if (niveau === 'L2') {
          sql += ' AND ms.semestre IN (3, 4)';
        } else if (niveau === 'L3') {
          sql += ' AND ms.semestre IN (5, 6)';
        }
      }
      if (specialite) {
        sql += ' AND s.ID_specialite = ?';
        params.push(specialite);
      }
      if (semestre) {
        sql += ' AND ms.semestre = ?';
        params.push(semestre);
      }
    } else {
      sql = `SELECT * FROM Module WHERE 1=0`;
    }

    console.log('SQL Query:', sql); // Vérifiez la requête générée
    console.log('Params:', params); // Vérifiez les paramètres
    const [rows] = await pool.query(sql, params);
    console.log('Results:', rows); // Vérifiez les résultats
    return rows;
  },

  async addModule(moduleData) {
    const { nom_module, description_module, credit, coefficient, ID_specialite, section, semestre } = moduleData;
    
    if (!nom_module.trim() || credit === '' || coefficient === '' || 
        ID_specialite === '' || ID_specialite == null || !semestre || !section) {
      throw new Error('Missing required fields');
    }
    
    if (!['1', '2'].includes(semestre.toString())) {
      throw new Error('Semestre must be 1 or 2');
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

      const [moduleResult] = await connection.query(
        `INSERT INTO Module (nom_module, description_module, credit, coefficient, ID_specialite)
         VALUES (?, ?, ?, ?, ?)`,
        [nom_module, description_module || null, creditNum, coefficientNum, specialiteNum]
      );

      const moduleId = moduleResult.insertId;

      await connection.query(
        `INSERT INTO Module_Section (ID_module, ID_section, semestre)
         VALUES (?, ?, ?)`,
        [moduleId, section, semestre]
      );

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
    const { nom_module, description_module, credit, coefficient } = moduleData;

    if (!nom_module.trim() || credit === '' || coefficient === '') {
      throw new Error('Missing required fields');
    }

    const creditNum = parseFloat(credit);
    const coefficientNum = parseFloat(coefficient);
    if (isNaN(creditNum) || isNaN(coefficientNum)) {
      throw new Error('Invalid number format');
    }

    const [result] = await pool.query(
      `UPDATE Module SET nom_module = ?, description_module = ?, credit = ?, coefficient = ? WHERE ID_module = ?`,
      [nom_module, description_module || null, creditNum, coefficientNum, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Module not found');
    }
    return result;
  },

  async deleteModule(id) {
    await pool.query(`DELETE FROM Module_Section WHERE ID_module = ?`, [id]);
    const [result] = await pool.query(`DELETE FROM Module WHERE ID_module = ?`, [id]);

    if (result.affectedRows === 0) {
      throw new Error('Module not found');
    }
    return result;
  },

  async getFacultes() {
    const [rows] = await pool.query(`SELECT ID_faculte, nom_faculte FROM Faculte`);
    return rows;
  },

  async getDepartements(filters) {
    let sql = `SELECT ID_departement, Nom_departement FROM Departement`;
    const params = [];
    if (filters && filters.faculte) {
      sql += ' WHERE ID_faculte = ?';
      params.push(filters.faculte);
    }
    const [rows] = await pool.query(sql, params);
    return rows;
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
    let sql = `SELECT ID_section , nom_section FROM Section`;
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

  async getSemestres() {
    const [rows] = await pool.query(`SELECT '1' AS semestre UNION SELECT '2'`);
    return rows;
  }
};

export default Module; // ✅ Utilisation d'export ES6
