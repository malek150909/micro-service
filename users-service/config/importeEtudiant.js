const mysql = require("mysql2/promise");
const xlsx = require("xlsx");
require("dotenv").config();

// 📌 Connexion à MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 📌 Lire le fichier Excel
function readExcelFile(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}

// 📌 Supprimer les anciens étudiants et leurs comptes utilisateurs
async function clearEtudiants() {
    try {
        console.log("🗑 Suppression des anciens étudiants...");
        await db.query("DELETE FROM user WHERE matricule IN (SELECT matricule FROM etudiant)");
        await db.query("DELETE FROM etudiant");
        console.log("✅ Anciennes données des étudiants supprimées !");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des étudiants:", error.message);
    }
}

// 📌 Insérer les étudiants
async function insertEtudiants(filePath) {
    const etudiants = readExcelFile(filePath);
    await clearEtudiants(); // 🔴 Supprime les anciens étudiants avant d'insérer les nouveaux

    for (const etudiant of etudiants) {
        const { Matricule, Nom, Prenom, Email, Password, Niveau, Etat } = etudiant;

        try {
            await db.query(
                "INSERT INTO user (matricule, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?)",
                [Matricule, Nom, Prenom, Email, Password]
            );

            await db.query(
                "INSERT INTO etudiant (matricule, niveau, etat) VALUES (?, ?, ?)",
                [Matricule, Niveau, Etat]
            );

            console.log(`✅ Étudiant ${Nom} ${Prenom} ajouté.`);
        } catch (error) {
            console.error(`❌ Erreur pour ${Nom} ${Prenom}:`, error.message);
        }
    }
    console.log("🚀 Importation des étudiants terminée !");
}

// 📌 Exécuter l'importation
insertEtudiants("excelFolders/etudiants.xlsx");
