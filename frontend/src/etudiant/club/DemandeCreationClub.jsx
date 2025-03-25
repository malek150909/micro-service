// club-evenement-service/frontend/src/components/DemandeCreationClub.jsx
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const DemandeCreationClub = ({ setError }) => {
  const [formData, setFormData] = useState({
    nom_club: '',
    description_club: '',
  });
  const [success, setSuccess] = useState(null);
  

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const data = {
      matricule_etudiant: matricule,
      nom_club: formData.nom_club,
      description_club: formData.description_club,
    };

    console.log('Données envoyées:', data);

    try {
      const response = await fetch(`${API_URL}/demandesCLUB/creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l’envoi de la demande');
        } else {
          const errorText = await response.text();
          console.error('Réponse non-JSON reçue:', errorText);
          throw new Error(`Erreur serveur: ${response.status} - ${response.statusText}`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        setSuccess(result.message || 'Demande envoyée avec succès !');
        setFormData({ nom_club: '', description_club: '' });
      } else {
        throw new Error('Réponse inattendue du serveur (non-JSON)');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
    <div id="clubs">
      <div className="header">
        <h1>Demande de Création de Club</h1>
        <p>Envoyez une demande pour créer un nouveau club</p>
        {success && <p className="success-message">{success}</p>}
      </div>

      <div className="content-grid">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nom du Club</label>
            <input
              type="text"
              name="nom_club"
              value={formData.nom_club}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea
              name="description_club"
              value={formData.description_club}
              onChange={handleInputChange}
              rows="4"
            />
          </div>
          <div className="button-group">
            <button type="submit">
              <FaPlus /> Envoyer la Demande
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
};

export default DemandeCreationClub;