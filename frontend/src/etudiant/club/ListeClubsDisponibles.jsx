import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';

const ListeClubsDisponibles = ({ clubsDisponibles, setClubsDisponibles, setError }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';
  const [selectedClubId, setSelectedClubId] = useState(null); // Gérer le club déplié
  const [confirmationMessages, setConfirmationMessages] = useState({}); // Gérer les messages de confirmation
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

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

      // Ajouter un message de confirmation pour ce club
      setConfirmationMessages((prev) => ({
        ...prev,
        [clubId]: 'Tu seras bientôt le bienvenu dans notre club !',
      }));

      // Supprimer le club de la liste après un délai pour laisser le temps de voir le message
      setTimeout(() => {
        setClubsDisponibles(clubsDisponibles.filter((club) => club.ID_club !== clubId));
        setConfirmationMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[clubId];
          return newMessages;
        });
      }, 2000); // 2 secondes de délai
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <div id="clubs">
      <div className="header">
        <h1>Clubs Disponibles</h1>
        <p>Consultez les clubs que vous pouvez rejoindre</p>
      </div>

      <div className="content-grid">
        <div className="event-list">
          <ul id="clubs-list">
            {clubsDisponibles.length === 0 ? (
              <li className="no-results">Aucun club disponible pour rejoindre</li>
            ) : (
              clubsDisponibles.map((club) => (
                <li key={club.ID_club} className="club-item">
                  {confirmationMessages[club.ID_club] ? (
                    <div className="confirmation-message">
                      {confirmationMessages[club.ID_club]}
                    </div>
                  ) : (
                    <div
                      className={`club-card ${selectedClubId === club.ID_club ? 'expanded' : ''}`}
                      onClick={() => handleToggleClubDetails(club.ID_club)}
                    >
                      <div className="club-preview">
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className="club-image"
                            onError={(e) => {
                              console.error('Erreur chargement image club:', `${API_URL}${club.image_url}`);
                              e.target.src = 'https://via.placeholder.com/80x80?text=Image+Indisponible';
                            }}
                          />
                        ) : (
                          <div className="club-placeholder">Aucune image</div>
                        )}
                        <h4 className="club-name">{club.nom}</h4>
                      </div>

                      {selectedClubId === club.ID_club && (
                        <div className="club-details">
                          <p className="club-description">
                            {club.description_club || 'Aucune description'}
                          </p>
                          <p className="club-manager">
                            <strong>Gérant :</strong> {club.gerant_nom} {club.gerant_prenom}
                          </p>
                          <button
                            className="join-button"
                            onClick={(e) => {
                              e.stopPropagation(); // Empêche le clic sur le bouton de déclencher le toggle
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
              ))
            )}
          </ul>
        </div>
      </div>
      </div>
    </>
  );
};

export default ListeClubsDisponibles;