import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes, FaCalendar, FaMapMarkerAlt, FaUsers, FaSearch, FaList, FaPlus, FaHome } from 'react-icons/fa';
import '../../css_files/index.css';

const handleImageUpload = (e, setFormData) => {
  const file = e.target.files[0];
  setFormData(prevState => ({ ...prevState, image: file }));
};

function GestionEvenements() {
  const [evenements, setEvenements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom_evenement: '',
    description_evenement: '',
    date_evenement: '',
    lieu: '',
    capacite: '',
    organisateur_admin: '',
    image_url: '',
    image: null
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isClosing, setIsClosing] = useState(false); // Nouvel état pour l’animation de fermeture
  const [searchQuery, setSearchQuery] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchEvenements();
    setTimeout(() => setIsFirstLoad(false), 1000);
  }, []);

  const fetchEvenements = async () => {
    try {
      const response = await axios.get('http://localhost:8084/api/evenements');
      setEvenements(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements :', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('nom_evenement', formData.nom_evenement);
    formDataToSend.append('description_evenement', formData.description_evenement);
    formDataToSend.append('date_evenement', formData.date_evenement);
    formDataToSend.append('lieu', formData.lieu);
    formDataToSend.append('capacite', formData.capacite);
    formDataToSend.append('organisateur_admin', formData.organisateur_admin);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
      console.log('Image envoyée au backend :', formData.image.name);
    }
    if (formData.image_url) {
      formDataToSend.append('image_url', formData.image_url);
      console.log('URL manuelle envoyée au backend :', formData.image_url);
    }

    try {
      let response;
      if (editingEvent) {
        response = await axios.put(`http://localhost:8084/api/evenements/${editingEvent.ID_evenement}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post(`http://localhost:8084/api/evenements`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      console.log('Réponse du backend :', response.data);

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        nom_evenement: '',
        description_evenement: '',
        date_evenement: '',
        lieu: '',
        capacite: '',
        organisateur_admin: '',
        image_url: '',
        image: null
      });
      fetchEvenements();
    } catch (error) {
      console.error('Erreur lors de l\'ajout/modification :', error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:8084/api/evenements/${id}`);
      console.log('Réponse suppression :', response.data);

      await fetchEvenements();
      if (selectedEvent === id) {
        setIsClosing(true); // Déclenche l’animation de fermeture
      }
    } catch (error) {
      console.error('Erreur lors de la suppression :', error.response?.data || error.message);
      alert('Erreur lors de la suppression. Vérifiez la console.');
    }
  };

  const handleEdit = (evenement) => {
    setEditingEvent(evenement);
    setFormData({
      nom_evenement: evenement.nom_evenement,
      description_evenement: evenement.description_evenement,
      date_evenement: evenement.date_evenement,
      lieu: evenement.lieu,
      capacite: evenement.capacite,
      organisateur_admin: evenement.organisateur_admin,
      image_url: evenement.image_url,
      image: null
    });
    setShowForm(true);
    setSelectedEvent(null);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleDetails = (id) => {
    if (selectedEvent === id) {
      setIsClosing(true); // Déclenche l’animation de fermeture
    } else {
      setSelectedEvent(id);
      setIsClosing(false);
    }
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setSelectedEvent(null);
      setIsClosing(false);
    }
  };

  const filteredEvenements = evenements.filter(evenement =>
    evenement.nom_evenement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="evenement-container">
      <h1 className={isFirstLoad ? 'animate-on-load' : ''}>Gestion des Événements Universitaires</h1>
      <button className={isFirstLoad ? 'animate-on-load' : ''} onClick={() => navigate('/admin')}>
        <FaHome /> Retour à l&apos;accueil
      </button>
      <button className={isFirstLoad ? 'animate-on-load' : ''} onClick={() => setShowForm(!showForm)}>
        <FaPlus /> {showForm ? 'Masquer le formulaire' : 'Ajouter un événement'}
      </button>

      {showForm && (
        <form className={isFirstLoad ? 'animate-on-load' : ''} onSubmit={handleSubmit} ref={formRef}>
          <div className="input-group">
            <input type="text" name="nom_evenement" placeholder="Nom de l'événement" value={formData.nom_evenement} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <textarea name="description_evenement" placeholder="Description" value={formData.description_evenement} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaCalendar className="input-icon" />
            <input type="date" name="date_evenement" value={formData.date_evenement} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaMapMarkerAlt className="input-icon" />
            <input type="text" name="lieu" placeholder="Lieu" value={formData.lieu} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaUsers className="input-icon" />
            <input type="number" name="capacite" placeholder="Capacité" value={formData.capacite} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <input type="number" name="organisateur_admin" placeholder="Matricule de l'organisateur" value={formData.organisateur_admin} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <input type="text" name="image_url" placeholder="URL de l'image" value={formData.image_url} onChange={handleChange} />
          </div>
          <div className="input-group">
            <input type="file" name="image" onChange={(e) => handleImageUpload(e, setFormData)} accept="image/*" />
          </div>
          <button type="submit">{editingEvent ? 'Modifier' : 'Ajouter'}</button>
        </form>
      )}

      <h2 className={isFirstLoad ? 'animate-on-load' : ''}><FaList /> Liste des Événements</h2>
      <div className={`search-container ${isFirstLoad ? 'animate-on-load' : ''}`}>
        <input
          type="text"
          placeholder="Rechercher un événement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />
        <FaSearch className="search-icon" />
      </div>
      <ul className={isFirstLoad ? 'animate-on-load' : ''}>
        {filteredEvenements.length > 0 ? (
          filteredEvenements.map((evenement) => (
            <li
              key={evenement.ID_evenement}
              className="event-square"
              onClick={() => toggleDetails(evenement.ID_evenement)}
            >
              {evenement.image_url && (
                <img
                  src={evenement.image_url}
                  alt={evenement.nom_evenement}
                  className="event-image"
                />
              )}
              <h3>{evenement.nom_evenement}</h3>
            </li>
          ))
        ) : (
          <p className="no-results">Aucun événement trouvé.</p>
        )}
      </ul>

      {selectedEvent && (
        <div className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onAnimationEnd={handleAnimationEnd}>
          <div className="event-modal">
            {(() => {
              const evenement = evenements.find(e => e.ID_evenement === selectedEvent);
              if (!evenement) return null;
              return (
                <>
                  {evenement.image_url && (
                    <img
                      src={evenement.image_url}
                      alt={evenement.nom_evenement}
                      className="event-image"
                    />
                  )}
                  <h3>{evenement.nom_evenement}</h3>
                  <div className="description">
                    <p>{evenement.description_evenement}</p>
                  </div>
                  <p><FaCalendar /> Date: {evenement.date_evenement}</p>
                  <p><FaMapMarkerAlt /> Lieu: {evenement.lieu}</p>
                  <p><FaUsers /> Capacité: {evenement.capacite}</p>
                  <div className="button-group">
                    <button className="close-button" onClick={() => toggleDetails(selectedEvent)}>
                      <FaTimes /> Fermer
                    </button>
                    <button className="edit-button" onClick={() => handleEdit(evenement)}>
                      <FaEdit /> Modifier
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(evenement.ID_evenement)}>
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEvenements;