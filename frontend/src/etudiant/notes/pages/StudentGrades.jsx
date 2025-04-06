import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faPen, faHome, faClipboardList, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "../global.css";

const StudentGrades = () => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState('');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    niveau: '',
    semestre: '',
  });
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [reclamationInputs, setReclamationInputs] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  useEffect(() => {
    fetchStudentName();
    fetchStudentLevel();
  }, []);

  useEffect(() => {
    if (filters.niveau && filters.semestre) {
      setGrades([]);
      fetchGrades();
    }
  }, [filters.niveau, filters.semestre]);

  const fetchStudentName = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        navigate('/');
        return;
      }
      const decoded = jwtDecode(token);
      const matricule = decoded.matricule;
      console.log('matricule =' , matricule) ;
      const res = await api.get(`/user/${matricule}`);
      const user = res.data;
      setStudentName(`${user.nom} ${user.prenom}`);
    } catch (err) {
      console.error('Error fetching student name:', err.response?.data || err.message);
      setStudentName('Unknown Student');
      setError('Failed to load student details.');
    }
  };

  const fetchStudentLevel = async () => {
    try {
      const res = await api.get('/student-level');
      const level = res.data.niveau;
      setCurrentLevel(level);

      const levels = ['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3'];
      const currentIndex = levels.indexOf(level);
      const pastLevels = levels.slice(0, currentIndex + 1);
      setAvailableLevels(pastLevels);
    } catch (err) {
      setError('Failed to fetch student level.');
      console.error(err);
      toast.error(err.response?.data?.error || 'Error fetching student level.');
    }
  };

  const fetchGrades = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const decoded = jwtDecode(token);
      const res = await api.get('/student-grades', { 
        params: { niveau: filters.niveau, semestre: filters.semestre },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format from server');
      }
      setGrades(res.data);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      console.error('Fetch grades error:', errorMsg, err);
      setError(`Failed to load grades: ${errorMsg}`);
      toast.error(`Error: ${errorMsg}`);
      if (err.response?.status === 401) navigate('/');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReclamationChange = (moduleId, value) => {
    setReclamationInputs(prev => ({
      ...prev,
      [moduleId]: value
    }));
  };

  const openReclamationModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setIsModalOpen(true);
  };

  const closeReclamationModal = () => {
    setIsModalOpen(false);
    setSelectedModuleId(null);
    setReclamationInputs(prev => ({
      ...prev,
      [selectedModuleId]: ''
    }));
  };

  const submitReclamation = async () => {
    const reclamationText = reclamationInputs[selectedModuleId];
    if (!reclamationText) {
      toast.error('Please enter a reclamation text');
      return;
    }

    try {
      await api.post('/reclamation', {
        ID_module: selectedModuleId,
        Semestre: filters.semestre,
        reclamation_text: reclamationText
      });
      toast.success('Reclamation submitted successfully');
      closeReclamationModal();
      fetchGrades();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      toast.error(`Failed to submit reclamation: ${errorMsg}`);
    }
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
        <button className="sidebar-button" onClick={() => navigate('/etudiant')}>
          <FontAwesomeIcon icon={faHome} /> Retour
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>BIENVENUE SUR VOTRE ESPACE NOTES, {studentName}</h1>
            <p>Consultez vos notes archivées</p>
          </div>
          <div className="section-card">
            <h1>Mes Notes Archivées</h1>
            <div className="filters">
              <select
                name="niveau"
                value={filters.niveau}
                onChange={handleFilterChange}
              >
                <option value="">Sélectionner une année</option>
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <select
                name="semestre"
                value={filters.semestre}
                onChange={handleFilterChange}
              >
                <option value="">Sélectionner un semestre</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
            {error && <p className="error-message">{error}</p>}
            {filters.niveau && filters.semestre ? (
              grades.length > 0 ? (
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Note</th>
                      <th>Remarque</th>
                      <th>Niveau</th>
                      <th>Semestre</th>
                      <th>Réclamation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={`${grade.ID_module}-${grade.Semestre}`}>
                        <td>{grade.nom_module}</td>
                        <td>{grade.Moyenne !== null ? grade.Moyenne : 'Non soumise'}</td>
                        <td>{grade.remarque || '-'}</td>
                        <td>{grade.niveau}</td>
                        <td>{grade.Semestre}</td>
                        <td>
                          {grade.reclamation ? (
                            <div>
                              <p><strong>Votre réclamation:</strong> {grade.reclamation}</p>
                              {grade.prof_response ? (
                                <p><strong>Réponse du professeur:</strong> {grade.prof_response}</p>
                              ) : (
                                <p>En attente de réponse</p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => openReclamationModal(grade.ID_module)}
                              className="reclamation-button"
                              title="Ajouter une réclamation"
                            >
                              <FontAwesomeIcon icon={faPen} /> Ajouter Réclamation
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">Aucune note disponible pour {filters.niveau} {filters.semestre}.</p>
              )
            ) : (
              <p className="no-results">Veuillez sélectionner une année et un semestre pour voir vos notes.</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Ajouter une réclamation</h2>
            <textarea
              value={reclamationInputs[selectedModuleId] || ''}
              onChange={(e) => handleReclamationChange(selectedModuleId, e.target.value)}
              placeholder="Écrire votre réclamation..."
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <div className="modal-actions">
              <button onClick={submitReclamation} className="modal-submit-button">
                <FontAwesomeIcon icon={faSave} /> Soumettre
              </button>
              <button onClick={closeReclamationModal} className="modal-cancel-button">
                <FontAwesomeIcon icon={faTimes} /> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default StudentGrades;