-- MySQL dump 10.13  Distrib 5.7.18, for osx10.12 (x86_64)
--
-- Host: localhost    Database: filmaffinity
-- ------------------------------------------------------
-- Server version	5.7.12

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actor`
--

DROP TABLE IF EXISTS `actor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actor` (
  `idActor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idActor`),
  UNIQUE KEY `actor_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmActor`
--

DROP TABLE IF EXISTS `assocFilmActor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmActor` (
  `idAssocFilmActor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idActor` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmActor`),
  UNIQUE KEY `unique_film_actor` (`idFilm`,`idActor`),
  KEY `assocFilmActor_fk_idActor_idx` (`idActor`),
  CONSTRAINT `assocFilmActor_fk_idActor` FOREIGN KEY (`idActor`) REFERENCES `actor` (`idActor`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmActor_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmCinematographer`
--

DROP TABLE IF EXISTS `assocFilmCinematographer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmCinematographer` (
  `idAssocFilmCinematographer` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idCinematographer` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmCinematographer`),
  UNIQUE KEY `unique_film_cinematographer` (`idFilm`,`idCinematographer`),
  KEY `assocFilmCinematographer_fk_idCinematographer_idx` (`idCinematographer`),
  CONSTRAINT `assocFilmCinematographer_fk_idCinematographer` FOREIGN KEY (`idCinematographer`) REFERENCES `cinematographer` (`idCinematographer`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmCinematographer_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmDirector`
--

DROP TABLE IF EXISTS `assocFilmDirector`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmDirector` (
  `idAssocFilmDirector` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idDirector` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmDirector`),
  UNIQUE KEY `unique_film_director` (`idFilm`,`idDirector`),
  KEY `assocFilmDirector_fk_idDirector_idx` (`idDirector`),
  CONSTRAINT `assocFilmDirector_fk_idDirector` FOREIGN KEY (`idDirector`) REFERENCES `director` (`idDirector`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmDirector_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmGenre`
--

DROP TABLE IF EXISTS `assocFilmGenre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmGenre` (
  `idAssocFilmGenre` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idGenre` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmGenre`),
  UNIQUE KEY `unique_film_genre` (`idFilm`,`idGenre`),
  KEY `assocFilmGenre_fk_idGenre_idx` (`idGenre`),
  CONSTRAINT `assocFilmGenre_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmGenre_fk_idGenre` FOREIGN KEY (`idGenre`) REFERENCES `genre` (`idGenre`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmMusician`
--

DROP TABLE IF EXISTS `assocFilmMusician`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmMusician` (
  `idAssocFilmMusician` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idMusician` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmMusician`),
  UNIQUE KEY `unique_film_musician` (`idFilm`,`idMusician`),
  KEY `assocFilmMusician_fk_idMusician_idx` (`idMusician`),
  CONSTRAINT `assocFilmMusician_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmMusician_fk_idMusician` FOREIGN KEY (`idMusician`) REFERENCES `musician` (`idMusician`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmScreenplayer`
--

DROP TABLE IF EXISTS `assocFilmScreenplayer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmScreenplayer` (
  `idAssocFilmScreenplayer` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idScreenplayer` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmScreenplayer`),
  UNIQUE KEY `unique_film_screenplayer` (`idFilm`,`idScreenplayer`),
  KEY `assocFilmScreenplayer_fk_idScreenplayer_idx` (`idScreenplayer`),
  CONSTRAINT `assocFilmScreenplayer_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmScreenplayer_fk_idScreenplayer` FOREIGN KEY (`idScreenplayer`) REFERENCES `screenplayer` (`idScreenplayer`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assocFilmTopic`
--

DROP TABLE IF EXISTS `assocFilmTopic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assocFilmTopic` (
  `idAssocFilmTopic` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `idFilm` int(10) unsigned NOT NULL,
  `idTopic` int(10) unsigned NOT NULL,
  `relevancePosition` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idAssocFilmTopic`),
  UNIQUE KEY `unique_film_topic` (`idFilm`,`idTopic`),
  KEY `assocFilmTopic_fk_idTopic_idx` (`idTopic`),
  CONSTRAINT `assocFilmTopic_fk_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assocFilmTopic_fk_idTopic` FOREIGN KEY (`idTopic`) REFERENCES `topic` (`idTopic`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cinematographer`
--

DROP TABLE IF EXISTS `cinematographer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cinematographer` (
  `idCinematographer` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idCinematographer`),
  UNIQUE KEY `cinematographer_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `director`
--

DROP TABLE IF EXISTS `director`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `director` (
  `idDirector` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idDirector`),
  UNIQUE KEY `director_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `failedCrawlFilm`
--

DROP TABLE IF EXISTS `failedCrawlFilm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failedCrawlFilm` (
  `idFilm` int(10) unsigned NOT NULL,
  PRIMARY KEY (`idFilm`),
  UNIQUE KEY `idFilm_UNIQUE` (`idFilm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `film`
--

DROP TABLE IF EXISTS `film`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `film` (
  `idFilm` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `originalTitle` varchar(255) NOT NULL,
  `year` char(4) DEFAULT NULL,
  `duration` mediumint(8) unsigned DEFAULT NULL,
  `country` char(2) DEFAULT NULL,
  `producer` text,
  `awards` text,
  `synopsis` text,
  `officialReviews` text,
  `rating` decimal(2,1) unsigned DEFAULT NULL,
  `numRatings` mediumint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`idFilm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `filmInTheatres`
--

DROP TABLE IF EXISTS `filmInTheatres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `filmInTheatres` (
  `idFilm` int(10) unsigned NOT NULL,
  `releaseDate` date NOT NULL,
  PRIMARY KEY (`idFilm`),
  UNIQUE KEY `idFilm_UNIQUE` (`idFilm`),
  CONSTRAINT `fk_filmInTheatres_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `filmPopular`
--

DROP TABLE IF EXISTS `filmPopular`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `filmPopular` (
  `idFilm` int(10) unsigned NOT NULL,
  `ranking` tinyint(1) unsigned NOT NULL,
  PRIMARY KEY (`idFilm`),
  UNIQUE KEY `idFilm_UNIQUE` (`idFilm`),
  CONSTRAINT `fk_filmPopular_idFilm` FOREIGN KEY (`idFilm`) REFERENCES `film` (`idFilm`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genre`
--

DROP TABLE IF EXISTS `genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `genre` (
  `idGenre` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idGenre`),
  UNIQUE KEY `genre_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `musician`
--

DROP TABLE IF EXISTS `musician`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `musician` (
  `idMusician` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idMusician`),
  UNIQUE KEY `musician_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `screenplayer`
--

DROP TABLE IF EXISTS `screenplayer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `screenplayer` (
  `idScreenplayer` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idScreenplayer`),
  UNIQUE KEY `screenplayer_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `topic`
--

DROP TABLE IF EXISTS `topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topic` (
  `idTopic` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`idTopic`),
  UNIQUE KEY `name_topic` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `idUser` int unsigned NOT NULL AUTO_INCREMENT,
  `idUserFilmaffinity` int unsigned NOT NULL,
  `cookieFilmaffinity` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `idUserFIlmaffinity` (`idUserFilmaffinity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-03-07 15:07:52
