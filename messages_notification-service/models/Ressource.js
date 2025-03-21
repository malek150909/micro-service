// models/Ressource.js
const db = require('../config/db');

class Ressource {
    static async findByProfessor(matricule) {
        const [rows] = await db.execute(`
            SELECT r.*, m.nom_module, s.niveau, sp.nom_specialite
            FROM Ressource r
            JOIN Module m ON r.ID_module = m.ID_module
            JOIN Section s ON r.ID_section = s.ID_section
            JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
            WHERE r.Matricule = ?
        `, [matricule]);
        return rows;
    }

    static async updateById(id, updates) {
        // Ensure all fields are present in updates, and convert undefined to null
        const fields = {
            ID_module: updates.ID_module || null,
            ID_section: updates.ID_section || null,
            nom_ressource: updates.nom_ressource || null,
            type_ressource: updates.type_ressource || null,
            description: updates.description || null,
            fichier_url: updates.fichier_url // fichier_url should always be defined now
        };

        const query = `
            UPDATE Ressource
            SET ID_module = ?, ID_section = ?, nom_ressource = ?, type_ressource = ?, description = ?, fichier_url = ?
            WHERE ID_ressource = ?
        `;
        const values = [
            fields.ID_module,
            fields.ID_section,
            fields.nom_ressource,
            fields.type_ressource,
            fields.description,
            fields.fichier_url,
            id
        ];

        const [result] = await db.execute(query, values);
        return result.affectedRows > 0;
    }

    static async deleteById(id) {
        const [result] = await db.execute('DELETE FROM Ressource WHERE ID_ressource = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Ressource;