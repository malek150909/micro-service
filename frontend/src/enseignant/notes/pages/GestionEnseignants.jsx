import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faUpload,
  faEdit,
  faTrash,
  faSignOutAlt,
  faDownload,
  faHome,
  faFileAlt,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import "../note.css";

const GestionEnseignants = () => {
  const navigate = useNavigate();
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [existingGrades, setExistingGrades] = useState([]);
  const [filters, setFilters] = useState({
    idFaculte: '',
    idDepartement: '',
    idSpecialite: '',
    niveau: '',
    idSection: '',
  });
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [error, setError] = useState('');
  const [showEditableTable, setShowEditableTable] = useState(false);
  const [showExistingGrades, setShowExistingGrades] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  useEffect(() => {
    fetchFacultes();
  }, []);

  const fetchFacultes = async () => {
    try {
      const res = await api.get('/facultes');
      setFacultes(res.data || []);
    } catch (err) {
      setError('Échec du chargement des facultés.');
      console.error(err);
    }
  };

  const fetchDepartements = async (idFaculte) => {
    try {
      const res = await api.get(`/departements/${idFaculte}`);
      setDepartements(res.data || []);
      setFilters((prev) => ({ ...prev, idDepartement: '', idSpecialite: '', niveau: '', idSection: '' }));
      setSpecialites([]);
      setSections([]);
      setModules([]);
    } catch (err) {
      setError('Échec du chargement des départements.');
      console.error(err);
    }
  };

  const fetchSpecialites = async (idDepartement) => {
    try {
      const res = await api.get(`/specialites/${idDepartement}`);
      setSpecialites(res.data || []);
      setFilters((prev) => ({ ...prev, idSpecialite: '', niveau: '', idSection: '' }));
      setSections([]);
      setModules([]);
    } catch (err) {
      setError('Échec du chargement des spécialités.');
      console.error(err);
    }
  };

  const fetchSections = async (idSpecialite) => {
    try {
      const res = await api.get(`/sections/${idSpecialite}`);
      setSections(res.data || []);
      setFilters((prev) => ({ ...prev, niveau: '', idSection: '' }));
      setModules([]);
    } catch (err) {
      setError('Échec du chargement des sections.');
      console.error(err);
    }
  };

  const fetchModules = async (idSection) => {
    try {
      const res = await api.get(`/modules/${idSection}`);
      setModules(res.data || []);
    } catch (err) {
      setError('Échec du chargement des modules.');
      console.error(err);
    }
  };

  const fetchExistingGrades = async () => {
    if (!filters.idSection || !selectedModule || !selectedSemestre) {
      setExistingGrades([]);
      setShowExistingGrades(false);
      return;
    }
    try {
      const res = await api.get('/existing-grades', {
        params: { idSection: filters.idSection, idModule: selectedModule, semestre: selectedSemestre },
      });
      setExistingGrades(res.data || []);
      setShowExistingGrades(true);
      setShowEditableTable(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setExistingGrades([]);
        setShowExistingGrades(true);
        setShowEditableTable(false);
        toast.info('Aucune note existante pour ce module, cette section et ce semestre.');
      } else {
        setError('Échec du chargement des notes existantes.');
        console.error(err);
        toast.error(err.response?.data?.error || 'Erreur lors du chargement des notes existantes.');
      }
    }
  };

  const handleExportGrades = async () => {
    try {
      const res = await api.get('/existing-grades', {
        params: { idSection: filters.idSection, idModule: selectedModule, semestre: selectedSemestre, export: 'excel' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'grades.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Notes exportées avec succès.');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erreur lors de l’exportation des notes.');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const updatedFilters = { ...prev, [name]: value };
      if (name === 'idFaculte') fetchDepartements(value);
      if (name === 'idDepartement') fetchSpecialites(value);
      if (name === 'idSpecialite') fetchSections(value);
      if (name === 'idSection') fetchModules(value);
      return updatedFilters;
    });
    setShowEditableTable(false);
    setShowExistingGrades(false);
    setGrades([]);
    setSelectedModule('');
    setSelectedSemestre('');
  };

  const handleModuleOrSemestreChange = () => {
    setShowEditableTable(false);
    setShowExistingGrades(false);
    setGrades([]);
    if (filters.idSection && selectedModule && selectedSemestre) {
      fetchExistingGrades();
    }
  };

  useEffect(() => {
    handleModuleOrSemestreChange();
  }, [selectedModule, selectedSemestre]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('Veuillez sélectionner un fichier Excel valide.');
      return;
    }
    if (!selectedSemestre) {
      toast.error('Veuillez sélectionner un semestre.');
      return;
    }
    if (!selectedModule) {
      toast.error('Veuillez sélectionner un module.');
      return;
    }
    if (!filters.idSection) {
      toast.error('Veuillez sélectionner une section.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/grades/import?module_id=${selectedModule}&semestre=${selectedSemestre}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const validGrades = res.data.processedGrades
        .filter(grade => grade.status !== 'skipped')
        .map((grade) => ({
          Matricule: grade.Matricule || '',
          nom: grade.nom,
          prenom: grade.prenom,
          Moyenne: parseFloat(grade.note),
          remarque: grade.remarque || '',
        }));

      if (validGrades.length > 0) {
        setGrades(validGrades);
        setShowEditableTable(true);
        setShowExistingGrades(false);
        toast.success(`Notes importées avec succès (${validGrades.length} étudiants trouvés).`);
      } else {
        toast.info('Aucune note importée (aucun étudiant trouvé dans la base de données).');
      }

      if (res.data.skippedCount > 0) {
        const skippedMessages = res.data.skippedGrades.map(
          (skipped) => `${skipped.nom} ${skipped.prenom}: ${skipped.reason}`
        );
        toast.warn(`Certaines notes n'ont pas été importées :\n${skippedMessages.join('\n')}`);
      }
    } catch (err) {
      console.error('Import error:', err.response?.data);
      toast.error(err.response?.data?.error || 'Erreur lors de l’importation.');
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedSemestre) {
      toast.error('Veuillez sélectionner un semestre.');
      return;
    }
    if (!filters.idSection) {
      toast.error('Veuillez sélectionner une section.');
      return;
    }
    if (!selectedModule) {
      toast.error('Veuillez sélectionner un module.');
      return;
    }
    if (!grades || grades.length === 0) {
      toast.error('Aucune note à soumettre.');
      return;
    }

    const invalidGrades = grades.filter(g => isNaN(g.Moyenne) || g.Moyenne < 0 || g.Moyenne > 20);
    if (invalidGrades.length > 0) {
      toast.error('Certaines notes sont invalides (doivent être entre 0 et 20).');
      return;
    }

    try {
      const payload = {
        section_id: filters.idSection,
        grades: grades.map((g) => ({
          Matricule: g.Matricule,
          ID_module: selectedModule,
          Moyenne: parseFloat(g.Moyenne),
          remarque: g.remarque || '',
        })),
        semestre: selectedSemestre,
      };
      const res = await api.post('/grades/submit', payload);
      toast.success(res.data.message || 'Notes soumises avec succès.');
      setGrades([]);
      setShowEditableTable(false);
      fetchExistingGrades();
    } catch (err) {
      console.error('Submit error:', err.response?.data);
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission.');
    }
  };

  const handleGradeChange = (identifier, field, value) => {
    setGrades((prev) =>
      prev.map((g) => {
        const gradeIdentifier = g.Matricule || `${g.nom}-${g.prenom}`;
        if (gradeIdentifier === identifier) {
          return { ...g, [field]: value };
        }
        return g;
      })
    );
  };

  const handleEditGrade = (grade) => {
    setEditingGrade({ ...grade, originalMoyenne: grade.Moyenne, originalRemarque: grade.remarque });
  };

  const handleSaveEdit = async () => {
    if (editingGrade) {
      try {
        await api.put(`/grades/${editingGrade.Matricule}/${editingGrade.ID_module}/${editingGrade.Semestre}`, {
          Moyenne: parseFloat(editingGrade.Moyenne),
          remarque: editingGrade.remarque,
        });
        toast.success('Note mise à jour avec succès');
        setEditingGrade(null);
        fetchExistingGrades();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour de la note');
        console.error(err);
      }
    }
  };

  const handleCancelEdit = () => setEditingGrade(null);

  const handleEditChange = (field, value) => {
    setEditingGrade((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteGrade = async (matricule, module_id, semestre) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    try {
      const res = await api.delete(`/grades/${matricule}/${module_id}/${semestre}`);
      toast.success(res.data.message || 'Note supprimée avec succès.');
      fetchExistingGrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la note.');
      console.error(err);
    }
  };

  const handleDeleteAllGrades = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toute la liste de notes ? Cette action est irréversible.')) return;

    try {
      const res = await api.delete('/grades', {
        params: { idSection: filters.idSection, idModule: selectedModule, semestre: selectedSemestre },
      });
      toast.success(res.data.message || 'Liste de notes supprimée avec succès.');
      fetchExistingGrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la liste de notes.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
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
        <button className="sidebar-button" onClick={() => navigate('/enseignant')}>
          <FontAwesomeIcon icon={faHome} /> Accueil
        </button>
        <button className="sidebar-button" onClick={() => navigate('/GESENS')}>
          <FontAwesomeIcon icon={faEdit} /> Gestion des Notes
        </button>
        <button className="sidebar-button" onClick={() => navigate('/PROFREC')}>
          <FontAwesomeIcon icon={faFileAlt} /> Réclamations
        </button>
        <button className="sidebar-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>BIENVENUE SUR VOTRE ESPACE NOTES</h1>
            <p>Gérez vos notes avec facilité et précision</p>
          </div>
          <div className="section-card">
            <h1>Soumettre une Liste de Notes</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="filters">
              <select name="idFaculte" value={filters.idFaculte} onChange={handleFilterChange}>
                <option value="">Sélectionner une faculté</option>
                {facultes.map((f) => (
                  <option key={f.ID_faculte} value={f.ID_faculte}>
                    {f.nom_faculte}
                  </option>
                ))}
              </select>
              <select name="idDepartement" value={filters.idDepartement} onChange={handleFilterChange} disabled={!filters.idFaculte}>
                <option value="">Sélectionner un département</option>
                {departements.map((d) => (
                  <option key={d.ID_departement} value={d.ID_departement}>
                    {d.Nom_departement}
                  </option>
                ))}
              </select>
              <select name="idSpecialite" value={filters.idSpecialite} onChange={handleFilterChange} disabled={!filters.idDepartement}>
                <option value="">Sélectionner une spécialité</option>
                {specialites.map((s) => (
                  <option key={s.ID_specialite} value={s.ID_specialite}>
                    {s.nom_specialite}
                  </option>
                ))}
              </select>
              <select name="niveau" value={filters.niveau} onChange={handleFilterChange} disabled={!filters.idSpecialite}>
                <option value="">Sélectionner un niveau</option>
                {['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3'].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select name="idSection" value={filters.idSection} onChange={handleFilterChange} disabled={!filters.niveau}>
                <option value="">Sélectionner une section</option>
                {sections
                  .filter((s) => !filters.niveau || s.niveau === filters.niveau)
                  .map((s) => (
                    <option key={s.ID_section} value={s.ID_section}>
                      {s.nom_section ? `${s.nom_section} (${s.niveau})` : s.niveau}
                    </option>
                  ))}
              </select>
            </div>
            <div className="module-selection">
              <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} disabled={!filters.idSection}>
                <option value="">Sélectionner un module</option>
                {modules.map((m) => (
                  <option key={m.ID_module} value={m.ID_module}>
                    {m.nom_module}
                  </option>
                ))}
              </select>
              <select value={selectedSemestre} onChange={(e) => setSelectedSemestre(e.target.value)} disabled={!filters.idSection}>
                <option value="">Sélectionner un semestre</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
            <div className="upload-section">
              <h3>
                <FontAwesomeIcon icon={faUpload} /> Importer via Excel
              </h3>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={!selectedModule || !selectedSemestre} />
            </div>
            {showEditableTable && grades.length > 0 && (
              <>
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Note</th>
                      <th>Remarque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => {
                      const identifier = g.Matricule || `${g.nom}-${g.prenom}`;
                      return (
                        <tr key={identifier}>
                          <td>{g.Matricule || '-'}</td>
                          <td>{g.nom}</td>
                          <td>{g.prenom}</td>
                          <td>
                            <input
                              type="number"
                              value={g.Moyenne || ''}
                              onChange={(e) => handleGradeChange(identifier, 'Moyenne', e.target.value)}
                              min="0"
                              max="20"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={g.remarque || ''}
                              onChange={(e) => handleGradeChange(identifier, 'remarque', e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="submit-btn" onClick={handleSubmitGrades}>
                  <FontAwesomeIcon icon={faPlus} /> Soumettre la Liste de Notes
                </button>
              </>
            )}
            {showExistingGrades && (
              <>
                <h2>Notes Existantes</h2>
                {existingGrades.length > 0 ? (
                  <>
                    <button className="export-btn" onClick={handleExportGrades}>
                      <FontAwesomeIcon icon={faDownload} /> Exporter
                    </button>
                    <button className="delete-all-btn" onClick={handleDeleteAllGrades}>
                      <FontAwesomeIcon icon={faTrash} /> Supprimer Toute la Liste
                    </button>
                    <table className="grades-table">
                      <thead>
                        <tr>
                          <th>Matricule</th>
                          <th>Nom</th>
                          <th>Prénom</th>
                          <th>Semestre</th>
                          <th>Note</th>
                          <th>Remarque</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingGrades.map((g) => (
                          <tr key={`${g.Matricule}-${g.ID_module}-${g.Semestre}`}>
                            <td>{g.Matricule}</td>
                            <td>{g.nom}</td>
                            <td>{g.prenom}</td>
                            <td>{g.Semestre}</td>
                            <td>{g.Moyenne}</td>
                            <td>{g.remarque || '-'}</td>
                            <td>
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="edit-btn"
                                onClick={() => handleEditGrade(g)}
                              />
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="delete-btn"
                                onClick={() => handleDeleteGrade(g.Matricule, g.ID_module, g.Semestre)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p className="no-results">Aucune note existante pour ce module, cette section et ce semestre.</p>
                )}
              </>
            )}
            {editingGrade && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Modifier la Note</h3>
                  <div className="input-group">
                    <input
                      type="number"
                      value={editingGrade.Moyenne || ''}
                      onChange={(e) => handleEditChange('Moyenne', e.target.value)}
                      min="0"
                      max="20"
                      placeholder="Note (0-20)"
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="text"
                      value={editingGrade.remarque || ''}
                      onChange={(e) => handleEditChange('remarque', e.target.value)}
                      placeholder="Remarque"
                    />
                  </div>
                  <div className="button-group">
                    <button onClick={handleSaveEdit}>
                      <FontAwesomeIcon icon={faSave} /> Sauvegarder
                    </button>
                    <button className="close-button" onClick={handleCancelEdit}>
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
    </>
  );
};

export default GestionEnseignants;