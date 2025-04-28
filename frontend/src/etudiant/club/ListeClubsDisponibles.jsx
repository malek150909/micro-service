import React, { useState } from 'react';
import { FaEnvelope, FaSearch } from 'react-icons/fa';
import styles from './club.module.css';

const ListeClubsDisponibles = ({ clubsDisponibles, setClubsDisponibles, setError }) => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const API_URL = 'http://events.localhost';
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [confirmationMessages, setConfirmationMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleClubDetails = (clubId) => {
    setSelectedClubId(selectedClubId === clubId ? null : clubId);
  };

  const handleDemandeRejoindre = async (clubId) => {
    try {
      const response = await fetch(`${API_URL}/demandesCLUB/rejoindre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule_etudiant: matricule, clubId }),
      });
      if (!response.ok) throw new Error('Erreur lors de l’envoi de la demande');

      setConfirmationMessages((prev) => ({
        ...prev,
        [clubId]: 'Tu seras bientôt le bienvenu dans notre club !',
      }));

      setTimeout(() => {
        setClubsDisponibles(clubsDisponibles.filter((club) => club.ID_club !== clubId));
        setConfirmationMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[clubId];
          return newMessages;
        });
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredClubs = clubsDisponibles.filter((club) =>
    club.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className={styles['CLUB-ETD-header']}>
        <h1>Clubs Disponibles</h1>
        <p>Consultez les clubs que vous pouvez rejoindre</p>
      </div>

      <div className={styles['CLUB-ETD-content-grid']}>
        <div className={styles['CLUB-ETD-search-bar']}>
          <div className={styles['CLUB-ETD-search-container']}>
            <FaSearch className={styles['CLUB-ETD-search-icon']} />
            <input
              type="text"
              placeholder="Rechercher un club"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles['CLUB-ETD-search-input']}
            />
          </div>
        </div>

        <div className={styles['CLUB-ETD-available-clubs-list']}>
          <h3>Clubs Disponibles</h3>
          {filteredClubs.length === 0 ? (
            <div className={styles['CLUB-ETD-no-data']}>
              {searchQuery
                ? 'Aucun club trouvé pour cette recherche'
                : 'Aucun club disponible pour rejoindre'}
            </div>
          ) : (
            <ul id="CLUB-ETD-available-clubs">
              {filteredClubs.map((club) => (
                <li key={club.ID_club} className={styles['CLUB-ETD-available-club-item']}>
                  {confirmationMessages[club.ID_club] ? (
                    <div className={styles['CLUB-ETD-confirmation-message']}>
                      {confirmationMessages[club.ID_club]}
                    </div>
                  ) : (
                    <div
                      className={`${styles['CLUB-ETD-available-club-preview']} ${
                        selectedClubId === club.ID_club ? styles['CLUB-ETD-expanded'] : ''
                      }`}
                      onClick={() => handleToggleClubDetails(club.ID_club)}
                    >
                      <div className={styles['CLUB-ETD-available-club-image-container']}>
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className={styles['CLUB-ETD-available-club-image']}
                            onError={(e) => {
                              console.error('Erreur chargement image club:', `${API_URL}${club.image_url}`);
                              e.target.src = 'https://via.placeholder.com/80x80?text=Image+Indisponible';
                            }}
                          />
                        ) : (
                          <div className={styles['CLUB-ETD-available-club-placeholder']}>
                            {club.nom.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className={styles['CLUB-ETD-available-club-name']}>{club.nom}</h4>

                      {selectedClubId === club.ID_club && (
                        <div className={styles['CLUB-ETD-club-details']}>
                          <p className={styles['CLUB-ETD-club-description']}>
                            {club.description_club || 'Aucune description'}
                          </p>
                          <p className={styles['CLUB-ETD-club-manager']}>
                            <strong>Gérant :</strong> {club.gerant_nom} {club.gerant_prenom}
                          </p>
                          <button
                            className={styles['CLUB-ETD-join-button']}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDemandeRejoindre(club.ID_club);
                            }}
                          >
                            <FaEnvelope /> Demande de Rejoindre
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default ListeClubsDisponibles;