import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaChevronLeft, FaChevronRight, FaTimesCircle, FaCalendarPlus } from 'react-icons/fa';
import styles from './club.module.css';

const ConsulterEvenementsPublics = () => {
  const [publications, setPublications] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [alert, setAlert] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [eventsInCalendar, setEventsInCalendar] = useState({});
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const API_URL = 'http://events.localhost';

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/publicationsCLUB/public-events?matricule=${matricule}`);
        if (!response.ok) {
          await handleApiError(response, 'Erreur lors de la récupération des événements publics');
        }
        const publicPublications = await response.json();
        setPublications(publicPublications || []);

        const eventsStatus = {};
        for (const pub of publicPublications) {
          const eventId = pub.eventId; // Use the eventId directly from the publication object
          if (eventId) {
            try {
              const calendarResponse = await fetch(
                `${API_URL}/publicationsCLUB/${eventId}/is-in-calendar?matricule=${matricule}`
              );
              if (!calendarResponse.ok) {
                console.warn(`Échec de la vérification pour l'événement ${eventId}: ${calendarResponse.statusText}`);
                eventsStatus[eventId] = false;
                continue;
              }
              const { isInCalendar } = await calendarResponse.json();
              eventsStatus[eventId] = isInCalendar;
            } catch (error) {
              console.error(`Erreur lors de la vérification de l'événement ${eventId} dans le calendrier:`, error);
              eventsStatus[eventId] = false;
            }
          }
        }
        setEventsInCalendar(eventsStatus);
      } catch (err) {
        showErrorAlert(err.message);
        setPublications([]);
      }
    };

    if (matricule) {
      fetchPublicEvents();
    }
  }, [matricule]);

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

  const showSuccessAlert = (message) => {
    setAlert({
      type: 'success',
      message,
      onClose: () => setAlert(null),
    });
  };

  const handleApiError = async (response, defaultMessage) => {
    const contentType = response.headers.get('content-type');
    let errorMessage = defaultMessage;
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || defaultMessage;
    } else {
      const text = await response.text();
      console.error('Réponse non-JSON reçue:', text);
      errorMessage = `Réponse inattendue du serveur: ${text || 'Erreur inconnue'}`;
    }
    throw new Error(errorMessage);
  };

  const handleAddToCalendar = async (eventId) => {
    try {
      const response = await fetch(`${API_URL}/publicationsCLUB/${eventId}/add-to-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricule }),
      });

      if (!response.ok) {
        await handleApiError(response, 'Erreur lors de l’ajout au calendrier');
      }

      const result = await response.json();
      setEventsInCalendar(prev => ({ ...prev, [eventId]: true }));
      showSuccessAlert(result.message);
    } catch (err) {
      showErrorAlert(err.message);
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
        await handleApiError(response, 'Erreur lors du like');
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
        await handleApiError(response, 'Erreur lors de l’ajout du commentaire');
      }

      const publicResponse = await fetch(`${API_URL}/publicationsCLUB/public-events?matricule=${matricule}`);
      if (!publicResponse.ok) {
        await handleApiError(publicResponse, 'Erreur lors de la récupération des publications publiques mises à jour');
      }
      const publicPublications = await publicResponse.json();

      setPublications(publicPublications || []);
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
        <h1>Consulter les Événements Publics</h1>
        <p>Consultez les événements publics des clubs</p>
      </div>

      <div className={styles['CLUB-ETD-content-grid']}>
        <div className={styles['CLUB-ETD-event-list']}>
          <div className={styles['CLUB-ETD-publications-section']}>
            <h4 className={styles['CLUB-ETD-section-title']}>Événements Publics</h4>
            {publications.length === 0 ? (
              <p className={styles['CLUB-ETD-no-data']}>Aucun événement public disponible.</p>
            ) : (
              <ul className={styles['CLUB-ETD-social-posts']}>
                {publications.map(pub => {
                  const eventId = pub.eventId; // Use the eventId directly
                  const isInCalendar = eventId ? eventsInCalendar[eventId] : false;

                  return (
                    <li key={pub.ID_publication} className={styles['CLUB-ETD-social-post-card']}>
                      <div className={styles['CLUB-ETD-post-header']}>
                        <div className={styles['CLUB-ETD-post-club-info']}>
                          <div className={styles['CLUB-ETD-club-image-container']}>
                            {pub.club_image_url ? (
                              <img
                                src={`${API_URL}${pub.club_image_url}`}
                                alt={pub.club_nom}
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
                            <h5>{pub.club_nom}</h5>
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
                        {eventId && (
                          <button
                            onClick={() => handleAddToCalendar(eventId)}
                            className={`${styles['CLUB-ETD-like-button']} ${isInCalendar ? styles['CLUB-ETD-added-to-calendar'] : ''}`}
                            disabled={isInCalendar}
                            title={isInCalendar ? 'Déjà ajouté au calendrier' : 'Ajouter au calendrier'}
                          >
                            <FaCalendarPlus /> {isInCalendar ? 'Ajouté' : 'Ajouter au calendrier'}
                          </button>
                        )}
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
                  );
                })}
              </ul>
            )}
          </div>
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

export default ConsulterEvenementsPublics;