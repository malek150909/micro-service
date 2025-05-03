import React, { useState, useEffect } from 'react';
import FilterPanel from './FilterPanel';
import TeacherSection from './TeacherSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import styles from './prof.module.css';

const ListEnseignant = () => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
    const [showBulkUploadForm, setShowBulkUploadForm] = useState(false);
    const [showModuleAssignForm, setShowModuleAssignForm] = useState(false);
    const [newTeacherForm, setNewTeacherForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        idFaculte: '',
        idSection: '',
        modules: []
    });
    const [bulkUploadForm, setBulkUploadForm] = useState({
        idFaculte: '',
        file: null
    });
    const [moduleAssignFile, setModuleAssignFile] = useState(null);
    const [facultes, setFacultes] = useState([]);
    const [sections, setSections] = useState([]);
    const [filteredModules, setFilteredModules] = useState([]);

    useEffect(() => {
        axios.get('http://users.localhost/api/facultes')
            .then(res => setFacultes(res.data || []))
            .catch(err => {
                toast.error('Erreur lors de la récupération des facultés: ' + err.message, { autoClose: 3000 });
                setFacultes([]);
            });
    }, []);

    useEffect(() => {
        if (newTeacherForm.idFaculte) {
            axios.get(`http://users.localhost/api/sections/${newTeacherForm.idFaculte}`)
                .then(res => setSections(res.data || []))
                .catch(err => {
                    toast.error('Erreur lors de la récupération des sections: ' + err.message, { autoClose: 3000 });
                    setSections([]);
                });
        } else {
            setSections([]);
            setFilteredModules([]);
            setNewTeacherForm(prev => ({ ...prev, idSection: '', modules: [] }));
            setBulkUploadForm(prev => ({ ...prev, idFaculte: '' }));
        }
    }, [newTeacherForm.idFaculte]);

    useEffect(() => {
        if (newTeacherForm.idSection) {
            axios.get(`http://users.localhost/api/modules/filtered`, {
                params: { idSection: newTeacherForm.idSection }
            })
                .then(res => setFilteredModules(res.data || []))
                .catch(err => {
                    toast.error('Erreur lors de la récupération des modules: ' + err.message, { autoClose: 3000 });
                    setFilteredModules([]);
                });
        } else {
            setFilteredModules([]);
            setNewTeacherForm(prev => ({ ...prev, modules: [] }));
        }
    }, [newTeacherForm.idSection]);

    const handleFilter = (filteredTeachers) => {
        setTeachers(filteredTeachers || []);
        setSelectedTeacher(null);
        setShowNewTeacherForm(false);
        setShowBulkUploadForm(false);
        setShowModuleAssignForm(false);
    };

    const handleReset = () => {
        setTeachers([]);
    };

    const handleBack = () => {
        setSelectedTeacher(null);
        setShowNewTeacherForm(false);
        setShowBulkUploadForm(false);
        setShowModuleAssignForm(false);
    };

    const handleNewTeacherChange = (e) => {
        const { name, value } = e.target;
        setNewTeacherForm(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => Number(option.value));
        console.log('Selected modules:', selectedOptions); // Debug log
        setNewTeacherForm(prev => ({ ...prev, modules: selectedOptions }));
    };

    const handleBulkUploadChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file') {
            setBulkUploadForm(prev => ({ ...prev, file: files[0] }));
        } else {
            setBulkUploadForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleModuleAssignFileChange = (e) => {
        setModuleAssignFile(e.target.files[0]);
    };

    const handleAddTeacher = () => {
        if (!newTeacherForm.nom || !newTeacherForm.prenom || !newTeacherForm.email || !newTeacherForm.idFaculte || newTeacherForm.modules.length === 0) {
            toast.error('Veuillez remplir tous les champs obligatoires et sélectionner au moins un module.', { autoClose: 3000 });
            return;
        }

        const payload = {
            nom: newTeacherForm.nom,
            prenom: newTeacherForm.prenom,
            email: newTeacherForm.email,
            idFaculte: newTeacherForm.idFaculte,
            idDepartement: null,
            idSection: newTeacherForm.idSection,
            modules: newTeacherForm.modules
        };

        axios.post('http://users.localhost/api/enseignants', payload)
            .then(res => {
                toast.success('Enseignant ajouté avec succès!', { autoClose: 3000 });
                setNewTeacherForm({
                    nom: '',
                    prenom: '',
                    email: '',
                    idFaculte: '',
                    idSection: '',
                    modules: []
                });
                setShowNewTeacherForm(false);
                setTeachers([]);
            })
            .catch(err => {
                toast.error('Erreur lors de l\'ajout de l\'enseignant: ' + (err.response?.data?.error || err.message), { autoClose: 3000 });
            });
    };

    const handleBulkUpload = () => {
        if (!bulkUploadForm.idFaculte || !bulkUploadForm.file) {
            toast.error('Veuillez sélectionner une faculté et un fichier Excel.', { autoClose: 3000 });
            return;
        }

        const formData = new FormData();
        formData.append('idFaculte', bulkUploadForm.idFaculte);
        formData.append('file', bulkUploadForm.file);

        axios.post('http://users.localhost/api/enseignants/bulk', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(res => {
                toast.success(`Importation réussie! ${res.data.successCount} enseignants ajoutés.`, { autoClose: 3000 });
                if (res.data.failedEntries.length > 0) {
                    res.data.failedEntries.forEach(entry => {
                        toast.error(`Échec pour ${entry.email}: ${entry.error}`, { autoClose: 3000 });
                    });
                }
                setBulkUploadForm({ idFaculte: '', file: null });
                setShowBulkUploadForm(false);
                setTeachers([]);
            })
            .catch(err => {
                toast.error('Erreur lors de l\'importation: ' + (err.response?.data?.error || err.message), { autoClose: 3000 });
            });
    };

    const handleModuleAssign = () => {
        if (!moduleAssignFile) {
            toast.error('Veuillez sélectionner un fichier Excel.', { autoClose: 3000 });
            return;
        }

        const formData = new FormData();
        formData.append('file', moduleAssignFile);

        axios.post('http://users.localhost/api/enseignants/assign-modules', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(res => {
                toast.success('Modules attribués avec succès!', { autoClose: 3000 });
                setModuleAssignFile(null);
                setShowModuleAssignForm(false);
            })
            .catch(err => {
                toast.error('Erreur lors de l\'attribution des modules: ' + (err.response?.data?.error || err.message), { autoClose: 3000 });
            });
    };

    return (
        <>
            <div className={styles['ADM-ENS-background-shapes']}>
                <div className={`${styles['ADM-ENS-shape']} ${styles['ADM-ENS-shape1']}`}></div>
                <div className={`${styles['ADM-ENS-shape']} ${styles['ADM-ENS-shape2']}`}></div>
            </div>
            <div className={styles['ADM-ENS-sidebar']}>
                <div className={styles['ADM-ENS-logo']}>
                    <h2>Gestion</h2>
                </div>
                <button
                    className={styles['ADM-ENS-sidebar-button']}
                    onClick={() => {
                        setShowNewTeacherForm(true);
                        setShowBulkUploadForm(false);
                        setShowModuleAssignForm(false);
                        setSelectedTeacher(null);
                        setTeachers([]);
                    }}
                >
                    Ajouter Enseignant
                </button>
                <button
                    className={styles['ADM-ENS-sidebar-button']}
                    onClick={() => {
                        setShowBulkUploadForm(true);
                        setShowNewTeacherForm(false);
                        setShowModuleAssignForm(false);
                        setSelectedTeacher(null);
                        setTeachers([]);
                    }}
                >
                    Importer Enseignants
                </button>
                <button
                    className={styles['ADM-ENS-sidebar-button']}
                    onClick={() => {
                        setShowModuleAssignForm(true);
                        setShowNewTeacherForm(false);
                        setShowBulkUploadForm(false);
                        setSelectedTeacher(null);
                        setTeachers([]);
                    }}
                >
                    Attribuer Modules
                </button>
                <button
                    className={styles['ADM-ENS-sidebar-button']}
                    onClick={() => {
                        setSelectedTeacher(null);
                        setShowNewTeacherForm(false);
                        setShowBulkUploadForm(false);
                        setShowModuleAssignForm(false);
                        setTeachers([]);
                    }}
                >
                    Liste Enseignants
                </button>
            </div>
            <div className={styles['ADM-ENS-container']}>
                <div className={styles['ADM-ENS-main-content']}>
                    <h1 className={styles['ADM-ENS-title-with-square']}>Gestion des Enseignants</h1>
                    {showNewTeacherForm ? (
                        <div className={`${styles['ADM-ENS-section-card']} ${styles['ADM-ENS-teacher-section']} ${styles['ADM-ENS-enlarged-form']}`}>
                            <h2>Ajouter un nouvel enseignant</h2>
                            <input
                                type="text"
                                name="nom"
                                value={newTeacherForm.nom}
                                onChange={handleNewTeacherChange}
                                placeholder="Nom"
                            />
                            <input
                                type="text"
                                name="prenom"
                                value={newTeacherForm.prenom}
                                onChange={handleNewTeacherChange}
                                placeholder="Prénom"
                            />
                            <input
                                type="email"
                                name="email"
                                value={newTeacherForm.email}
                                onChange={handleNewTeacherChange}
                                placeholder="Email"
                            />
                            <select
                                name="idFaculte"
                                value={newTeacherForm.idFaculte}
                                onChange={handleNewTeacherChange}
                            >
                                <option value="">Sélectionner une faculté</option>
                                {facultes.map(f => (
                                    <option key={f.ID_faculte} value={f.ID_faculte}>
                                        {f.nom_faculte}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="idSection"
                                value={newTeacherForm.idSection}
                                onChange={handleNewTeacherChange}
                                disabled={!newTeacherForm.idFaculte}
                            >
                                <option value="">Sélectionner une section</option>
                                {sections.map(section => (
                                    <option key={section.ID_section} value={section.ID_section}>
                                        {section.nom_section} ({section.niveau})
                                    </option>
                                ))}
                            </select>
                            <select
                                multiple
                                name="modules"
                                value={newTeacherForm.modules}
                                onChange={handleModuleChange}
                                disabled={!newTeacherForm.idSection}
                                style={{ minHeight: '120px' }}
                            >
                                {filteredModules.map(module => (
                                    <option key={module.ID_module} value={module.ID_module}>
                                        {module.nom_module}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.9rem', color: '#052659', marginTop: '-10px', marginBottom: '15px' }}>
                                Tenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs modules.
                            </p>
                            <div className={styles['ADM-ENS-button-group']}>
                                <button onClick={handleAddTeacher} className={styles['ADM-ENS-submit-btn']}>
                                    Ajouter
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewTeacherForm(false);
                                        setNewTeacherForm({
                                            nom: '',
                                            prenom: '',
                                            email: '',
                                            idFaculte: '',
                                            idSection: '',
                                            modules: []
                                        });
                                        setTeachers([]);
                                    }}
                                    className={styles['ADM-ENS-back-btn']}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    ) : showBulkUploadForm ? (
                        <div className={`${styles['ADM-ENS-section-card']} ${styles['ADM-ENS-teacher-section']} ${styles['ADM-ENS-enlarged-form']}`}>
                            <h2>Importer des enseignants via Excel</h2>
                            <select
                                name="idFaculte"
                                value={bulkUploadForm.idFaculte}
                                onChange={handleBulkUploadChange}
                            >
                                <option value="">Sélectionner une faculté</option>
                                {facultes.map(f => (
                                    <option key={f.ID_faculte} value={f.ID_faculte}>
                                        {f.nom_faculte}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="file"
                                name="file"
                                accept=".xlsx, .xls"
                                onChange={handleBulkUploadChange}
                            />
                            <div className={styles['ADM-ENS-button-group']}>
                                <button onClick={handleBulkUpload} className={styles['ADM-ENS-submit-btn']}>
                                    Importer
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkUploadForm(false);
                                        setBulkUploadForm({ idFaculte: '', file: null });
                                        setTeachers([]);
                                    }}
                                    className={styles['ADM-ENS-back-btn']}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    ) : showModuleAssignForm ? (
                        <div className={`${styles['ADM-ENS-section-card']} ${styles['ADM-ENS-teacher-section']} ${styles['ADM-ENS-enlarged-form']}`}>
                            <h2>Attribuer des modules via Excel</h2>
                            <input
                                type="file"
                                name="file"
                                accept=".xlsx, .xls"
                                onChange={handleModuleAssignFileChange}
                            />
                            <div className={styles['ADM-ENS-button-group']}>
                                <button onClick={handleModuleAssign} className={styles['ADM-ENS-submit-btn']}>
                                    Attribuer
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModuleAssignForm(false);
                                        setModuleAssignFile(null);
                                        setTeachers([]);
                                    }}
                                    className={styles['ADM-ENS-back-btn']}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    ) : selectedTeacher ? (
                        <TeacherSection teacher={selectedTeacher} onBack={handleBack} />
                    ) : (
                        <div className={`${styles['ADM-ENS-filtering-page']} flex flex-row gap-6`}>
                            <div className={styles['ADM-ENS-section-card']}>
                                <FilterPanel onFilter={handleFilter} onReset={handleReset} />
                            </div>
                            <div className={`${styles['ADM-ENS-section-card']} ${styles['ADM-ENS-teacher-list-container']} flex items-center justify-center`}>
                                {teachers.length > 0 ? (
                                    <div className={`${styles['ADM-ENS-teachers-list']} w-full`}>
                                        {[...teachers]
                                            .sort((a, b) =>
                                                `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr', { sensitivity: 'base' })
                                            )
                                            .map(teacher => (
                                                <div
                                                    key={teacher.Matricule}
                                                    className={styles['ADM-ENS-teacher-card']}
                                                    onClick={() => setSelectedTeacher(teacher)}
                                                >
                                                    {teacher.nom} {teacher.prenom}
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className={styles['ADM-ENS-empty-list-message']}>La liste des enseignants s'affichera ici</p>
                                )}
                            </div>
                        </div>
                    )}
                    <ToastContainer className={styles['ADM-ENS-Toastify__toast']} />
                </div>
            </div>
        </>
    );
};

export default ListEnseignant;