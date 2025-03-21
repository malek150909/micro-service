import { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import TeacherSection from './TeacherSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import "../../admin_css_files/prof.css";

const App = () => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
    const [newTeacherForm, setNewTeacherForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        idFaculte: '',
        idDepartement: '',
        modules: []
    });
    const [availableModules, setAvailableModules] = useState([]);
    const [facultes, setFacultes] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [sections, setSections] = useState([]);
    const [niveaux] = useState(['L1', 'L2', 'L3', 'M1', 'M2']);
    const [filters, setFilters] = useState({
        idFaculte: '',
        idDepartement: '',
        idSpecialite: '',
        niveau: '',
        idSection: ''
    });

    // Fetch faculties
    useEffect(() => {
        axios.get('http://localhost:8081/api/facultes')
            .then(res => setFacultes(res.data || []))
            .catch(err => {
                toast.error('Erreur lors de la récupération des facultés: ' + err.message, { autoClose: 3000 });
                setFacultes([]);
            });
    }, []);

    // Fetch departments
    useEffect(() => {
        if (newTeacherForm.idFaculte || filters.idFaculte) {
            const activeIdFaculte = newTeacherForm.idFaculte || filters.idFaculte;
            axios.get(`http://localhost:8081/api/departements/${activeIdFaculte}`)
                .then(res => setDepartements(res.data || []))
                .catch(err => {
                    toast.error('Erreur lors de la récupération des départements: ' + err.message, { autoClose: 3000 });
                    setDepartements([]);
                });
        } else {
            setDepartements([]);
            setSpecialites([]);
            setSections([]);
            setAvailableModules([]);
            setFilters(prev => ({ ...prev, idDepartement: '', idSpecialite: '', niveau: '', idSection: '' }));
            setNewTeacherForm(prev => ({ ...prev, idDepartement: '' }));
        }
    }, [newTeacherForm.idFaculte, filters.idFaculte]);

    // Fetch specialties
    useEffect(() => {
        if (newTeacherForm.idDepartement || filters.idDepartement) {
            const activeIdDepartement = newTeacherForm.idDepartement || filters.idDepartement;
            axios.get(`http://localhost:8081/api/specialites/${activeIdDepartement}`)
                .then(res => setSpecialites(res.data || []))
                .catch(err => {
                    toast.error('Erreur lors de la récupération des spécialités: ' + err.message, { autoClose: 3000 });
                    setSpecialites([]);
                });
        } else {
            setSpecialites([]);
            setSections([]);
            setAvailableModules([]);
            setFilters(prev => ({ ...prev, idSpecialite: '', niveau: '', idSection: '' }));
        }
    }, [newTeacherForm.idDepartement, filters.idDepartement]);

    // Fetch sections
    useEffect(() => {
        if (filters.idSpecialite) {
            axios.get(`http://localhost:8081/api/sections/${filters.idSpecialite}`)
                .then(res => setSections(res.data || []))
                .catch(err => {
                    toast.error('Erreur lors de la récupération des sections: ' + err.message, { autoClose: 3000 });
                    setSections([]);
                });
        } else {
            setSections([]);
            setAvailableModules([]);
            setFilters(prev => ({ ...prev, niveau: '', idSection: '' }));
        }
    }, [filters.idSpecialite]);

    // Fetch available modules
    useEffect(() => {
        if (filters.idSpecialite) {
            console.log('Fetching modules with filters:', filters);
            axios.get('http://localhost:8081/api/modules/filtered', {
                params: {
                    idFaculte: newTeacherForm.idFaculte || filters.idFaculte || '',
                    idDepartement: newTeacherForm.idDepartement || filters.idDepartement || '',
                    idSpecialite: filters.idSpecialite,
                    niveau: filters.niveau || '',
                    idSection: filters.idSection || ''
                }
            })
                .then(res => {
                    console.log('Modules received:', res.data);
                    setAvailableModules(res.data || []);
                })
                .catch(err => {
                    console.error('Error fetching modules:', err.response?.data || err.message);
                    toast.error('Erreur lors de la récupération des modules: ' + err.message, { autoClose: 3000 });
                    setAvailableModules([]);
                });
        } else {
            setAvailableModules([]);
        }
    }, [filters.idFaculte, filters.idDepartement, filters.idSpecialite, filters.niveau, filters.idSection]);

    const handleFilter = (filteredTeachers) => {
        setTeachers(filteredTeachers || []);
        setSelectedTeacher(null);
        setShowNewTeacherForm(false); // Hide form when filtering
    };

    const handleBack = () => {
        setSelectedTeacher(null);
        setTeachers([]);
        setShowNewTeacherForm(false);
    };

    const handleNewTeacherChange = (e) => {
        const { name, value } = e.target;
        setNewTeacherForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleToggle = (moduleId) => {
        setNewTeacherForm(prev => {
            const updatedModules = prev.modules.includes(moduleId)
                ? prev.modules.filter(id => id !== moduleId)
                : [...prev.modules, moduleId];
            console.log('Updated modules:', updatedModules);
            return { ...prev, modules: updatedModules };
        });
    };

    const handleAddTeacher = () => {
      if (!newTeacherForm.nom || !newTeacherForm.prenom || !newTeacherForm.email || !newTeacherForm.idFaculte || !newTeacherForm.idDepartement || newTeacherForm.modules.length === 0) {
          toast.error('Veuillez remplir tous les champs et sélectionner au moins un module.', { autoClose: 3000 });
          return;
      }
  
      console.log('Submitting new teacher:', newTeacherForm);
  
      axios.post('http://localhost:8081/api/enseignants', newTeacherForm)
          .then(res => {
              console.log('Teacher added successfully:', res.data); // Log the response
              toast.success('Enseignant ajouté avec succès!', { autoClose: 3000 });
              setNewTeacherForm({ nom: '', prenom: '', email: '', idFaculte: '', idDepartement: '', modules: [] });
              setFilters({ idFaculte: '', idDepartement: '', idSpecialite: '', niveau: '', idSection: '' });
              setShowNewTeacherForm(false);
              // Refetch teachers based on current filters
              if (filters.idFaculte && filters.idDepartement) {
                  axios.post('http://localhost:8081/api/enseignants/filtrer', {
                      idFaculte: filters.idFaculte,
                      idDepartement: filters.idDepartement
                  })
                      .then(res => setTeachers(res.data))
                      .catch(err => toast.error('Erreur lors du rechargement des enseignants: ' + err.message, { autoClose: 3000 }));
              }
          })
          .catch(err => {
              console.error('Error adding teacher:', err.response?.data || err.message);
              toast.error('Erreur lors de l\'ajout de l\'enseignant: ' + (err.response?.data?.error || err.message), { autoClose: 3000 });
          });
  };

    return (
        <div id="profs">
        <div className="container">
            <h1>Gestion des Enseignants</h1>
            {showNewTeacherForm ? (
                <div className="teacher-section" style={{ marginBottom: '20px' }}>
                    <h2>Ajouter un nouvel enseignant</h2>
                    <input
                        type="text"
                        name="nom"
                        value={newTeacherForm.nom}
                        onChange={handleNewTeacherChange}
                        placeholder="Nom"
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="text"
                        name="prenom"
                        value={newTeacherForm.prenom}
                        onChange={handleNewTeacherChange}
                        placeholder="Prénom"
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="email"
                        name="email"
                        value={newTeacherForm.email}
                        onChange={handleNewTeacherChange}
                        placeholder="Email"
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <h3>Filtrer les modules</h3>
                    <select
                        name="idFaculte"
                        value={newTeacherForm.idFaculte}
                        onChange={(e) => {
                            handleNewTeacherChange(e);
                            handleFilterChange(e);
                        }}
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
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
                        value={newTeacherForm.idDepartement}
                        onChange={(e) => {
                            handleNewTeacherChange(e);
                            handleFilterChange(e);
                        }}
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                        disabled={!newTeacherForm.idFaculte}
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
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                        disabled={!newTeacherForm.idDepartement}
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
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
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
                        style={{ margin: '5px 0', padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">Sélectionner une section</option>
                        {sections.map(s => (
                            <option key={s.ID_section} value={s.ID_section}>
                                {s.nom_section || s.niveau}
                            </option>
                        ))}
                    </select>
                    <h3>Modules</h3>
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
                                        backgroundColor: newTeacherForm.modules.includes(module.ID_module) ? '#e0f7fa' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={e => (e.target.style.backgroundColor = newTeacherForm.modules.includes(module.ID_module) ? '#b2ebf2' : '#f5f5f5')}
                                    onMouseLeave={e => (e.target.style.backgroundColor = newTeacherForm.modules.includes(module.ID_module) ? '#e0f7fa' : '#fff')}
                                >
                                    <span>
                                        {module.nom_module} (Crédits: {module.credit}, Coefficient: {module.coefficient})
                                    </span>
                                    {newTeacherForm.modules.includes(module.ID_module) && (
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
                        {newTeacherForm.modules.length > 0
                            ? newTeacherForm.modules
                                  .map(id => availableModules.find(m => m.ID_module === id)?.nom_module || 'Inconnu')
                                  .join(', ')
                            : 'Aucun module sélectionné'}
                    </p>
                    <button
                        onClick={handleAddTeacher}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '10px',
                            marginTop: '10px'
                        }}
                    >
                        Ajouter
                    </button>
                    <button
                        onClick={() => {
                            setShowNewTeacherForm(false);
                            setNewTeacherForm({ nom: '', prenom: '', email: '', idFaculte: '', idDepartement: '', modules: [] });
                            setFilters({ idFaculte: '', idDepartement: '', idSpecialite: '', niveau: '', idSection: '' });
                        }}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Annuler
                    </button>
                </div>
            ) : !selectedTeacher ? (
                <div>
                    <button
                        onClick={() => setShowNewTeacherForm(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '20px'
                        }}
                    >
                        Ajouter un nouvel enseignant
                    </button>
                    <FilterPanel onFilter={handleFilter} />
                    {teachers.length > 0 && (
    <div className="teachers-list">
        {teachers.map(teacher => (
            <div
                key={teacher.Matricule}
                className="teacher-card"
                onClick={() => setSelectedTeacher(teacher)}
            >
                {teacher.nom} {teacher.prenom}
            </div>
        ))}
    </div>
)}
                </div>
            ) : (
                <TeacherSection teacher={selectedTeacher} onBack={handleBack} />
            )}
            <ToastContainer />
        </div>
        </div>
    );
};

export default App;