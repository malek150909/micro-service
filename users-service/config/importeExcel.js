require('dotenv').config(); // Charger les variables d'environnement
const db = require('./db'); // Utiliser ta connexion MySQL
const xlsx = require('xlsx'); // Lire le fichier Excel
const fs = require('fs');

const filePath = 'etudiants.xlsx'; // Ton fichier Excel

// 📌 Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
    console.error("❌ Le fichier Excel n'existe pas !");
    process.exit(1);
}

// 📌 Fonction pour nettoyer le rôle et éviter les erreurs MySQL
const cleanRole = (role) => {
    if (!role) return "Etudiant"; // Valeur par défaut si vide
    return role.trim(); // Supprimer les espaces avant/après
};

// 📌 Lire le fichier Excel
function readExcelFile(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Prendre la première feuille
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet); // Convertir en JSON
}

// 📌 Insérer les étudiants dans MySQL
async function insertEtudiants() {
    const etudiants = readExcelFile(filePath);

    for (const etudiant of etudiants) {
        const { Matricule, Nom, Prenom, Password, Role, Email } = etudiant;
        try {
            await db.query(
                "INSERT INTO users (matricule, nom, prenom, role, password, email) VALUES (?, ?, ?, ?, ?,?)",
                [Matricule, Nom, Prenom, Role, Password, Email]
            );

            console.log(`✅ Étudiant ${Nom} ${Prenom} inséré avec succès.`);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.error(`⚠️ Matricule ${Matricule} déjà existant, utilisateur ignoré.`);
            } else {
                console.error(`❌ Erreur lors de l'insertion de ${Nom} ${Prenom} :`, error.message);
            }
        }
    }

    console.log("🚀 Importation terminée !");
}

// 📌 Exécuter l'importation
insertEtudiants();
