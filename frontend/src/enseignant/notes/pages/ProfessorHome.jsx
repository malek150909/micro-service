import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faSignOutAlt, 
  faFileAlt, 
  faFileExcel, 
  faFilePdf, 
  faHome, 
  faClipboardList, 
  faEye, 
  faSave, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import "../note.css";

const ProfessorHome = () => {
  const navigate = useNavigate();
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    idFaculte: '',
    idDepartement: '',
    idSpecialite: '',
    niveau: '',
    idSection: '',
    idModule: '',
    semestre: '',
  });
  const [error, setError] = useState('');
  const [editingGrade, setEditingGrade] = useState(null);
  

  useEffect(() => {
    fetchFacultes();
  }, []);

  useEffect(() => {
    if (filters.idFaculte) fetchDepartements(filters.idFaculte);
    else resetAfterFaculte();
  }, [filters.idFaculte]);

  useEffect(() => {
    if (filters.idDepartement) fetchSpecialites(filters.idDepartement);
    else resetAfterDepartement();
  }, [filters.idDepartement]);

  useEffect(() => {
    if (filters.idSpecialite) fetchSections(filters.idSpecialite);
    else resetAfterSpecialite();
  }, [filters.idSpecialite]);

  useEffect(() => {
    if (filters.idSection) fetchModules(filters.idSection);
    else setModules([]);
  }, [filters.idSection]);

  useEffect(() => {
    fetchGrades();
  }, [filters.idSection, filters.idModule, filters.semestre]);

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
    } catch (err) {
      setError('Échec du chargement des départements.');
      console.error(err);
    }
  };

  const fetchSpecialites = async (idDepartement) => {
    try {
      const res = await api.get(`/specialites/${idDepartement}`);
      setSpecialites(res.data || []);
    } catch (err) {
      setError('Échec du chargement des spécialités.');
      console.error(err);
    }
  };

  const fetchSections = async (idSpecialite) => {
    try {
      const res = await api.get(`/sections/${idSpecialite}`);
      setSections(res.data || []);
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

  const fetchGrades = async () => {
    if (!filters.idSection || !filters.idModule || !filters.semestre) {
      console.log('Paramètres manquants:', filters);
      setGrades([]);
      return;
    }
    try {
      console.log('Requête envoyée avec:', filters);
      console.log('Token:', localStorage.getItem('token'));
      const res = await api.get('/existing-grades', {
        params: { idSection: filters.idSection, idModule: filters.idModule, semestre: filters.semestre },
      });
      console.log('Réponse reçue:', res.data);
      setGrades(res.data || []);
    } catch (err) {
      console.error('Erreur complète:', err.response || err);
      if (err.response?.status === 404) {
        setGrades([]);
        setError('Aucune note trouvée pour cette combinaison.');
        toast.info('Aucune note trouvée pour cette combinaison.');
      } else {
        setError('Échec du chargement des notes.');
        toast.error(err.response?.data?.error || 'Erreur lors du chargement des notes.');
      }
    }
  };

  const resetAfterFaculte = () => {
    setDepartements([]);
    setSpecialites([]);
    setSections([]);
    setModules([]);
    setGrades([]);
  };

  const resetAfterDepartement = () => {
    setSpecialites([]);
    setSections([]);
    setModules([]);
    setGrades([]);
  };

  const resetAfterSpecialite = () => {
    setSections([]);
    setModules([]);
    setGrades([]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'idFaculte' && { idDepartement: '', idSpecialite: '', niveau: '', idSection: '', idModule: '', semestre: '' }),
      ...(name === 'idDepartement' && { idSpecialite: '', niveau: '', idSection: '', idModule: '', semestre: '' }),
      ...(name === 'idSpecialite' && { niveau: '', idSection: '', idModule: '', semestre: '' }),
      ...(name === 'niveau' && { idSection: '', idModule: '', semestre: '' }),
      ...(name === 'idSection' && { idModule: '', semestre: '' }),
    }));
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
        fetchGrades();
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
      fetchGrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la note.');
      console.error(err);
    }
  };

  const handleDeleteAllGrades = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toute la liste de notes ? Cette action est irréversible.')) return;

    try {
      const res = await api.delete('/grades', {
        params: { idSection: filters.idSection, idModule: filters.idModule, semestre: filters.semestre },
      });
      toast.success(res.data.message || 'Liste de notes supprimée avec succès.');
      fetchGrades();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression de la liste de notes.');
      console.error(err);
    }
  };

  const exportGrades = async (format) => {
    if (!filters.idSection || !filters.idModule || !filters.semestre) {
      toast.error('Veuillez sélectionner une section, un module et un semestre avant d\'exporter.');
      return;
    }

    try {
      const response = await api.get('/existing-grades', {
        params: {
          idSection: filters.idSection,
          idModule: filters.idModule,
          semestre: filters.semestre,
          export: format,
        },
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'];
      if (format === 'pdf' && contentType !== 'application/pdf') {
        throw new Error('Invalid PDF response from server');
      }
      if (format === 'excel' && contentType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        throw new Error('Invalid Excel response from server');
      }

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `Grades_${filters.idModule}_${filters.idSection}_${filters.semestre}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

      const blob = new Blob([response.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      });
      saveAs(blob, filename);
      toast.success(`Exportation réussie en format ${format === 'excel' ? 'Excel' : 'PDF'}.`);
    } catch (err) {
      console.error(`Erreur lors de l'exportation des notes en ${format}:`, err);

      if (format === 'pdf') {
        try {
          const table = document.querySelector('.grades-table');
          if (!table) {
            toast.error('Tableau des notes non trouvé pour l\'exportation.');
            return;
          }

          const canvas = await html2canvas(table, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          if (pdfHeight > pdf.internal.pageSize.getHeight()) {
            const ratio = pdf.internal.pageSize.getHeight() / pdfHeight;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth * ratio, pdfHeight * ratio);
          } else {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          }

          pdf.save(`Grades_${filters.idModule}_${filters.idSection}_${filters.semestre}.pdf`);
          toast.success('Exportation PDF réussie (génération côté client).');
        } catch (clientErr) {
          console.error('Erreur lors de la génération PDF côté client:', clientErr);
          toast.error('Échec de l\'exportation PDF, même avec la génération côté client.');
        }
      } else {
        toast.error(`Échec de l'exportation des notes en ${format === 'excel' ? 'Excel' : 'PDF'}.`);
      }
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
        <button className="sidebar-button" onClick={() => navigate('/enseignant')}>
          <FontAwesomeIcon icon={faHome} /> Accueil
        </button>
        <button className="sidebar-button" onClick={() => navigate('/GESENS')}>
          <FontAwesomeIcon icon={faClipboardList} /> Gestion des Notes
        </button>
        <button className="sidebar-button" onClick={() => navigate('/PROFREC')}>
          <FontAwesomeIcon icon={faFileAlt} /> Réclamations
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>BIENVENUE SUR VOTRE ESPACE NOTES</h1>
            <p>Gérez vos notes avec facilité et précision</p>
          </div>
          <div className="section-card">
            <h1>Consultation des Notes</h1>
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
              <select
                name="idDepartement"
                value={filters.idDepartement}
                onChange={handleFilterChange}
                disabled={!filters.idFaculte}
              >
                <option value="">Sélectionner un département</option>
                {departements.map((d) => (
                  <option key={d.ID_departement} value={d.ID_departement}>
                    {d.Nom_departement}
                  </option>
                ))}
              </select>
              <select
                name="idSpecialite"
                value={filters.idSpecialite}
                onChange={handleFilterChange}
                disabled={!filters.idDepartement}
              >
                <option value="">Sélectionner une spécialité</option>
                {specialites.map((s) => (
                  <option key={s.ID_specialite} value={s.ID_specialite}>
                    {s.nom_specialite}
                  </option>
                ))}
              </select>
              <select
                name="niveau"
                value={filters.niveau}
                onChange={handleFilterChange}
                disabled={!filters.idSpecialite}
              >
                <option value="">Sélectionner un niveau</option>
                {['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3'].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                name="idSection"
                value={filters.idSection}
                onChange={handleFilterChange}
                disabled={!filters.niveau}
              >
                <option value="">Sélectionner une section</option>
                {sections
                  .filter((s) => !filters.niveau || s.niveau === filters.niveau)
                  .map((s) => (
                    <option key={s.ID_section} value={s.ID_section}>
                      {s.nom_section ? `${s.nom_section} (${s.niveau})` : s.niveau}
                    </option>
                  ))}
              </select>
              <select
                name="idModule"
                value={filters.idModule}
                onChange={handleFilterChange}
                disabled={!filters.idSection}
              >
                <option value="">Sélectionner un module</option>
                {modules.map((m) => (
                  <option key={m.ID_module} value={m.ID_module}>
                    {m.nom_module}
                  </option>
                ))}
              </select>
              <select
                name="semestre"
                value={filters.semestre}
                onChange={handleFilterChange}
                disabled={!filters.idSection}
              >
                <option value="">Sélectionner un semestre</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
              <button 
                className="submit-btn"
                onClick={fetchGrades} 
                disabled={!filters.idSection || !filters.idModule || !filters.semestre}
              >
                <FontAwesomeIcon icon={faEye} /> Afficher les Notes
              </button>
            </div>
            {grades.length > 0 ? (
              <>
                <div className="export-buttons" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <button
                    className="submit-btn"
                    onClick={() => exportGrades('excel')}
                    disabled={!filters.idSection || !filters.idModule || !filters.semestre}
                  >
                    <FontAwesomeIcon icon={faFileExcel} /> Exporter en Excel
                  </button>
                  <button
                    className="submit-btn"
                    onClick={() => exportGrades('pdf')}
                    disabled={!filters.idSection || !filters.idModule || !filters.semestre}
                  >
                    <FontAwesomeIcon icon={faFilePdf} /> Exporter en PDF
                  </button>
                </div>
                <button className="delete-all-btn" onClick={handleDeleteAllGrades}>
                  <FontAwesomeIcon icon={faTrash} /> Supprimer Toute la Liste
                </button>
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Module</th>
                      <th>Semestre</th>
                      <th>Note</th>
                      <th>Remarque</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, index) => (
                      <tr key={`${g.Matricule}-${g.ID_module}-${g.Semestre}-${index}`}>
                        <td>{g.Matricule}</td>
                        <td>{g.nom}</td>
                        <td>{g.prenom}</td>
                        <td>{g.nom_module}</td>
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
              <p className="no-results">Sélectionnez une section, un module et un semestre pour voir les notes soumises précédemment.</p>
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
                    <button className="submit-btn" onClick={handleSaveEdit}>
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

export default ProfessorHome;