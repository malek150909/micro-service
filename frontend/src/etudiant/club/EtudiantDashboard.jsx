import React, { useState, useEffect } from 'react';
import { FaUsers, FaList, FaEnvelope, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GererMesClubs from './GererMesClubs';
import ListeClubsDisponibles from './ListeClubsDisponibles';
import MesClubsMembre from './MesClubsMembre';
import DemandeCreationClub from './DemandeCreationClub';
import styles from './club.module.css';

const EtudiantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gerer');
  const [clubsGerant, setClubsGerant] = useState([]);
  const [clubsMembre, setClubsMembre] = useState([]);
  const [clubsDisponibles, setClubsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const API_URL = 'http://localhost:8084';

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/clubsCLUB/etudiant/${matricule}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des clubs');
        }
        const data = await response.json();
        setClubsGerant(data.clubsGerant);
        setClubsMembre(data.clubsMembre);
        setClubsDisponibles(data.clubsDisponibles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [matricule]);

  const handleBack = () => {
    navigate('/etudiant');
  };

  if (loading) {
    return <div className={styles['CLUB-ETD-container']}>Chargement...</div>;
  }

  return (
    <div className={styles['CLUB-ETD-container']}>
      <div className={styles['CLUB-ETD-background-shapes']}>
        <div className={styles['CLUB-ETD-shape1']}></div>
        <div className={styles['CLUB-ETD-shape2']}></div>
      </div>

      <aside className={styles['CLUB-ETD-sidebar']}>
        <div className={styles['CLUB-ETD-logo']}>
          <h2>Club et Événement</h2>
        </div>
        <button className={styles['CLUB-ETD-sidebar-button']} onClick={handleBack}>
          <FaHome /> retour a l'accueil
        </button>
        <button
          className={`${styles['CLUB-ETD-sidebar-button']} ${activeTab === 'gerer' ? styles['CLUB-ETD-active'] : ''}`}
          onClick={() => setActiveTab('gerer')}
        >
          <FaUsers /> Gérer mes Clubs
        </button>
        <button
          className={`${styles['CLUB-ETD-sidebar-button']} ${activeTab === 'disponibles' ? styles['CLUB-ETD-active'] : ''}`}
          onClick={() => setActiveTab('disponibles')}
        >
          <FaList /> Consulter les Clubs
        </button>
        <button
          className={`${styles['CLUB-ETD-sidebar-button']} ${activeTab === 'membre' ? styles['CLUB-ETD-active'] : ''}`}
          onClick={() => setActiveTab('membre')}
        >
          <FaUsers /> Mes Clubs (Membre)
        </button>
        <button
          className={`${styles['CLUB-ETD-sidebar-button']} ${activeTab === 'demande' ? styles['CLUB-ETD-active'] : ''}`}
          onClick={() => setActiveTab('demande')}
        >
          <FaEnvelope /> Demande de Création
        </button>
      </aside>

      <main className={styles['CLUB-ETD-main-content']}>
        <section className={styles['CLUB-ETD-tab-content']}>
          {activeTab === 'gerer' && (
            <GererMesClubs
              matricule={matricule}
              clubsGerant={clubsGerant}
              setClubsGerant={setClubsGerant}
              setError={setError}
            />
          )}
          {activeTab === 'disponibles' && (
            <ListeClubsDisponibles
              matricule={matricule}
              clubsDisponibles={clubsDisponibles}
              setClubsDisponibles={setClubsDisponibles}
              setError={setError}
            />
          )}
          {activeTab === 'membre' && (
            <MesClubsMembre
              matricule={matricule}
              clubsMembre={clubsMembre}
              setClubsMembre={setClubsMembre}
              setError={setError}
            />
          )}
          {activeTab === 'demande' && (
            <DemandeCreationClub
              matricule={matricule}
              setError={setError}
            />
          )}
          {error && <p className={styles['CLUB-ETD-error-message']}>{error}</p>}
        </section>
      </main>
    </div>
  );
};

export default EtudiantDashboard;