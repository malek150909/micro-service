const db = require("../config/db")

const User = {
  findByMatricule: async (matricule) => {
    const [rows] = await db.query("SELECT Matricule, nom, prenom, email FROM User WHERE Matricule = ?", [matricule])
    return rows
  },

  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT Matricule, nom, prenom, email FROM User WHERE email = ?", [email])
    return rows
  },
}

module.exports = User
