CREATE TABLE User (
    Matricule BIGINT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(70) UNIQUE,
    motdepasse VARCHAR(255) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Admin Table
CREATE TABLE admin (
    Matricule BIGINT PRIMARY KEY,
    poste VARCHAR(50) NOT NULL,
    FOREIGN KEY (Matricule) REFERENCES User(Matricule) ON DELETE CASCADE
);

-- Create Faculte Table
CREATE TABLE faculte (
    ID_faculte INT PRIMARY KEY AUTO_INCREMENT,
    nom_faculte VARCHAR(100) NOT NULL
);

-- Create Departement Table
CREATE TABLE Departement (
    ID_departement INT PRIMARY KEY AUTO_INCREMENT,
    ID_faculte INT,
    Nom_departement VARCHAR(100) NOT NULL,
    FOREIGN KEY (ID_faculte) REFERENCES faculte(ID_faculte) ON DELETE CASCADE 
);

-- Create Specialite Table
CREATE TABLE Specialite (
    ID_specialite INT PRIMARY KEY AUTO_INCREMENT,
    nom_specialite VARCHAR(100) NOT NULL,
    ID_departement INT,
    ID_faculte INT,
    FOREIGN KEY (ID_departement) REFERENCES Departement(ID_departement) ON DELETE CASCADE,
    FOREIGN KEY (ID_faculte) REFERENCES faculte(ID_faculte) ON DELETE CASCADE
);

-- Create Etudiant Table
CREATE TABLE Etudiant (
    Matricule BIGINT PRIMARY KEY,
    ID_specialite INT NOT NULL,
    annee_inscription DATE NOT NULL,
    etat ENUM('Ajourne', 'Admis', 'Admis avec dettes', 'Reintegrer') NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    ID_groupe INT,
    FOREIGN KEY (Matricule) REFERENCES User(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (ID_specialite) REFERENCES Specialite(ID_specialite) ON DELETE CASCADE,
    FOREIGN KEY (ID_groupe) REFERENCES Groupe(ID_groupe) ON DELETE SET NULL
);

-- Create Enseignant Table with Faculty and Department
CREATE TABLE Enseignant (
    Matricule BIGINT PRIMARY KEY,
    annee_inscription DATE NOT NULL,
    ID_faculte INT,
    ID_departement INT,
    FOREIGN KEY (Matricule) REFERENCES User(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (ID_faculte) REFERENCES faculte(ID_faculte) ON DELETE SET NULL,
    FOREIGN KEY (ID_departement) REFERENCES Departement(ID_departement) ON DELETE SET NULL
);

-- Create Section Table
CREATE TABLE section (
  ID_section int NOT NULL AUTO_INCREMENT,
  niveau varchar(50) NOT NULL,
  ID_specialite int DEFAULT NULL,
  nom_section varchar(50) NOT NULL,
  num_etudiant int DEFAULT '0',
  PRIMARY KEY (ID_sectio),
  KEY ID_specialite (ID_specialite),
  CONSTRAINT section_ibfk_2 FOREIGN KEY (ID_specialite) REFERENCES specialite (ID_specialite) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci |

--initialiser les valeurs basées sur la table etudiant_section
UPDATE section s
LEFT JOIN (
    SELECT ID_section, COUNT(*) as count_students
    FROM etudiant_section
    GROUP BY ID_section
) es ON s.ID_section = es.ID_section
SET s.num_etudiant = COALESCE(es.count_students, 0);

--maintenir cette colonne à jour
DELIMITER //
CREATE TRIGGER update_num_etudiant_insert
AFTER INSERT ON etudiant_section
FOR EACH ROW
BEGIN
    UPDATE section
    SET num_etudiant = num_etudiant + 1
    WHERE ID_section = NEW.ID_section;
END;//

CREATE TRIGGER update_num_etudiant_delete
AFTER DELETE ON etudiant_section
FOR EACH ROW
BEGIN
    UPDATE section
    SET num_etudiant = num_etudiant - 1
    WHERE ID_section = OLD.ID_section;
END;//

DELIMITER ;

-- Create Module Table
CREATE TABLE Module (
    ID_module INT PRIMARY KEY AUTO_INCREMENT,
    nom_module VARCHAR(100) NOT NULL,
    description_module TEXT,
    credit INT NOT NULL,
    coefficient INT NOT NULL,
    ID_specialite INT,
    FOREIGN KEY (ID_specialite) REFERENCES Specialite(ID_specialite) ON DELETE CASCADE ,
    seances ENUM('Cour','Cour/TD','Cour/TP','Cour/TD/TP','En ligne') NOT NULL 
);

-- Create Module_Enseignant Table to Link Professors to Modules
CREATE TABLE Module_Enseignant (
    ID_module INT,
    Matricule BIGINT,
    PRIMARY KEY (ID_module, Matricule),
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE,
    FOREIGN KEY (Matricule) REFERENCES Enseignant(Matricule) ON DELETE CASCADE
);

-- Create Enseignant_Section Table to Link Professors to Sections
CREATE TABLE Enseignant_Section (
    Matricule BIGINT,
    ID_section INT,
    PRIMARY KEY (Matricule, ID_section),
    FOREIGN KEY (Matricule) REFERENCES Enseignant(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Etudiant_Section Table
CREATE TABLE Etudiant_Section (
    Matricule BIGINT,
    ID_section INT,
    PRIMARY KEY (Matricule, ID_section),
    FOREIGN KEY (Matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Groupe Table
CREATE TABLE Groupe (
    ID_groupe INT PRIMARY KEY AUTO_INCREMENT,
    num_groupe INT NOT NULL,
    ID_section INT,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Salle Table
CREATE TABLE Salle (
    ID_salle INT PRIMARY KEY,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    capacite INT NOT NULL,
    type_salle ENUM('Cour','TD','TP','TP/TD') ,
    nom_salle VARCHAR(10) NOT NULL
);

-- Create Salle_Section Table
CREATE TABLE Salle_Section (
    ID_salle INT,
    ID_section INT,
    PRIMARY KEY (ID_salle, ID_section),
    FOREIGN KEY (ID_salle) REFERENCES Salle(ID_salle) ON DELETE CASCADE,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Module_Etudiant Table
CREATE TABLE Module_Etudiant (
    ID_module INT,
    Matricule BIGINT,
    Moyenne FLOAT NOT NULL,
    PRIMARY KEY (ID_module, Matricule),
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE,
    FOREIGN KEY (Matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE,
    semestre TEXT ,
    Moyenne float NOT NULL 
);

-- Create Module_Section Table
CREATE TABLE Module_Section (
    ID_module INT,
    ID_section INT,
    semestre ENUM('1', '2','3','4','5','6') NOT NULL,
    PRIMARY KEY (ID_module, ID_section, semestre),
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Semestre Table
CREATE TABLE Semestre (
    ID_semestre INT PRIMARY KEY AUTO_INCREMENT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL
);

-- Create semestre_etudiant Table
CREATE TABLE semestre_etudiant (
    ID_semestre INT,
    Matricule BIGINT,
    Moyenne FLOAT NOT NULL,
    PRIMARY KEY (ID_semestre, Matricule),
    FOREIGN KEY (ID_semestre) REFERENCES Semestre(ID_semestre) ON DELETE CASCADE,
    FOREIGN KEY (Matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE
);

-- Create Seance Table
CREATE TABLE Seance (
    ID_seance INT PRIMARY KEY AUTO_INCREMENT,
    ID_salle INT,
    Matricule BIGINT,
    type_seance ENUM('cours', 'TD', 'TP') NOT NULL,
    ID_groupe INT,
    ID_module INT,
    jour ENUM('Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi') NOT NULL,
    time_slot ENUM('08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50') NOT NULL,
    ID_section INT ,
    FOREIGN KEY (ID_section) REFERENCES section(ID_section) ON DELETE CASCADE,
    FOREIGN KEY (Matricule) REFERENCES Enseignant(Matricule) ON DELETE SET NULL,
    FOREIGN KEY (ID_salle) REFERENCES Salle(ID_salle) ON DELETE SET NULL,
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE,
    FOREIGN KEY (ID_groupe) REFERENCES Groupe(ID_groupe) ON DELETE CASCADE
    
);

-- Create Message Table
CREATE TABLE Message (
    ID_message INT PRIMARY KEY AUTO_INCREMENT,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenu TEXT NOT NULL,
    expediteur BIGINT,
    destinataire BIGINT,
    isRead tinyint(1) DEFAULT 0;
    FOREIGN KEY (expediteur) REFERENCES User(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (destinataire) REFERENCES User(Matricule) ON DELETE CASCADE
);

-- Create Notification Table
CREATE TABLE Notification (
    ID_notification INT PRIMARY KEY AUTO_INCREMENT,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenu TEXT NOT NULL,
    expediteur BIGINT,
    destinataire BIGINT,
    FOREIGN KEY (expediteur) REFERENCES User(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (destinataire) REFERENCES User(Matricule) ON DELETE CASCADE
);

-- Create Evenement Table
CREATE TABLE Evenement (
    ID_evenement INT PRIMARY KEY AUTO_INCREMENT,
    nom_evenement VARCHAR(100) NOT NULL,
    description_evenement TEXT,
    date_evenement DATE NOT NULL,
    lieu VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    image_url VARCHAR(255),
    organisateur_admin BIGINT,
    FOREIGN KEY (organisateur_admin) REFERENCES admin(Matricule) ON DELETE CASCADE
);

-- Create Participant Table
CREATE TABLE Participant (
    ID_evenement INT,
    Matricule BIGINT,
    PRIMARY KEY (ID_evenement, Matricule),
    FOREIGN KEY (ID_evenement) REFERENCES Evenement(ID_evenement) ON DELETE CASCADE,
    FOREIGN KEY (Matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE
);

-- Create Club Table
CREATE TABLE Club (
    ID_club INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description_club TEXT,
    image_url VARCHAR(255),
    gerant_matricule bigint
);

-- Create Membre Table
CREATE TABLE Membre (
    id_club INT NOT NULL,
    matricule BIGINT NOT NULL,
    role ENUM('Gerant', 'MembreOrdinaire') NOT NULL,
    date_adhesion DATE DEFAULT (CURRENT_DATE),
    date_recrutement DATE NULL,
    PRIMARY KEY (id_club, matricule),
    FOREIGN KEY (id_club) REFERENCES Club(ID_club) ON DELETE CASCADE,
    FOREIGN KEY (matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE,
    CHECK (role = 'Gerant' OR date_recrutement IS NULL)
);

-- Create Exam Table
CREATE TABLE Exam (
    ID_exam INT PRIMARY KEY AUTO_INCREMENT,
    ID_module INT NOT NULL,
    ID_section INT NOT NULL,
    exam_date DATE NOT NULL,
    time_slot ENUM('08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', 
                   '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50') NOT NULL,
    ID_salle INT NOT NULL,
    ID_semestre INT NOT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module),
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section),
    FOREIGN KEY (ID_salle) REFERENCES Salle(ID_salle),
    FOREIGN KEY (ID_semestre) REFERENCES Semestre(ID_semestre)
);

CREATE TABLE annonce (
  id int NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  image_url varchar(255) DEFAULT '',
  event_id int DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  target_type enum('Etudiants','Enseignants') DEFAULT NULL,
  target_filter json DEFAULT NULL,
  enseignant_matricule bigint DEFAULT NULL,
  admin_matricule bigint DEFAULT NULL,
  PRIMARY KEY (id),
  KEY event_id (event_id),
  KEY admin_matricule (admin_matricule),
  KEY enseignant_matricule (enseignant_matricule),
  CONSTRAINT annonce_ibfk_1 FOREIGN KEY (event_id) REFERENCES evenement (ID_evenement) ON DELETE CASCADE,
  CONSTRAINT annonce_ibfk_3 FOREIGN KEY (admin_matricule) REFERENCES admin (Matricule) ON DELETE CASCADE,
  CONSTRAINT annonce_ibfk_4 FOREIGN KEY (enseignant_matricule) REFERENCES enseignant (Matricule) ON DELETE CASCADE
);

CREATE TABLE clubevenement (
  ID_club_evenement int NOT NULL AUTO_INCREMENT,
  nom_evenement varchar(255) NOT NULL,
  description_evenement text,
  date_evenement datetime NOT NULL,
  lieu varchar(255) NOT NULL,
  capacite int NOT NULL,
  image_url varchar(255) DEFAULT NULL,
  organisateur_admin bigint DEFAULT NULL,
  ID_club int NOT NULL,
  PRIMARY KEY (ID_club_evenement),
  KEY organisateur_admin (organisateur_admin),
  KEY ID_club (ID_club),
  CONSTRAINT clubevenement_ibfk_1 FOREIGN KEY (organisateur_admin) REFERENCES user (Matricule) ON DELETE CASCADE,
  CONSTRAINT clubevenement_ibfk_2 FOREIGN KEY (ID_club) REFERENCES club (ID_club) ON DELETE CASCADE
);

CREATE TABLE DemandeCreationClub (
    ID_demande INT AUTO_INCREMENT PRIMARY KEY,
    matricule_etudiant BIGINT NOT NULL,
    nom_club VARCHAR(255) NOT NULL,
    description_club TEXT,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    etat ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
  FOREIGN KEY (matricule_etudiant) REFERENCES User(Matricule)
);

CREATE TABLE MembreClub (
    ID_membre INT AUTO_INCREMENT PRIMARY KEY,
    matricule_etudiant BIGINT NOT NULL,
    ID_club INT NOT NULL,
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (matricule_etudiant) REFERENCES User(Matricule),
    FOREIGN KEY (ID_club) REFERENCES Club(ID_club),
    UNIQUE (matricule_etudiant, ID_club) -- Un étudiant ne peut être membre qu'une fois par club
);

CREATE TABLE Publication (
    ID_publication INT AUTO_INCREMENT PRIMARY KEY,
    ID_club INT NOT NULL,
    contenu TEXT NOT NULL,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_club) REFERENCES Club(ID_club)
);

CREATE TABLE PublicationImages (
    ID_image INT AUTO_INCREMENT PRIMARY KEY,
    ID_publication INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (ID_publication) REFERENCES Publication(ID_publication) ON DELETE CASCADE
);

CREATE TABLE Reaction (
    ID_reaction INT AUTO_INCREMENT PRIMARY KEY,
    ID_publication INT NOT NULL,
    matricule_etudiant BIGINT NOT NULL,
    type_reaction ENUM('like') DEFAULT 'like',
    date_reaction DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_publication) REFERENCES Publication(ID_publication),
    FOREIGN KEY (matricule_etudiant) REFERENCES User(Matricule),
    UNIQUE (ID_publication, matricule_etudiant) -- Un étudiant ne peut réagir qu'une fois par publication
);

CREATE TABLE Commentaire (
    ID_commentaire INT AUTO_INCREMENT PRIMARY KEY,
    ID_publication INT NOT NULL,
    matricule_etudiant BIGINT NOT NULL,
    contenu TEXT NOT NULL,
    date_commentaire DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_publication) REFERENCES Publication(ID_publication),
    FOREIGN KEY (matricule_etudiant) REFERENCES User(Matricule)
);

CREATE TABLE commentaire_annonce (
  ID_commentaire int NOT NULL AUTO_INCREMENT,
  ID_annonce int NOT NULL,
  matricule_etudiant bigint NOT NULL,
  contenu text NOT NULL,
  date_commentaire datetime DEFAULT CURRENT_TIMESTAMP,
  reponse_enseignant text,
  date_reponse datetime DEFAULT NULL,
  PRIMARY KEY (ID_commentaire),
  KEY ID_annonce (ID_annonce),
  KEY matricule_etudiant (matricule_etudiant),
  CONSTRAINT commentaire_annonce_ibfk_1 FOREIGN KEY (ID_annonce) REFERENCES annonce (id),
  CONSTRAINT commentaire_annonce_ibfk_2 FOREIGN KEY (matricule_etudiant) REFERENCES etudiant (Matricule)
)

CREATE TABLE DemandeRejoindreClub (
    ID_demande INT AUTO_INCREMENT PRIMARY KEY,
    matricule_etudiant BIGINT NOT NULL,
    ID_club INT NOT NULL,
    date_demande DATETIME DEFAULT CURRENT_TIMESTAMP,
    etat ENUM('en_attente', 'acceptee', 'refusee') DEFAULT 'en_attente',
    FOREIGN KEY (matricule_etudiant) REFERENCES User(Matricule),
    FOREIGN KEY (ID_club) REFERENCES Club(ID_club),
    UNIQUE (matricule_etudiant, ID_club) -- Une seule demande par étudiant et par club
);

CREATE TABLE `documents` (
  `ID_document` int NOT NULL AUTO_INCREMENT,
  `ID_faculte` int NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `fichier_url` varchar(255) NOT NULL,
  `date_upload` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_document`),
  KEY `ID_faculte` (`ID_faculte`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`ID_faculte`) REFERENCES `faculte` (`ID_faculte`) ON DELETE CASCADE
);

CREATE TABLE `reclamation` (
  `ID_reclamation` int NOT NULL AUTO_INCREMENT,
  `ID_module` int NOT NULL,
  `Matricule_etudiant` bigint NOT NULL,
  `Semestre` enum('S1','S2') NOT NULL,
  `reclamation_text` text NOT NULL,
  `date_reclamation` datetime DEFAULT CURRENT_TIMESTAMP,
  `prof_response` text,
  `date_response` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_reclamation`),
  KEY `ID_module` (`ID_module`),
  KEY `Matricule_etudiant` (`Matricule_etudiant`),
  CONSTRAINT `reclamation_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`),
  CONSTRAINT `reclamation_ibfk_2` FOREIGN KEY (`Matricule_etudiant`) REFERENCES `etudiant` (`Matricule`)
);

CREATE TABLE `reponse_sondage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sondage_id` int NOT NULL,
  `matricule_etudiant` bigint NOT NULL,
  `reponse` varchar(255) NOT NULL,
  `repondu_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sondage_id` (`sondage_id`,`matricule_etudiant`),
  KEY `matricule_etudiant` (`matricule_etudiant`),
  CONSTRAINT `reponse_sondage_ibfk_1` FOREIGN KEY (`sondage_id`) REFERENCES `sondage` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reponse_sondage_ibfk_2` FOREIGN KEY (`matricule_etudiant`) REFERENCES `etudiant` (`Matricule`) ON DELETE CASCADE
);

CREATE TABLE `ressource` (
  `ID_ressource` int NOT NULL AUTO_INCREMENT,
  `ID_module` int NOT NULL,
  `ID_section` int NOT NULL,
  `Matricule` bigint NOT NULL,
  `nom_ressource` varchar(255) NOT NULL,
  `fichier_url` varchar(255) NOT NULL,
  `description` text,
  `date_upload` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type_ressource` enum('Cours','TD','TP') DEFAULT 'Cours',
  PRIMARY KEY (`ID_ressource`),
  UNIQUE KEY `unique_ressource` (`ID_module`,`ID_section`,`nom_ressource`),
  KEY `ID_section` (`ID_section`),
  KEY `Matricule` (`Matricule`),
  CONSTRAINT `ressource_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE,
  CONSTRAINT `ressource_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE,
  CONSTRAINT `ressource_ibfk_3` FOREIGN KEY (`Matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE
);

CREATE TABLE `sondage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `question` text NOT NULL,
  `options` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `enseignant_matricule` bigint NOT NULL,
  `target_type` enum('Etudiants') DEFAULT 'Etudiants',
  `target_filter` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignant_matricule` (`enseignant_matricule`),
  CONSTRAINT `sondage_ibfk_1` FOREIGN KEY (`enseignant_matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE
);

