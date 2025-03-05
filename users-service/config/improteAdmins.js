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

// 📌 Supprimer les anciens admins et leurs comptes utilisateurs
async function clearAdmins() {
    try {
        console.log("🗑 Suppression des anciens admins...");
        await db.query("DELETE FROM user WHERE matricule IN (SELECT matricule FROM admin)");
        await db.query("DELETE FROM admin");
        console.log("✅ Anciennes données des admins supprimées !");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des admins:", error.message);
    }
}

// 📌 Insérer les admins
async function insertAdmins(filePath) {
    const admins = readExcelFile(filePath);
    await clearAdmins(); // 🔴 Supprime les anciens admins avant d'insérer les nouveaux

    for (const admin of admins) {
        const { Matricule, Nom, Prenom, Email, Password, Poste } = admin;

        try {
            await db.query(
                "INSERT INTO user (matricule, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?)",
                [Matricule, Nom, Prenom, Email, Password]
            );

            await db.query(
                "INSERT INTO admin (matricule, poste) VALUES (?, ?)",
                [Matricule, Poste]
            );

            console.log(`✅ Admin ${Nom} ${Prenom} ajouté.`);
        } catch (error) {
            console.error(`❌ Erreur pour ${Nom} ${Prenom}:`, error.message);
        }
    }
    console.log("🚀 Importation des admins terminée !");
}

// 📌 Exécuter l'importation
insertAdmins("excelFolders/admins.xlsx");
