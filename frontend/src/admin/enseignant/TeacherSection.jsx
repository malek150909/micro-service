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
    const [facultes, setFacultes] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [sections, setSections] = useState([]);
    const [niveaux] = useState(['L1', 'L2', 'L3', 'M1', 'M2']);
    const [filters, setFilters] = useState({ idFaculte: '', idDepartement: '', idSpecialite: '', niveau: '', idSection: '' });
    const [selectedModuleSections, setSelectedModuleSections] = useState([]);
    const [selectedModuleName, setSelectedModuleName] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Nouvel état pour le modal de suppression

    useEffect(() => {
        axios.get(`http://users.localhost/api/enseignants/${teacher.Matricule}`)
            .then(res => {
                setTeacherDetails(res.data.enseignant);
                setModules(res.data.modules);
                setFormData({
                    nom: res.data.enseignant.nom,
                    prenom: res.data.enseignant.prenom,
                    email: res.data.enseignant.email,
                    modules: res.data.modules.map(m => ({
                        ID_module: m.ID_module,
                        course_type: m.course_type,
                        group_number: m.group_number
                    })) || []
                });
            })
            .catch(err => {
                toast.error('Erreur lors de la récupération des détails de l\'enseignant: ' + err.message, { autoClose: 3000 });
            });

        axios.get('http://users.localhost/api/facultes')
            .then(res => setFacultes(res.data))
            .catch(err => toast.error('Erreur lors de la récupération des facultés: ' + err.message, { autoClose: 3000 }));
    }, [teacher]);

    useEffect(() => {
        if (filters.idFaculte) {
            axios.get(`http://users.localhost/api/departements/${filters.idFaculte}`)
                .then(res => setDepartements(res.data))
                .catch(err => toast.error('Erreur lors de la récupération des départements: ' + err.message, { autoClose: 3000 }));
        }
    }, [filters.idFaculte]);

    useEffect(() => {
        if (filters.idDepartement) {
            axios.get(`http://users.localhost/api/specialites/${filters.idDepartement}`)
                .then(res => setSpecialites(res.data))
                .catch(err => toast.error('Erreur lors de la récupération des spécialités: ' + err.message, { autoClose: 3000 }));
        }
    }, [filters.idDepartement]);

    useEffect(() => {
        if (filters.idSpecialite) {
            axios.get(`http://users.localhost/api/sections/${filters.idSpecialite}`)
                .then(res => setSections(res.data))
                .catch(err => toast.error('Erreur lors de la récupération des sections: ' + err.message, { autoClose: 3000 }));
        }
    }, [filters.idSpecialite]);

    const handleDelete = () => {
        if (!teacher.Matricule) {
            toast.error('Erreur : Matricule de l\'enseignant non défini', { autoClose: 3000 });
            return;
        }
        setShowDeleteModal(true); // Affiche le modal de confirmation
    };

    const confirmDelete = () => {
        const token = localStorage.getItem('token');
        axios.delete(`http://users.localhost/api/enseignants/${teacher.Matricule}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(() => {
                toast.success('Enseignant supprimé avec succès', { autoClose: 3000 });
                setShowDeleteModal(false);
                onBack(true);
            })
            .catch(err => {
                console.error('Erreur suppression:', err.response?.data || err.message);
                toast.error(`Erreur lors de la suppression de l'enseignant: ${err.response?.data?.error || err.message}`, { autoClose: 3000 });
                setShowDeleteModal(false);
            });
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleClick = (moduleId, moduleName) => {
        setSelectedModuleName(moduleName);
        axios.get(`http://users.localhost/api/enseignants/${teacher.Matricule}/modules/${moduleId}/sections`)
            .then(res => {
                setSelectedModuleSections(res.data || []);
                setShowModal(true);
            })
            .catch(err => {
                toast.error('Erreur lors de la récupération des sections du module: ' + err.message, { autoClose: 3000 });
            });
    };

    const handleUpdate = () => {
        const token = localStorage.getItem('token');
        axios.put(`http://users.localhost/api/enseignants/${teacher.Matricule}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(() => {
                toast.success('Enseignant mis à jour avec succès', { autoClose: 3000 });
                axios.get(`http://users.localhost/api/enseignants/${teacher.Matricule}`)
                    .then(res => {
                        setTeacherDetails(res.data.enseignant);
                        setModules(res.data.modules);
                        setFormData({
                            nom: res.data.enseignant.nom,
                            prenom: res.data.enseignant.prenom,
                            email: res.data.enseignant.email,
                            modules: res.data.modules.map(m => ({
                                ID_module: m.ID_module,
                                course_type: m.course_type,
                                group_number: m.group_number
                            })) || []
                        });
                        setEditMode(false);
                    })
                    .catch(err => toast.error('Erreur lors du rechargement des données: ' + err.message, { autoClose: 3000 }));
            })
            .catch(err => toast.error('Erreur lors de la mise à jour de l\'enseignant: ' + err.message, { autoClose: 3000 }));
    };

    return (
        <div className={styles['ADM-ENS-container']}>
            <div className={`${styles['ADM-ENS-section-card']} ${styles['ADM-ENS-teacher-section']}`}>
                <button
                    className={styles['ADM-ENS-back-btn']}
                    onClick={() => onBack()}
                >
                    Retour
                </button>
                <h2>Détails de l'enseignant</h2>
                {teacherDetails && (
                    <div>
                        {!editMode ? (
                            <>
                                <p><strong>Nom complet:</strong> {teacherDetails.prenom} {teacherDetails.nom}</p>
                                <p><strong>Email:</strong> {teacherDetails.email}</p>
                                <p><strong>Date d'inscription:</strong> {teacherDetails.annee_inscription}</p>
                                <h3>Modules enseignés</h3>
                                <ul>
                                    {modules.length > 0 ? (
                                        modules.map(m => (
                                            <li
                                                key={`${m.ID_module}-${m.course_type}-${m.group_number || 'none'}`}
                                                onClick={() => handleModuleClick(m.ID_module, m.nom_module)}
                                                className={styles['ADM-ENS-module-link']}
                                            >
                                                {m.nom_module} ({m.course_type}{m.group_number ? ` ${m.group_number}` : ''})
                                            </li>
                                        ))
                                    ) : (
                                        <li>Aucun module assigné</li>
                                    )}
                                </ul>
                                <div className={styles['ADM-ENS-button-group']}>
                                    <button
                                        className={styles['ADM-ENS-edit-btn']}
                                        onClick={() => setEditMode(true)}
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        className={styles['ADM-ENS-delete-btn']}
                                        onClick={handleDelete}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                    placeholder="Nom"
                                    className={styles['ADM-ENS-input']}
                                />
                                <input
                                    type="text"
                                    value={formData.prenom}
                                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                                    placeholder="Prénom"
                                    className={styles['ADM-ENS-input']}
                                />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Email"
                                    className={styles['ADM-ENS-input']}
                                />
                                <div className={styles['ADM-ENS-button-group']}>
                                    <button
                                        onClick={handleUpdate}
                                        className={styles['ADM-ENS-submit-btn']}
                                    >
                                        Mettre à jour
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className={styles['ADM-ENS-back-btn']}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {showModal && (
                    <div className={styles['ADM-ENS-modal']}>
                        <div className={styles['ADM-ENS-section-card']}>
                            <h3>{selectedModuleName}</h3>
                            {selectedModuleSections.length > 0 ? (
                                <div>
                                    {selectedModuleSections.map(section => (
                                        <div
                                            key={`${section.ID_section}-${section.course_type}-${section.group_number || 'none'}`}
                                            className={styles['ADM-ENS-section-item']}
                                        >
                                            <p><strong>Année:</strong> {section.niveau}</p>
                                            <p><strong>Section:</strong> {section.nom_section || 'Section sans nom'}</p>
                                            <p><strong>Type:</strong> {section.course_type}{section.group_number ? ` (Groupe ${section.group_number})` : ''}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Aucune section associée à ce module pour cet enseignant.</p>
                            )}
                            <div className={styles['ADM-ENS-button-group']}>
                                <button
                                    className={styles['ADM-ENS-submit-btn']}
                                    onClick={() => setShowModal(false)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showDeleteModal && (
                    <div className={styles['ADM-ENS-modal']}>
                        <div className={styles['ADM-ENS-section-card']}>
                            <h3>Confirmer la suppression</h3>
                            <p>Êtes-vous sûr de vouloir supprimer cet enseignant ({teacherDetails?.prenom} {teacherDetails?.nom}) ?</p>
                            <div className={styles['ADM-ENS-button-group']}>
                                <button
                                    className={styles['ADM-ENS-delete-btn']}
                                    onClick={confirmDelete}
                                >
                                    Supprimer
                                </button>
                                <button
                                    className={styles['ADM-ENS-back-btn']}
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <ToastContainer className={styles['ADM-ENS-Toastify__toast']} />
            </div>
        </div>
    );
};

export default TeacherSection;