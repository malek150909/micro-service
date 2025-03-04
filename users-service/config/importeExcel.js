const mysql = require("mysql2/promise");
const xlsx = require("xlsx");
require("dotenv").config();

// 📌 Connexion à la base de données MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 📌 Fonction pour lire un fichier Excel
function readExcelFile(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}

// 📌 Fonction pour insérer les utilisateurs dans MySQL
async function insertUsers(filePath) {
    let role = null;
    if (filePath.includes("etudiants.xlsx")) role = "etudiant";
    else if (filePath.includes("enseignants.xlsx")) role = "enseignant";
    else if (filePath.includes("admins.xlsx")) role = "admin";
    
    if (!role) {
        console.error(`❌ Le fichier ${filePath} ne correspond à aucun rôle.`);
        return;
    }

    const users = readExcelFile(filePath);

    for (const user of users) {
        const { Palier, Matricule, Nom, Prenom, Etat, Email, Password } = user;

        try {
            // 📌 Insérer dans la table `user`
            await db.query(
                "INSERT INTO user (matricule, nom, prenom, email, password) VALUES (?, ?, ?, ?, ?)",
                [Matricule, Nom, Prenom, Email, Password]
            );

            // 📌 Insérer dans la table spécifique (etudiant, enseignant, admin)
            await db.query(
                `INSERT INTO ${role} (niveau,matricule,etat) VALUES (?,?,?)`,
                [Palier,Matricule,Etat]
            );

            console.log(`✅ Utilisateur ${Nom} ${Prenom} inséré dans 'user' et '${role}'.`);
        } catch (error) {
            console.error(`❌ Erreur pour ${Nom} ${Prenom}:`, error.message);
        }
    }
    console.log(`🚀 Importation terminée pour ${filePath} !`);
}

// 📌 Exécuter l'importation pour chaque fichier
async function importAll() {
    await insertUsers("excelFolders/etudiants.xlsx");
    await insertUsers("excelFolders/enseignants.xlsx");
    await insertUsers("excelFolders/admins.xlsx");
    console.log("✅ Tous les fichiers ont été importés !");
}

// 📌 Lancer l'importation
importAll();
