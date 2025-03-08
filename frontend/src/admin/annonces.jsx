import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css_files/index.css';

const handleImageUpload = async (e, setFormData) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post('http://localhost:8082/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    setFormData(prevState => ({ ...prevState, image_url: response.data.imageUrl }));
  } catch (error) {
    console.error('Error uploading image:', error);
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
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const response = await axios.get('http://localhost:8082/api/annonces');
      setAnnonces(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = {
        ...formData,
        admin_id: parseInt(formData.admin_id, 10) // Convert to integer
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
            admin_id: 1 // Reset to a valid integer
        });
        fetchAnnonces();
    } catch (error) {
        console.error('Error adding/updating announcement:', error);
    }
};

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8082/api/annonces/${id}`);
      fetchAnnonces();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleEdit = (annonce) => {
    setEditingAnnonce(annonce);
  
    // Ensure the image_url is not rewritten with the base URL
    const imageUrl = annonce.image_url?.startsWith('http') 
      ? annonce.image_url 
      : `http://localhost:8082${annonce.image_url}`;
  
    setFormData({
      title: annonce.title,
      content: annonce.content,
      image_url: imageUrl, // Use the corrected image URL
      admin_id: annonce.admin_id
    });
  
    setShowForm(true);
    setSelectedAnnonce(null);
  
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFullscreen = (id) => {
    setSelectedAnnonce(selectedAnnonce === id ? null : id);
  };

  return (
    <div className="container">
      <h1>Gestion des Annonces</h1>
      <button onClick={() => navigate('/admin')}>Retour à l&apos;accueil</button>
  
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Masquer le formulaire' : 'Ajouter une annonce'}
      </button>
  
      {showForm && (
        <form onSubmit={handleSubmit} ref={formRef}>
          <input
            type="text"
            name="title"
            placeholder="Titre de l'annonce"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            name="content"
            placeholder="Contenu"
            value={formData.content}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="image_url"
            placeholder="URL de l'image"
            value={formData.image_url}
            onChange={handleChange}
          />
          <input
            type="file"
            name="image"
            onChange={(e) => handleImageUpload(e, setFormData)}
            accept="image/*"
          />
          <button type="submit">
            {editingAnnonce ? 'Modifier' : 'Ajouter'}
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
            {/* Remove the image from the feed */}
            <h3>{annonce.title}</h3>
            <p>{annonce.content}</p>
            {selectedAnnonce === annonce.id && (
              <div className="annonce-details">
                <button
                  className="close-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnonce(null);
                  }}
                >
                  Fermer
                </button>
                <button
                  className="edit-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(annonce);
                  }}
                >
                  Modifier
                </button>
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(annonce.id);
                  }}
                >
                  Supprimer
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
  
      {/* Add the fullscreen view here */}
      {selectedAnnonce && (
        <div className="annonce-square fullscreen">
          {/* Display the image in the fullscreen view */}
          {annonces.find((a) => a.id === selectedAnnonce)?.image_url && (
            <img
              src={annonces.find((a) => a.id === selectedAnnonce).image_url}
              alt={annonces.find((a) => a.id === selectedAnnonce).title}
              className="annonce-image"
            />
          )}
          <h3>{annonces.find((a) => a.id === selectedAnnonce)?.title}</h3>
          <p>{annonces.find((a) => a.id === selectedAnnonce)?.content}</p>
          <div className="button-group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnonce(null);
              }}
            >
              Fermer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(annonces.find((a) => a.id === selectedAnnonce));
              }}
            >
              Modifier
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(selectedAnnonce);
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionAnnonces;