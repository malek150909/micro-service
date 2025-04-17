import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './prof.module.css';

const TeacherSection = ({ teacher, onBack }) => {
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [modules, setModules] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', modules: [] });
  const [availableModules, setAvailableModules] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [sections, setSections] = useState([]);
  const [niveaux] = useState(['L1', 'L2', 'L3', 'M1', 'M2']);
  const [filters, setFilters] = useState({ idFaculte: '', idDepartement: '', idSpecialite: '', niveau: '', idSection: '' });

  useEffect(() => {
    // Fetch teacher details and modules
    axios.get(`http://localhost:8081/api/enseignants/${teacher.Matricule}`)
      .then(res => {
        setTeacherDetails(res.data.enseignant);
        setModules(res.data.modules);
        setFormData({
          nom: res.data.enseignant.nom,
          prenom: res.data.enseignant.prenom,
          email: res.data.enseignant.email,
          modules: res.data.modules.map(m => m.ID_module) || []
        });
      })
      .catch(err => {
        toast.error('Erreur lors de la récupération des détails de l\'enseignant: ' + err.message, { autoClose: 3000 });
      });

    // Fetch all faculties
    axios.get('http://localhost:8081/api/facultes')
      .then(res => setFacultes(res.data))
      .catch(err => toast.error('Erreur lors de la récupération des facultés: ' + err.message, { autoClose: 3000 }));
  }, [teacher]);

  useEffect(() => {
    if (filters.idFaculte) {
      axios.get(`http://localhost:8081/api/departements/${filters.idFaculte}`)
        .then(res => setDepartements(res.data))
        .catch(err => toast.error('Erreur lors de la récupération des départements: ' + err.message, { autoClose: 3000 }));
    }
  }, [filters.idFaculte]);

  useEffect(() => {
    if (filters.idDepartement) {
      axios.get(`http://localhost:8081/api/specialites/${filters.idDepartement}`)
        .then(res => setSpecialites(res.data))
        .catch(err => toast.error('Erreur lors de la récupération des spécialités: ' + err.message, { autoClose: 3000 }));
    }
  }, [filters.idDepartement]);

  useEffect(() => {
    if (filters.idSpecialite) {
      axios.get(`http://localhost:8081/api/sections/${filters.idSpecialite}`)
        .then(res => setSections(res.data))
        .catch(err => toast.error('Erreur lors de la récupération des sections: ' + err.message, { autoClose: 3000 }));
    }
  }, [filters.idSpecialite]);

  useEffect(() => {
    if (filters.idSpecialite) {
      axios.get('http://localhost:8081/api/modules/filtered', {
        params: {
          idFaculte: filters.idFaculte || '',
          idDepartement: filters.idDepartement || '',
          idSpecialite: filters.idSpecialite,
          niveau: filters.niveau || '',
          idSection: filters.idSection || ''
        }
      })
        .then(res => setAvailableModules(res.data || []))
        .catch(err => toast.error('Erreur lors de la récupération des modules: ' + err.message, { autoClose: 3000 }));
    } else {
      setAvailableModules([]);
    }
  }, [filters.idFaculte, filters.idDepartement, filters.idSpecialite, filters.niveau, filters.idSection]);

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      axios.delete(`http://localhost:8081/api/enseignants/${teacher.Matricule}`)
        .then(() => {
          toast.success('Enseignant supprimé avec succès', { autoClose: 3000 });
          onBack();
        })
        .catch(err => toast.error('Erreur lors de la suppression de l\'enseignant: ' + err.message, { autoClose: 3000 }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleToggle = (moduleId) => {
    setFormData(prev => {
      const updatedModules = prev.modules.includes(moduleId)
        ? prev.modules.filter(id => id !== moduleId)
        : [...prev.modules, moduleId];
      return { ...prev, modules: updatedModules };
    });
  };

  const handleUpdate = () => {
    axios.put(`http://localhost:8081/api/enseignants/${teacher.Matricule}`, formData)
      .then(() => {
        toast.success('Enseignant mis à jour avec succès', { autoClose: 3000 });
        axios.get(`http://localhost:8081/api/enseignants/${teacher.Matricule}`)
          .then(res => {
            setTeacherDetails(res.data.enseignant);
            setModules(res.data.modules);
            setFormData({
              nom: res.data.enseignant.nom,
              prenom: res.data.enseignant.prenom,
              email: res.data.enseignant.email,
              modules: res.data.modules.map(m => m.ID_module) || []
            });
            setEditMode(false);
          })
          .catch(err => toast.error('Erreur lors du rechargement des données: ' + err.message, { autoClose: 3000 }));
      })
      .catch(err => toast.error('Erreur lors de la mise à jour de l\'enseignant: ' + err.message, { autoClose: 3000 }));
  };

  return (
    <div className={`${styles.ProfSectionCard} ${styles.ProfTeacherSection}`}>
      <button className={styles.ProfBackButton} onClick={onBack}>Retour</button>
      <h2 className={styles.ProfTitleH2}>Détails de l'enseignant</h2>
      {teacherDetails && (
        <div>
          {!editMode ? (
            <>
              <p><strong>Nom:</strong> {teacherDetails.nom}</p>
              <p><strong>Prénom:</strong> {teacherDetails.prenom}</p>
              <p><strong>Email:</strong> {teacherDetails.email}</p>
              <h3 className={styles.ProfTitleH3}>Modules enseignés</h3>
              <ul>
                {modules.length > 0 ? (
                  modules.map(m => (
                    <li key={m.ID_module}>{m.nom_module}</li>
                  ))
                ) : (
                  <li>Aucun module assigné</li>
                )}
              </ul>
              <button className={styles.ProfEditButton} onClick={() => setEditMode(true)}>Modifier</button>
              <button className={styles.ProfDeleteButton} onClick={handleDelete}>Supprimer</button>
            </>
          ) : (
            <div>
              <input
                type="text"
                value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom"
                className={styles.ProfInput}
              />
              <input
                type="text"
                value={formData.prenom}
                onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Prénom"
                className={styles.ProfInput}
              />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className={styles.ProfInput}
              />
              <h3 className={styles.ProfTitleH3}>Filtrer les modules</h3>
              <select
                name="idFaculte"
                value={filters.idFaculte}
                onChange={handleFilterChange}
                className={styles.ProfSelect}
              >
                <option value="">Sélectionner une faculté</option>
                {facultes.map(f => (
                  <option key={f.ID_faculte} value={f.ID_faculte}>
                    {f.nom_faculte}
                  </option>
                ))}
              </select>
              <select
                name="idDepartement"
                value={filters.idDepartement}
                onChange={handleFilterChange}
                className={styles.ProfSelect}
              >
                <option value="">Sélectionner un département</option>
                {departements.map(d => (
                  <option key={d.ID_departement} value={d.ID_departement}>
                    {d.Nom_departement}
                  </option>
                ))}
              </select>
              <select
                name="idSpecialite"
                value={filters.idSpecialite}
                onChange={handleFilterChange}
                className={styles.ProfSelect}
              >
                <option value="">Sélectionner une spécialité</option>
                {specialites.map(s => (
                  <option key={s.ID_specialite} value={s.ID_specialite}>
                    {s.nom_specialite}
                  </option>
                ))}
              </select>
              <select
                name="niveau"
                value={filters.niveau}
                onChange={handleFilterChange}
                className={styles.ProfSelect}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <select
                name="idSection"
                value={filters.idSection}
                onChange={handleFilterChange}
                className={styles.ProfSelect}
              >
                <option value="">Sélectionner une section</option>
                {sections.map(s => (
                  <option key={s.ID_section} value={s.ID_section}>
                    {s.nom_section || s.niveau}
                  </option>
                ))}
              </select>
              <h3 className={styles.ProfTitleH3}>Modules</h3>
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '10px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {availableModules.length > 0 ? (
                  availableModules.map(module => (
                    <div
                      key={module.ID_module}
                      onClick={() => handleModuleToggle(module.ID_module)}
                      style={{
                        padding: '8px 12px',
                        margin: '5px 0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: formData.modules.includes(module.ID_module) ? '#e0f7fa' : '#fff',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => (e.target.style.backgroundColor = formData.modules.includes(module.ID_module) ? '#b2ebf2' : '#f5f5f5')}
                      onMouseLeave={e => (e.target.style.backgroundColor = formData.modules.includes(module.ID_module) ? '#e0f7fa' : '#fff')}
                    >
                      <span>
                        {module.nom_module} (Crédits: {module.credit}, Coefficient: {module.coefficient})
                      </span>
                      {formData.modules.includes(module.ID_module) && (
                        <span style={{ color: '#2196f3', fontSize: '12px' }}>Sélectionné</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888', padding: '5px' }}>Aucun module disponible</p>
                )}
              </div>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                Modules sélectionnés :{' '}
                {formData.modules.length > 0
                  ? formData.modules
                      .map(id => availableModules.find(m => m.ID_module === id)?.nom_module || 'Inconnu')
                      .join(', ')
                  : 'Aucun module sélectionné'}
              </p>
              <button onClick={handleUpdate} className={styles.ProfButton}>
                Mettre à jour
              </button>
              <button onClick={() => setEditMode(false)} className={styles.ProfBackButton}>
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default TeacherSection;