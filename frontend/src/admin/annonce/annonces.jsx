import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa'; // Icônes
import '../../admin_css_files/annonce.css';

const handleImageUpload = async (e, setFormData) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post('http://localhost:8082/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setFormData(prevState => ({ ...prevState, image_url: response.data.imageUrl }));
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image :', error);
  }
};

function GestionAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    admin_id: 1
  });
  const [editingAnnonce, setEditingAnnonce] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const response = await axios.get('http://localhost:8082/api/annonces');
      setAnnonces(response.data);
      console.log('Annonces récupérées :', response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces :', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = {
      title: formData.title,
      content: formData.content,
      image_url: formData.image_url,
      admin_id: formData.admin_id
    };

    try {
      if (editingAnnonce) {
        await axios.put(`http://localhost:8082/api/annonces/${editingAnnonce.id}`, formDataToSend);
      } else {
        await axios.post('http://localhost:8082/api/annonces', formDataToSend);
      }

      setShowForm(false);
      setEditingAnnonce(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        admin_id: 1
      });
      fetchAnnonces();
    } catch (error) {
      console.error('Erreur lors de l\'ajout/modification de l\'annonce :', error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8082/api/annonces/${id}`);
      fetchAnnonces();
      if (selectedAnnonce === id) setIsClosing(true);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'annonce :', error);
    }
  };

  const handleEdit = (annonce) => {
    setEditingAnnonce(annonce);
    setFormData({
      title: annonce.title,
      content: annonce.content,
      image_url: annonce.image_url,
      admin_id: annonce.admin_id
    });
    setShowForm(true);
    setSelectedAnnonce(null);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFullscreen = (id) => {
    if (selectedAnnonce === id) {
      setIsClosing(true);
    } else {
      setSelectedAnnonce(id);
      setIsClosing(false);
    }
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setSelectedAnnonce(null);
      setIsClosing(false);
    }
  };

  return (
    <div id="annonces">
    <div className="container">
      <div className="button-group">
        <button onClick={() => navigate('/admin')}>
          <FaHome style={{ marginRight: '8px' }} /> Retour à l&apos;accueil
        </button>
        <button onClick={() => setShowForm(!showForm)}>
          <FaPlus style={{ marginRight: '8px' }} /> {showForm ? 'Masquer le formulaire' : 'Ajouter une annonce'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="input-group">
            <input
              type="text"
              name="title"
              placeholder="Titre de l'annonce"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <textarea
              name="content"
              placeholder="Contenu"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="image_url"
              placeholder="URL de l'image"
              value={formData.image_url}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <input
              type="file"
              name="image"
              onChange={(e) => handleImageUpload(e, setFormData)}
              accept="image/*"
            />
          </div>
          <button type="submit">
            <FaPlus style={{ marginRight: '8px' }} /> {editingAnnonce ? 'Modifier' : 'Ajouter'}
          </button>
        </form>
      )}

      <h2>Liste des Annonces</h2>
      <ul>
        {annonces.map((annonce) => (
          <li
            key={annonce.id}
            className={`annonce-square ${selectedAnnonce === annonce.id ? 'fullscreen' : ''}`}
            onClick={() => toggleFullscreen(annonce.id)}
          >
            <h3>{annonce.title}</h3>
          </li>
        ))}
      </ul>

      {selectedAnnonce && (
        <div className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onAnimationEnd={handleAnimationEnd}>
          <div className="event-modal">
            <button className="close-button" onClick={() => toggleFullscreen(selectedAnnonce)}>
              <FaTimes style={{ marginRight: '8px' }} /> Fermer
            </button>
            <div className="modal-content">
              <div className="modal-image">
                {annonces.find((a) => a.id === selectedAnnonce)?.image_url ? (
                  <img
                    src={annonces.find((a) => a.id === selectedAnnonce).image_url}
                    alt={annonces.find((a) => a.id === selectedAnnonce).title}
                    className="event-image"
                    onError={(e) => console.error('Erreur chargement image :', annonces.find((a) => a.id === selectedAnnonce).image_url)}
                  />
                ) : (
                  <div className="image-placeholder">Aucune image</div>
                )}
              </div>
              <div className="modal-text">
                <h3>{annonces.find((a) => a.id === selectedAnnonce)?.title}</h3>
                <p>{annonces.find((a) => a.id === selectedAnnonce)?.content}</p>
                <div className="button-group">
                  <button className="edit-button" onClick={() => handleEdit(annonces.find((a) => a.id === selectedAnnonce))}>
                    <FaEdit style={{ marginRight: '8px' }} /> Modifier
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(selectedAnnonce)}>
                    <FaTrash style={{ marginRight: '8px' }} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default GestionAnnonces;