import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUsers, FaList, FaEnvelope, FaTrash, FaComment, FaEye, FaCamera, FaEdit, FaCalendarAlt, FaComments, FaCheckCircle, FaTimesCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './club.module.css';
import { io } from 'socket.io-client';

const GererMesClubs = ({ clubsGerant, setClubsGerant, setError }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [membres, setMembres] = useState([]);
  const [filteredMembres, setFilteredMembres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [timeSlots, setTimeSlots] = useState('');
  const [isPublic, setIsPublic] = useState(false); // Nouvel état pour gérer la visibilité de l'événement
  const [showMessagerie, setShowMessagerie] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageFile, setMessageFile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const messagesEndRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;
  const socket = io('http://localhost:8084'); // adresse de ton backend

  const timeSlotsOptions = [
    "08:00 - 09:30",
    "09:40 - 11:10",
    "11:20 - 12:50",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50"
  ];

  const API_URL = 'http://localhost:8084';

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

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = async () => {
    try {
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
      setMessages([]); // Vider l'état avant de le mettre à jour
      setMessages(messagesData);
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des messages:', err.message);
      handleError(err.message);
    }
  };

  useEffect(() => {
    let interval;
    if (showMessagerie && selectedClub) {
      fetchMessages();
      interval = setInterval(fetchMessages, 10000);
      if (selectedClub) {
        socket.emit('joinClub', selectedClub.ID_club);
      
        socket.on('newMessage', (newMessages) => {
          setMessages(prev => [...prev, ...newMessages]);
          scrollToBottom(); // si disponible
        });
      }
      
    }
    return () => clearInterval(interval);
    socket.off('newMessage'); // nettoyage
  }, [showMessagerie, selectedClub, matricule]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembres(membres);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = membres.filter(membre =>
        (membre.nom + ' ' + membre.prenom).toLowerCase().includes(query)
      );
      setFilteredMembres(filtered);
    }
  }, [searchQuery, membres]);

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
    setSearchQuery('');

    if (!matricule) {
      handleError('Matricule non défini. Veuillez vous reconnecter.');
      return;
    }

    try {
      const [membresResponse, demandesResponse, publicationsResponse, evenementsResponse] = await Promise.all([
        fetch(`${API_URL}/membresCLUB/club/${club.ID_club}`),
        fetch(`${API_URL}/demandesCLUB/rejoindre/club/${club.ID_club}`),
        fetch(`${API_URL}/publicationsCLUB/club/${club.ID_club}`),
        fetch(`${API_URL}/api/club-events/gerant/${matricule}`),
      ]);

      if (!membresResponse.ok) {
        const errorData = await membresResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la récupération des membres');
      }
      if (!demandesResponse.ok) {
        const errorData = await demandesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la récupération des demandes');
      }
      if (!publicationsResponse.ok) {
        const errorData = await publicationsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la récupération des publications');
      }
      if (!evenementsResponse.ok) {
        const errorData = await evenementsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la récupération des événements');
      }

      const membresData = await membresResponse.json();
      const demandesData = await demandesResponse.json();
      const publicationsData = await publicationsResponse.json();
      const evenementsData = await evenementsResponse.json();

      setMembres(membresData);
      setFilteredMembres(membresData);
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
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de la suppression du membre');
        }
        const updatedMembres = membres.filter(m => m.Matricule !== matriculeMembre);
        setMembres(updatedMembres);
        setFilteredMembres(updatedMembres);
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l’acceptation de la demande');
      }
      setDemandes(demandes.filter(d => d.ID_demande !== demandeId));
      const responseMembres = await fetch(`${API_URL}/membresCLUB/club/${selectedClub.ID_club}`);
      const updatedMembres = await responseMembres.json();
      setMembres(updatedMembres);
      setFilteredMembres(updatedMembres);

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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du refus de la demande');
      }
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
    const files = Array.from(e.target.files).slice(0, typePublication === 'publication' ? 5 : 1);
    setEditImages(files);
  };

  const handlePublier = async (e) => {
    e.preventDefault();
    if (!publicationContenu) {
      handleError('Le contenu de la publication ne peut pas être vide');
      return;
    }

    if ((typePublication === 'evenement' || typePublication === 'evenement_public') && (!nomEvenement || !dateEvenement || !lieu || !capacite || !timeSlots)) {
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
      formData.append('is_public', typePublication === 'evenement_public' ? 'true' : 'false'); // Ajouter is_public

      if (typePublication === 'evenement' || typePublication === 'evenement_public') {
        formData.append('nom_evenement', nomEvenement);
        formData.append('description_evenement', descriptionEvenement);
        formData.append('date_evenement', dateEvenement);
        formData.append('lieu', lieu);
        formData.append('capacite', capacite);
        formData.append('time_slots', timeSlots);
      }

      publicationImages.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`${API_URL}/publicationsCLUB`, {
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
      setTimeSlots('');
      setIsPublic(false); // Réinitialiser isPublic
      setShowPublicationForm(false);

      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`).then(res => res.json());
      const updatedEvenementsData = await fetch(`${API_URL}/api/club-events/gerant/${matricule}`).then(res => res.json());
      const updatedEvenements = updatedEvenementsData.filter(e => Number(e.ID_club) === Number(selectedClub.ID_club));
      setPublications(updatedPublications);
      setEvenements(updatedEvenements);
      setSuccess(typePublication === 'evenement' || typePublication === 'evenement_public' ? 'Événement créé avec succès !' : 'Publication créée avec succès !');
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
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
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
          const contentType = response.headers.get('content-type');
          let errorData = {};
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            console.error('Réponse non-JSON reçue:', text);
            throw new Error('Réponse inattendue du serveur (non-JSON)');
          }
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
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de la modification de la publication');
      }

      setEditPublication(null);
      setEditContenu('');
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
    setTimeSlots(evenement.time_slots || '');
    setIsPublic(evenement.is_public || false); // Initialiser isPublic
    setEditImages([]);
  };

  const handleUpdateEvenement = async (e) => {
    e.preventDefault();

    if (!nomEvenement || !dateEvenement || !lieu || !capacite || !timeSlots) {
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
      formData.append('time_slots', timeSlots);
      formData.append('is_public', isPublic); // Ajouter is_public
      if (editImages.length > 0) {
        formData.append('image', editImages[0]);
      } else {
        formData.append('image_url', editEvenement.image_url || '');
      }

      const response = await fetch(`${API_URL}/api/club-events/${editEvenement.ID_club_evenement}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Erreur lors de la modification de l’événement');
      }

      const updatedEvent = await response.json();
      const publicationId = editEvenement.ID_publication;

      if (publicationId) {
        const publicationFormData = new FormData();
        publicationFormData.append('matricule', matricule);
        const updatedContenu = `Événement "${nomEvenement}" le ${new Date(dateEvenement).toLocaleDateString()} à ${lieu} (${timeSlots}) avec une capacité de ${capacite} participants. ${descriptionEvenement || ''}`;
        publicationFormData.append('contenu', updatedContenu);
        if (editImages.length > 0) {
          editImages.forEach((image) => {
            publicationFormData.append('images', image);
          });
        }

        const pubResponse = await fetch(`${API_URL}/publicationsCLUB/${publicationId}`, {
          method: 'PUT',
          body: publicationFormData,
        });

        if (!pubResponse.ok) {
          const contentType = pubResponse.headers.get('content-type');
          let errorData = {};
          if (contentType && contentType.includes('application/json')) {
            errorData = await pubResponse.json();
          } else {
            const text = await response.text();
            console.error('Réponse non-JSON reçue:', text);
            throw new Error('Réponse inattendue du serveur (non-JSON)');
          }
          throw new Error(errorData.error || 'Erreur lors de la mise à jour de la publication de l’événement');
        }
      }

      setEditEvenement(null);
      setNomEvenement('');
      setDescriptionEvenement('');
      setDateEvenement('');
      setLieu('');
      setCapacite('');
      setTimeSlots('');
      setIsPublic(false); // Réinitialiser isPublic
      setEditImages([]);

      const updatedEvenementsData = await fetch(`${API_URL}/api/club-events/gerant/${matricule}`).then(res => res.json());
      const updatedEvenements = updatedEvenementsData.filter(e => Number(e.ID_club) === Number(selectedClub.ID_club));
      const updatedPublications = await fetch(`${API_URL}/publicationsCLUB/club/${selectedClub.ID_club}`).then(res => res.json());
      setPublications(updatedPublications);
      setEvenements(updatedEvenements);
      setSuccess('Événement et publication modifiés avec succès !');
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleAddToCalendar = async (evenementId) => {
    console.log("handleAddToCalendar appelée avec evenementId:", evenementId);
    console.log("Matricule:", matricule);
  
    if (!matricule) {
      handleError('Matricule non défini. Veuillez vous reconnecter.');
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/api/club-events/add-to-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evenementId, matricule }),
      });
  
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData = {};
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.log("Erreur JSON:", errorData);
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error(`Réponse inattendue du serveur (non-JSON): ${text}`);
        }
        throw new Error(errorData.error || 'Erreur lors de l’ajout au calendrier');
      }
  
      const result = await response.json();
      setSuccess(result.message || 'Événement ajouté au calendrier avec succès !');
    } catch (err) {
      console.error("Erreur dans handleAddToCalendar:", err.message);
      handleError(err.message);
    }
  };

  const handleDeleteEvenement = (evenementId) => {
    showConfirmAlert('Êtes-vous sûr de vouloir supprimer cet événement ?', async () => {
      try {
        const response = await fetch(`${API_URL}/api/club-events/${evenementId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gerant_matricule: matricule }),
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
          throw new Error(errorData.error || 'Erreur lors de la suppression de l’événement');
        }

        const updatedEvenementsData = await fetch(`${API_URL}/api/club-events/gerant/${matricule}`).then(res => res.json());
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
    await fetchMessages();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !messageFile) {
      handleError('Veuillez entrer un message ou sélectionner un fichier');
      return;
    }

    try {
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
          console.error('Erreur renvoyée par le serveur:', errorData);
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text);
          throw new Error('Réponse inattendue du serveur (non-JSON)');
        }
        throw new Error(errorData.error || 'Erreur lors de l’envoi du message');
      }

      setSuccess('Message envoyé avec succès !');
      await fetchMessages();
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('Erreur dans handleSendMessage:', err.message);
      handleError(err.message);
    } finally {
      setNewMessage('');
      setMessageFile(null);
    }
  };

  const handleAddComment = async (publicationId) => {
    const contenu = newComment[publicationId] ? newComment[publicationId].trim() : '';
    if (!contenu) {
      handleError('Le commentaire ne peut pas être vide');
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
      <div className={styles['CLUB-ETD-header']}>
        <h1><FaUsers /> Gérer mes Clubs</h1>
        <p>Gérez les clubs dont vous êtes le gérant</p>
        {success && <p className={styles['CLUB-ETD-success-message']}>{success}</p>}
      </div>

      <div className={styles['CLUB-ETD-content-grid']}>
        <div className={styles['CLUB-ETD-event-list']}>
          {clubsGerant.length === 0 ? (
            <p className={styles['CLUB-ETD-no-data']}>Vous n’êtes gérant d’aucun club. Faites une demande de création pour en gérer un.</p>
          ) : (
            <>
              <h3>Choisissez un club à gérer :</h3>
              <ul id="clubs-list" className={styles['CLUB-ETD-clubs-list']}>
                {clubsGerant.map(club => (
                  <li key={club.ID_club} className={styles['CLUB-ETD-club-item']}>
                    <div className={styles['CLUB-ETD-club-preview']} onClick={() => handleSelectClub(club)}>
                      <div className={styles['CLUB-ETD-club-image-container']}>
                        {club.image_url ? (
                          <img
                            src={`${API_URL}${club.image_url}`}
                            alt={club.nom}
                            className={styles['CLUB-ETD-club-image']}
                            onError={(e) => {
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
                  <h3 className={styles['CLUB-ETD-section-title']}>Gestion de {selectedClub.nom}</h3>
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
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(true); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaUsers /> Voir les Membres
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(true); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaComment /> Publier
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(false); setShowDemandes(true); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaEnvelope /> Gérer les Demandes
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(true); setShowChangePhotoForm(false); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaEye /> Voir les Publications
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(true); setShowEvenements(false); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaCamera /> {selectedClub.image_url ? 'Modifier la Photo' : 'Ajouter une Photo'}
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={() => { setShowMembres(false); setShowDemandes(false); setShowPublicationForm(false); setShowPublications(false); setShowChangePhotoForm(false); setShowEvenements(true); setShowMessagerie(false); setSuccess(null); setEditPublication(null); setEditEvenement(null); setAlert(null); }}>
                      <FaCalendarAlt /> Gérer les Événements
                    </button>
                    <button className={styles['CLUB-ETD-button']} onClick={handleShowMessagerie}>
                      <FaComments /> Messagerie
                    </button>
                  </div>

                  {showChangePhotoForm && (
                    <div className={styles['CLUB-ETD-photo-form-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>{selectedClub.image_url ? 'Modifier la Photo du Club' : 'Ajouter une Photo au Club'}</h4>
                      <form className={styles['CLUB-ETD-form']} onSubmit={handleChangeClubPhoto}>
                        <div className={styles['CLUB-ETD-input-group']}>
                          <label>Choisir une Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleClubPhotoChange}
                            required
                          />
                          {newClubPhoto && (
                            <p className={styles['CLUB-ETD-form-images']}>
                              Image sélectionnée : {newClubPhoto.name}
                            </p>
                          )}
                        </div>
                        <button className={styles['CLUB-ETD-button']} type="submit">Mettre à Jour</button>
                        <button
                          className={styles['CLUB-ETD-close-button']}
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
                    <div className={styles['CLUB-ETD-members-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Membres du Club</h4>
                      <div className={styles['CLUB-ETD-search-bar']}>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher par nom ou prénom..."
                          className={styles['CLUB-ETD-search-input']}
                        />
                        <span className={styles['CLUB-ETD-search-icon']}>
                          <FaSearch />
                        </span>
                      </div>
                      {filteredMembres.length === 0 ? (
                        <p className={styles['CLUB-ETD-no-data']}>
                          {searchQuery ? 'Aucun membre correspondant à la recherche.' : 'Aucun membre dans ce club.'}
                        </p>
                      ) : (
                        <ul className={styles['CLUB-ETD-members-list']}>
                          {filteredMembres.map(membre => (
                            <li key={membre.Matricule} className={styles['CLUB-ETD-member-card']}>
                              <span>{membre.nom} {membre.prenom} ({membre.Matricule})</span>
                              <button
                                className={styles['CLUB-ETD-delete-button']}
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
                    <div className={styles['CLUB-ETD-publication-form-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Publier un Message ou un Événement</h4>
                      <form className={styles['CLUB-ETD-form']} onSubmit={handlePublier}>
                        <div className={styles['CLUB-ETD-input-group']}>
                          <label>Type :</label>
                          <select
                            className={styles['CLUB-ETD-select']}
                            value={typePublication}
                            onChange={(e) => setTypePublication(e.target.value)}
                          >
                            <option value="publication">Simple Publication</option>
                            <option value="evenement">Annonce d’un Événement (Privé)</option>
                            <option value="evenement_public">Annonce d’un Événement (Public)</option>
                          </select>
                        </div>
                        <div className={styles['CLUB-ETD-input-group']}>
                          <label>Contenu</label>
                          <textarea
                            className={styles['CLUB-ETD-textarea']}
                            value={publicationContenu}
                            onChange={(e) => setPublicationContenu(e.target.value)}
                            rows="4"
                            placeholder="Écrivez votre message ici..."
                          />
                        </div>
                        {(typePublication === 'evenement' || typePublication === 'evenement_public') && (
                          <div className={styles['CLUB-ETD-event-details-form']}>
                            <h5>Détails de l’Événement</h5>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Nom de l’Événement</label>
                              <input
                                className={styles['CLUB-ETD-input']}
                                type="text"
                                value={nomEvenement}
                                onChange={(e) => setNomEvenement(e.target.value)}
                                placeholder="Nom de l’événement"
                                required
                              />
                            </div>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Description</label>
                              <textarea
                                className={styles['CLUB-ETD-textarea']}
                                value={descriptionEvenement}
                                onChange={(e) => setDescriptionEvenement(e.target.value)}
                                rows="3"
                                placeholder="Description de l’événement (optionnel)"
                              />
                            </div>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Date</label>
                              <input
                                className={styles['CLUB-ETD-input']}
                                type="date"
                                value={dateEvenement}
                                onChange={(e) => setDateEvenement(e.target.value)}
                                required
                              />
                            </div>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Heure</label>
                              <select
                                className={styles['CLUB-ETD-select']}
                                value={timeSlots}
                                onChange={(e) => setTimeSlots(e.target.value)}
                                required
                              >
                                <option value="">Sélectionner un créneau horaire</option>
                                {timeSlotsOptions.map((slot, index) => (
                                  <option key={index} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Lieu</label>
                              <input
                                className={styles['CLUB-ETD-input']}
                                type="text"
                                value={lieu}
                                onChange={(e) => setLieu(e.target.value)}
                                placeholder="Lieu de l’événement"
                                required
                              />
                            </div>
                            <div className={styles['CLUB-ETD-input-group']}>
                              <label>Capacité</label>
                              <input
                                className={styles['CLUB-ETD-input']}
                                type="number"
                                value={capacite}
                                onChange={(e) => setCapacite(e.target.value)}
                                placeholder="Capacité (nombre de participants)"
                                required
                              />
                            </div>
                          </div>
                        )}
                        <div className={styles['CLUB-ETD-input-group']}>
                          <label>
                            {typePublication === 'evenement' || typePublication === 'evenement_public' ? 'Image de l’Événement (optionnel)' : 'Photos (jusqu’à 5)'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple={typePublication === 'publication'}
                            onChange={handleImageChange}
                          />
                          {publicationImages.length > 0 && (
                            <div className={styles['CLUB-ETD-form-images']}>
                              <p>Images sélectionnées :</p>
                              <ul>
                                {publicationImages.map((image, index) => (
                                  <li key={index}>{image.name}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button className={styles['CLUB-ETD-button']} type="submit">Publier</button>
                      </form>
                    </div>
                  )}

                  {showDemandes && (
                    <div className={styles['CLUB-ETD-requests-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Demandes pour Rejoindre</h4>
                      {demandes.length === 0 ? (
                        <p className={styles['CLUB-ETD-no-data']}>Aucune demande en attente.</p>
                      ) : (
                        <ul className={styles['CLUB-ETD-requests-list']}>
                          {demandes.map(demande => (
                            <li key={demande.ID_demande} className={styles['CLUB-ETD-request-card']}>
                              <span>{demande.nom} {demande.prenom} ({demande.matricule_etudiant})</span>
                              <div className={styles['CLUB-ETD-request-actions']}>
                                <button
                                  className={styles['CLUB-ETD-edit-button']}
                                  onClick={() => handleAccepterDemande(demande.ID_demande)}
                                >
                                  Accepter
                                </button>
                                <button
                                  className={styles['CLUB-ETD-delete-button']}
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
                    <div className={styles['CLUB-ETD-publications-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Publications de {selectedClub.nom}</h4>
                      {publications.length === 0 ? (
                        <p className={styles['CLUB-ETD-no-data']}>Aucune publication pour ce club.</p>
                      ) : (
                        <>
                          {editPublication ? (
                            <div className={styles['CLUB-ETD-edit-publication-section']}>
                              <h4 className={styles['CLUB-ETD-section-title']}>Modifier la Publication</h4>
                              <form className={styles['CLUB-ETD-form']} onSubmit={handleUpdatePublication}>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Contenu</label>
                                  <textarea
                                    className={styles['CLUB-ETD-textarea']}
                                    value={editContenu}
                                    onChange={(e) => setEditContenu(e.target.value)}
                                    rows="4"
                                    placeholder="Écrivez votre message ici..."
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
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
                                    <div className={styles['CLUB-ETD-form-images']}>
                                      <p>Nouvelles images sélectionnées :</p>
                                      <ul>
                                        {editImages.map((image, index) => (
                                          <li key={index}>{image.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {editImages.length === 0 && editPublication.images && editPublication.images.length > 0 && (
                                    <div className={styles['CLUB-ETD-form-images']}>
                                      <p>Images actuelles :</p>
                                      <div className={styles['CLUB-ETD-publication-images']}>
                                        {editPublication.images.map((image, index) => (
                                          <img
                                            key={index}
                                            src={`${API_URL}${image.image_url}`}
                                            alt={`Image ${index + 1}`}
                                            className={styles['CLUB-ETD-carousel-image']}
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/100x75?text=Image+Indisponible';
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button className={styles['CLUB-ETD-button']} type="submit">Mettre à Jour</button>
                                <button
                                  className={styles['CLUB-ETD-close-button']}
                                  type="button"
                                  onClick={() => setEditPublication(null)}
                                >
                                  Annuler
                                </button>
                              </form>
                            </div>
                          ) : (
                            <ul className={styles['CLUB-ETD-social-posts']}>
                              {publications.map(pub => {
                                const relatedEvent = evenements.find(e => e.ID_publication === pub.ID_publication);
                                const hasImages = pub.images && pub.images.length > 0;

                                return (
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
                                    {hasImages && (
                                      <div className={styles['CLUB-ETD-post-image-carousel']}>
                                        <button
                                          className={`${styles['CLUB-ETD-carousel-button']} ${styles['CLUB-ETD-prev']}`}
                                          onClick={() => handlePrevImage(pub.ID_publication, 'pub', pub.images.length)}
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
                                          onClick={() => handleNextImage(pub.ID_publication, 'pub', pub.images.length)}
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
                                    )}
                                    <div className={styles['CLUB-ETD-post-content']}>
                                      <p>{pub.contenu}</p>
                                      {relatedEvent && (
                                        <div className={styles['CLUB-ETD-event-details']}>
                                          <p>
                                            Événement "{relatedEvent.nom_evenement}" le {new Date(relatedEvent.date_evenement).toLocaleDateString()} à {relatedEvent.lieu} ({relatedEvent.time_slots || 'Non spécifié'}) avec une capacité de {relatedEvent.capacite} participants. {relatedEvent.description_evenement || 'Aucune description supplémentaire.'}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className={styles['CLUB-ETD-post-actions']}>
                                      <span>{pub.likes || 0} J’aime</span>
                                      <span>{pub.commentaires_count || 0} Commentaire(s)</span>
                                      <div className={styles['CLUB-ETD-post-buttons']}>
                                        <button
                                          className={styles['CLUB-ETD-edit-button']}
                                          onClick={() => handleEditPublication(pub)}
                                        >
                                          <FaEdit /> Modifier
                                        </button>
                                        <button
                                          className={styles['CLUB-ETD-delete-button']}
                                          onClick={() => handleDeletePublication(pub.ID_publication)}
                                        >
                                          <FaTrash /> Supprimer
                                        </button>
                                      </div>
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
                        </>
                      )}
                    </div>
                  )}

                  {showEvenements && (
                    <div className={styles['CLUB-ETD-events-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Événements de {selectedClub.nom}</h4>
                      {evenements.length === 0 ? (
                        <p className={styles['CLUB-ETD-no-data']}>Aucun événement pour ce club.</p>
                      ) : (
                        <>
                          {editEvenement ? (
                            <div className={styles['CLUB-ETD-edit-event-section']}>
                              <h4 className={styles['CLUB-ETD-section-title']}>Modifier l’Événement</h4>
                              <form className={styles['CLUB-ETD-form']} onSubmit={handleUpdateEvenement}>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Nom de l’Événement</label>
                                  <input
                                    className={styles['CLUB-ETD-input']}
                                    type="text"
                                    value={nomEvenement}
                                    onChange={(e) => setNomEvenement(e.target.value)}
                                    placeholder="Nom de l’événement"
                                    required
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Description</label>
                                  <textarea
                                    className={styles['CLUB-ETD-textarea']}
                                    value={descriptionEvenement}
                                    onChange={(e) => setDescriptionEvenement(e.target.value)}
                                    rows="3"
                                    placeholder="Description de l’événement (optionnel)"
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Date</label>
                                  <input
                                    className={styles['CLUB-ETD-input']}
                                    type="date"
                                    value={dateEvenement}
                                    onChange={(e) => setDateEvenement(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Heure</label>
                                  <select
                                    className={styles['CLUB-ETD-select']}
                                    value={timeSlots}
                                    onChange={(e) => setTimeSlots(e.target.value)}
                                    required
                                  >
                                    <option value="">Sélectionner un créneau horaire</option>
                                    {timeSlotsOptions.map((slot, index) => (
                                      <option key={index} value={slot}>{slot}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Lieu</label>
                                  <input
                                    className={styles['CLUB-ETD-input']}
                                    type="text"
                                    value={lieu}
                                    onChange={(e) => setLieu(e.target.value)}
                                    placeholder="Lieu de l’événement"
                                    required
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Capacité</label>
                                  <input
                                    className={styles['CLUB-ETD-input']}
                                    type="number"
                                    value={capacite}
                                    onChange={(e) => setCapacite(e.target.value)}
                                    placeholder="Capacité (nombre de participants)"
                                    required
                                  />
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>Visibilité</label>
                                  <select
                                    className={styles['CLUB-ETD-select']}
                                    value={isPublic}
                                    onChange={(e) => setIsPublic(e.target.value === 'true')}
                                  >
                                    <option value={false}>Privé (Membres du club uniquement)</option>
                                    <option value={true}>Public (Tous les étudiants)</option>
                                  </select>
                                </div>
                                <div className={styles['CLUB-ETD-input-group']}>
                                  <label>
                                    Nouvelle Image (optionnel, laissez vide pour garder l’ancienne)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditImageChange}
                                  />
                                  {editImages.length > 0 && (
                                    <div className={styles['CLUB-ETD-form-images']}>
                                      <p>Nouvelle image sélectionnée :</p>
                                      <ul>
                                        {editImages.map((image, index) => (
                                          <li key={index}>{image.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {editImages.length === 0 && editEvenement.image_url && (
                                    <div className={styles['CLUB-ETD-form-images']}>
                                      <p>Image actuelle :</p>
                                      <img
                                        src={`${API_URL}${editEvenement.image_url}`}
                                        alt="Événement"
                                        className={styles['CLUB-ETD-carousel-image']}
                                        onError={(e) => {
                                          e.target.src = 'https://via.placeholder.com/100x75?text=Image+Indisponible';
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <button className={styles['CLUB-ETD-button']} type="submit">Mettre à Jour</button>
                                <button
                                  className={styles['CLUB-ETD-close-button']}
                                  type="button"
                                  onClick={() => setEditEvenement(null)}
                                >
                                  Annuler
                                </button>
                              </form>
                            </div>
                          ) : (
                            <ul className={styles['CLUB-ETD-social-events']}>
                              {[...evenements]
                                .sort((a, b) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
                                  const dateA = new Date(a.date_evenement);
                                  const dateB = new Date(b.date_evenement);
                                  
                                  // Calculer la différence absolue par rapport à aujourd'hui
                                  const diffA = Math.abs(dateA - today);
                                  const diffB = Math.abs(dateB - today);
                                  
                                  // Si les différences sont différentes, trier par proximité
                                  if (diffA !== diffB) {
                                    return diffA - diffB; // Plus proche en premier
                                  }
                                  
                                  // Si les différences sont égales (même distance), trier par date croissante
                                  return dateA - dateB;
                                })
                                .map(evenement => (
                                  <li key={evenement.ID_club_evenement} className={styles['CLUB-ETD-social-event-card']}>
                                    <div className={styles['CLUB-ETD-event-header']}>
                                      <div className={styles['CLUB-ETD-event-club-info']}>
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
                                          <p className={styles['CLUB-ETD-event-date']}>
                                            {new Date(evenement.date_evenement).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {evenement.image_url && (
                                      <div className={styles['CLUB-ETD-event-image-carousel']}>
                                        <div className={styles['CLUB-ETD-carousel-image-container']}>
                                          <img
                                            src={`${API_URL}${evenement.image_url}`}
                                            alt={evenement.nom_evenement}
                                            className={styles['CLUB-ETD-carousel-image']}
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible';
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <div className={styles['CLUB-ETD-event-content']}>
                                      <h5>{evenement.nom_evenement}</h5>
                                      <p><strong>Lieu :</strong> {evenement.lieu}</p>
                                      <p><strong>Capacité :</strong> {evenement.capacite} participants</p>
                                      <p><strong>Heure :</strong> {evenement.time_slots || 'Non spécifié'}</p>
                                      <p><strong>Visibilité :</strong> {evenement.is_public ? 'Public (Tous les étudiants)' : 'Privé (Membres du club uniquement)'}</p>
                                      <p><strong>Description :</strong> {evenement.description_evenement || 'Aucune description'}</p>
                                    </div>
                                    <div className={styles['CLUB-ETD-event-actions']}>
                                      <button
                                        className={styles['CLUB-ETD-edit-button']}
                                        onClick={() => handleEditEvenement(evenement)}
                                      >
                                        <FaEdit /> Modifier
                                      </button>
                                      <button
                                        className={styles['CLUB-ETD-button']}
                                        onClick={() => handleAddToCalendar(evenement.ID_club_evenement)}
                                      >
                                        <FaCalendarAlt /> Ajouter à mon Calendrier
                                      </button>
                                      <button
                                        className={styles['CLUB-ETD-delete-button']}
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
                    <div className={styles['CLUB-ETD-messagerie-section']}>
                      <h4 className={styles['CLUB-ETD-section-title']}>Messagerie de groupe - {selectedClub.nom}</h4>
                      <div className={styles['CLUB-ETD-messagerie-container']}>
                        {messages.length === 0 ? (
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
                                {msg.fichier_url && (
                                  <div>
                                    <a
                                      href={`${API_URL}${msg.fichier_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Télécharger le fichier
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
                        <button className={styles['CLUB-ETD-button']} type="submit">Envoyer</button>
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
        <div className={`${styles['CLUB-ETD-custom-alert']} ${styles[`CLUB-ETD-${alert.type}`]}`}>
          <div className={styles['CLUB-ETD-alert-content']}>
            <div className={styles['CLUB-ETD-alert-icon']}>
              {alert.type === 'confirm' ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
            </div>
            <p>{alert.message}</p>
            <div className={styles['CLUB-ETD-alert-buttons']}>
              {alert.type === 'confirm' ? (
                <>
                  <button className={styles['CLUB-ETD-confirm-button']} onClick={alert.onConfirm}>
                    OK
                  </button>
                  <button className={styles['CLUB-ETD-cancel-button']} onClick={alert.onCancel}>
                    Annuler
                  </button>
                </>
              ) : (
                <button className={styles['CLUB-ETD-close-button']} onClick={alert.onClose}>
                  <FaTimes /> Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GererMesClubs;