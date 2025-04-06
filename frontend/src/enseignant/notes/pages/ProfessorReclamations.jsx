import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faFileAlt, faReply } from '@fortawesome/free-solid-svg-icons';
import "../note.css";

const ProfessorReclamations = () => {
  const navigate = useNavigate();
  const [reclamations, setReclamations] = useState([]);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = async () => {
    try {
      const res = await api.get('/reclamations');
      setReclamations(res.data || []);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      setError(`Failed to load reclamations: ${errorMsg}`);
      toast.error(`Error: ${errorMsg}`);
      if (err.response?.status === 401) navigate('/');
    }
  };

  const handleResponseChange = (reclamationId, value) => {
    setResponses(prev => ({
      ...prev,
      [reclamationId]: value
    }));
  };

  const submitResponse = async (reclamationId) => {
    const responseText = responses[reclamationId];
    if (!responseText) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await api.post(`/reclamation/${reclamationId}/respond`, {
        prof_response: responseText
      });
      toast.success('Response submitted successfully');
      setResponses(prev => ({ ...prev, [reclamationId]: '' }));
      fetchReclamations();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      toast.error(`Failed to submit response: ${errorMsg}`);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/GESENS');
  };

  return (
    <>
    <div id="notes">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>
      <div className="sidebar">
        <div className="logo">
          <h2>Notes</h2>
        </div>
        <button className="sidebar-button" onClick={() => navigate('/PROFREC')}>
          <FontAwesomeIcon icon={faFileAlt} /> Réclamations
        </button>
        <button className="sidebar-button" onClick={handleBack}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Retour
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>BIENVENUE SUR VOTRE ESPACE RÉCLAMATIONS</h1>
            <p>Gérez les réclamations des étudiants</p>
          </div>
          <div className="section-card">
            <h1>Réclamations</h1>
            {error && <p className="error-message">{error}</p>}
            {reclamations.length > 0 ? (
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Semestre</th>
                    <th>Étudiant</th>
                    <th>Réclamation</th>
                    <th>Date</th>
                    <th>Réponse</th>
                  </tr>
                </thead>
                <tbody>
                  {reclamations.map((rec) => (
                    <tr key={rec.ID_reclamation}>
                      <td>{rec.nom_module}</td>
                      <td>{rec.Semestre}</td>
                      <td>{`${rec.nom} ${rec.prenom}`}</td>
                      <td>{rec.reclamation_text}</td>
                      <td>{new Date(rec.date_reclamation).toLocaleString()}</td>
                      <td>
                        {rec.prof_response ? (
                          <div>
                            <p>{rec.prof_response}</p>
                            <small>Répondu le {new Date(rec.date_response).toLocaleString()}</small>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              value={responses[rec.ID_reclamation] || ''}
                              onChange={(e) => handleResponseChange(rec.ID_reclamation, e.target.value)}
                              placeholder="Écrire une réponse..."
                              rows="2"
                              style={{ width: '100%' }}
                            />
                            <button
                              className="submit-btn"
                              onClick={() => submitResponse(rec.ID_reclamation)}
                              style={{ marginTop: '5px' }}
                            >
                              <FontAwesomeIcon icon={faReply} /> Répondre
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-results">Aucune réclamation disponible.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ProfessorReclamations;