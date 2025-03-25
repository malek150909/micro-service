import React, { useState, useEffect } from 'react';
import { FaUsers, FaList, FaEnvelope, FaTrash, FaComment, FaEye, FaCamera, FaEdit, FaCalendarAlt, FaComments, FaCheckCircle, FaTimesCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const GererMesClubs = ({ clubsGerant, setClubsGerant, setError }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [membres, setMembres] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [publications, setPublications] = useState([]);
  const [publicationContenu, setPublicationContenu] = useState('');
  const [publicationImages, setPublicationImages] = useState([]);
  const [showMembres, setShowMembres] = useState(false);
  const [showDemandes, setShowDemandes] = useState(false);
  const [showPublicationForm, setShowPublicationForm] = useState(false);
  const [showPublications, setShowPublications] = useState(false);
  const [showChangePhotoForm, setShowChangePhotoForm] = useState(false);
  const [showEvenements, setShowEvenements] = useState(false);
  const [evenements, setEvenements] = useState([]);
  const [newClubPhoto, setNewClubPhoto] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editPublication, setEditPublication] = useState(null);
  const [editContenu, setEditContenu] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [editEvenement, setEditEvenement] = useState(null);
  const [typePublication, setTypePublication] = useState('publication');
  const [nomEvenement, setNomEvenement] = useState('');
  const [descriptionEvenement, setDescriptionEvenement] = useState('');
  const [dateEvenement, setDateEvenement] = useState('');
  const [lieu, setLieu] = useState('');
  const [capacite, setCapacite] = useState('');
  const [showMessagerie, setShowMessagerie] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [alert, setAlert] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  useEffect(() => {
    const initialIndexes = {};
    publications.forEach(pub => {
      if (pub.images && pub.images.length > 0) {
        initialIndexes[`pub-${pub.ID_publication}`] = 0;
      }
    });
    evenements.forEach(event => {
      if (event.image_url) {
        initialIndexes[`event-${event.ID_club_evenement}`] = 0;
      }
    });
    setCurrentImageIndex(initialIndexes);
  }, [publications, evenements]);

  const showConfirmAlert = (message, onConfirm) => {
    setAlert({
      type: 'confirm',
      message,
      onConfirm,
      onCancel: () => setAlert(null),
    });
  };

  const showErrorAlert = (message) => {
    setAlert({
      type: 'error',
      message,
      onClose: () => setAlert(null),
    });
  };

  const handleError = (message) => {
    showErrorAlert(message);
  };

  const handleSelectClub = async (club) => {
    setSelectedClub(club);
    setShowMembres(false);
    setShowDemandes(false);
    setShowPublicationForm(false);
    setShowPublications(false);
    setShowChangePhotoForm(false);
    setShowEvenements(false);
    setShowMessagerie(false);
    setSuccess(null);
    setEditPublication(null);
    setEditEvenement(null);
    setAlert(null);

    if (!matricule) {
      handleError('Matricule non défini. Veuillez vous reconnecter.');
      return;
    }

    try {
      const [membresResponse, demandesResponse, publicationsResponse, evenementsResponse] = await Promise.all([
        fetch(`${API_URL}/membresCLUB/club/${club.ID_club}`),
        fetch(`${API_URL}/demandesCLUB/rejoindre/club/${club.ID_club}`),
        fetch(`${API_URL}/publicationsCLUB/club/${club.ID_club}`),
        fetch(`${API_URL}/evenementsCLUB/gerant/${matricule}`),
      ]);

      if (!membresResponse.ok) throw new Error('Erreur lors de la récupération des membres');
      if (!demandesResponse.ok) throw new Error('Erreur lors de la récupération des demandes');
      if (!publicationsResponse.ok) throw new Error('Erreur lors de la récupération des publications');
      if (!evenementsResponse.ok) throw new Error('Erreur lors de la récupération des événements');

      const membresData = await membresResponse.json();
      const demandesData = await demandesResponse.json();
      const publicationsData = await publicationsResponse.json();
      const evenementsData = await evenementsResponse.json();

      setMembres(membresData);
      setDemandes(demandesData);
      setPublications(publicationsData);
      const filteredEvenements = evenementsData.filter(e => Number(e.ID_club) === Number(club.ID_club));
      setEvenements(filteredEvenements);
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleSupprimerMembre = (matriculeMembre) => {
    showConfirmAlert('Êtes-vous sûr de vouloir supprimer ce membre ?', async () => {
      try {
        const response = await fetch(`${API_URL}/membresCLUB/club/${selectedClub.ID_club}/membre/${matriculeMembre}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression du membre');
        setMembres(membres.filter(m => m.Matricule !== matriculeMembre));
        setAlert(null);
      } catch (err) {
        handleError(err.message);
      }
    });
  };

  const handleAccepterDemande = async (demandeId) => {
    try {
      const response = await fetch(`${API_URL}/demandesCLUB/rejoindre/accepter/${demandeId}`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors de l’acceptation de la demande');
      setDemandes(demandes.filter(d => d.ID_demande !== demandeId));
      const responseMembres = await fetch(`${API_URL}/membresCLUB/club/${selectedClub.ID_club}`);
      const updatedMembres = await responseMembres.json();
      setMembres(updatedMembres);

      if (showMessagerie) {
        handleShowMessagerie();
      }
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleRefuserDemande = async (demandeId) => {
    try {
      const response = await fetch(`${API_URL}/demandesCLUB/rejoindre/refuser/${demandeId}`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors du refus de la demande');
      setDemandes(demandes.filter(d => d.ID_demande !== demandeId));
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, typePublication === 'publication' ? 5 : 1);
    setPublicationImages(files);
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setEditImages(files);
  };

  const handlePublier = async (e) => {
    e.preventDefault();
    if (!publicationContenu) {
      handleError('Le contenu de la publication ne peut pas être vide');
      return;
    }

    if (typePublication === 'evenement' && (!nomEvenement || !dateEvenement || !lieu || !capacite)) {
      handleError('Tous les champs de l’événement sont requis');
      return;
    }

    if (!selectedClub || !selectedClub.ID_club) {
      handleError('Aucun club sélectionné. Veuillez sélectionner un club avant de publier.');
      return;
    }

    if (!matricule) {
      handleError('Matricule non défini. Veuillez vous reconnecter.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('clubId', selectedClub.ID_club);
      formData.append('contenu', publicationContenu);
      formData.append('matricule', matricule);
      formData.append('type', typePublication);

      if (typePublication === 'evenement') {
        formData.append('nom_evenement', nomEvenement);
        formData.append('description_evenement', descriptionEvenement);
        formData.append('date_evenement', dateEvenement);
        formData.append('lieu', lieu);
        formData.append('capacite', capacite);
      }

      publicationImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`${API_URL}/publicationsCLUB`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la publication');
      }

      setPublicationContenu('');
      setPublicationImages([]);
      setTypePublication('publication');
      setNomEvenement('');
      setDescriptionEvenement('');
      setDateEvenement('');
      setLieu('');
      setCapacite('');
      setShowPublicationForm(false);

      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`).then(res => res.json());
      const updatedEvenementsData = await fetch(`${API_URL}/evenementsCLUB/gerant/${matricule}`).then(res => res.json());
      const updatedEvenements = updatedEvenementsData.filter(e => Number(e.ID_club) === Number(selectedClub.ID_club));
      setPublications(updatedPublications);
      setEvenements(updatedEvenements);
      setSuccess(typePublication === 'evenement' ? 'Événement créé avec succès !' : 'Publication créée avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleClubPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const filetypes = /jpeg|jpg|png/;
      const extname = filetypes.test(file.name.toLowerCase().split('.').pop());
      const mimetype = filetypes.test(file.type);
      if (!extname || !mimetype) {
        handleError('Seules les images JPEG/JPG/PNG sont autorisées');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        handleError('Le fichier est trop volumineux (max 5MB)');
        return;
      }
      setNewClubPhoto(file);
    }
  };

  const handleChangeClubPhoto = async (e) => {
    e.preventDefault();
    setSuccess(null);

    if (!newClubPhoto) {
      handleError('Veuillez sélectionner une photo pour le club');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', newClubPhoto);

      const response = await fetch(`${API_URL}/clubsCLUB/${selectedClub.ID_club}/photo`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la photo du club');
      }

      const updatedClub = await response.json();
      setClubsGerant(clubsGerant.map(club =>
        club.ID_club === selectedClub.ID_club ? { ...club, image_url: updatedClub.image_url } : club
      ));
      setSelectedClub({ ...selectedClub, image_url: updatedClub.image_url });
      setNewClubPhoto(null);
      setShowChangePhotoForm(false);
      setSuccess('Photo mise à jour avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleDeletePublication = (publicationId) => {
    showConfirmAlert('Êtes-vous sûr de vouloir supprimer cette publication ?', async () => {
      try {
        const response = await fetch(`${API_URL}/publicationsCLUB/${publicationId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matricule }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression de la publication');
        }

        const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`).then(res => res.json());
        setPublications(updatedPublications);
        setSuccess('Publication supprimée avec succès !');
        setAlert(null);
      } catch (err) {
        handleError(err.message);
      }
    });
  };

  const handleEditPublication = (pub) => {
    setEditPublication(pub);
    setEditContenu(pub.contenu);
    setEditImages([]);
  };

  const handleUpdatePublication = async (e) => {
    e.preventDefault();
    if (!editContenu) {
      handleError('Le contenu de la publication ne peut pas être vide');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('matricule', matricule);
      formData.append('contenu', editContenu);
      editImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`${API_URL}/publicationsCLUB/${editPublication.ID_publication}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification de la publication');
      }

      setEditPublication(null);
      setEditContenu('');
      setEditImages([]);

      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`).then(res => res.json());
      setPublications(updatedPublications);
      setSuccess('Publication modifiée avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleEditEvenement = (evenement) => {
    setEditEvenement(evenement);
    setNomEvenement(evenement.nom_evenement);
    setDescriptionEvenement(evenement.description_evenement || '');
    setDateEvenement(evenement.date_evenement.split('T')[0]);
    setLieu(evenement.lieu);
    setCapacite(evenement.capacite);
    setEditImages([]);
  };

  const handleUpdateEvenement = async (e) => {
    e.preventDefault();

    if (!nomEvenement || !dateEvenement || !lieu || !capacite) {
      handleError('Tous les champs de l’événement sont requis');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom_evenement', nomEvenement);
      formData.append('description_evenement', descriptionEvenement);
      formData.append('date_evenement', dateEvenement);
      formData.append('lieu', lieu);
      formData.append('capacite', capacite);
      formData.append('gerant_matricule', matricule);
      if (editImages.length > 0) {
        formData.append('image', editImages[0]);
      } else {
        formData.append('image_url', editEvenement.image_url || '');
      }

      const response = await fetch(`${API_URL}/evenementsCLUB/${editEvenement.ID_club_evenement}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification de l’événement');
      }

      setEditEvenement(null);
      setNomEvenement('');
      setDescriptionEvenement('');
      setDateEvenement('');
      setLieu('');
      setCapacite('');
      setEditImages([]);

      const updatedEvenementsData = await fetch(`${API_URL}/evenementsCLUB/gerant/${matricule}`).then(res => res.json());
      const updatedEvenements = updatedEvenementsData.filter(e => Number(e.ID_club) === Number(selectedClub.ID_club));
      setEvenements(updatedEvenements);
      setSuccess('Événement modifié avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleDeleteEvenement = (evenementId) => {
    showConfirmAlert('Êtes-vous sûr de vouloir supprimer cet événement ?', async () => {
      try {
        const response = await fetch(`${API_URL}/evenementsCLUB/${evenementId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gerant_matricule: matricule }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression de l’événement');
        }

        const updatedEvenementsData = await fetch(`${API_URL}/evenementsCLUB/gerant/${matricule}`).then(res => res.json());
        const updatedEvenements = updatedEvenementsData.filter(e => Number(e.ID_club) === Number(selectedClub.ID_club));
        setEvenements(updatedEvenements);
        setSuccess('Événement supprimé avec succès !');
        setAlert(null);
      } catch (err) {
        handleError(err.message);
      }
    });
  };

  const handleShowMessagerie = async () => {
    setShowMessagerie(true);
    setShowMembres(false);
    setShowDemandes(false);
    setShowPublicationForm(false);
    setShowPublications(false);
    setShowChangePhotoForm(false);
    setShowEvenements(false);
    setSuccess(null);
  
    try {
      console.log('Appel API avec :', `${API_URL}/messagesCLUB/club/${selectedClub.ID_club}/user/${matricule}`);
      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}/user/${matricule}`);
      const responseText = await response.text(); // Récupérer la réponse brute
      console.log('Statut HTTP :', response.status);
      console.log('Content-Type :', response.headers.get('content-type'));
      console.log('Réponse brute :', responseText);
  
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Erreur lors de la récupération des messages');
        } catch (parseError) {
          throw new Error(`Erreur de parsing JSON : ${responseText}`);
        }
      }
      const messagesData = JSON.parse(responseText);
      setMessages(messagesData);
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage) {
      handleError('Veuillez entrer un message');    
      return;
    }

    try {
      const response = await fetch(`${API_URL}/messagesCLUB/club/${selectedClub.ID_club}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: selectedClub.ID_club,
          expediteur: matricule,
          contenu: newMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l’envoi du message');
      }

      const newMessages = await response.json();
      setMessages([...messages, ...newMessages]);
      setNewMessage('');
      setSuccess('Message envoyé avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handlePrevImage = (id, type, length) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`${type}-${id}`]: (prev[`${type}-${id}`] - 1 + length) % length,
    }));
  };

  const handleNextImage = (id, type, length) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [`${type}-${id}`]: (prev[`${type}-${id}`] + 1) % length,
    }));
  };

  return (
    <>
    <div id="clubs">
      <div className="header">
        <h1><FaUsers /> Gérer mes Clubs</h1>
        <p>Gérez les clubs dont vous êtes le gérant</p>
        {success && <p className="success-message">{success}</p>}
      </div>

      <div className="content-grid">
        <div className="event-list">
          {clubsGerant.length === 0 ? (
            <p>Vous n’êtes gérant d’aucun club. Faites une demande de création pour en gérer un.</p>
          ) : (
            <>
              <h3>Choisissez un club à gérer :</h3>
              <ul id="clubs-list">
                {clubsGerant.map(club => (
                  <li key={club.ID_club} className="club-item">
                    <div className="club-preview" onClick={() => handleSelectClub(club)}>
                      <div className="club-image-container">
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className="club-image"
                            onError={(e) => {
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
                  <h3>Gestion de {selectedClub.nom}</h3>
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
                    <button onClick={() => { setShowMembres(true); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaUsers /> Voir les Membres
                    </button>
                    <button onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(true); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaComment /> Publier
                    </button>
                    <button onClick={() => { setShowMembres(false); setShowDemandes(true); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaEnvelope /> Gérer les Demandes
                    </button>
                    <button onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(true); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaEye /> Voir les Publications
                    </button>
                    <button onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(true); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaCamera /> {selectedClub.image_url ? 'Modifier la Photo' : 'Ajouter une Photo'}
                    </button>
                    <button onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(true); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaCalendarAlt /> Gérer les Événements
                    </button>
                    <button onClick={handleShowMessagerie}>
                      <FaComments /> Messagerie
                    </button>
                  </div>

                  {showChangePhotoForm && (
                    <div className="photo-form-section">
                      <h4 className="section-title">{selectedClub.image_url ? 'Modifier la Photo du Club' : 'Ajouter une Photo au Club'}</h4>
                      <form onSubmit={handleChangeClubPhoto}>
                        <div className="input-group">
                          <label>Choisir une Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleClubPhotoChange}
                            required
                          />
                          {newClubPhoto && (
                            <p className="form-images">
                              Image sélectionnée : {newClubPhoto.name}
                            </p>
                          )}
                        </div>
                        <button type="submit">Mettre à Jour</button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowChangePhotoForm(false);
                            setNewClubPhoto(null);
                          }}
                        >
                          Annuler
                        </button>
                      </form>
                    </div>
                  )}

                  {showMembres && (
                    <div className="members-section">
                      <h4 className="section-title">Membres du Club</h4>
                      {membres.length === 0 ? (
                        <p className="no-data">Aucun membre dans ce club.</p>
                      ) : (
                        <ul className="members-list">
                          {membres.map(membre => (
                            <li key={membre.Matricule} className="member-card">
                              <span>{membre.nom} {membre.prenom} ({membre.Matricule})</span>
                              <button
                                className="delete-button"
                                onClick={() => handleSupprimerMembre(membre.Matricule)}
                              >
                                <FaTrash /> Supprimer
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {showPublicationForm && (
                    <div className="publication-form-section">
                      <h4 className="section-title">Publier un Message ou un Événement</h4>
                      <form onSubmit={handlePublier}>
                        <div className="input-group">
                          <label>Type :</label>
                          <select
                            value={typePublication}
                            onChange={(e) => setTypePublication(e.target.value)}
                          >
                            <option value="publication">Simple Publication</option>
                            <option value="evenement">Annonce d’un Événement</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Contenu</label>
                          <textarea
                            value={publicationContenu}
                            onChange={(e) => setPublicationContenu(e.target.value)}
                            rows="4"
                            placeholder="Écrivez votre message ici..."
                          />
                        </div>
                        {typePublication === 'evenement' && (
                          <div className="event-details-form">
                            <h5>Détails de l’Événement</h5>
                            <div className="input-group">
                              <label>Nom de l’Événement</label>
                              <input
                                type="text"
                                value={nomEvenement}
                                onChange={(e) => setNomEvenement(e.target.value)}
                                placeholder="Nom de l’événement"
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Description</label>
                              <textarea
                                value={descriptionEvenement}
                                onChange={(e) => setDescriptionEvenement(e.target.value)}
                                rows="3"
                                placeholder="Description de l’événement (optionnel)"
                              />
                            </div>
                            <div className="input-group">
                              <label>Date</label>
                              <input
                                type="date"
                                value={dateEvenement}
                                onChange={(e) => setDateEvenement(e.target.value)}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Lieu</label>
                              <input
                                type="text"
                                value={lieu}
                                onChange={(e) => setLieu(e.target.value)}
                                placeholder="Lieu de l’événement"
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Capacité</label>
                              <input
                                type="number"
                                value={capacite}
                                onChange={(e) => setCapacite(e.target.value)}
                                placeholder="Capacité (nombre de participants)"
                                required
                              />
                            </div>
                          </div>
                        )}
                        <div className="input-group">
                          <label>
                            {typePublication === 'evenement' ? 'Image de l’Événement (optionnel)' : 'Photos (jusqu’à 5)'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple={typePublication === 'publication'}
                            onChange={handleImageChange}
                          />
                          {publicationImages.length > 0 && (
                            <div className="form-images">
                              <p>Images sélectionnées :</p>
                              <ul>
                                {publicationImages.map((image, index) => (
                                  <li key={index}>{image.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button type="submit">Publier</button>
                      </form>
                    </div>
                  )}

                  {showDemandes && (
                    <div className="requests-section">
                      <h4 className="section-title">Demandes pour Rejoindre</h4>
                      {demandes.length === 0 ? (
                        <p className="no-data">Aucune demande en attente.</p>
                      ) : (
                        <ul className="requests-list">
                          {demandes.map(demande => (
                            <li key={demande.ID_demande} className="request-card">
                              <span>{demande.nom} {demande.prenom} ({demande.matricule_etudiant})</span>
                              <div className="request-actions">
                                <button
                                  className="edit-button"
                                  onClick={() => handleAccepterDemande(demande.ID_demande)}
                                >
                                  Accepter
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={() => handleRefuserDemande(demande.ID_demande)}
                                >
                                  Refuser
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {showPublications && (
                    <div className="publications-section">
                      <h4 className="section-title">Publications de {selectedClub.nom}</h4>
                      {publications.length === 0 ? (
                        <p className="no-data">Aucune publication pour ce club.</p>
                      ) : (
                        <>
                          {editPublication ? (
                            <div className="edit-publication-section">
                              <h4 className="section-title">Modifier la Publication</h4>
                              <form onSubmit={handleUpdatePublication}>
                                <div className="input-group">
                                  <label>Contenu</label>
                                  <textarea
                                    value={editContenu}
                                    onChange={(e) => setEditContenu(e.target.value)}
                                    rows="4"
                                    placeholder="Écrivez votre message ici..."
                                  />
                                </div>
                                <div className="input-group">
                                  <label>
                                    Nouvelles Photos (jusqu’à 5, laissez vide pour garder les anciennes)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleEditImageChange}
                                  />
                                  {editImages.length > 0 && (
                                    <div className="form-images">
                                      <p>Nouvelles images sélectionnées :</p>
                                      <ul>
                                        {editImages.map((image, index) => (
                                          <li key={index}>{image.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {editImages.length === 0 && editPublication.images.length > 0 && (
                                    <div className="form-images">
                                      <p>Images actuelles :</p>
                                      <div className="publication-images">
                                        {editPublication.images.map((image, index) => (
                                          <img
                                            key={index}
                                            src={`${API_URL}${image.image_url}`}
                                            alt={`Image ${index + 1}`}
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/100x75?text=Image+Indisponible';
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button type="submit">Mettre à Jour</button>
                                <button
                                  type="button"
                                  onClick={() => setEditPublication(null)}
                                >
                                  Annuler
                                </button>
                              </form>
                            </div>
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
                                          {new Date(pub.date_publication).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {pub.images && pub.images.length > 0 ? (
                                    <div className="post-image-carousel">
                                      <button
                                        className="carousel-button prev"
                                        onClick={() => handlePrevImage(pub.ID_publication, 'pub', pub.images.length)}
                                        disabled={pub.images.length <= 1}
                                      >
                                        <FaChevronLeft />
                                      </button>
                                      <div className="carousel-image-container">
                                        <img
                                          src={`${API_URL}${pub.images[currentImageIndex[`pub-${pub.ID_publication}`] || 0].image_url}`}
                                          alt={`Publication ${currentImageIndex[`pub-${pub.ID_publication}`] + 1}`}
                                          className="carousel-image"
                                          onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible';
                                          }}
                                        />
                                      </div>
                                      <button
                                        className="carousel-button next"
                                        onClick={() => handleNextImage(pub.ID_publication, 'pub', pub.images.length)}
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
                                    <p>{pub.contenu}</p>
                                  </div>
                                  <div className="post-actions">
                                    <span>{pub.likes} J’aime</span>
                                    <span>{pub.commentaires_count} Commentaire(s)</span>
                                    <div className="post-buttons">
                                      <button
                                        className="edit-button"
                                        onClick={() => handleEditPublication(pub)}
                                      >
                                        <FaEdit /> Modifier
                                      </button>
                                      <button
                                        className="delete-button"
                                        onClick={() => handleDeletePublication(pub.ID_publication)}
                                      >
                                        <FaTrash /> Supprimer
                                      </button>
                                    </div>
                                  </div>
                                  <div className="post-comments">
                                    <h5>Commentaires :</h5>
                                    {pub.commentaires.length === 0 ? (
                                      <p>Aucun commentaire.</p>
                                    ) : (
                                      <ul>
                                        {pub.commentaires.map(comment => (
                                          <li key={comment.ID_commentaire}>
                                            <strong>{comment.nom} {comment.prenom} :</strong> {comment.contenu}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {showEvenements && (
                    <div className="events-section">
                      <h4 className="section-title">Événements de {selectedClub.nom}</h4>
                      {evenements.length === 0 ? (
                        <p className="no-data">Aucun événement pour ce club.</p>
                      ) : (
                        <>
                          {editEvenement ? (
                            <div className="edit-event-section">
                              <h4 className="section-title">Modifier l’Événement</h4>
                              <form onSubmit={handleUpdateEvenement}>
                                <div className="input-group">
                                  <label>Nom de l’Événement</label>
                                  <input
                                    type="text"
                                    value={nomEvenement}
                                    onChange={(e) => setNomEvenement(e.target.value)}
                                    placeholder="Nom de l’événement"
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label>Description</label>
                                  <textarea
                                    value={descriptionEvenement}
                                    onChange={(e) => setDescriptionEvenement(e.target.value)}
                                    rows="3"
                                    placeholder="Description de l’événement (optionnel)"
                                  />
                                </div>
                                <div className="input-group">
                                  <label>Date</label>
                                  <input
                                    type="date"
                                    value={dateEvenement}
                                    onChange={(e) => setDateEvenement(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label>Lieu</label>
                                  <input
                                    type="text"
                                    value={lieu}
                                    onChange={(e) => setLieu(e.target.value)}
                                    placeholder="Lieu de l’événement"
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label>Capacité</label>
                                  <input
                                    type="number"
                                    value={capacite}
                                    onChange={(e) => setCapacite(e.target.value)}
                                    placeholder="Capacité (nombre de participants)"
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label>
                                    Nouvelle Image (optionnel, laissez vide pour garder l’ancienne)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                  />
                                  {editImages.length > 0 && (
                                    <div className="form-images">
                                      <p>Nouvelle image sélectionnée :</p>
                                      <ul>
                                        {editImages.map((image, index) => (
                                          <li key={index}>{image.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {editImages.length === 0 && editEvenement.image_url && (
                                    <div className="form-images">
                                      <p>Image actuelle :</p>
                                      <img
                                        src={`${API_URL}${editEvenement.image_url}`}
                                        alt="Événement"
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/100x75?text=Image+Indisponible';
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <button type="submit">Mettre à Jour</button>
                                <button
                                  type="button"
                                  onClick={() => setEditEvenement(null)}
                                >
                                  Annuler
                                </button>
                              </form>
                            </div>
                          ) : (
                            <ul className="social-events">
                              {evenements.map(evenement => (
                                <li key={evenement.ID_club_evenement} className="social-event-card">
                                  <div className="event-header">
                                    <div className="event-club-info">
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
                                        <p className="event-date">
                                          {new Date(evenement.date_evenement).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {evenement.image_url && (
                                    <div className="event-image-carousel">
                                      <div className="carousel-image-container">
                                        <img
                                          src={`${API_URL}${evenement.image_url}`}
                                          alt={evenement.nom_evenement}
                                          className="carousel-image"
                                          onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible';
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="event-content">
                                    <h5>{evenement.nom_evenement}</h5>
                                    <p><strong>Lieu :</strong> {evenement.lieu}</p>
                                    <p><strong>Capacité :</strong> {evenement.capacite} participants</p>
                                    <p><strong>Description :</strong> {evenement.description_evenement || 'Aucune description'}</p>
                                  </div>
                                  <div className="event-actions">
                                    <button
                                      className="edit-button"
                                      onClick={() => handleEditEvenement(evenement)}
                                    >
                                      <FaEdit /> Modifier
                                    </button>
                                    <button
                                      className="delete-button"
                                      onClick={() => handleDeleteEvenement(evenement.ID_club_evenement)}
                                    >
                                      <FaTrash /> Supprimer
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {showMessagerie && (
                    <div className="messagerie-section">
                      <h4 className="section-title">Messagerie de groupe - {selectedClub.nom}</h4>
                      <div className="messagerie-container">
                        {messages.length === 0 ? (
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
                      </div>
                      <form onSubmit={handleSendMessage} className="message-form">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrire un message..."
                        />
                        <button type="submit">Envoyer</button>
                      </form>
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
              {alert.type === 'confirm' ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
            </div>
            <p>{alert.message}</p>
            <div className="alert-buttons">
              {alert.type === 'confirm' ? (
                <>
                  <button className="confirm-button" onClick={alert.onConfirm}>
                    OK
                  </button>
                  <button className="cancel-button" onClick={alert.onCancel}>
                    Annuler
                  </button>
                </>
              ) : (
                <button className="close-button" onClick={alert.onClose}>
                  <FaTimes /> Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default GererMesClubs;