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

// 📌 Supprimer les anciens enseignants et leurs comptes utilisateurs
async function clearEnseignants() {
    try {
        console.log("🗑 Suppression des anciens enseignants...");
        await db.query("DELETE FROM user WHERE matricule IN (SELECT matricule FROM enseignant)");
        await db.query("DELETE FROM enseignant");
        console.log("✅ Anciennes données des enseignants supprimées !");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des enseignants:", error.message);
    }
}

// 📌 Insérer les enseignants
async function insertEnseignants(filePath) {
    const enseignants = readExcelFile(filePath);
    await clearEnseignants(); // 🔴 Supprime les anciens enseignants avant d'insérer les nouveaux

    for (const enseignant of enseignants) {
        const { Matricule, Nom, Prenom, Email, Password } = enseignant;

        try {
            await db.query(
                "INSERT INTO user (matricule, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?)",
                [Matricule, Nom, Prenom, Email, Password]
            );

            await db.query(
                "INSERT INTO enseignant (matricule) VALUES (?)",
                [Matricule]
            );

            console.log(`✅ Enseignant ${Nom} ${Prenom} ajouté.`);
        } catch (error) {
            console.error(`❌ Erreur pour ${Nom} ${Prenom}:`, error.message);
        }
    }
    console.log("🚀 Importation des enseignants terminée !");
}

// 📌 Exécuter l'importation
insertEnseignants("excelFolders/enseignants.xlsx");
