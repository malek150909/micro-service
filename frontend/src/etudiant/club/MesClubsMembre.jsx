import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaComments, FaChevronLeft, FaChevronRight, FaTimesCircle } from 'react-icons/fa';
import styles from './club.module.css';

const MesClubsMembre = ({ clubsMembre, setClubsMembre, setError }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [publications, setPublications] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [showMessagerie, setShowMessagerie] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageFile, setMessageFile] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [alert, setAlert] = useState(null);
  const [showComments, setShowComments] = useState({});
  const messagesEndRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const API_URL = 'http://localhost:8084';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initialIndexes = {};
    publications.forEach(pub => {
      if (pub.images && Array.isArray(pub.images) && pub.images.length > 0) {
        initialIndexes[`pub-${pub.ID_publication}`] = 0;
      }
    });
    setCurrentImageIndex(initialIndexes);
  }, [publications]);

  const showErrorAlert = (message) => {
    setAlert({
      type: 'error',
      message,
      onClose: () => setAlert(null),
    });
  };

  const fetchMessages = async () => {
    if (!selectedClub || !selectedClub.ID_club || isFetchingMessages) {
      return;
    }

    try {
      setIsFetchingMessages(true);
      setIsLoadingMessages(true);
      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}/user/${matricule}`);
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de la récupération des messages');
      }
      const messagesData = await response.json();
      console.log('Messages reçus de l\'API:', messagesData);
      setMessages(messagesData || []);
    } catch (err) {
      showErrorAlert(err.message);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      setIsFetchingMessages(false);
    }
  };

  useEffect(() => {
    let interval;
    if (showMessagerie && selectedClub) {
      fetchMessages();
      interval = setInterval(() => {
        fetchMessages();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showMessagerie, selectedClub, matricule]);

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
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de la récupération des publications');
      }
      const data = await response.json();
      setPublications(data || []);
    } catch (err) {
      showErrorAlert(err.message);
      setPublications([]);
    }
  };

  const handleShowMessagerie = async () => {
    setShowMessagerie(true);
    setAlert(null);
    await fetchMessages();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !messageFile) {
      showErrorAlert('Le message ou le fichier ne peut pas être vide');
      return;
    }

    try {
      setIsSendingMessage(true);
      const formData = new FormData();
      formData.append('clubId', selectedClub.ID_club);
      formData.append('expediteur', matricule);
      formData.append('contenu', newMessage.trim() || 'Fichier joint');
      if (messageFile) {
        formData.append('file', messageFile);
      }

      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de l’envoi du message');
      }

      setNewMessage('');
      setMessageFile(null);
      setTimeout(async () => {
        await fetchMessages();
      }, 500);
    } catch (err) {
      showErrorAlert(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

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
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors du like');
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
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de l’ajout du commentaire');
      }

      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`);
      if (!updatedPublications.ok) {
        const contentType = updatedPublications.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await updatedPublications.json();
        } else {
          const text = await updatedPublications.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de la récupération des publications mises à jour');
      }
      const data = await updatedPublications.json();
      setPublications(data || []);
      setNewComment(prev => ({ ...prev, [publicationId]: '' }));
    } catch (err) {
      showErrorAlert(err.message);
    }
  };

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

  return (
    <>
      <div className={styles['CLUB-ETD-header']}>
        <h1>Mes Clubs (Membre)</h1>
        <p>Consultez les clubs dont vous êtes membre</p>
      </div>

      <div className={styles['CLUB-ETD-content-grid']}>
        <div className={styles['CLUB-ETD-event-list']}>
          {clubsMembre.length === 0 ? (
            <p className={styles['CLUB-ETD-no-data']}>Vous n’êtes membre d’aucun club. Rejoignez un club pour voir ses publications.</p>
          ) : (
            <>
              <h3>Choisissez un club :</h3>
              <ul id="clubs-list" className={styles['CLUB-ETD-clubs-list']}>
                {clubsMembre.map(club => (
                  <li key={club.ID_club} className={styles['CLUB-ETD-club-item']}>
                    <div className={styles['CLUB-ETD-club-preview']} onClick={() => handleSelectClub(club)}>
                      <div className={styles['CLUB-ETD-club-image-container']}>
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className={styles['CLUB-ETD-club-image']}
                            onError={(e) => {
                              console.error('Erreur chargement image club:', `${API_URL}${club.image_url}`);
                              e.target.src = 'https://via.placeholder.com/60x60?text=Club';
                            }}
                          />
                        ) : (
                          <div className={styles['CLUB-ETD-club-placeholder']}>Club</div>
                        )}
                      </div>
                      <h4 className={styles['CLUB-ETD-club-name']}>{club.nom}</h4>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedClub && (
                <div className={styles['CLUB-ETD-club-details']}>
                  <h3>{selectedClub.nom}</h3>
                  <div className={styles['CLUB-ETD-club-details-header']}>
                    <div className={styles['CLUB-ETD-club-image-container']}>
                      {selectedClub.image_url ? (
                        <img
                          src={`${API_URL}${selectedClub.image_url}`}
                          alt={selectedClub.nom}
                          className={styles['CLUB-ETD-club-image']}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x60?text=Club';
                          }}
                        />
                      ) : (
                        <div className={styles['CLUB-ETD-club-placeholder']}>Club</div>
                      )}
                    </div>
                    <div className={styles['CLUB-ETD-club-info']}>
                      <h4>{selectedClub.nom}</h4>
                      <p>{selectedClub.description_club || 'Aucune description'}</p>
                    </div>
                  </div>
                  <div className={styles['CLUB-ETD-button-group']}>
                    <button className={styles['CLUB-ETD-button']} onClick={() => setShowMessagerie(false)}>
                      <FaHeart /> Voir les Publications
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={handleShowMessagerie}>
                      <FaComments /> Messagerie
                    </button>
                  </div>

                  {showMessagerie ? (
                    <div className={styles['CLUB-ETD-messagerie-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Messagerie de groupe - {selectedClub.nom}</h4>
                      <div className={styles['CLUB-ETD-messagerie-container']} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {isLoadingMessages ? (
                          <p style={{ textAlign: 'center', color: '#5483b3' }}>Chargement des messages...</p>
                        ) : messages.length === 0 ? (
                          <p className={styles['CLUB-ETD-no-data']}>Aucun message dans ce club.</p>
                        ) : (
                          messages.map(msg => (
                            <div
                              key={msg.ID_message}
                              className={`${styles['CLUB-ETD-message']} ${String(msg.expediteur) === String(matricule) ? styles['CLUB-ETD-sent'] : styles['CLUB-ETD-received']}`}
                            >
                              <div className={styles['CLUB-ETD-message-header']}>
                                <div className={styles['CLUB-ETD-message-sender']}>
                                  {String(msg.expediteur) === String(matricule) ? 'Vous' : `${msg.expediteur_nom} ${msg.expediteur_prenom}`}
                                </div>
                                <div className={styles['CLUB-ETD-message-timestamp']}>
                                  {new Date(msg.date_envoi).toLocaleString()}
                                </div>
                              </div>
                              <div className={styles['CLUB-ETD-message-content']}>
                                {msg.contenu}
                                {msg.filePath && (
                                  <div>
                                    <a
                                      href={`${API_URL}${msg.filePath}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={msg.fileName}
                                    >
                                      {msg.fileName} (Télécharger)
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <form onSubmit={handleSendMessage} className={styles['CLUB-ETD-message-form']}>
                        <textarea
                          className={styles['CLUB-ETD-textarea']}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrire un message..."
                        />
                        <div className={styles['CLUB-ETD-file-input-container']}>
                          <input
                            type="file"
                            id="messageFile"
                            accept="image/jpeg,image/png,application/pdf,text/plain"
                            onChange={(e) => setMessageFile(e.target.files[0])}
                          />
                          <label htmlFor="messageFile">Joindre un fichier</label>
                        </div>
                        {messageFile && <p className={styles['CLUB-ETD-file-selected']}>Fichier sélectionné : {messageFile.name}</p>}
                        <button className={styles['CLUB-ETD-button']} type="submit" disabled={isSendingMessage}>
                          {isSendingMessage ? 'Envoi...' : 'Envoyer'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className={styles['CLUB-ETD-publications-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Publications de {selectedClub.nom}</h4>
                      {publications.length === 0 ? (
                        <p className={styles['CLUB-ETD-no-data']}>Aucune publication pour ce club.</p>
                      ) : (
                        <ul className={styles['CLUB-ETD-social-posts']}>
                          {publications.map(pub => (
                            <li key={pub.ID_publication} className={styles['CLUB-ETD-social-post-card']}>
                              <div className={styles['CLUB-ETD-post-header']}>
                                <div className={styles['CLUB-ETD-post-club-info']}>
                                  <div className={styles['CLUB-ETD-club-image-container']}>
                                    {selectedClub.image_url ? (
                                      <img
                                        src={`${API_URL}${selectedClub.image_url}`}
                                        alt={selectedClub.nom}
                                        className={styles['CLUB-ETD-club-image']}
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/40x40?text=Club';
                                        }}
                                      />
                                    ) : (
                                      <div className={styles['CLUB-ETD-club-placeholder']}>Club</div>
                                    )}
                                  </div>
                                  <div>
                                    <h5>{selectedClub.nom}</h5>
                                    <p className={styles['CLUB-ETD-post-date']}>
                                      {new Date(pub.date_publication).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {pub.images && Array.isArray(pub.images) && pub.images.length > 0 ? (
                                <div className={styles['CLUB-ETD-post-image-carousel']}>
                                  <button
                                    className={`${styles['CLUB-ETD-carousel-button']} ${styles['CLUB-ETD-prev']}`}
                                    onClick={() => handlePrevImage(pub.ID_publication, pub.images.length)}
                                    disabled={pub.images.length <= 1}
                                  >
                                    <FaChevronLeft />
                                  </button>
                                  <div className={styles['CLUB-ETD-carousel-image-container']}>
                                    <img
                                      src={`${API_URL}${pub.images[currentImageIndex[`pub-${pub.ID_publication}`] || 0].image_url}`}
                                      alt={`Publication ${currentImageIndex[`pub-${pub.ID_publication}`] + 1}`}
                                      className={styles['CLUB-ETD-carousel-image']}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible';
                                      }}
                                    />
                                  </div>
                                  <button
                                    className={`${styles['CLUB-ETD-carousel-button']} ${styles['CLUB-ETD-next']}`}
                                    onClick={() => handleNextImage(pub.ID_publication, pub.images.length)}
                                    disabled={pub.images.length <= 1}
                                  >
                                    <FaChevronRight />
                                  </button>
                                  {pub.images.length > 1 && (
                                    <div className={styles['CLUB-ETD-carousel-indicators']}>
                                      {pub.images.map((_, index) => (
                                        <span
                                          key={index}
                                          className={`${styles['CLUB-ETD-indicator']} ${index === (currentImageIndex[`pub-${pub.ID_publication}`] || 0) ? styles['CLUB-ETD-active'] : ''}`}
                                          onClick={() => setCurrentImageIndex(prev => ({ ...prev, [`pub-${pub.ID_publication}`]: index }))}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                              <div className={styles['CLUB-ETD-post-content']}>
                                <p>{pub.contenu}</p>
                              </div>
                              <div className={styles['CLUB-ETD-post-actions']}>
                                <button
                                  onClick={() => handleLikePublication(pub.ID_publication)}
                                  className={`${styles['CLUB-ETD-like-button']} ${pub.liked_by && pub.liked_by.includes(Number(matricule)) ? styles['CLUB-ETD-liked'] : ''}`}
                                >
                                  <FaHeart /> {pub.likes || 0} J’aime
                                </button>
                                <span>{pub.commentaires_count || 0} Commentaire(s)</span>
                              </div>
                              <div className={styles['CLUB-ETD-post-comments']}>
                                <h5>
                                  Commentaires :
                                  <button
                                    className={styles['CLUB-ETD-toggle-comments-btn']}
                                    onClick={() =>
                                      setShowComments(prev => ({
                                        ...prev,
                                        [pub.ID_publication]: !prev[pub.ID_publication],
                                      }))
                                    }
                                  >
                                    {showComments[pub.ID_publication] ? 'Masquer' : 'Afficher'}
                                  </button>
                                </h5>
                                {showComments[pub.ID_publication] && (
                                  <>
                                    {pub.commentaires && pub.commentaires.length > 0 ? (
                                      <ul className={styles['CLUB-ETD-comments-list']}>
                                        {pub.commentaires.map(comment => (
                                          <li key={comment.ID_commentaire}>
                                            <strong>{comment.nom} {comment.prenom} :</strong> {comment.contenu}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>Aucun commentaire.</p>
                                    )}
                                    <div className={styles['CLUB-ETD-add-comment']}>
                                      <textarea
                                        className={styles['CLUB-ETD-textarea']}
                                        value={newComment[pub.ID_publication] || ''}
                                        onChange={(e) =>
                                          setNewComment(prev => ({
                                            ...prev,
                                            [pub.ID_publication]: e.target.value,
                                          }))
                                        }
                                        placeholder="Ajouter un commentaire..."
                                      />
                                      <button className={styles['CLUB-ETD-button']} onClick={() => handleAddComment(pub.ID_publication)}>
                                        <FaComment /> Commenter
                                      </button>
                                    </div>
                                  </>
                                )}
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
        <div className={`${styles['CLUB-ETD-custom-alert']} ${styles[`CLUB-ETD-${alert.type}`]}`}>
          <div className={styles['CLUB-ETD-alert-content']}>
            <div className={styles['CLUB-ETD-alert-icon']}>
              <FaTimesCircle />
            </div>
            <p>{alert.message}</p>
            <div className={styles['CLUB-ETD-alert-buttons']}>
              <button className={styles['CLUB-ETD-close-button']} onClick={alert.onClose}>
                <FaTimesCircle /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MesClubsMembre;