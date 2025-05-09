-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: uni_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `Matricule` bigint NOT NULL,
  `poste` varchar(50) NOT NULL,
  PRIMARY KEY (`Matricule`),
  CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (909,'l''moudir'),(1509,'President');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `annonce`
--

DROP TABLE IF EXISTS `annonce`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annonce` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(255) DEFAULT '',
  `event_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `target_type` enum('Etudiants','Enseignants') DEFAULT NULL,
  `target_filter` json DEFAULT NULL,
  `enseignant_matricule` bigint DEFAULT NULL,
  `admin_matricule` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `admin_matricule` (`admin_matricule`),
  KEY `enseignant_matricule` (`enseignant_matricule`),
  CONSTRAINT `annonce_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `evenement` (`ID_evenement`) ON DELETE CASCADE,
  CONSTRAINT `annonce_ibfk_3` FOREIGN KEY (`admin_matricule`) REFERENCES `admin` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `annonce_ibfk_4` FOREIGN KEY (`enseignant_matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `annonce`
--

LOCK TABLES `annonce` WRITE;
/*!40000 ALTER TABLE `annonce` DISABLE KEYS */;
/*!40000 ALTER TABLE `annonce` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendarevent`
--

DROP TABLE IF EXISTS `calendarevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendarevent` (
  `ID_event` int NOT NULL AUTO_INCREMENT,
  `matricule` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `event_date` date NOT NULL,
  `time_slot` enum('08:00 - 09:30','09:40 - 11:10','11:20 - 12:50','13:00 - 14:30','14:40 - 16:10','16:20 - 17:50') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_event`),
  KEY `matricule` (`matricule`),
  CONSTRAINT `calendarevent_ibfk_1` FOREIGN KEY (`matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendarevent`
--

LOCK TABLES `calendarevent` WRITE;
/*!40000 ALTER TABLE `calendarevent` DISABLE KEYS */;
INSERT INTO `calendarevent` VALUES (2,212131095493,'Événements administratifs','L''événement administratif efrgthjyuk aura lieu ce jour-là','2025-05-17','11:20 - 12:50','2025-04-17 17:19:10','2025-04-17 17:19:10'),(3,212131095493,'Événements administratifs','L''événement administratif ergthyj aura lieu ce jour-là','2025-09-15','08:00 - 09:30','2025-04-17 17:19:45','2025-04-17 17:19:45'),(6,212131095493,'Événements administratifs','L''événement administratif annonce men 3end admin lel etudiant aura lieu ce jour-là','2025-04-19','09:40 - 11:10','2025-04-17 22:21:24','2025-04-17 22:21:24'),(18,2002,'Événements administratifs','L''événement administratif annonce men 3end admin lel enseignant aura lieu ce jour-là','2025-04-20','08:00 - 09:30','2025-04-18 00:20:48','2025-04-18 00:20:48'),(24,212131095493,'Événements administratifs','L''événement administratif test aura lieu ce jour-là','2025-04-27','11:20 - 12:50','2025-04-21 19:22:47','2025-04-21 19:22:47');
/*!40000 ALTER TABLE `calendarevent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `club`
--

DROP TABLE IF EXISTS `club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `club` (
  `ID_club` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description_club` text,
  `image_url` varchar(255) DEFAULT '',
  `gerant_matricule` bigint DEFAULT NULL,
  PRIMARY KEY (`ID_club`),
  KEY `fk_club_gerant` (`gerant_matricule`),
  CONSTRAINT `fk_club_gerant` FOREIGN KEY (`gerant_matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `club`
--

LOCK TABLES `club` WRITE;
/*!40000 ALTER TABLE `club` DISABLE KEYS */;
INSERT INTO `club` VALUES (1,'Micro Club','\nMicro Club\nScientific Student Club | Nonprofit Organization. MC aims at popularizing computer science, IT & technology fields among the student community.','/uploads/1745752055304.png',212131095493),(2,'OMC','Open Minded Club','/uploads/1745752518528.png',222231657517);
/*!40000 ALTER TABLE `club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clubevenement`
--

DROP TABLE IF EXISTS `clubevenement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clubevenement` (
  `ID_club_evenement` int NOT NULL AUTO_INCREMENT,
  `nom_evenement` varchar(255) NOT NULL,
  `description_evenement` text,
  `date_evenement` datetime NOT NULL,
  `lieu` varchar(255) NOT NULL,
  `capacite` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `organisateur_admin` bigint DEFAULT NULL,
  `ID_club` int NOT NULL,
  `time_slots` text,
  `is_public` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`ID_club_evenement`),
  KEY `organisateur_admin` (`organisateur_admin`),
  KEY `ID_club` (`ID_club`),
  CONSTRAINT `clubevenement_ibfk_1` FOREIGN KEY (`organisateur_admin`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `clubevenement_ibfk_2` FOREIGN KEY (`ID_club`) REFERENCES `club` (`ID_club`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clubevenement`
--

LOCK TABLES `clubevenement` WRITE;
/*!40000 ALTER TABLE `clubevenement` DISABLE KEYS */;
INSERT INTO `clubevenement` VALUES (2,'event micro club public','event','2025-05-01 00:00:00','salle de conference',250,'/uploads/1745752875832.png',212131095493,1,'13:00 - 14:30',1),(3,'evenement','event','2025-05-01 00:00:00','bibliotheque de la faculte',200,'/uploads/1745753460887.png',212131095493,1,'16:20 - 17:50',1),(4,'event micro club','event','2025-05-01 00:00:00','salle de conference',200,NULL,212131095493,1,'16:20 - 17:50',1);
/*!40000 ALTER TABLE `clubevenement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commentaire`
--

DROP TABLE IF EXISTS `commentaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commentaire` (
  `ID_commentaire` int NOT NULL AUTO_INCREMENT,
  `ID_publication` int NOT NULL,
  `matricule_etudiant` bigint NOT NULL,
  `contenu` text NOT NULL,
  `date_commentaire` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_commentaire`),
  KEY `ID_publication` (`ID_publication`),
  KEY `matricule_etudiant` (`matricule_etudiant`),
  CONSTRAINT `commentaire_ibfk_1` FOREIGN KEY (`ID_publication`) REFERENCES `publication` (`ID_publication`) ON DELETE CASCADE,
  CONSTRAINT `commentaire_ibfk_2` FOREIGN KEY (`matricule_etudiant`) REFERENCES `user` (`Matricule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commentaire`
--

LOCK TABLES `commentaire` WRITE;
/*!40000 ALTER TABLE `commentaire` DISABLE KEYS */;
/*!40000 ALTER TABLE `commentaire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commentaire_annonce`
--

DROP TABLE IF EXISTS `commentaire_annonce`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commentaire_annonce` (
  `ID_commentaire` int NOT NULL AUTO_INCREMENT,
  `ID_annonce` int NOT NULL,
  `matricule_etudiant` bigint NOT NULL,
  `contenu` text NOT NULL,
  `date_commentaire` datetime DEFAULT CURRENT_TIMESTAMP,
  `reponse_enseignant` text,
  `date_reponse` datetime DEFAULT NULL,
  PRIMARY KEY (`ID_commentaire`),
  KEY `ID_annonce` (`ID_annonce`),
  KEY `matricule_etudiant` (`matricule_etudiant`),
  CONSTRAINT `commentaire_annonce_ibfk_1` FOREIGN KEY (`ID_annonce`) REFERENCES `annonce` (`id`),
  CONSTRAINT `commentaire_annonce_ibfk_2` FOREIGN KEY (`matricule_etudiant`) REFERENCES `etudiant` (`Matricule`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commentaire_annonce`
--

LOCK TABLES `commentaire_annonce` WRITE;
/*!40000 ALTER TABLE `commentaire_annonce` DISABLE KEYS */;
/*!40000 ALTER TABLE `commentaire_annonce` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demandecreationclub`
--

DROP TABLE IF EXISTS `demandecreationclub`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demandecreationclub` (
  `ID_demande` int NOT NULL AUTO_INCREMENT,
  `matricule_etudiant` bigint NOT NULL,
  `nom_club` varchar(255) NOT NULL,
  `description_club` text,
  `date_demande` datetime DEFAULT CURRENT_TIMESTAMP,
  `etat` enum('en_attente','acceptee','refusee') DEFAULT 'en_attente',
  PRIMARY KEY (`ID_demande`),
  KEY `matricule_etudiant` (`matricule_etudiant`),
  CONSTRAINT `demandecreationclub_ibfk_1` FOREIGN KEY (`matricule_etudiant`) REFERENCES `user` (`Matricule`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demandecreationclub`
--

LOCK TABLES `demandecreationclub` WRITE;
/*!40000 ALTER TABLE `demandecreationclub` DISABLE KEYS */;
INSERT INTO `demandecreationclub` VALUES (1,222231657517,'club','club description','2025-04-13 00:52:15','acceptee');
/*!40000 ALTER TABLE `demandecreationclub` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demanderejoindreclub`
--

DROP TABLE IF EXISTS `demanderejoindreclub`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demanderejoindreclub` (
  `ID_demande` int NOT NULL AUTO_INCREMENT,
  `matricule_etudiant` bigint NOT NULL,
  `ID_club` int NOT NULL,
  `date_demande` datetime DEFAULT CURRENT_TIMESTAMP,
  `etat` enum('en_attente','acceptee','refusee') DEFAULT 'en_attente',
  PRIMARY KEY (`ID_demande`),
  UNIQUE KEY `matricule_etudiant` (`matricule_etudiant`,`ID_club`),
  KEY `ID_club` (`ID_club`),
  CONSTRAINT `demanderejoindreclub_ibfk_1` FOREIGN KEY (`matricule_etudiant`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `demanderejoindreclub_ibfk_2` FOREIGN KEY (`ID_club`) REFERENCES `club` (`ID_club`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demanderejoindreclub`
--

LOCK TABLES `demanderejoindreclub` WRITE;
/*!40000 ALTER TABLE `demanderejoindreclub` DISABLE KEYS */;
INSERT INTO `demanderejoindreclub` VALUES (1,212231446507,1,'2025-04-27 12:18:13','acceptee'),(2,212231446507,2,'2025-04-27 12:41:30','acceptee');
/*!40000 ALTER TABLE `demanderejoindreclub` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departement`
--

DROP TABLE IF EXISTS `departement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departement` (
  `ID_departement` int NOT NULL AUTO_INCREMENT,
  `ID_faculte` int DEFAULT NULL,
  `Nom_departement` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_departement`),
  KEY `ID_faculte` (`ID_faculte`),
  CONSTRAINT `departement_ibfk_1` FOREIGN KEY (`ID_faculte`) REFERENCES `faculte` (`ID_faculte`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departement`
--

LOCK TABLES `departement` WRITE;
/*!40000 ALTER TABLE `departement` DISABLE KEYS */;
INSERT INTO `departement` VALUES (1,1,'Computer Science'),(2,1,'Mathematics'),(3,2,'Mechanical Engineering'),(4,2,'Electrical Engineering'),(5,1,'Informatique'),(6,2,'Département de Biologie Cellulaire et Moléculaire'),(7,2,'Département de Biologie et Physiologie des Organismes'),(8,2,'Département d''Écologie et Environnement'),(9,2,'Palier SNV Licence'),(10,8,'Département de Géotechnique et Hydraulique'),(11,8,'Département de Structures et Matériaux'),(12,9,'Les départements spécifiques ne sont pas détaillés dans les sources disponibles.'),(13,11,'Département de Géographie et de l''Aménagement du Territoire'),(14,11,'Département de Géologie'),(15,11,'Département de Géophysique'),(16,10,'Département de Construction Mécanique et Productique'),(17,10,'Département de Thermo-Énergétique'),(18,10,'Département de Science des Matériaux'),(19,10,'Département de Génie Chimique et Cryogénie'),(20,10,'Département de Génie de l''Environnement'),(21,7,'Département des Systèmes d''Information et de la Qualité '),(22,7,'Département de l''Informatique Fondamentale'),(23,7,'Département de Génie Logiciel et Réseaux'),(24,7,'Département d''Intelligence Artificielle et de Science des Données');
/*!40000 ALTER TABLE `departement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (21,1,'gfesg','gvsgfvg','/uploads/1743081361218-80945886.pdf','2025-03-27 13:16:01'),(23,7,'test','test','/uploads/1745009344572-456243310.pdf','2025-04-18 20:49:04');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emploi_du_temps_etudiant`
--

DROP TABLE IF EXISTS `emploi_du_temps_etudiant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emploi_du_temps_etudiant` (
  `ID_emploi` int NOT NULL AUTO_INCREMENT,
  `mise_a_jour` date DEFAULT (curdate()),
  `ID_section` int DEFAULT NULL,
  `ID_seance` int DEFAULT NULL,
  PRIMARY KEY (`ID_emploi`),
  KEY `ID_seance` (`ID_seance`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `emploi_du_temps_etudiant_ibfk_1` FOREIGN KEY (`ID_seance`) REFERENCES `seance` (`ID_seance`) ON DELETE CASCADE,
  CONSTRAINT `emploi_du_temps_etudiant_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emploi_du_temps_etudiant`
--

LOCK TABLES `emploi_du_temps_etudiant` WRITE;
/*!40000 ALTER TABLE `emploi_du_temps_etudiant` DISABLE KEYS */;
/*!40000 ALTER TABLE `emploi_du_temps_etudiant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emploi_du_temps_prof`
--

DROP TABLE IF EXISTS `emploi_du_temps_prof`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emploi_du_temps_prof` (
  `ID_emploi` int NOT NULL AUTO_INCREMENT,
  `ID_seance` int DEFAULT NULL,
  `matricule` bigint DEFAULT NULL,
  `mise_a_jour` date DEFAULT (curdate()),
  PRIMARY KEY (`ID_emploi`),
  KEY `ID_seance` (`ID_seance`),
  KEY `matricule` (`matricule`),
  CONSTRAINT `emploi_du_temps_prof_ibfk_1` FOREIGN KEY (`ID_seance`) REFERENCES `seance` (`ID_seance`) ON DELETE CASCADE,
  CONSTRAINT `emploi_du_temps_prof_ibfk_2` FOREIGN KEY (`matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emploi_du_temps_prof`
--

LOCK TABLES `emploi_du_temps_prof` WRITE;
/*!40000 ALTER TABLE `emploi_du_temps_prof` DISABLE KEYS */;
/*!40000 ALTER TABLE `emploi_du_temps_prof` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enseignant`
--

DROP TABLE IF EXISTS `enseignant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignant` (
  `Matricule` bigint NOT NULL,
  `annee_inscription` date NOT NULL,
  `ID_faculte` int DEFAULT NULL,
  `ID_departement` int DEFAULT NULL,
  PRIMARY KEY (`Matricule`),
  KEY `fk_nom_colonne1` (`ID_faculte`),
  KEY `fk_nom_colonne2` (`ID_departement`),
  CONSTRAINT `enseignant_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `fk_nom_colonne1` FOREIGN KEY (`ID_faculte`) REFERENCES `faculte` (`ID_faculte`),
  CONSTRAINT `fk_nom_colonne2` FOREIGN KEY (`ID_departement`) REFERENCES `departement` (`ID_departement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enseignant`
--

LOCK TABLES `enseignant` WRITE;
/*!40000 ALTER TABLE `enseignant` DISABLE KEYS */;
INSERT INTO `enseignant` VALUES (2001,'2010-09-01',7,21),(2002,'2025-03-23',7,22),(2003,'2025-03-23',7,22),(2004,'2025-03-23',7,22),(2005,'2025-03-23',7,22),(2006,'2025-03-23',7,22),(2007,'2025-03-23',7,22),(2008,'2025-03-23',7,22),(2009,'2025-03-23',7,22),(2010,'2025-03-23',7,22);
/*!40000 ALTER TABLE `enseignant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enseignant_section`
--

DROP TABLE IF EXISTS `enseignant_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignant_section` (
  `Matricule` bigint NOT NULL,
  `ID_section` int NOT NULL,
  PRIMARY KEY (`Matricule`,`ID_section`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `enseignant_section_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `enseignant_section_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enseignant_section`
--

LOCK TABLES `enseignant_section` WRITE;
/*!40000 ALTER TABLE `enseignant_section` DISABLE KEYS */;
INSERT INTO `enseignant_section` VALUES (2001,6),(2002,6),(2003,6),(2004,6),(2005,6),(2006,6),(2007,6),(2009,6),(2010,6);
/*!40000 ALTER TABLE `enseignant_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etudiant`
--

DROP TABLE IF EXISTS `etudiant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etudiant` (
  `Matricule` bigint NOT NULL,
  `ID_specialite` int NOT NULL,
  `annee_inscription` date NOT NULL,
  `etat` enum('Ajourne','Admis','Admis avec dettes','Reintegrer') NOT NULL,
  `niveau` varchar(50) NOT NULL,
  `ID_groupe` int DEFAULT NULL,
  PRIMARY KEY (`Matricule`),
  KEY `ID_specialite` (`ID_specialite`),
  KEY `ID_groupe` (`ID_groupe`),
  CONSTRAINT `etudiant_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `etudiant_ibfk_2` FOREIGN KEY (`ID_specialite`) REFERENCES `specialite` (`ID_specialite`) ON DELETE CASCADE,
  CONSTRAINT `etudiant_ibfk_3` FOREIGN KEY (`ID_groupe`) REFERENCES `groupe` (`ID_groupe`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etudiant`
--

LOCK TABLES `etudiant` WRITE;
/*!40000 ALTER TABLE `etudiant` DISABLE KEYS */;
INSERT INTO `etudiant` VALUES (212131095493,15,'2024-09-15','Admis','L3',4),(212131095495,15,'2025-04-27','Admis avec dettes','L3',2),(212131195496,15,'2025-04-27','Admis','L2',34),(212131595490,15,'2025-04-27','Admis','L3',5),(212231446507,15,'2025-04-27','Admis','L3',2),(222231657517,15,'2024-09-15','Admis','L3',2);
/*!40000 ALTER TABLE `etudiant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etudiant_section`
--

DROP TABLE IF EXISTS `etudiant_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etudiant_section` (
  `Matricule` bigint NOT NULL,
  `ID_section` int NOT NULL,
  PRIMARY KEY (`Matricule`,`ID_section`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `etudiant_section_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `etudiant` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `etudiant_section_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etudiant_section`
--

LOCK TABLES `etudiant_section` WRITE;
/*!40000 ALTER TABLE `etudiant_section` DISABLE KEYS */;
INSERT INTO `etudiant_section` VALUES (212131095493,6),(212131095495,6),(212131595490,6),(212231446507,6),(222231657517,6),(212131195496,17);
/*!40000 ALTER TABLE `etudiant_section` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_num_etudiant_insert` AFTER INSERT ON `etudiant_section` FOR EACH ROW BEGIN
    UPDATE section
    SET num_etudiant = num_etudiant + 1
    WHERE ID_section = NEW.ID_section;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_num_etudiant_update` AFTER UPDATE ON `etudiant_section` FOR EACH ROW BEGIN
    IF NEW.ID_section != OLD.ID_section THEN
        UPDATE section
        SET num_etudiant = num_etudiant - 1
        WHERE ID_section = OLD.ID_section;
        UPDATE section
        SET num_etudiant = num_etudiant + 1
        WHERE ID_section = NEW.ID_section;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_num_etudiant_delete` AFTER DELETE ON `etudiant_section` FOR EACH ROW BEGIN
    UPDATE section
    SET num_etudiant = num_etudiant - 1
    WHERE ID_section = OLD.ID_section;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `evenement`
--

DROP TABLE IF EXISTS `evenement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evenement` (
  `ID_evenement` int NOT NULL AUTO_INCREMENT,
  `nom_evenement` varchar(100) NOT NULL,
  `description_evenement` text,
  `date_evenement` date NOT NULL,
  `lieu` varchar(100) NOT NULL,
  `capacite` int NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `organisateur_admin` bigint DEFAULT NULL,
  `heure_evenement` time DEFAULT NULL,
  `target_type` varchar(50) DEFAULT 'Etudiants',
  PRIMARY KEY (`ID_evenement`),
  KEY `fk_evenement_user` (`organisateur_admin`),
  CONSTRAINT `fk_evenement_user` FOREIGN KEY (`organisateur_admin`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evenement`
--

LOCK TABLES `evenement` WRITE;
/*!40000 ALTER TABLE `evenement` DISABLE KEYS */;
/*!40000 ALTER TABLE `evenement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam`
--

DROP TABLE IF EXISTS `exam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam` (
  `ID_exam` int NOT NULL AUTO_INCREMENT,
  `ID_module` int NOT NULL,
  `ID_section` int NOT NULL,
  `exam_date` date NOT NULL,
  `time_slot` enum('08:00 - 09:30','09:40 - 11:10','11:20 - 12:50','13:00 - 14:30','14:40 - 16:10','16:20 - 17:50') NOT NULL,
  `ID_semestre` int NOT NULL,
  `mode` enum('en ligne','presentiel') NOT NULL DEFAULT 'presentiel',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_exam`),
  KEY `ID_module` (`ID_module`),
  KEY `ID_section` (`ID_section`),
  KEY `ID_semestre` (`ID_semestre`),
  CONSTRAINT `exam_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`),
  CONSTRAINT `exam_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`),
  CONSTRAINT `exam_ibfk_4` FOREIGN KEY (`ID_semestre`) REFERENCES `semestre` (`ID_semestre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam`
--

LOCK TABLES `exam` WRITE;
/*!40000 ALTER TABLE `exam` DISABLE KEYS */;
INSERT INTO `exam` VALUES (9,33,6,'2025-05-06','14:40 - 16:10',6,'presentiel','2025-04-28 12:11:09'),(10,32,6,'2025-05-08','14:40 - 16:10',6,'presentiel','2025-04-28 12:11:09');
/*!40000 ALTER TABLE `exam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_salle`
--

DROP TABLE IF EXISTS `exam_salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_salle` (
  `ID_exam` int NOT NULL,
  `ID_salle` int NOT NULL,
  PRIMARY KEY (`ID_exam`,`ID_salle`),
  KEY `ID_salle` (`ID_salle`),
  CONSTRAINT `exam_salle_ibfk_1` FOREIGN KEY (`ID_exam`) REFERENCES `exam` (`ID_exam`) ON DELETE CASCADE,
  CONSTRAINT `exam_salle_ibfk_2` FOREIGN KEY (`ID_salle`) REFERENCES `salle` (`ID_salle`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_salle`
--

LOCK TABLES `exam_salle` WRITE;
/*!40000 ALTER TABLE `exam_salle` DISABLE KEYS */;
INSERT INTO `exam_salle` VALUES (9,9),(9,15),(10,26),(10,27);
/*!40000 ALTER TABLE `exam_salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculte`
--

DROP TABLE IF EXISTS `faculte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculte` (
  `ID_faculte` int NOT NULL AUTO_INCREMENT,
  `nom_faculte` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_faculte`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculte`
--

LOCK TABLES `faculte` WRITE;
/*!40000 ALTER TABLE `faculte` DISABLE KEYS */;
INSERT INTO `faculte` VALUES (1,'Faculty of Science'),(2,'Faculty of Engineering'),(3,'Faculté des Sciences Biologiques'),(4,'Faculté de Chimie'),(5,'Faculté de Physique'),(6,'Faculté de Mathématiques'),(7,'Faculté d''Informatique'),(8,'Faculté de Génie Civil'),(9,'Faculté de Génie Electrique'),(10,'Faculté de Génie Mécanique et Génie des Procédés'),(11,'Faculté des Sciences de la Terre, de la Géographie et de l''Aménagement du Territoire');
/*!40000 ALTER TABLE `faculte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groupe`
--

DROP TABLE IF EXISTS `groupe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groupe` (
  `ID_groupe` int NOT NULL AUTO_INCREMENT,
  `num_groupe` int NOT NULL,
  `ID_section` int DEFAULT NULL,
  PRIMARY KEY (`ID_groupe`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `groupe_ibfk_1` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groupe`
--

LOCK TABLES `groupe` WRITE;
/*!40000 ALTER TABLE `groupe` DISABLE KEYS */;
INSERT INTO `groupe` VALUES (2,1,6),(3,2,6),(4,3,6),(5,4,6),(15,1,13),(16,2,13),(17,3,13),(18,4,13),(19,1,14),(20,2,14),(21,3,14),(22,4,14),(23,1,15),(24,2,15),(25,3,15),(26,4,15),(27,1,16),(28,2,16),(29,3,16),(30,4,16),(31,1,17),(32,2,17),(33,3,17),(34,4,17),(35,1,18),(36,2,18),(37,3,18),(38,4,18),(39,1,19),(40,2,19),(41,3,19),(42,4,19),(43,1,20),(44,2,20),(45,3,20),(46,4,20),(47,1,21),(48,2,21),(49,3,21),(50,4,21),(51,1,22),(52,2,22),(53,3,22),(54,4,22),(55,1,23),(56,2,23),(57,3,23),(58,4,23),(59,1,24),(60,2,24),(61,3,24),(62,4,24),(63,1,25),(64,2,25),(65,3,25),(66,4,25),(67,1,26),(68,2,26),(69,3,26),(70,4,26),(71,1,27),(72,2,27),(73,3,27),(74,4,27),(75,1,28),(76,2,28),(77,3,28),(78,4,28);
/*!40000 ALTER TABLE `groupe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membreclub`
--

DROP TABLE IF EXISTS `membreclub`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membreclub` (
  `ID_membre` int NOT NULL AUTO_INCREMENT,
  `matricule_etudiant` bigint NOT NULL,
  `ID_club` int NOT NULL,
  `date_ajout` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_membre`),
  UNIQUE KEY `matricule_etudiant` (`matricule_etudiant`,`ID_club`),
  KEY `ID_club` (`ID_club`),
  CONSTRAINT `membreclub_ibfk_1` FOREIGN KEY (`matricule_etudiant`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `membreclub_ibfk_2` FOREIGN KEY (`ID_club`) REFERENCES `club` (`ID_club`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membreclub`
--

LOCK TABLES `membreclub` WRITE;
/*!40000 ALTER TABLE `membreclub` DISABLE KEYS */;
INSERT INTO `membreclub` VALUES (1,212231446507,1,'2025-04-27 12:18:26'),(2,212231446507,2,'2025-04-27 12:42:08');
/*!40000 ALTER TABLE `membreclub` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `ID_message` int NOT NULL AUTO_INCREMENT,
  `date_envoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contenu` text NOT NULL,
  `expediteur` bigint DEFAULT NULL,
  `destinataire` bigint DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `filePath` varchar(255) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_message`),
  KEY `expediteur` (`expediteur`),
  KEY `destinataire` (`destinataire`),
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`expediteur`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`destinataire`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (117,'2025-04-27 15:48:35','ok',909,212131095493,1,NULL,NULL),(118,'2025-04-27 20:23:26','ok',212131095493,909,1,NULL,NULL),(119,'2025-04-28 00:06:52','ok',909,212131095493,1,NULL,NULL),(120,'2025-04-28 01:34:41','ok',212131095493,909,1,NULL,NULL),(121,'2025-04-28 01:37:37','test',212131095493,909,1,NULL,NULL),(122,'2025-04-28 01:38:02','test',909,212131095493,0,NULL,NULL);
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messageclub`
--

DROP TABLE IF EXISTS `messageclub`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messageclub` (
  `ID_message` int NOT NULL AUTO_INCREMENT,
  `date_envoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contenu` text NOT NULL,
  `expediteur` bigint DEFAULT NULL,
  `destinataire` bigint DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `filePath` varchar(255) DEFAULT NULL,
  `fileName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_message`),
  KEY `expediteur` (`expediteur`),
  KEY `destinataire` (`destinataire`),
  CONSTRAINT `messageclub_ibfk_1` FOREIGN KEY (`expediteur`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `messageclub_ibfk_2` FOREIGN KEY (`destinataire`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messageclub`
--

LOCK TABLES `messageclub` WRITE;
/*!40000 ALTER TABLE `messageclub` DISABLE KEYS */;
INSERT INTO `messageclub` VALUES (3,'2025-04-17 11:12:45','[CLUB_1] salam',212131095493,222231657517,0,NULL,NULL),(5,'2025-04-17 11:12:54','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/event-1744888373975-563284212.png','IMG_1515.png'),(7,'2025-04-17 11:18:37','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/event-1744888717758-384102976.png','Untitled.png'),(9,'2025-04-17 11:21:38','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/event-1744888898182-263648712.png','omc.png'),(11,'2025-04-17 11:45:23','[CLUB_1] egeg',212131095493,222231657517,0,NULL,NULL),(13,'2025-04-17 12:02:54','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/event-1744891374243-515274600.png','omc.png'),(16,'2025-04-17 12:07:02','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/event-1744891622700-533466523.png','omc.png'),(18,'2025-04-17 12:24:21','[CLUB_1] Fichier joint',212131095493,222231657517,0,'/uploads/messages/1744892661355.pdf','emploi_du_temps_L3_ACAD_3-1.pdf'),(22,'2025-04-17 17:20:54','[CLUB_1] slam',212131095493,222231657517,0,NULL,NULL),(24,'2025-04-27 11:09:37','[CLUB_1] Fichier joint',212131095493,NULL,0,'/uploads/messages/1745752177627.pdf','emploi_du_temps_L3_ACAD_3-6.pdf'),(25,'2025-04-27 11:19:13','[CLUB_1] salam',212131095493,212231446507,0,NULL,NULL),(26,'2025-04-27 11:19:20','[CLUB_1] Fichier joint',212131095493,212231446507,0,'/uploads/messages/1745752760391.pdf','emploi_du_temps_L3_ACAD_3-6.pdf');
/*!40000 ALTER TABLE `messageclub` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `ID_module` int NOT NULL AUTO_INCREMENT,
  `nom_module` varchar(100) NOT NULL,
  `description_module` text,
  `credit` int NOT NULL,
  `coefficient` int NOT NULL,
  `ID_specialite` int DEFAULT NULL,
  `seances` enum('Cour','Cour/TD','Cour/TP','Cour/TD/TP','En ligne') NOT NULL,
  PRIMARY KEY (`ID_module`),
  KEY `ID_specialite` (`ID_specialite`),
  CONSTRAINT `module_ibfk_1` FOREIGN KEY (`ID_specialite`) REFERENCES `specialite` (`ID_specialite`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES (7,'Systeme d''Exploitaion',NULL,5,3,15,'Cour/TD'),(8,'Analse Numerique',NULL,5,3,15,'Cour/TD'),(12,'Algo 1',NULL,5,4,15,'Cour/TD'),(14,'Algo 2',NULL,4,3,15,'Cour/TD'),(26,'Resaux',NULL,5,3,15,'Cour/TD/TP'),(27,'System d''Exploitation 2',NULL,6,3,15,'Cour/TD/TP'),(28,'Theorie des Graphes',NULL,4,3,15,'Cour/TD'),(29,'Genie Logiciel et POO',NULL,4,3,15,'Cour/TD'),(30,'Option 1',NULL,2,2,15,'En ligne'),(31,'Anglais 3',NULL,2,2,15,'En ligne'),(32,'Programmation Web',NULL,4,3,15,'Cour/TP'),(33,'Security',NULL,4,3,15,'Cour'),(34,'Probabilites et Statistiques',NULL,4,3,15,'Cour/TD'),(35,'Analyse Numerique',NULL,4,3,15,'Cour/TD'),(36,'Logique Mathematique',NULL,4,3,15,'Cour/TD'),(37,'Algorithmique et Structure de Donnees',NULL,6,3,15,'Cour/TD/TP'),(38,'Systemes d''Informations',NULL,5,3,15,'Cour/TD'),(39,'Architecture des Ordinateurs 1',NULL,5,3,15,'Cour/TD/TP'),(40,'Anglais 1',NULL,2,2,15,'En ligne'),(41,'Base de donnees',NULL,3,5,15,'Cour/TD/TP'),(42,'Theorie des Languages',NULL,5,3,15,'Cour/TD'),(43,'Programmation Orientee Objet ',NULL,5,3,15,'Cour/TD/TP'),(44,'Systeme d''Exploitation 1',NULL,5,3,15,'Cour/TD/TP'),(45,'Architecture des Ordinateurs 2',NULL,5,3,15,'Cour/TD/TP'),(46,'Anglais 2',NULL,3,2,15,'En ligne'),(47,'Compilation',NULL,5,3,15,'Cour/TD/TP');
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_enseignant`
--

DROP TABLE IF EXISTS `module_enseignant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_enseignant` (
  `ID_module` int NOT NULL,
  `Matricule` bigint NOT NULL,
  `course_type` varchar(50) DEFAULT NULL,
  `group_number` int DEFAULT NULL,
  PRIMARY KEY (`ID_module`,`Matricule`),
  KEY `Matricule` (`Matricule`),
  CONSTRAINT `module_enseignant_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE,
  CONSTRAINT `module_enseignant_ibfk_2` FOREIGN KEY (`Matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `module_enseignant_ibfk_3` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`),
  CONSTRAINT `module_enseignant_ibfk_4` FOREIGN KEY (`Matricule`) REFERENCES `user` (`Matricule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_enseignant`
--

LOCK TABLES `module_enseignant` WRITE;
/*!40000 ALTER TABLE `module_enseignant` DISABLE KEYS */;
INSERT INTO `module_enseignant` VALUES (26,2006,NULL,NULL),(27,2002,NULL,NULL),(28,2005,NULL,NULL),(29,2003,NULL,NULL),(30,2007,NULL,NULL),(32,2010,NULL,NULL),(33,2009,NULL,NULL),(47,2004,NULL,NULL);
/*!40000 ALTER TABLE `module_enseignant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_etudiant`
--

DROP TABLE IF EXISTS `module_etudiant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_etudiant` (
  `ID_module` int NOT NULL,
  `Matricule` bigint NOT NULL,
  `Semestre` enum('S1','S2') NOT NULL,
  `Moyenne` float NOT NULL,
  `remarque` text,
  `niveau` enum('L1','ING1','L2','ING2','L3','ING3','M1','M2') NOT NULL,
  PRIMARY KEY (`ID_module`,`Matricule`,`Semestre`),
  KEY `Matricule` (`Matricule`),
  CONSTRAINT `module_etudiant_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE,
  CONSTRAINT `module_etudiant_ibfk_2` FOREIGN KEY (`Matricule`) REFERENCES `etudiant` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_etudiant`
--

LOCK TABLES `module_etudiant` WRITE;
/*!40000 ALTER TABLE `module_etudiant` DISABLE KEYS */;
INSERT INTO `module_etudiant` VALUES (7,212131095493,'S1',10.77,'bien','L3');
/*!40000 ALTER TABLE `module_etudiant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_section`
--

DROP TABLE IF EXISTS `module_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_section` (
  `ID_module` int NOT NULL,
  `ID_section` int NOT NULL,
  `semestre` enum('1','2','3','4','5','6') NOT NULL,
  PRIMARY KEY (`ID_module`,`ID_section`,`semestre`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `module_section_ibfk_1` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE,
  CONSTRAINT `module_section_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_section`
--

LOCK TABLES `module_section` WRITE;
/*!40000 ALTER TABLE `module_section` DISABLE KEYS */;
INSERT INTO `module_section` VALUES (26,6,'5'),(27,6,'5'),(28,6,'5'),(29,6,'5'),(30,6,'5'),(31,6,'5'),(32,6,'6'),(33,6,'6'),(47,6,'5'),(26,13,'5'),(27,13,'5'),(28,13,'5'),(29,13,'5'),(30,13,'5'),(31,13,'5'),(32,13,'6'),(33,13,'6'),(47,13,'5'),(26,14,'5'),(27,14,'5'),(28,14,'5'),(29,14,'5'),(30,14,'5'),(31,14,'5'),(32,14,'6'),(33,14,'6'),(47,14,'5'),(34,15,'3'),(35,15,'3'),(36,15,'3'),(37,15,'3'),(38,15,'3'),(39,15,'3'),(40,15,'3'),(41,15,'4'),(42,15,'4'),(43,15,'4'),(44,15,'4'),(45,15,'4'),(46,15,'4'),(34,16,'3'),(35,16,'3'),(36,16,'3'),(37,16,'3'),(38,16,'3'),(39,16,'3'),(40,16,'3'),(41,16,'4'),(42,16,'4'),(43,16,'4'),(44,16,'4'),(45,16,'4'),(46,16,'4'),(34,17,'3'),(35,17,'3'),(36,17,'3'),(37,17,'3'),(38,17,'3'),(39,17,'3'),(40,17,'3'),(41,17,'4'),(42,17,'4'),(43,17,'4'),(44,17,'4'),(45,17,'4'),(46,17,'4');
/*!40000 ALTER TABLE `module_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `ID_note` int NOT NULL AUTO_INCREMENT,
  `Matricule` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_note`),
  KEY `notes_fk_user` (`Matricule`),
  CONSTRAINT `notes_fk_user` FOREIGN KEY (`Matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
INSERT INTO `notes` VALUES (22,222231657517,'test','test','2025-04-17 19:02:26','2025-04-17 19:02:26'),(42,2002,'test','test','2025-04-19 15:05:52','2025-04-19 15:05:52'),(43,212131095493,'PFE','- SNTP ou d''autre outils .\n- edt logique.\n- nombre de message et notif non lue dans le main .\n- ','2025-04-23 17:25:12','2025-04-23 17:25:12');
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `ID_notification` int NOT NULL AUTO_INCREMENT,
  `date_envoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `contenu` text NOT NULL,
  `expediteur` bigint DEFAULT NULL,
  `destinataire` bigint DEFAULT NULL,
  PRIMARY KEY (`ID_notification`),
  KEY `expediteur` (`expediteur`),
  KEY `destinataire` (`destinataire`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`expediteur`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`destinataire`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=342 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (6,'2025-03-21 10:05:11','Une nouvelle ressource a été téléchargée pour le module Analse Numerique par Smith Professor : CHAPITRE_1 (Cours)',2001,212131095493),(8,'2025-03-21 10:12:54','Une ressource a été mise à jour pour le module Analse Numerique par Smith Professor : cahier_de_charge (TP)',2001,212131095493),(14,'2025-03-21 12:03:10','PAS DE COUR DEMAIN ! - je ne serais pas disponible pour le cour de demain ,profitez-vous !',2001,212131095493),(16,'2025-03-25 02:40:59','Nouvelle annonce: vrhbsrdgf',909,212131095493),(19,'2025-03-25 02:40:59','Nouvelle annonce: vrhbsrdgf',909,222231657517),(62,'2025-03-25 11:29:05','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : chapitre 2  (Cours)',2002,212131095493),(63,'2025-03-25 11:29:05','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : chapitre 2  (Cours)',2002,222231657517),(66,'2025-03-25 11:34:34','jhfhr - rghbbrth',2002,212131095493),(69,'2025-03-25 11:34:34','jhfhr - rghbbrth',2002,222231657517),(73,'2025-03-28 13:48:39','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : jjhdfaiuhfidh (TP)',2002,212131095493),(75,'2025-03-28 13:48:39','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : jjhdfaiuhfidh (TP)',2002,222231657517),(76,'2025-04-06 20:34:05','Annonce modifiée: kjhgfdsfghjk',909,212131095493),(79,'2025-04-06 20:34:05','Annonce modifiée: kjhgfdsfghjk',909,222231657517),(94,'2025-04-11 16:55:06','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(95,'2025-04-11 18:41:46','Séance supplémentaire ajoutée : Reseaux (TD, presentiel)',2002,212131095493),(98,'2025-04-11 18:41:46','Séance supplémentaire ajoutée : Reseaux (TD, presentiel)',2002,222231657517),(115,'2025-04-12 18:58:29','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(117,'2025-04-12 19:18:32','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(120,'2025-04-12 23:48:42','Vous avez de nouveaux messages du club Micro Club',222231657517,212131095493),(121,'2025-04-12 23:52:29','Votre demande de création du club \"club\" a été acceptée.',NULL,222231657517),(124,'2025-04-13 22:12:26','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(155,'2025-04-16 23:54:50','Nouveau événement du club \"Micro Club\": \"rrttghjuy\" est là !',212131095493,222231657517),(157,'2025-04-17 11:12:45','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(159,'2025-04-17 11:18:37','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(161,'2025-04-17 11:21:38','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(163,'2025-04-17 11:45:23','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(165,'2025-04-17 11:56:45','Nouveau événement du club \"Micro Club\": \"wertghyju\" est là !',212131095493,222231657517),(167,'2025-04-17 12:02:54','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(170,'2025-04-17 12:07:02','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(172,'2025-04-17 12:24:21','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(183,'2025-04-17 17:20:54','Vous avez de nouveaux messages du club Micro Club',212131095493,222231657517),(208,'2025-04-17 19:17:03','Séance supplémentaire supprimée : Reseaux (TD, presentiel)',2002,212131095493),(211,'2025-04-17 19:17:03','Séance supplémentaire supprimée : Reseaux (TD, presentiel)',2002,222231657517),(215,'2025-04-18 00:47:17','Séance supplémentaire ajoutée : Reseaux (cours, presentiel)',2002,212131095493),(218,'2025-04-18 00:47:17','Séance supplémentaire ajoutée : Reseaux (cours, presentiel)',2002,222231657517),(222,'2025-04-18 20:44:08','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : akhedmou (Cours)',2002,212131095493),(225,'2025-04-18 20:44:08','Une nouvelle ressource a été téléchargée pour le module System d''Exploitation 2 par Hamza Nemouchi  : akhedmou (Cours)',2002,222231657517),(226,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(227,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(228,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(229,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(230,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(231,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(232,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(233,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(234,'2025-04-18 22:48:00','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(235,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(236,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(237,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(238,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(239,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(240,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(241,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(242,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(243,'2025-04-18 22:48:04','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(244,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(245,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(246,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(247,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(248,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(249,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(250,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(251,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(252,'2025-04-18 22:48:08','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(253,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(254,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(255,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(256,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(257,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(258,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(259,'2025-04-18 22:48:26','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(260,'2025-04-18 22:48:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(261,'2025-04-18 22:48:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(270,'2025-04-19 14:59:03','Séance supplémentaire ajoutée : System d''Exploitation 2 (cours, presentiel)',2002,212131095493),(273,'2025-04-19 14:59:03','Séance supplémentaire ajoutée : System d''Exploitation 2 (cours, presentiel)',2002,222231657517),(290,'2025-04-25 23:12:16','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(291,'2025-04-25 23:12:16','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(292,'2025-04-25 23:12:16','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(293,'2025-04-25 23:12:16','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(294,'2025-04-25 23:12:16','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(295,'2025-04-25 23:12:17','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(296,'2025-04-25 23:12:17','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(297,'2025-04-25 23:12:17','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(298,'2025-04-25 23:12:17','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(299,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(300,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(301,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(302,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(303,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(304,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(305,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(306,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(307,'2025-04-27 11:16:40','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(308,'2025-04-27 11:19:13','Vous avez de nouveaux messages du club Micro Club',212131095493,212231446507),(311,'2025-04-27 11:21:15','Événement public du club \"Micro Club\": \"event micro club public\" est ouvert à tous !',212131095493,212131095493),(312,'2025-04-27 11:21:15','Événement public du club \"Micro Club\": \"event micro club public\" est ouvert à tous !',212131095493,212131095493),(313,'2025-04-27 11:21:15','Événement public du club \"Micro Club\": \"event micro club public\" est ouvert à tous !',212131095493,222231657517),(314,'2025-04-27 11:21:15','Événement public du club \"Micro Club\": \"event micro club public\" est ouvert à tous !',212131095493,222231657517),(315,'2025-04-27 11:31:00','Nouveau événement du club \"Micro Club\": \"evenement\" est là !',212131095493,212231446507),(316,'2025-04-27 11:31:01','Événement public du club \"Micro Club\": \"evenement\" est ouvert à tous !',212131095493,212131095493),(317,'2025-04-27 11:31:01','Événement public du club \"Micro Club\": \"evenement\" est ouvert à tous !',212131095493,222231657517),(318,'2025-04-27 11:44:52','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(319,'2025-04-27 11:44:52','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(320,'2025-04-27 11:44:52','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(321,'2025-04-27 11:44:52','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(322,'2025-04-27 11:44:52','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(323,'2025-04-27 11:44:53','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(324,'2025-04-27 11:44:53','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(325,'2025-04-27 11:44:53','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(326,'2025-04-27 11:44:53','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(327,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2001),(328,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2002),(329,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2003),(330,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2004),(331,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2005),(332,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2006),(333,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2007),(334,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2009),(335,'2025-04-27 12:50:27','La liste des étudiants de la 3 - ACAD a été mise à jour, vous avez maintenant la nouvelle version.',NULL,2010),(336,'2025-04-27 13:18:49','Nouveau événement du club \"Micro Club\": \"event micro club\" est là !',212131095493,212231446507),(337,'2025-04-27 13:18:49','Événement public du club \"Micro Club\": \"event micro club\" est ouvert à tous !',212131095493,212131095493),(338,'2025-04-27 13:18:49','Événement public du club \"Micro Club\": \"event micro club\" est ouvert à tous !',212131095493,212131095495),(339,'2025-04-27 13:18:49','Événement public du club \"Micro Club\": \"event micro club\" est ouvert à tous !',212131095493,212131195496),(340,'2025-04-27 13:18:49','Événement public du club \"Micro Club\": \"event micro club\" est ouvert à tous !',212131095493,212131595490),(341,'2025-04-27 13:18:49','Événement public du club \"Micro Club\": \"event micro club\" est ouvert à tous !',212131095493,222231657517);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_seen`
--

DROP TABLE IF EXISTS `notification_seen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_seen` (
  `ID_notification` int NOT NULL,
  `matricule` bigint NOT NULL,
  `seen_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_notification`,`matricule`),
  KEY `matricule` (`matricule`),
  CONSTRAINT `notification_seen_ibfk_1` FOREIGN KEY (`ID_notification`) REFERENCES `notification` (`ID_notification`) ON DELETE CASCADE,
  CONSTRAINT `notification_seen_ibfk_2` FOREIGN KEY (`matricule`) REFERENCES `user` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_seen`
--

LOCK TABLES `notification_seen` WRITE;
/*!40000 ALTER TABLE `notification_seen` DISABLE KEYS */;
INSERT INTO `notification_seen` VALUES (6,212131095493,'2025-04-09 12:06:06'),(8,212131095493,'2025-04-09 12:06:05'),(14,212131095493,'2025-04-09 12:06:04'),(16,212131095493,'2025-04-09 12:06:04'),(62,212131095493,'2025-04-09 12:05:57'),(66,212131095493,'2025-04-09 12:05:56'),(73,212131095493,'2025-04-04 17:25:33'),(76,212131095493,'2025-04-11 00:43:41'),(95,212131095493,'2025-04-28 00:02:19'),(215,212131095493,'2025-04-18 22:27:45'),(222,212131095493,'2025-04-18 22:27:41'),(227,2002,'2025-04-28 00:06:24'),(270,212131095493,'2025-04-28 00:02:09'),(311,212131095493,'2025-04-27 23:55:45'),(312,212131095493,'2025-04-27 23:55:49'),(316,212131095493,'2025-04-27 23:55:09'),(337,212131095493,'2025-04-27 23:54:40');
/*!40000 ALTER TABLE `notification_seen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participant`
--

DROP TABLE IF EXISTS `participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participant` (
  `ID_evenement` int NOT NULL,
  `Matricule` bigint NOT NULL,
  PRIMARY KEY (`ID_evenement`,`Matricule`),
  KEY `Matricule` (`Matricule`),
  CONSTRAINT `participant_ibfk_1` FOREIGN KEY (`ID_evenement`) REFERENCES `evenement` (`ID_evenement`) ON DELETE CASCADE,
  CONSTRAINT `participant_ibfk_2` FOREIGN KEY (`Matricule`) REFERENCES `etudiant` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participant`
--

LOCK TABLES `participant` WRITE;
/*!40000 ALTER TABLE `participant` DISABLE KEYS */;
/*!40000 ALTER TABLE `participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publication`
--

DROP TABLE IF EXISTS `publication`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publication` (
  `ID_publication` int NOT NULL AUTO_INCREMENT,
  `ID_club` int NOT NULL,
  `contenu` text NOT NULL,
  `date_publication` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_publication`),
  KEY `ID_club` (`ID_club`),
  CONSTRAINT `publication_ibfk_1` FOREIGN KEY (`ID_club`) REFERENCES `club` (`ID_club`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publication`
--

LOCK TABLES `publication` WRITE;
/*!40000 ALTER TABLE `publication` DISABLE KEYS */;
INSERT INTO `publication` VALUES (3,1,'evenement micro club\n\n        **Événement du club \"Micro Club\": evenement** \n        - **Date** : 01/05/2025, 01:00:00\n        - **Heure** : 16:20 - 17:50\n        - **Lieu** : bibliotheque de la faculte\n        - **Capacité** : 200 participants\n        - **Description** : event','2025-04-27 12:31:01'),(4,1,'event\n\n        **Événement du club \"Micro Club\": event micro club** \n        - **Date** : 01/05/2025, 01:00:00\n        - **Heure** : 16:20 - 17:50\n        - **Lieu** : salle de conference\n        - **Capacité** : 200 participants\n        - **Description** : event','2025-04-27 14:18:50');
/*!40000 ALTER TABLE `publication` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publicationimages`
--

DROP TABLE IF EXISTS `publicationimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publicationimages` (
  `ID_image` int NOT NULL AUTO_INCREMENT,
  `ID_publication` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  PRIMARY KEY (`ID_image`),
  KEY `ID_publication` (`ID_publication`),
  CONSTRAINT `publicationimages_ibfk_1` FOREIGN KEY (`ID_publication`) REFERENCES `publication` (`ID_publication`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publicationimages`
--

LOCK TABLES `publicationimages` WRITE;
/*!40000 ALTER TABLE `publicationimages` DISABLE KEYS */;
/*!40000 ALTER TABLE `publicationimages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reaction`
--

DROP TABLE IF EXISTS `reaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reaction` (
  `ID_reaction` int NOT NULL AUTO_INCREMENT,
  `ID_publication` int NOT NULL,
  `matricule_etudiant` bigint NOT NULL,
  `type_reaction` enum('like') DEFAULT 'like',
  `date_reaction` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_reaction`),
  UNIQUE KEY `ID_publication` (`ID_publication`,`matricule_etudiant`),
  KEY `matricule_etudiant` (`matricule_etudiant`),
  CONSTRAINT `reaction_ibfk_1` FOREIGN KEY (`ID_publication`) REFERENCES `publication` (`ID_publication`) ON DELETE CASCADE,
  CONSTRAINT `reaction_ibfk_2` FOREIGN KEY (`matricule_etudiant`) REFERENCES `user` (`Matricule`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reaction`
--

LOCK TABLES `reaction` WRITE;
/*!40000 ALTER TABLE `reaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `reaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reclamation`
--

DROP TABLE IF EXISTS `reclamation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reclamation`
--

LOCK TABLES `reclamation` WRITE;
/*!40000 ALTER TABLE `reclamation` DISABLE KEYS */;
/*!40000 ALTER TABLE `reclamation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reponse_sondage`
--

DROP TABLE IF EXISTS `reponse_sondage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reponse_sondage`
--

LOCK TABLES `reponse_sondage` WRITE;
/*!40000 ALTER TABLE `reponse_sondage` DISABLE KEYS */;
/*!40000 ALTER TABLE `reponse_sondage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ressource`
--

DROP TABLE IF EXISTS `ressource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ressource`
--

LOCK TABLES `ressource` WRITE;
/*!40000 ALTER TABLE `ressource` DISABLE KEYS */;
INSERT INTO `ressource` VALUES (2,8,6,2001,'CHAPITRE_1','/uploads/1742552036987-Emploi_du_Temps_L3_ACAD_3.pdf','chapitre_1 module analyse numerique','2025-03-21 10:13:57','TD'),(3,8,6,2001,'cahier de charge','/uploads/1742552093500-L3_ACAD_3.pdf','chapitre_2 analyse numerique','2025-03-21 10:14:53','Cours');
/*!40000 ALTER TABLE `ressource` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salle`
--

DROP TABLE IF EXISTS `salle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salle` (
  `ID_salle` int NOT NULL AUTO_INCREMENT,
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `capacite` int NOT NULL,
  `type_salle` enum('Cour','TD','TP','TP/TD') DEFAULT NULL,
  `nom_salle` varchar(10) NOT NULL,
  PRIMARY KEY (`ID_salle`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salle`
--

LOCK TABLES `salle` WRITE;
/*!40000 ALTER TABLE `salle` DISABLE KEYS */;
INSERT INTO `salle` VALUES (9,1,60,'TD','215'),(15,1,140,'Cour','E8'),(16,1,40,'TD','220'),(17,1,120,'Cour','C4'),(18,1,70,'Cour','Amphi F'),(19,1,70,'Cour','Amphi Z'),(20,1,70,'Cour','Amphi A'),(21,1,130,'Cour','R2'),(22,1,130,'Cour','D3'),(23,1,50,'TD','119'),(24,1,50,'TD','115'),(25,1,40,'TD','118'),(26,1,40,'TD','120'),(27,1,40,'TD','122'),(28,1,40,'TD','124'),(29,1,40,'TD','123'),(30,1,40,'TD','240'),(31,1,40,'TD','241'),(32,1,40,'TD','242'),(33,1,40,'TD','243'),(34,1,40,'TD','244'),(35,1,40,'TD','245'),(36,1,40,'TD','246'),(37,1,40,'TD','247'),(38,1,40,'TD','248'),(39,1,40,'TD','249'),(40,1,40,'TD','250'),(41,1,40,'TD','310'),(42,1,40,'TD','311'),(43,1,40,'TD','312'),(44,1,40,'TD','313'),(45,1,40,'TD','314'),(46,1,40,'TD','315'),(47,1,40,'TD','316'),(48,1,40,'TD','317'),(49,1,40,'TD','318'),(50,1,40,'TD','319'),(51,1,40,'TD','402'),(52,1,40,'TD','415'),(53,1,40,'TD','445'),(54,1,40,'TD','444'),(55,1,40,'TP','TP132'),(56,1,40,'TP','TP130'),(57,1,40,'TP','TP122'),(58,1,40,'TP','TP126'),(59,1,40,'TP','TP.C3B'),(60,1,40,'TP','TP.C3A'),(61,1,40,'TP','TP.C3C'),(62,1,40,'TP','TP128'),(63,1,40,'TP','TP129');
/*!40000 ALTER TABLE `salle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salle_section`
--

DROP TABLE IF EXISTS `salle_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salle_section` (
  `ID_salle` int NOT NULL,
  `ID_section` int NOT NULL,
  PRIMARY KEY (`ID_salle`,`ID_section`),
  KEY `ID_section` (`ID_section`),
  CONSTRAINT `salle_section_ibfk_1` FOREIGN KEY (`ID_salle`) REFERENCES `salle` (`ID_salle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salle_section`
--

LOCK TABLES `salle_section` WRITE;
/*!40000 ALTER TABLE `salle_section` DISABLE KEYS */;
/*!40000 ALTER TABLE `salle_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seance`
--

DROP TABLE IF EXISTS `seance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seance` (
  `ID_seance` int NOT NULL AUTO_INCREMENT,
  `ID_salle` int DEFAULT NULL,
  `Matricule` bigint DEFAULT NULL,
  `type_seance` enum('cours','TD','TP') NOT NULL,
  `ID_groupe` int DEFAULT NULL,
  `ID_module` int DEFAULT NULL,
  `jour` enum('Samedi','Dimanche','Lundi','Mardi','Mercredi','Jeudi') NOT NULL,
  `time_slot` enum('08:00 - 09:30','09:40 - 11:10','11:20 - 12:50','13:00 - 14:30','14:40 - 16:10','16:20 - 17:50') NOT NULL,
  `ID_section` int DEFAULT NULL,
  PRIMARY KEY (`ID_seance`),
  KEY `Matricule` (`Matricule`),
  KEY `ID_module` (`ID_module`),
  KEY `ID_groupe` (`ID_groupe`),
  KEY `ID_section_contraint` (`ID_section`),
  KEY `seance_ibfk_2` (`ID_salle`),
  CONSTRAINT `ID_section_contraint` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `seance_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE SET NULL,
  CONSTRAINT `seance_ibfk_2` FOREIGN KEY (`ID_salle`) REFERENCES `salle` (`ID_salle`) ON DELETE SET NULL,
  CONSTRAINT `seance_ibfk_3` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE,
  CONSTRAINT `seance_ibfk_4` FOREIGN KEY (`ID_groupe`) REFERENCES `groupe` (`ID_groupe`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1303 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seance`
--

LOCK TABLES `seance` WRITE;
/*!40000 ALTER TABLE `seance` DISABLE KEYS */;
INSERT INTO `seance` VALUES (1266,15,2006,'cours',NULL,26,'Lundi','08:00 - 09:30',6),(1267,15,2002,'cours',NULL,27,'Lundi','09:40 - 11:10',6),(1268,15,2005,'cours',NULL,28,'Lundi','11:20 - 12:50',6),(1269,15,2003,'cours',NULL,29,'Mardi','08:00 - 09:30',6),(1270,15,2004,'cours',NULL,47,'Mardi','09:40 - 11:10',6),(1271,55,2004,'TP',4,47,'Dimanche','08:00 - 09:30',6),(1272,56,2006,'TP',5,26,'Dimanche','08:00 - 09:30',6),(1273,57,2002,'TP',2,27,'Dimanche','08:00 - 09:30',6),(1274,9,2003,'TD',3,29,'Dimanche','08:00 - 09:30',6),(1275,55,2006,'TP',3,26,'Jeudi','11:20 - 12:50',6),(1276,56,2004,'TP',5,47,'Jeudi','11:20 - 12:50',6),(1277,9,2003,'TD',2,29,'Jeudi','11:20 - 12:50',6),(1278,16,2005,'TD',4,28,'Jeudi','11:20 - 12:50',6),(1279,9,2006,'TD',2,26,'Jeudi','09:40 - 11:10',6),(1280,16,2002,'TD',3,27,'Jeudi','09:40 - 11:10',6),(1281,23,2004,'TD',4,47,'Jeudi','09:40 - 11:10',6),(1282,24,2005,'TD',5,28,'Jeudi','09:40 - 11:10',6),(1283,55,2006,'TP',4,26,'Mercredi','08:00 - 09:30',6),(1284,56,2004,'TP',2,47,'Mercredi','08:00 - 09:30',6),(1285,9,2002,'TD',5,27,'Mercredi','08:00 - 09:30',6),(1286,16,2005,'TD',3,28,'Mercredi','08:00 - 09:30',6),(1287,55,2004,'TP',3,47,'Jeudi','14:40 - 16:10',6),(1288,9,2002,'TD',4,27,'Jeudi','14:40 - 16:10',6),(1289,56,2006,'TP',2,26,'Jeudi','14:40 - 16:10',6),(1290,16,2003,'TD',5,29,'Jeudi','14:40 - 16:10',6),(1291,9,2004,'TD',5,47,'Jeudi','08:00 - 09:30',6),(1292,16,2006,'TD',3,26,'Jeudi','08:00 - 09:30',6),(1293,55,2002,'TP',4,27,'Jeudi','08:00 - 09:30',6),(1294,23,2005,'TD',2,28,'Jeudi','08:00 - 09:30',6),(1295,9,2006,'TD',4,26,'Samedi','13:00 - 14:30',6),(1296,55,2002,'TP',3,27,'Samedi','13:00 - 14:30',6),(1297,16,2004,'TD',2,47,'Samedi','13:00 - 14:30',6),(1298,9,2003,'TD',4,29,'Samedi','09:40 - 11:10',6),(1299,16,2004,'TD',3,47,'Samedi','09:40 - 11:10',6),(1300,55,2002,'TP',5,27,'Samedi','09:40 - 11:10',6),(1301,9,2006,'TD',5,26,'Mercredi','13:00 - 14:30',6),(1302,16,2002,'TD',2,27,'Mercredi','13:00 - 14:30',6);
/*!40000 ALTER TABLE `seance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seance_supp`
--

DROP TABLE IF EXISTS `seance_supp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seance_supp` (
  `ID_seance_supp` int NOT NULL AUTO_INCREMENT,
  `Matricule` bigint NOT NULL,
  `ID_section` int NOT NULL,
  `ID_salle` int DEFAULT NULL,
  `ID_module` int NOT NULL,
  `type_seance` enum('cours','TD','TP') NOT NULL,
  `date_seance` date NOT NULL,
  `time_slot` enum('08:00 - 09:30','09:40 - 11:10','11:20 - 12:50','13:00 - 14:30','14:40 - 16:10','16:20 - 17:50') NOT NULL,
  `mode` enum('presentiel','en ligne') NOT NULL DEFAULT 'presentiel',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_seance_supp`),
  UNIQUE KEY `Matricule` (`Matricule`,`date_seance`,`time_slot`),
  UNIQUE KEY `ID_salle` (`ID_salle`,`date_seance`,`time_slot`),
  KEY `ID_section` (`ID_section`),
  KEY `ID_module` (`ID_module`),
  CONSTRAINT `seance_supp_ibfk_1` FOREIGN KEY (`Matricule`) REFERENCES `enseignant` (`Matricule`) ON DELETE CASCADE,
  CONSTRAINT `seance_supp_ibfk_2` FOREIGN KEY (`ID_section`) REFERENCES `section` (`ID_section`) ON DELETE CASCADE,
  CONSTRAINT `seance_supp_ibfk_3` FOREIGN KEY (`ID_salle`) REFERENCES `salle` (`ID_salle`) ON DELETE SET NULL,
  CONSTRAINT `seance_supp_ibfk_4` FOREIGN KEY (`ID_module`) REFERENCES `module` (`ID_module`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seance_supp`
--

LOCK TABLES `seance_supp` WRITE;
/*!40000 ALTER TABLE `seance_supp` DISABLE KEYS */;
/*!40000 ALTER TABLE `seance_supp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seance_supp_groupe`
--

DROP TABLE IF EXISTS `seance_supp_groupe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seance_supp_groupe` (
  `ID_seance_supp` int NOT NULL,
  `ID_groupe` int NOT NULL,
  PRIMARY KEY (`ID_seance_supp`,`ID_groupe`),
  KEY `ID_groupe` (`ID_groupe`),
  CONSTRAINT `seance_supp_groupe_ibfk_1` FOREIGN KEY (`ID_seance_supp`) REFERENCES `seance_supp` (`ID_seance_supp`) ON DELETE CASCADE,
  CONSTRAINT `seance_supp_groupe_ibfk_2` FOREIGN KEY (`ID_groupe`) REFERENCES `groupe` (`ID_groupe`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seance_supp_groupe`
--

LOCK TABLES `seance_supp_groupe` WRITE;
/*!40000 ALTER TABLE `seance_supp_groupe` DISABLE KEYS */;
/*!40000 ALTER TABLE `seance_supp_groupe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `section`
--

DROP TABLE IF EXISTS `section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section` (
  `ID_section` int NOT NULL AUTO_INCREMENT,
  `niveau` varchar(50) NOT NULL,
  `ID_specialite` int DEFAULT NULL,
  `nom_section` varchar(50) NOT NULL,
  `num_etudiant` int DEFAULT '0',
  PRIMARY KEY (`ID_section`),
  KEY `ID_specialite` (`ID_specialite`),
  CONSTRAINT `section_ibfk_2` FOREIGN KEY (`ID_specialite`) REFERENCES `specialite` (`ID_specialite`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `section`
--

LOCK TABLES `section` WRITE;
/*!40000 ALTER TABLE `section` DISABLE KEYS */;
INSERT INTO `section` VALUES (2,'L2',1,'5',0),(3,'ING1',4,'4',0),(4,'M1',5,'3',0),(5,'L3',2,'1',0),(6,'L3',15,'3',5),(13,'L3',15,'2',0),(14,'L3',15,'1',0),(15,'L2',15,'A',0),(16,'L2',15,'B',0),(17,'L2',15,'C',1),(18,'L2',16,'A',0),(19,'L2',16,'B',0),(20,'L3',16,'A',0),(21,'L3',16,'B',0),(22,'L1',18,'1',0),(23,'L1',18,'2',0),(24,'L1',18,'3',0),(25,'L1',18,'4',0),(26,'L1',18,'5',0),(27,'L2',17,'A',0),(28,'L3',17,'A',0);
/*!40000 ALTER TABLE `section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `semestre`
--

DROP TABLE IF EXISTS `semestre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semestre` (
  `ID_semestre` int NOT NULL AUTO_INCREMENT,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  PRIMARY KEY (`ID_semestre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `semestre`
--

LOCK TABLES `semestre` WRITE;
/*!40000 ALTER TABLE `semestre` DISABLE KEYS */;
INSERT INTO `semestre` VALUES (1,'2024-09-15','2024-12-31'),(2,'2025-02-01','2025-05-20'),(3,'2024-09-15','2024-12-31'),(4,'2025-02-01','2025-05-20'),(5,'2024-09-15','2024-12-31'),(6,'2025-02-01','2025-05-20');
/*!40000 ALTER TABLE `semestre` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `semestre_etudiant`
--

DROP TABLE IF EXISTS `semestre_etudiant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semestre_etudiant` (
  `ID_semestre` int NOT NULL,
  `Matricule` bigint NOT NULL,
  `Moyenne` float NOT NULL,
  PRIMARY KEY (`ID_semestre`,`Matricule`),
  KEY `Matricule` (`Matricule`),
  CONSTRAINT `semestre_etudiant_ibfk_1` FOREIGN KEY (`ID_semestre`) REFERENCES `semestre` (`ID_semestre`) ON DELETE CASCADE,
  CONSTRAINT `semestre_etudiant_ibfk_2` FOREIGN KEY (`Matricule`) REFERENCES `etudiant` (`Matricule`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `semestre_etudiant`
--

LOCK TABLES `semestre_etudiant` WRITE;
/*!40000 ALTER TABLE `semestre_etudiant` DISABLE KEYS */;
/*!40000 ALTER TABLE `semestre_etudiant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sondage`
--

DROP TABLE IF EXISTS `sondage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sondage`
--

LOCK TABLES `sondage` WRITE;
/*!40000 ALTER TABLE `sondage` DISABLE KEYS */;
/*!40000 ALTER TABLE `sondage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialite`
--

DROP TABLE IF EXISTS `specialite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialite` (
  `ID_specialite` int NOT NULL AUTO_INCREMENT,
  `nom_specialite` varchar(100) NOT NULL,
  `ID_departement` int DEFAULT NULL,
  `ID_faculte` int DEFAULT NULL,
  PRIMARY KEY (`ID_specialite`),
  KEY `ID_departement` (`ID_departement`),
  KEY `ID_faculte` (`ID_faculte`),
  CONSTRAINT `specialite_ibfk_1` FOREIGN KEY (`ID_departement`) REFERENCES `departement` (`ID_departement`) ON DELETE CASCADE,
  CONSTRAINT `specialite_ibfk_2` FOREIGN KEY (`ID_faculte`) REFERENCES `faculte` (`ID_faculte`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialite`
--

LOCK TABLES `specialite` WRITE;
/*!40000 ALTER TABLE `specialite` DISABLE KEYS */;
INSERT INTO `specialite` VALUES (1,'Software Engineering',1,1),(2,'Data Science',1,1),(3,'Pure Mathematics',2,1),(4,'Robotics',3,2),(5,'Power Systems',4,2),(6,'IA',1,1),(7,'Réseaux et Systèmes Distribués',21,7),(8,'Ingénierie Logicielle',21,7),(9,'Sécurité des Systèmes d''Information',21,7),(10,'Big Data',22,7),(11,'Systèmes d''Information Intelligents',24,7),(12,'Ingénierie des Données et des Connaissances',24,6),(13,'Bioinformatique',24,7),(14,'Génie des Télécommunications et Réseaux',23,7),(15,'ACAD',22,7),(16,'ISIL',21,7),(17,'GTR',23,7),(18,'INFO',22,7);
/*!40000 ALTER TABLE `specialite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `Matricule` bigint NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(70) DEFAULT NULL,
  `motdepasse` varchar(255) NOT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Matricule`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (909,'chabri','malek','malekchabri@gmail.com','15092003','2025-03-19 03:28:15'),(1509,'xxx','Mohammed','mohammedxxx@gmail.com','1515','2025-03-11 14:58:01'),(2001,'Professor','Smith','smith@uni.com','pass123','2025-03-11 14:50:52'),(2002,'Nemouchi ','Hamza','nemouchih@gmail.com','$2b$10$2OkWh7A6HIPpO0QEAr0cpud.rmafRuJphHggP0I8/MpsIssfvOJUa','2025-03-23 05:22:51'),(2003,'Oulefki','Samira','samira.oulefki@yahoo.fr','$2b$10$LRihbsTQoIumvqjNb.WLtOI/lDcQYuMWh6.j9U55jKjKG4AjJALuS','2025-03-23 05:40:24'),(2004,'Himrane ','Mohammed','hbm2737@yahoo.com','$2b$10$s/EYSWiOUWIjRNiZ7AFKZ.mOTCMaN1HXrRQfKBq6.P4Oowyg7kRaS','2025-03-23 05:41:32'),(2005,'Boukala','Mohammed','mboukala@usthb.dz','$2b$10$x4SbDpoByGhjew.KBkM2Ke1v7MgdlhdxxxEVrII7YhLSBQLg4TcrO','2025-03-23 05:42:07'),(2006,'Kheroua','Leila','kheroua_leila@yahoo.fr','$2b$10$RvM45btdkyPowEbXGYCF0OsNUmBiAsI7NdEcLuJULYtfTzx/ixjJW','2025-03-23 05:42:40'),(2007,'Zellal','Nassim','zellal.nassim@gmail.com','$2b$10$FbCIQ2FoNNSnqYGTAk.gyOLNA/l6rSuIZuuqHW0.iseSbxCITCK.W','2025-03-23 05:43:15'),(2008,'fggdfg','dgvfgfv','vfgdghgf','$2b$10$kx3gucZiyb05sXC99x62mu/XyaaWhQpFdLrzvvCl2.S4LnInMGJ5K','2025-03-23 06:37:56'),(2009,'Berbar','Ahmed','ahmedberbar@hotmail.com','$2b$10$qjDyroDRNkMV4/81AC/9PeXaTmhwpgXQbOlyLG/q0s3UNS5V0Capm','2025-03-23 07:38:06'),(2010,'Benkaouha','Haroune','haroun.benkaouha@gmail.com','$2b$10$DUA8J5TiuGVd2A96uNMQQun8jB8JAvTgzxQcLuoluzuwXPKodBFe.','2025-03-23 07:38:48'),(212131095493,'Chabri','Abdelmalek','malek@gmail.com','15091509','2025-03-19 06:54:55'),(212131095495,'suarez','abdou','benazouaou@gmail.com','rWdIcI9H','2025-04-27 11:44:52'),(212131195496,'Merakchi','Rahma','merakchirahma@gmail.com','iJlmFfGI','2025-04-27 13:03:22'),(212131595490,'abdou','suarez','cc.crb2016@gmail.com','xvet7y97','2025-04-27 12:50:27'),(212231446507,'Sayadi','Chaima','chaimasayadi12@gmail.com','9d14w0sE','2025-04-27 11:16:39'),(222231657517,'Merakchi','Rahma','rahma@gmail.com','BrZggGGU','2025-03-22 06:39:55');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-03 12:48:06
