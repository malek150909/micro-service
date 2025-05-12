import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faHome, faSave, faTimes, faEdit, faFileAlt, faBook, faTable, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import styles from '../moyennes.module.css';
import { FaHome } from 'react-icons/fa';

const StudentGrades = () => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState('');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({ niveau: '', semestre: '' });
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [reclamationInputs, setReclamationInputs] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedReclamationId, setSelectedReclamationId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [average, setAverage] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  const semestersMap = {
    'L1': ['S1', 'S2'], 'L2': ['S3', 'S4'], 'L3': ['S5', 'S6'],
    'M1': ['S7', 'S8'], 'M2': ['S9', 'S10'],
    'ING1': ['S1', 'S2'], 'ING2': ['S3', 'S4'], 'ING3': ['S5', 'S6']
  };

  const defaultLevels = ['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3'];

  useEffect(() => {
    console.log('Component mounted, starting initial fetches');
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([fetchStudentName(), fetchStudentLevels()]);
    } catch (err) {
      console.error('Error in initial data fetch:', err);
      setError('Erreur lors du chargement initial des données.');
      toast.error('Erreur lors du chargement initial.');
    }
  };

  useEffect(() => {
    console.log('Filters updated:', filters);
    if (filters.niveau && filters.semestre) {
      fetchGrades().catch(err => {
        console.error('Error in fetchGrades:', err);
        setError('Erreur lors du chargement des notes.');
        toast.error('Erreur lors du chargement des notes.');
      });
    }
  }, [filters.niveau, filters.semestre]);

  const fetchStudentName = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Aucun token trouvé');
        navigate('/login');
        return;
      }
      const decoded = jwtDecode(token);
      const matricule = decoded.matricule;
      console.log('Fetching student name for matricule:', matricule);
      const res = await api.get(`/user/${matricule}`);
      setStudentName(`${res.data.nom} ${res.data.prenom}`);
      toast.success('Nom de l\'étudiant chargé avec succès.');
    } catch (err) {
      console.error('Error fetching student name:', err);
      setStudentName('Étudiant inconnu');
      setError('Échec du chargement des détails de l\'étudiant');
      toast.error('Erreur lors du chargement du nom.');
    }
  };

  const fetchStudentLevels = async () => {
    try {
      console.log('Fetching student levels');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Aucun token trouvé');
        navigate('/login');
        return;
      }
      const res = await api.get('/student-level');
      const level = res.data.niveau || res.data.defaultLevel || 'L1';
      console.log('Niveau récupéré:', level);
      setCurrentLevel(level);
      const currentIndex = defaultLevels.indexOf(level);
      const available = currentIndex !== -1 ? defaultLevels.slice(0, currentIndex + 1) : defaultLevels;
      setAvailableLevels(available);
      setFilters(prev => ({ ...prev, niveau: level }));
      toast.success('Niveaux chargés avec succès.');
    } catch (err) {
      console.error('Error fetching student levels:', err);
      setError(`Échec du chargement des niveaux: ${err.response?.data?.error || err.message}`);
      setAvailableLevels(defaultLevels);
      setCurrentLevel('L1');
      setFilters(prev => ({ ...prev, niveau: 'L1' }));
      toast.error('Erreur lors du chargement des niveaux, valeurs par défaut utilisées.');
    }
  };

  const handleNiveauChange = (e) => {
    e.stopPropagation();
    const niveau = e.target.value;
    setFilters(prev => ({ ...prev, niveau, semestre: '' }));
    setError('');
    toast.info(`Niveau sélectionné: ${niveau}`);
  };

  const handleSemestreChange = (e) => {
    e.stopPropagation();
    const semestre = e.target.value;
    setFilters(prev => ({ ...prev, semestre }));
    setError('');
    toast.info(`Semestre sélectionné: ${semestre}`);
  };

  const fetchGrades = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token');
      const res = await api.get('/student-grades', { params: filters, headers: { Authorization: `Bearer ${token}` } });
      console.log('Raw grades data from backend:', res.data);
      setGrades(res.data.grades || []);
      setAverage(res.data.average || null);
      setAcademicYear(res.data.academicYear || '');
      setError('');
      toast.success(`${res.data.grades.length} note(s) chargée(s).`);
      if (isTranscriptModalOpen) {
        fetchTranscript();
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setGrades([]);
      setAverage(null);
      setError(`Échec du chargement des notes: ${err.response?.data?.error || err.message}`);
      toast.error('Erreur lors du chargement des notes.');
    }
  };

  const fetchTranscript = async () => {
    if (!filters.niveau) {
      toast.error('Veuillez sélectionner un niveau avant de consulter le relevé.');
      return;
    }
    try {
      setIsTranscriptLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token');
      const res = await api.get('/student-transcript', {
        params: { niveau: filters.niveau },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Transcript data:', res.data);
      setTranscriptData(res.data);
      setIsTranscriptModalOpen(true);
      toast.success('Relevé chargé avec succès.');
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setTranscriptData(null);
      setError(`Échec du chargement du relevé: ${err.response?.data?.error || err.message}`);
      toast.error('Erreur lors du chargement du relevé.');
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  const handleReclamationChange = (moduleId, value) => {
    setReclamationInputs(prev => ({ ...prev, [moduleId]: value }));
  };

  const openReclamationModal = (moduleId, reclamationId = null, existingReclamation = '') => {
    setSelectedModuleId(moduleId);
    setSelectedReclamationId(reclamationId);
    setIsEditing(!!reclamationId);
    setReclamationInputs(prev => ({ ...prev, [moduleId]: existingReclamation }));
    setIsModalOpen(true);
  };

  const closeReclamationModal = () => {
    setIsModalOpen(false);
    setSelectedModuleId(null);
    setSelectedReclamationId(null);
    setIsEditing(false);
  };

  const submitReclamation = async () => {
    const text = reclamationInputs[selectedModuleId] || '';
    if (!text.trim()) {
      toast.error('Veuillez entrer un texte de réclamation.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Aucun token');

      if (isEditing && selectedReclamationId) {
        await api.put(`/reclamation/${selectedReclamationId}`, { reclamation_text: text }, { headers: { Authorization: `Bearer ${token}` } });
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.ID_module === selectedModuleId
              ? { ...grade, reclamation: text, prof_response: grade.prof_response }
              : grade
          )
        );
        toast.success('Réclamation mise à jour avec succès.');
      } else {
        const res = await api.post('/reclamation', { ID_module: selectedModuleId, Semestre: filters.semestre, reclamation_text: text }, { headers: { Authorization: `Bearer ${token}` } });
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.ID_module === selectedModuleId
              ? { ...grade, reclamation: text, ID_reclamation: res.data.id }
              : grade
          )
        );
        toast.success('Réclamation soumise avec succès.');
      }
      closeReclamationModal();
      fetchGrades();
      if (!isTranscriptModalOpen) {
        toast.info('Les données ont été mises à jour. Cliquez sur "Voir Relevé" pour voir la nouvelle moyenne.');
      }
    } catch (err) {
      console.error('Erreur lors de la soumission/modification de la réclamation:', err);
      toast.error(`Échec: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleReturn = (e) => {
    e.stopPropagation();
    navigate('/etudiant');
  };

  // Vérifier si le niveau sélectionné est archivé
  const isArchivedLevel = filters.niveau && filters.niveau !== currentLevel;

  return (
    <div className={styles['ETD-MOY-background-shapes']} style={{ pointerEvents: 'auto', zIndex: 1 }}>
      <div className={`${styles['ETD-MOY-shape']} ${styles['ETD-MOY-shape1']}`} style={{ pointerEvents: 'none' }}></div>
      <div className={`${styles['ETD-MOY-shape']} ${styles['ETD-MOY-shape2']}`} style={{ pointerEvents: 'none' }}></div>
      <div className={styles['ETD-MOY-sidebar']} style={{ pointerEvents: 'auto', zIndex: 10000 }}>
        <div className={styles['ETD-MOY-logo']}><h2>Résultats Académiques</h2></div>
        <button
          className={styles['ETD-MOY-sidebar-button']}
          onClick={handleReturn}
          style={{ cursor: 'pointer' }}
        >
          <FaHome /> Retour
        </button>
        {filters.niveau ? (
          <button
            className={styles['ETD-MOY-sidebar-button']}
            onClick={() => {
              console.log('filters.niveau avant fetchTranscript:', filters.niveau);
              fetchTranscript();
            }}
            style={{ cursor: 'pointer' }}
            disabled={isTranscriptLoading}
          >
            <FontAwesomeIcon icon={faFileAlt} /> {isTranscriptLoading ? 'Chargement...' : 'Voir Relevé'}
          </button>
        ) : (
          <button
            className={styles['ETD-MOY-sidebar-button']}
            disabled
            style={{ cursor: 'not-allowed', opacity: 0.5 }}
          >
            <FontAwesomeIcon icon={faFileAlt} /> Voir Relevé
          </button>
        )}
      </div>
      <div className={styles['ETD-MOY-container']} style={{ pointerEvents: 'auto', zIndex: 1000 }}>
        <div className={styles['ETD-MOY-main-content']} style={{ pointerEvents: 'auto', zIndex: 1001 }}>
          <div className={styles['ETD-MOY-welcome-panel']}>
            <h1>
              <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '10px' }} />
               Consulter vos résultats académiques
            </h1>
            <p className={styles['ETD-MOY-welcome-subtext']}>Année académique: {academicYear || 'Non définie'}</p>
            <p className={styles['ETD-MOY-welcome-subtext']}>Consultez vos moyennes ici</p>
          </div>
          <div className={styles['ETD-MOY-section-card']} style={{ pointerEvents: 'auto', zIndex: 1002 }}>
            <h1 className={styles['ETD-MOY-section-title']}>
              <FontAwesomeIcon icon={faTable} style={{ marginRight: '10px' }} />
              - Mes Notes -
            </h1>
            {error && <p className={styles['ETD-MOY-error-message']}>{error}</p>}
            {isArchivedLevel && filters.niveau && filters.semestre && (
              <p className={styles['ETD-MOY-info-message']}>
                Ces données sont archivées. Les réclamations ne sont pas disponibles pour ce niveau.
              </p>
            )}
            {!availableLevels.length && !error && <p className={styles['ETD-MOY-no-results']}>Chargement des niveaux...</p>}
            {availableLevels.length > 0 && (
              <div className={styles['ETD-MOY-filters']} style={{ pointerEvents: 'auto', zIndex: 1003 }}>
                <select
                  name="niveau"
                  value={filters.niveau}
                  onChange={handleNiveauChange}
                  className={styles['ETD-MOY-select']}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Sélectionner une année</option>
                  {availableLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <select
                  name="semestre"
                  value={filters.semestre}
                  onChange={handleSemestreChange}
                  className={styles['ETD-MOY-select']}
                  disabled={!filters.niveau || !semestersMap[filters.niveau]}
                  style={{ cursor: filters.niveau && semestersMap[filters.niveau] ? 'pointer' : 'not-allowed' }}
                >
                  <option value="">Sélectionner un semestre</option>
                  {filters.niveau && semestersMap[filters.niveau] && semestersMap[filters.niveau].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {filters.niveau && filters.semestre && (
              grades.length > 0 ? (
                <table className={styles['ETD-MOY-grades-table']}>
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Coeff</th>
                      <th>Crédits</th>
                      <th>Moyenne</th>
                      <th>Remarque</th>
                      <th>Réclamation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(grade => (
                      <tr key={`${grade.ID_module}-${grade.Semestre}`}>
                        <td>{grade.nom_module}</td>
                        <td>{grade.coefficient}</td>
                        <td>{grade.Moyenne !== null ? (grade.Moyenne >= 10 ? grade.credit : 0) : '-'}</td>
                        <td>{grade.Moyenne !== null ? grade.Moyenne : '-'}</td>
                        <td>{grade.remarque || '-'}</td>
                        <td>
                          {grade.Moyenne !== null ? (
                            grade.reclamation ? (
                              <div>
                                <p><strong>Réclamation:</strong> {grade.reclamation}</p>
                                {grade.prof_response ? (
                                  <p><strong>Réponse:</strong> {grade.prof_response}</p>
                                ) : (
                                  <button
                                    onClick={() => openReclamationModal(grade.ID_module, grade.ID_reclamation, grade.reclamation)}
                                    className={styles['ETD-MOY-reclamation-button']}
                                    disabled={isArchivedLevel}
                                    style={{ cursor: isArchivedLevel ? 'not-allowed' : 'pointer', opacity: isArchivedLevel ? 0.5 : 1 }}
                                  >
                                    <FontAwesomeIcon icon={faEdit} /> Modifier
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openReclamationModal(grade.ID_module)}
                                className={styles['ETD-MOY-reclamation-button']}
                                disabled={isArchivedLevel}
                                style={{ cursor: isArchivedLevel ? 'not-allowed' : 'pointer', opacity: isArchivedLevel ? 0.5 : 1 }}
                              >
                                <FontAwesomeIcon icon={faPen} /> Réclamer
                              </button>
                            )
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className={styles['ETD-MOY-no-results']}>Aucun module ou note pour {filters.niveau} {filters.semestre}.</p>
            )}
            {average !== null && <p className={styles['ETD-MOY-average']}>Moyenne: {average}/20</p>}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className={styles['ETD-MOY-modal-overlay']} style={{ pointerEvents: 'auto', zIndex: 5000 }}>
          <div className={styles['ETD-MOY-modal-content']} style={{ pointerEvents: 'auto', zIndex: 5001 }}>
            <h2>{isEditing ? 'Modifier la Réclamation' : 'Nouvelle Réclamation'}</h2>
            <textarea
              value={reclamationInputs[selectedModuleId] || ''}
              onChange={(e) => handleReclamationChange(selectedModuleId, e.target.value)}
              placeholder="Entrez votre réclamation..."
              rows="4"
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <div className={styles['ETD-MOY-modal-actions']}>
              <button
                onClick={submitReclamation}
                className={styles['ETD-MOY-modal-submit-button']}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faSave} /> {isEditing ? 'Mettre à jour' : 'Soumettre'}
              </button>
              <button
                onClick={closeReclamationModal}
                className={styles['ETD-MOY-modal-cancel-button']}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faTimes} /> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {isTranscriptModalOpen && (
        <div className={styles['ETD-MOY-modal-overlay']} style={{ pointerEvents: 'auto', zIndex: 5000 }}>
          <div className={styles['ETD-MOY-modal-content']} style={{ pointerEvents: 'auto', zIndex: 5001, maxWidth: '1000px', width: '90%', transform: 'translateX(100px)' }}>
            {isTranscriptLoading ? (
              <p>Chargement du relevé...</p>
            ) : transcriptData ? (
              transcriptData.message ? (
                <div>
                  <h2>Relevé de Notes</h2>
                  <p>{transcriptData.message}</p>
                </div>
              ) : (
                <div>
                  <h2 className={styles['ETD-MOY-transcript-title']}>Relevé de Notes - {studentName || 'Étudiant'}</h2>
                  <div className={styles['ETD-MOY-transcript-header']}>
                    <p className={styles['ETD-MOY-transcript-niveau']}>Niveau: {transcriptData.niveau || 'Non défini'}</p>
                    <p className={styles['ETD-MOY-transcript-academic-year']}>Année Académique: {transcriptData.academicYear || 'Non définie'}</p>
                  </div>
                  {transcriptData.grades && Object.entries(transcriptData.grades).length > 0 ? (
                    Object.entries(transcriptData.grades).map(([semester, semesterGrades]) => (
                      <div key={semester} className={styles['ETD-MOY-transcript-section']}>
                        <h3>{semester}</h3>
                        <div className={styles['ETD-MOY-table-wrapper']}>
                          <table className={styles['ETD-MOY-grades-table']}>
                            <thead>
                              <tr>
                                <th>Module</th>
                                <th>Coefficient</th>
                                <th>Crédits</th>
                                <th>Moyenne</th>
                              </tr>
                            </thead>
                            <tbody>
                              {semesterGrades.map(grade => (
                                <tr key={`${grade.ID_module}-${semester}`}>
                                  <td>{grade.nom_module}</td>
                                  <td>{grade.coefficient || 1}</td>
                                  <td>{grade.earnedCredits !== undefined ? grade.earnedCredits : (grade.Moyenne >= 10 ? grade.credit : 0)}</td>
                                  <td>{grade.Moyenne !== null ? grade.Moyenne : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className={styles['ETD-MOY-transcript-semester-average']}>Moyenne du semestre: {transcriptData.semesterAverages[semester] || 'N/A'}/20</p>
                        <p className={styles['ETD-MOY-transcript-credits']}>Crédits obtenus: {transcriptData.semesterCredits[semester] || 0}/30</p>
                      </div>
                    ))
                  ) : (
                    <p>Aucune note disponible pour ce niveau.</p>
                  )}
                  {transcriptData.annualAverage !== null && (
                    <div className={styles['ETD-MOY-transcript-section']}>
                      <h3>Résumé Annuel</h3>
                      <p className={styles['ETD-MOY-transcript-annual-average']}>Moyenne annuelle: {transcriptData.annualAverage}/20</p>
                      <p className={styles['ETD-MOY-transcript-annual-credits']}>Crédits annuels obtenus: {transcriptData.totalAnnualCredits}/60</p>
                      {transcriptData.status && (
                        <p className={styles['ETD-MOY-transcript-status']}>Statut: {transcriptData.status}</p>
                      )}
                      {transcriptData.debt !== null && (
                        <p className={styles['ETD-MOY-transcript-debt']}>Dettes: {transcriptData.debt} crédits</p>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <p>Erreur lors du chargement du relevé.</p>
            )}
            <div className={styles['ETD-MOY-modal-actions']}>
              <button
                onClick={() => setIsTranscriptModalOpen(false)}
                className={styles['ETD-MOY-modal-cancel-button']}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faTimes} /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;