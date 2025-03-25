import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaComments, FaChevronLeft, FaChevronRight, FaTimesCircle } from 'react-icons/fa';

const MesClubsMembre = ({ clubsMembre, setClubsMembre, setError }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [publications, setPublications] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [showMessagerie, setShowMessagerie] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [alert, setAlert] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  // Fonction pour faire défiler automatiquement vers le bas de la messagerie
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialisation des indices pour le carrousel d'images des publications
  useEffect(() => {
    const initialIndexes = {};
    publications.forEach(pub => {
      if (pub.images && Array.isArray(pub.images) && pub.images.length > 0) {
        initialIndexes[`pub-${pub.ID_publication}`] = 0;
      }
    });
    setCurrentImageIndex(initialIndexes);
  }, [publications]);

  // Afficher une alerte d'erreur
  const showErrorAlert = (message) => {
    setAlert({
      type: 'error',
      message,
      onClose: () => setAlert(null),
    });
  };

  // Sélectionner un club et charger ses publications
  const handleSelectClub = async (club) => {
    setSelectedClub(club);
    setShowMessagerie(false);
    setMessages([]);
    setPublications([]);
    setAlert(null);

    if (!club || !club.ID_club) {
      showErrorAlert('Club invalide. Veuillez sélectionner un autre club.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/publicationsCLUB/club/${club.ID_club}`);
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la récupération des publications');
        } else {
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }
      const data = await response.json();
      setPublications(data || []);
    } catch (err) {
      showErrorAlert(err.message);
      setPublications([]);
    }
  };

  // Afficher la messagerie du club sélectionné
  const handleShowMessagerie = async () => {
    setShowMessagerie(true);
    setAlert(null);

    if (!selectedClub || !selectedClub.ID_club) {
      showErrorAlert('Aucun club sélectionné pour la messagerie.');
      return;
    }

    try {
      setIsLoadingMessages(true);
      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}/user/${matricule}`);
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la récupération des messages');
        } else {
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }
      const messagesData = await response.json();
      setMessages(messagesData || []);
    } catch (err) {
      showErrorAlert(err.message);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Envoyer un message dans la messagerie
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      showErrorAlert('Le message ne peut pas être vide');
      return;
    }

    try {
      setIsSendingMessage(true);
      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: selectedClub.ID_club,
          expediteur: matricule,
          contenu: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l’envoi du message');
        } else {
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }

      const newMessages = await response.json();
      setMessages([...messages, ...newMessages]);
      setNewMessage('');
    } catch (err) {
      showErrorAlert(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Gérer le "J'aime" sur une publication
  const handleLikePublication = async (publicationId) => {
    try {
      const response = await fetch(`${API_URL}/publicationsCLUB/${publicationId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricule }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du like');
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }

      const updatedPublication = await response.json();
      setPublications(prevPublications =>
        prevPublications.map(pub =>
          pub.ID_publication === publicationId
            ? {
                ...pub,
                likes: updatedPublication.likes || pub.likes,
                liked_by: updatedPublication.liked_by || pub.liked_by || [],
              }
            : pub
        )
      );
    } catch (err) {
      showErrorAlert(err.message);
    }
  };

  // Ajouter un commentaire à une publication
  const handleAddComment = async (publicationId) => {
    const contenu = newComment[publicationId] ? newComment[publicationId].trim() : '';
    if (!contenu) {
      showErrorAlert('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/publicationsCLUB/${publicationId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricule, contenu }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l’ajout du commentaire');
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }

      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`);
      if (!updatedPublications.ok) {
        const contentType = updatedPublications.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await updatedPublications.json();
          throw new Error(errorData.error || 'Erreur lors de la récupération des publications mises à jour');
        } else {
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
      }
      const data = await updatedPublications.json();
      setPublications(data || []);
      setNewComment(prev => ({ ...prev, [publicationId]: '' }));
    } catch (err) {
      showErrorAlert(err.message);
    }
  };

  // Navigation dans le carrousel d'images
  const handlePrevImage = (id, length) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`pub-${id}`]: (prev[`pub-${id}`] - 1 + length) % length,
    }));
  };

  const handleNextImage = (id, length) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`pub-${id}`]: (prev[`pub-${id}`] + 1) % length,
    }));
  };

  // Rafraîchissement automatique des messages toutes les 10 secondes
  useEffect(() => {
    let interval;
    if (showMessagerie && selectedClub) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}/user/${matricule}`);
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Erreur lors de la récupération des messages');
            } else {
              throw new Error('Réponse inattendue du serveur (non-JSON)');
            }
          }
          const messagesData = await response.json();
          setMessages(messagesData || []);
        } catch (err) {
          console.error('Erreur lors du rafraîchissement des messages:', err.message);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [showMessagerie, selectedClub, matricule]);

  return (
    <>
    <div id="clubs">
      <div className="header">
        <h1>Mes Clubs (Membre)</h1>
        <p>Consultez les clubs dont vous êtes membre</p>
      </div>

      <div className="content-grid">
        <div className="event-list">
          {clubsMembre.length === 0 ? (
            <p className="no-data">Vous n’êtes membre d’aucun club. Rejoignez un club pour voir ses publications.</p>
          ) : (
            <>
              <h3>Choisissez un club :</h3>
              <ul id="clubs-list">
                {clubsMembre.map(club => (
                  <li key={club.ID_club} className="club-item">
                    <div className="club-preview" onClick={() => handleSelectClub(club)}>
                      <div className="club-image-container">
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className="club-image"
                            onError={(e) => {
                              console.error('Erreur chargement image club:', `${API_URL}${club.image_url}`);
                              e.target.src = 'https://via.placeholder.com/60x60?text=Club';
                            }}
                          />
                        ) : (
                          <div className="club-placeholder">Club</div>
                        )}
                      </div>
                      <h4 className="club-name">{club.nom}</h4>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedClub && (
                <div className="club-details">
                  <h3>{selectedClub.nom}</h3>
                  <div className="club-details-header">
                    <div className="club-image-container">
                      {selectedClub.image_url ? (
                        <img
                          src={`${API_URL}${selectedClub.image_url}`}
                          alt={selectedClub.nom}
                          className="club-image"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x60?text=Club';
                          }}
                        />
                      ) : (
                        <div className="club-placeholder">Club</div>
                      )}
                    </div>
                    <div className="club-info">
                      <h4>{selectedClub.nom}</h4>
                      <p>{selectedClub.description_club || 'Aucune description'}</p>
                    </div>
                  </div>
                  <div className="button-group">
                    <button onClick={() => setShowMessagerie(false)}>
                      <FaHeart /> Voir les Publications
                    </button>
                    <button onClick={handleShowMessagerie}>
                      <FaComments /> Messagerie
                    </button>
                  </div>

                  {showMessagerie ? (
                    <div className="messagerie-section">
                      <h4 className="section-title">Messagerie de groupe - {selectedClub.nom}</h4>
                      <div className="messagerie-container">
                        {isLoadingMessages ? (
                          <p style={{ textAlign: 'center', color: '#5483b3' }}>Chargement des messages...</p>
                        ) : messages.length === 0 ? (
                          <p className="no-data">Aucun message dans ce club.</p>
                        ) : (
                          messages.map(msg => (
                            <div
                              key={msg.ID_message}
                              className={`message ${msg.expediteur === matricule ? 'sent' : 'received'}`}
                            >
                              <div className="message-header">
                                <div className="message-sender">
                                  {msg.expediteur === matricule ? 'Vous' : `${msg.expediteur_nom} ${msg.expediteur_prenom}`}
                                </div>
                                <div className="message-timestamp">
                                  {new Date(msg.date_envoi).toLocaleString()}
                                </div>
                              </div>
                              <div className="message-content">
                                {msg.contenu}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <form onSubmit={handleSendMessage} className="message-form">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrire un message..."
                          disabled={isSendingMessage}
                        />
                        <button type="submit" disabled={isSendingMessage}>
                          {isSendingMessage ? 'Envoi...' : 'Envoyer'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="publications-section">
                      <h4 className="section-title">Publications de {selectedClub.nom}</h4>
                      {publications.length === 0 ? (
                        <p className="no-data">Aucune publication pour ce club.</p>
                      ) : (
                        <ul className="social-posts">
                          {publications.map(pub => (
                            <li key={pub.ID_publication} className="social-post-card">
                              <div className="post-header">
                                <div className="post-club-info">
                                  <div className="club-image-container">
                                    {selectedClub.image_url ? (
                                      <img
                                        src={`${API_URL}${selectedClub.image_url}`}
                                        alt={selectedClub.nom}
                                        className="club-image"
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/40x40?text=Club';
                                        }}
                                      />
                                    ) : (
                                      <div className="club-placeholder">Club</div>
                                    )}
                                  </div>
                                  <div>
                                    <h5>{selectedClub.nom}</h5>
                                    <p className="post-date">
                                      {pub.date_publication
                                        ? new Date(pub.date_publication).toLocaleDateString()
                                        : 'Date inconnue'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {pub.images && Array.isArray(pub.images) && pub.images.length > 0 ? (
                                <div className="post-image-carousel">
                                  <button
                                    className="carousel-button prev"
                                    onClick={() => handlePrevImage(pub.ID_publication, pub.images.length)}
                                    disabled={pub.images.length <= 1}
                                  >
                                    <FaChevronLeft />
                                  </button>
                                  <div className="carousel-image-container">
                                    <img
                                      src={`${API_URL}${pub.images[currentImageIndex[`pub-${pub.ID_publication}`] || 0]?.image_url}`}
                                      alt={`Publication ${currentImageIndex[`pub-${pub.ID_publication}`] + 1}`}
                                      className="carousel-image"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible';
                                      }}
                                    />
                                  </div>
                                  <button
                                    className="carousel-button next"
                                    onClick={() => handleNextImage(pub.ID_publication, pub.images.length)}
                                    disabled={pub.images.length <= 1}
                                  >
                                    <FaChevronRight />
                                  </button>
                                  {pub.images.length > 1 && (
                                    <div className="carousel-indicators">
                                      {pub.images.map((_, index) => (
                                        <span
                                          key={index}
                                          className={`indicator ${index === (currentImageIndex[`pub-${pub.ID_publication}`] || 0) ? 'active' : ''}`}
                                          onClick={() => setCurrentImageIndex(prev => ({ ...prev, [`pub-${pub.ID_publication}`]: index }))}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                              <div className="post-content">
                                <p>{pub.contenu || 'Aucun contenu'}</p>
                              </div>
                              <div className="post-actions">
                                <button
                                  className={`like-button ${pub.liked_by && Array.isArray(pub.liked_by) && pub.liked_by.includes(matricule) ? 'liked' : ''}`}
                                  onClick={() => handleLikePublication(pub.ID_publication)}
                                >
                                  <FaHeart /> {pub.likes || 0} J’aime
                                </button>
                                <span>{pub.commentaires_count || 0} Commentaire(s)</span>
                              </div>
                              <div className="post-comments">
                                <h5>Commentaires :</h5>
                                {pub.commentaires && Array.isArray(pub.commentaires) && pub.commentaires.length > 0 ? (
                                  <ul>
                                    {pub.commentaires.map(comment => (
                                      <li key={comment.ID_commentaire}>
                                        <strong>{comment.nom || 'Utilisateur'} {comment.prenom || ''} :</strong> {comment.contenu || 'Aucun contenu'}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>Aucun commentaire.</p>
                                )}
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddComment(pub.ID_publication);
                                  }}
                                  className="comment-form"
                                >
                                  <textarea
                                    value={newComment[pub.ID_publication] || ''}
                                    onChange={(e) =>
                                      setNewComment(prev => ({
                                        ...prev,
                                        [pub.ID_publication]: e.target.value,
                                      }))
                                    }
                                    placeholder="Ajouter un commentaire..."
                                    rows="2"
                                  />
                                  <button type="submit">
                                    <FaComment /> Commenter
                                  </button>
                                </form>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {alert && (
        <div className={`custom-alert ${alert.type}`}>
          <div className="alert-content">
            <div className="alert-icon">
              <FaTimesCircle />
            </div>
            <p>{alert.message}</p>
            <div className="alert-buttons">
              <button className="close-button" onClick={alert.onClose}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default MesClubsMembre;