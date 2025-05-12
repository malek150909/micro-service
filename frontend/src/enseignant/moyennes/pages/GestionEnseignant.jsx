import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUpload,
  faDownload,
  faSave,
  faTimes,
  faPen,
  faFileExcel,
  faGraduationCap,
  faChalkboardTeacher
} from '@fortawesome/free-solid-svg-icons';
import '../note.css';

const GestionEnseignants = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [grades, setGrades] = useState([]);
  const [error, setError] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  const [respondingReclamation, setRespondingReclamation] = useState(null);

  useEffect(() => {
    fetchTeacherSections();
  }, []);

  const fetchTeacherSections = async () => {
    try {
      console.log('Début de fetchTeacherSections');
      const res = await api.get('/teacher-sections');
      console.log('Réponse de /teacher-sections:', res.data);
      setSections(res.data || []);
      if (!res.data.length) {
        setError('Aucune section disponible.');
        toast.error('Aucune section disponible pour cet utilisateur.');
      }
    } catch (err) {
      console.error('Erreur dans fetchTeacherSections:', err);
      const errorMessage = err.response?.status && err.response?.data?.error 
        ? `${err.response.status}: ${err.response.data.error}` 
        : 'Erreur lors du chargement des sections.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const fetchSemesters = async (niveau, sectionId, moduleId) => {
    try {
      console.log(`Début de fetchSemesters pour niveau: ${niveau}, section: ${sectionId}, module: ${moduleId}`);
      const res = await api.get(`/semesters/${encodeURIComponent(niveau)}`, {
        params: { idSection: sectionId, idModule: moduleId }
      });
      console.log(`Réponse de /semesters/${niveau}:`, res.data);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSemesters(res.data);
        setError('');
        console.log(`Semestres mis à jour: ${res.data.join(', ')}`);
        toast.success(`Semestres chargés: ${res.data.join(', ')}`);
      } else {
        setSemesters([]);
        setError(`Aucun semestre disponible pour ce module et cette section.`);
        toast.warn(`Aucun semestre disponible pour ce module et cette section.`);
      }
      setSelectedSemestre('');
    } catch (err) {
      console.error(`Erreur dans fetchSemesters pour niveau ${niveau}:`, err);
      const errorMessage = err.response?.status && err.response?.data?.error 
        ? `${err.response.status}: ${err.response.data.error}` 
        : 'Erreur lors du chargement des semestres.';
      setError(errorMessage);
      setSemesters([]);
      toast.error(errorMessage);
    }
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    console.log(`Changement de section, ID: ${sectionId}, type: ${typeof sectionId}`);
    console.log('Sections actuelles:', sections);
    setSelectedSection(sectionId);
    setSelectedSemestre('');
    setSemesters([]);
    setGrades([]);
    setError('');
    if (sectionId) {
      const section = sections.find(s => String(s.ID_section) === sectionId);
      if (section) {
        console.log('Section trouvée:', section);
        setSelectedModule(section.ID_module);
        if (section.niveau) {
          console.log(`Appel de fetchSemesters avec niveau: ${section.niveau}, section: ${sectionId}, module: ${section.ID_module}`);
          fetchSemesters(section.niveau, sectionId, section.ID_module);
        } else {
          setError('Niveau non défini pour la section sélectionnée.');
          toast.error('Niveau non défini pour la section sélectionnée.');
        }
      } else {
        setSelectedModule('');
        setSemesters([]);
        setSelectedSemestre('');
        setGrades([]);
        setError(`Section avec ID ${sectionId} non trouvée.`);
        toast.error(`Section avec ID ${sectionId} non trouvée.`);
      }
    } else {
      setSelectedModule('');
      setSemesters([]);
      setSelectedSemestre('');
      setGrades([]);
    }
  };

  const handleSemestreChange = (e) => {
    const semestre = e.target.value;
    console.log(`Semestre sélectionné: ${semestre}`);
    setSelectedSemestre(semestre);
  };

  useEffect(() => {
    if (selectedSection && selectedModule && selectedSemestre) {
      console.log(`Appel de fetchGrades pour section: ${selectedSection}, module: ${selectedModule}, semestre: ${selectedSemestre}`);
      fetchGrades();
    }
  }, [selectedSection, selectedModule, selectedSemestre]);

  const fetchGrades = async () => {
    try {
      console.log(`Envoi de la requête /section-grades avec idSection: ${selectedSection}, idModule: ${selectedModule}, semestre: ${selectedSemestre}`);
      const res = await api.get('/section-grades', {
        params: { idSection: selectedSection, idModule: selectedModule, semestre: selectedSemestre },
      });
      console.log('Réponse de /section-grades:', res.data);
      setGrades(res.data || []);
      if (res.data.length === 0) {
        toast.info('Aucun étudiant trouvé pour cette section, module et semestre.');
      } else {
        toast.success(`${res.data.length} étudiant(s) chargé(s).`);
      }
    } catch (err) {
      console.error('Erreur dans fetchGrades:', err);
      const errorMessage = err.response?.status && err.response?.data?.error 
        ? `${err.response.status}: ${err.response.data.error}` 
        : 'Erreur lors du chargement des notes.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('Veuillez sélectionner un fichier Excel valide.');
      return;
    }
    if (!selectedSection || !selectedModule || !selectedSemestre) {
      toast.error('Veuillez sélectionner une section, un module et un semestre.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(
        `/grades/import?module_id=${selectedModule}&semestre=${selectedSemestre}&idSection=${selectedSection}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(res.data.message);
      if (res.data.skippedCount > 0) {
        const skippedMessages = res.data.skippedGrades.map(
          s => `${s.matricule}: ${s.reason}`
        );
        toast.warn(`Certaines notes n'ont pas été importées :\n${skippedMessages.join('\n')}`);
      }
      fetchGrades();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de l’importation.';
      toast.error(errorMessage);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedSection || !selectedModule || !selectedSemestre) {
      toast.error('Veuillez sélectionner une section, un module et un semestre.');
      return;
    }
    try {
      const res = await api.get('/grades/import-template', {
        params: { idSection: selectedSection, idModule: selectedModule, semestre: selectedSemestre },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `moyennes_${selectedModule}_${selectedSection}_${selectedSemestre}_template.xlsx`;
      const contentDisposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
      console.log('En-tête Content-Disposition reçu:', contentDisposition);
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
          console.log('Nom extrait de Content-Disposition:', filename);
        } else {
          console.warn('Format de filename invalide dans Content-Disposition:', contentDisposition);
        }
      } else {
        console.warn('En-tête Content-Disposition absent ou mal formé');
        const section = sections.find(s => String(s.ID_section) === selectedSection);
        if (section && section.display) {
          const parts = section.display.split(' - ');
          if (parts.length >= 3) {
            const nomSpecialite = parts[1].replace(/[^a-zA-Z0-9]/g, '_');
            const nomSection = parts[2].replace(/[^a-zA-Z0-9]/g, '_');
            filename = `moyennes_${nomSpecialite}_${nomSection}_template.xlsx`;
            console.log('Nom par défaut ajusté avec les données de section:', filename);
          }
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Modèle Excel téléchargé.');
    } catch (err) {
      console.error('Erreur lors du téléchargement du modèle:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors du téléchargement du modèle.';
      toast.error(errorMessage);
    }
  };

  const handleGradeChange = (matricule, field, value) => {
    setEditingGrade({ matricule, field, value });
  };

  const saveGrade = async () => {
    if (!editingGrade) return;
    const { matricule, field, value } = editingGrade;
    const grade = grades.find(g => g.Matricule === matricule);
    const payload = {
      Moyenne: field === 'Moyenne' ? parseFloat(value) : grade.Moyenne || 0,
      remarque: field === 'remarque' ? value : grade.remarque || ''
    };
    if (field === 'Moyenne' && (isNaN(value) || value < 0 || value > 20)) {
      toast.error('La note doit être entre 0 et 20.');
      return;
    }
    try {
      await api.put(`/grades/${matricule}/${selectedModule}/${selectedSemestre}`, payload);
      toast.success('Note mise à jour avec succès.');
      setEditingGrade(null);
      fetchGrades();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la note:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de la mise à jour.';
      toast.error(errorMessage);
    }
  };

  const handleReclamationResponse = async () => {
    if (!respondingReclamation || !respondingReclamation.response) {
      toast.error('Veuillez entrer une réponse.');
      return;
    }
    try {
      await api.post(`/reclamation/${respondingReclamation.ID_reclamation}/respond`, {
        prof_response: respondingReclamation.response
      });
      toast.success('Réponse envoyée avec succès.');
      setRespondingReclamation(null);
      fetchGrades();
    } catch (err) {
      console.error('Erreur lors de l’envoi de la réponse:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de l’envoi de la réponse.';
      toast.error(errorMessage);
    }
  };

  const handleExport = async (format) => {
    if (!selectedSection || !selectedModule || !selectedSemestre) {
      toast.error('Veuillez sélectionner une section, un module et un semestre.');
      return;
    }
    if (editingGrade) {
      await saveGrade();
    }
    try {
      const res = await api.get('/export-grades', {
        params: { idSection: selectedSection, idModule: selectedModule, semestre: selectedSemestre, format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `moyennes_${selectedModule}_${selectedSection}_${selectedSemestre}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const contentDisposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
      console.log('En-tête Content-Disposition reçu pour export:', contentDisposition);
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
          console.log('Nom extrait de Content-Disposition pour export:', filename);
        } else {
          console.warn('Format de filename invalide dans Content-Disposition pour export:', contentDisposition);
        }
      } else {
        console.warn('En-tête Content-Disposition absent ou mal formé pour export');
        const section = sections.find(s => String(s.ID_section) === selectedSection);
        if (section && section.display) {
          const parts = section.display.split(' - ');
          if (parts.length >= 3) {
            const nomSpecialite = parts[1].replace(/[^a-zA-Z0-9]/g, '_');
            const nomSection = parts[2].replace(/[^a-zA-Z0-9]/g, '_');
            filename = `moyennes_${nomSpecialite}_${nomSection}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            console.log('Nom par défaut ajusté avec les données de section pour export:', filename);
          }
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Notes exportées en ${format.toUpperCase()}.`);
    } catch (err) {
      console.error('Erreur lors de l’exportation:', err);
      const errorMessage = err.response?.data?.error || 
        (err.response?.status === 403 ? 'Accès refusé : vous n’êtes pas autorisé à exporter ces notes.' : 
        'Erreur lors de l’exportation des notes.');
      toast.error(errorMessage);
    }
  };

  return (
    <div id="notes">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>
      <div className="sidebar">
        <div className="logo">
          <h2>Résultats Académiques</h2>
        </div>
        <button className="sidebar-button" onClick={() => navigate('/enseignant')}>
          <FontAwesomeIcon icon={faHome} /> Retour à l'Accueil
        </button>
        <button className="sidebar-button" onClick={() => handleExport('pdf')} disabled={!selectedSection || !selectedModule || !selectedSemestre}>
          <FontAwesomeIcon icon={faDownload} /> Télécharger en PDF
        </button>
        <button className="sidebar-button" onClick={() => handleExport('excel')} disabled={!selectedSection || !selectedModule || !selectedSemestre}>
          <FontAwesomeIcon icon={faDownload} /> Télécharger en Excel
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>
              <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '10px' }} />
              Gestion des Résultats Académiques
            </h1>
            <p>Gérez les résultats de vos étudiants</p>
          </div>
          <div className="section-card">
            <h1 className="section-title">
              <FontAwesomeIcon icon={faChalkboardTeacher} style={{ marginRight: '10px' }} />
              Vos Sections :
            </h1>
            {error && <p className="error-message">{error}</p>}
            {!sections.length && !error && <p className="no-results">Chargement des sections...</p>}
            {sections.length === 0 && error && <p className="no-results">Aucune section disponible.</p>}
            {sections.length > 0 && (
              <div className="filters">
                <select value={selectedSection} onChange={handleSectionChange}>
                  <option value="">Sélectionner une section</option>
                  {sections.map(s => (
                    <option key={s.ID_section} value={s.ID_section}>
                      {s.display}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSemestre}
                  onChange={handleSemestreChange}
                  disabled={!selectedSection || !semesters.length}
                >
                  <option value="">Sélectionner un semestre</option>
                  {semesters.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {selectedSection && selectedModule && selectedSemestre && (
              <div className="upload-section">
                <h3><FontAwesomeIcon icon={faUpload} /> Importer via Excel</h3>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={!selectedSection || !selectedModule || !selectedSemestre}
                />
              </div>
            )}
            {grades.length > 0 && (
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Groupe</th>
                    <th>Moyenne</th>
                    <th>Remarque</th>
                    <th>Réclamation</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(grade => (
                    <tr key={grade.Matricule}>
                      <td>{grade.Matricule}</td>
                      <td>{grade.nom}</td>
                      <td>{grade.prenom}</td>
                      <td>{grade.groupe || '-'}</td>
                      <td>
                        <input
                          type="number"
                          value={editingGrade?.matricule === grade.Matricule && editingGrade?.field === 'Moyenne' ? editingGrade.value : (grade.Moyenne != null ? grade.Moyenne : '')}
                          onChange={(e) => handleGradeChange(grade.Matricule, 'Moyenne', e.target.value)}
                          onBlur={saveGrade}
                          min="0"
                          max="20"
                          disabled={editingGrade?.matricule !== grade.Matricule && editingGrade !== null}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingGrade?.matricule === grade.Matricule && editingGrade?.field === 'remarque' ? editingGrade.value : (grade.remarque || '')}
                          onChange={(e) => handleGradeChange(grade.Matricule, 'remarque', e.target.value)}
                          onBlur={saveGrade}
                          disabled={editingGrade?.matricule !== grade.Matricule && editingGrade !== null}
                        />
                      </td>
                      <td>
                        {grade.reclamation_text ? (
                          grade.prof_response ? (
                            <span>Réponse envoyée: {grade.prof_response}</span>
                          ) : (
                            <button
                              className="reclamation-button"
                              onClick={() => setRespondingReclamation({ ID_reclamation: grade.ID_reclamation, reclamation_text: grade.reclamation_text, response: '' })}
                            >
                              <FontAwesomeIcon icon={faPen} /> Voir et Répondre
                            </button>
                          )
                        ) : (
                          'Aucune'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {grades.length === 0 && selectedSection && selectedModule && selectedSemestre && (
              <p className="no-results">Aucun étudiant trouvé pour cette section, module et semestre.</p>
            )}
            {respondingReclamation && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Répondre à la Réclamation</h3>
                  <div style={{ marginBottom: '15px' }}>
                    <h4>Réclamation de l'étudiant :</h4>
                    <p style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                      {respondingReclamation.reclamation_text || 'Aucune réclamation spécifiée.'}
                    </p>
                  </div>
                  <h4>Votre réponse :</h4>
                  <textarea
                    value={respondingReclamation.response}
                    onChange={(e) => setRespondingReclamation({ ...respondingReclamation, response: e.target.value })}
                    placeholder="Votre réponse..."
                    rows="5"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                  />
                  <div className="button-group">
                    <button onClick={handleReclamationResponse}>
                      <FontAwesomeIcon icon={faSave} /> Envoyer
                    </button>
                    <button className="close-button" onClick={() => setRespondingReclamation(null)}>
                      <FontAwesomeIcon icon={faTimes} /> Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionEnseignants;