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
    FOREIGN KEY (Matricule) REFERENCES User(Matricule) ON DELETE CASCADE,
    FOREIGN KEY (ID_specialite) REFERENCES Specialite(ID_specialite) ON DELETE CASCADE
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
CREATE TABLE Section (
    ID_section INT PRIMARY KEY AUTO_INCREMENT,
	nom_section VARCHAR(50),
    niveau ENUM('L1', 'ING1', 'L2', 'ING2', 'L3', 'ING3', 'M1', 'M2') NOT NULL,
    Matricule BIGINT,
    ID_specialite INT,
    FOREIGN KEY (Matricule) REFERENCES Enseignant(Matricule) ON DELETE SET NULL,
    FOREIGN KEY (ID_specialite) REFERENCES Specialite(ID_specialite) ON DELETE CASCADE
);

-- Create Module Table
CREATE TABLE Module (
    ID_module INT PRIMARY KEY AUTO_INCREMENT,
    nom_module VARCHAR(100) NOT NULL,
    description_module TEXT,
    credit INT NOT NULL,
    coefficient INT NOT NULL,
    ID_specialite INT,
    FOREIGN KEY (ID_specialite) REFERENCES Specialite(ID_specialite) ON DELETE CASCADE
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
    capacite INT NOT NULL
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
    FOREIGN KEY (Matricule) REFERENCES Etudiant(Matricule) ON DELETE CASCADE
);

-- Create Module_Section Table
CREATE TABLE Module_Section (
    ID_module INT,
    ID_section INT,
    semestre ENUM('1', '2') NOT NULL,
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
    FOREIGN KEY (Matricule) REFERENCES Enseignant(Matricule) ON DELETE SET NULL,
    FOREIGN KEY (ID_salle) REFERENCES Salle(ID_salle) ON DELETE SET NULL,
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE,
    FOREIGN KEY (ID_groupe) REFERENCES Groupe(ID_groupe) ON DELETE CASCADE
);

-- Create Emploi_du_temps_prof Table
CREATE TABLE Emploi_du_temps_prof (
    ID_emploi INT PRIMARY KEY AUTO_INCREMENT,
    ID_seance INT,
    matricule BIGINT,
    mise_a_jour DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (ID_seance) REFERENCES Seance(ID_seance) ON DELETE CASCADE,
    FOREIGN KEY (matricule) REFERENCES Enseignant(Matricule) ON DELETE CASCADE
);

-- Create Emploi_du_temps_etudiant Table
CREATE TABLE Emploi_du_temps_etudiant (
    ID_emploi INT PRIMARY KEY AUTO_INCREMENT,
    mise_a_jour DATE DEFAULT (CURRENT_DATE),
    ID_section INT,
    ID_seance INT,
    FOREIGN KEY (ID_seance) REFERENCES Seance(ID_seance) ON DELETE CASCADE,
    FOREIGN KEY (ID_section) REFERENCES Section(ID_section) ON DELETE CASCADE
);

-- Create Message Table
CREATE TABLE Message (
    ID_message INT PRIMARY KEY AUTO_INCREMENT,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenu TEXT NOT NULL,
    expediteur BIGINT,
    destinataire BIGINT,
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
    description_club TEXT
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

CREATE TABLE type_module(
    ID_type INT PRIMARY KEY AUTO_INCREMENT,
    seance ENUM ('cours', 'TD', 'TP') NOT NULL,
    nombre_seance ENUM INT NOT NULL 
);

CREATE TABLE type_module_module(
    ID_type INT,
    ID_module INT,
    PRIMARY KEY (ID_type, ID_module),
    FOREIGN KEY (ID_type) REFERENCES type_module(ID_type) ON DELETE CASCADE,
    FOREIGN KEY (ID_module) REFERENCES Module(ID_module) ON DELETE CASCADE
);


