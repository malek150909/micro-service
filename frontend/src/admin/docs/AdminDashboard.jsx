import React,{ useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaBook, FaPen, FaFileUpload, FaDownload, FaHome, FaUser } from 'react-icons/fa';
import { MdDescription } from 'react-icons/md';
import styles from './doc.module.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        file: null
    });
    const [selectedFileName, setSelectedFileName] = useState('Aucun fichier sélectionné');
    const [selectedFaculte, setSelectedFaculte] = useState('');
    const [error, setError] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editModalClosing, setEditModalClosing] = useState(false);
    const [editModalActive, setEditModalActive] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteModalClosing, setDeleteModalClosing] = useState(false);
    const [deleteModalActive, setDeleteModalActive] = useState(false);
    const [errorModalClosing, setErrorModalClosing] = useState(false);
    const [errorModalActive, setErrorModalActive] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [loadingFaculties, setLoadingFaculties] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const formRef = useRef(null);

    // Récupération des données utilisateur depuis localStorage au montage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate('/');
        } else {
            setUser(storedUser);
            fetchFaculties(storedUser);
        }
    }, [navigate]);

    useEffect(() => {
        if (selectedFaculte && user) {
            fetchDocuments();
        }
    }, [selectedFaculte, user]);

    useEffect(() => {
        if (editModalOpen && !editModalClosing) {
            const timer = setTimeout(() => {
                setEditModalActive(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setEditModalActive(false);
        }
    }, [editModalOpen, editModalClosing]);

    useEffect(() => {
        if (deleteModalOpen && !deleteModalClosing) {
            const timer = setTimeout(() => {
                setDeleteModalActive(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setDeleteModalActive(false);
        }
    }, [deleteModalOpen, deleteModalClosing]);

    useEffect(() => {
        if (error && !errorModalClosing) {
            const timer = setTimeout(() => {
                setErrorModalActive(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setErrorModalActive(false);
        }
    }, [error, errorModalClosing]);

    const fetchFaculties = async (storedUser) => {
        try {
            setLoadingFaculties(true);
            console.log('Fetching faculties...');
            const response = await axios.get('http://courses.localhost/documents/faculties', {
                headers: { matricule: storedUser.Matricule }
            });
            console.log('Faculties fetched:', response.data);
            setFaculties(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Échec de la récupération des facultés';
            setError(errorMessage);
            console.error('Erreur lors de la récupération des facultés:', err, 'Error message:', errorMessage);
        } finally {
            setLoadingFaculties(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            console.log('Fetching documents for faculte:', selectedFaculte);
            const response = await axios.get(`http://courses.localhost/documents/faculte/${selectedFaculte}`, {
                headers: { matricule: user.Matricule }
            });
            console.log('Documents fetched:', response.data);
            setDocuments(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Échec de la récupération des documents';
            setError(errorMessage);
            console.error('Erreur lors de la récupération des documents:', err, 'Error message:', errorMessage);
            setDocuments([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData, 'Selected faculte:', selectedFaculte);
        try {
            setError('');
            if (!formData.titre || !formData.file || !selectedFaculte) {
                setError('Faculté, titre et fichier sont requis');
                console.log('Validation failed:', { titre: formData.titre, file: formData.file, selectedFaculte });
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('ID_faculte', selectedFaculte);
            formDataToSend.append('titre', formData.titre);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('file', formData.file);

            console.log('Sending request to create document...');
            const response = await axios.post('http://courses.localhost/documents', formDataToSend, {
                headers: {
                    matricule: user.Matricule,
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Document created:', response.data);

            console.log('Fetching updated documents...');
            await fetchDocuments();
            console.log('Resetting form...');
            setFormData({ titre: '', description: '', file: null });
            setSelectedFileName('Aucun fichier sélectionné');
            formRef.current.reset();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Échec de la création du document';
            setError(errorMessage);
            console.error('Erreur lors de la création du document:', err, 'Error message:', errorMessage);
        }
    };

    const handleEdit = (doc) => {
        setEditDocument(doc);
        setFormData({
            titre: doc.titre,
            description: doc.description || '',
            file: null
        });
        setSelectedFileName('Aucun fichier sélectionné');
        setEditModalOpen(true);
        setEditModalClosing(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setError('');
            if (!formData.titre) {
                setError('Le titre est requis');
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('ID_faculte', selectedFaculte);
            formDataToSend.append('titre', formData.titre);
            formDataToSend.append('description', formData.description);
            if (formData.file) {
                formDataToSend.append('file', formData.file);
            } else {
                formDataToSend.append('fichier_url', editDocument.fichier_url);
            }

            await axios.put(`http://courses.localhost/documents/${editDocument.ID_document}`, formDataToSend, {
                headers: {
                    matricule: user.Matricule,
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchDocuments();
            closeEditModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Échec de la mise à jour du document');
            console.error('Erreur lors de la mise à jour du document:', err);
        }
    };

    const handleDeleteClick = (doc) => {
        setDocumentToDelete(doc);
        setDeleteModalOpen(true);
        setDeleteModalClosing(false);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
    
        try {
            setError('');
            console.log('Deleting document with ID:', documentToDelete.ID_document);
            const response = await axios.delete(`http://courses.localhost/documents/${documentToDelete.ID_document}`, {
                headers: { matricule: user.Matricule }
            });
            console.log('Delete response:', response.data);
            fetchDocuments();
            closeDeleteModal();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Échec de la suppression du document';
            setError(errorMessage);
            console.error('Erreur lors de la suppression du document:', err.response?.data || err.message);
        }
    };

    const closeEditModal = () => {
        setEditModalClosing(true);
        setTimeout(() => {
            setEditModalOpen(false);
            setEditModalClosing(false);
            setFormData({ titre: '', description: '', file: null });
            setSelectedFileName('Aucun fichier sélectionné');
        }, 400);
    };

    const closeDeleteModal = () => {
        setDeleteModalClosing(true);
        setTimeout(() => {
            setDeleteModalOpen(false);
            setDeleteModalClosing(false);
            setDocumentToDelete(null);
        }, 400);
    };

    const closeErrorModal = () => {
        setErrorModalClosing(true);
        setTimeout(() => {
            setError('');
            setErrorModalClosing(false);
        }, 400);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, file });
        setSelectedFileName(file ? file.name : 'Aucun fichier sélectionné');
    };

    const handleLogout = () => {
        navigate('/admin');
    };

    return (
        <div className={styles['ADM-DOC-container']}>
            <div className={styles['ADM-DOC-background-shapes']}>
                <div className={styles['ADM-DOC-shape ADM-DOC-shape1']}></div>
                <div className={styles['ADM-DOC-shape ADM-DOC-shape2']}></div>
            </div>

            <div className={styles['ADM-DOC-sidebar']}>
                <div className={styles['ADM-DOC-logo']}>
                    <h2>Documents Administratifs</h2>
                </div>
                <button className={styles['ADM-DOC-sidebar-button']} onClick={handleLogout}>
                    <FaHome /> Retour à l’accueil
                </button>
            </div>

            <div className={styles['ADM-DOC-main-content']}>
                <div className={styles['ADM-DOC-header']}>
                    <h1>Gestion des documents administratifs</h1>
                    <p>Gérer les documents des facultés</p>
                </div>

                <div className={styles['ADM-DOC-content-grid']}>
                    <div className={styles['ADM-DOC-chart-container']}>
                        <div className={styles['ADM-DOC-chart-title']}>
                            <FaPlus /> Ajouter un Nouveau Document
                        </div>
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>Faculté</label>
                                {loadingFaculties ? (
                                    <p>Chargement des facultés...</p>
                                ) : faculties.length === 0 ? (
                                    <p>Aucune faculté disponible</p>
                                ) : (
                                    <select 
                                        value={selectedFaculte} 
                                        onChange={(e) => setSelectedFaculte(Number(e.target.value))}
                                        required
                                    >
                                        <option value="">Sélectionner une faculté</option>
                                        {faculties.map(faculty => (
                                            <option key={faculty.ID_faculte} value={faculty.ID_faculte}>
                                                {faculty.nom_faculte}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <FaPen className={styles['ADM-DOC-input-icon']} /> Titre
                                </label>
                                <input
                                    type="text"
                                    placeholder="Titre du document"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                                    required
                                    className={styles['ADM-DOC-input']}
                                />
                            </div>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <MdDescription className={styles['ADM-DOC-input-icon']} /> Description
                                </label>
                                <textarea
                                    placeholder="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className={styles['ADM-DOC-textarea']}
                                />
                            </div>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <FaFileUpload className={styles['ADM-DOC-input-icon']} /> Télécharger PDF
                                </label>
                                <div className={styles['ADM-DOC-custom-file-input']}>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <label htmlFor="file-upload" className={styles['ADM-DOC-custom-file-label']}>
                                        Choisir
                                    </label>
                                    <span className={styles['ADM-DOC-file-name']}>{selectedFileName}</span>
                                </div>
                            </div>
                            <button type="submit" className={styles['ADM-DOC-button']}>
                                <FaPlus /> Ajouter Document
                            </button>
                        </form>
                    </div>

                    <div className={styles['ADM-DOC-document-list']}>
                        <h3>
                            <FaBook /> Documents
                        </h3>
                        {!selectedFaculte ? (
                            <div className={styles['ADM-DOC-no-results']}>Sélectionnez une faculté pour afficher les documents.</div>
                        ) : documents === null || documents === undefined ? (
                            <div className={styles['ADM-DOC-no-results']}>Erreur lors du chargement des documents.</div>
                        ) : documents.length === 0 ? (
                            <div className={styles['ADM-DOC-no-results']}>Aucun document trouvé pour cette faculté.</div>
                        ) : (
                            <ul>
                                {documents.map(doc => (
                                    <li key={doc.ID_document} className={styles['ADM-DOC-document-item']}>
                                        <div className={styles['ADM-DOC-document-info']}>
                                            <h3>
                                                <FaBook /> {doc.titre}
                                            </h3>
                                            <p>{doc.description || 'Aucune description'}</p>
                                            <p> {new Date(doc.date_upload).toLocaleDateString('fr-FR')}</p> <br />
                                            <a href={`http://courses.localhost/${doc.fichier_url}`} download target="_blank" rel="noopener noreferrer">
                                                <FaDownload /> Télécharger
                                            </a>
                                        </div>
                                        <div className={styles['ADM-DOC-document-actions']}>
                                            <button className={styles['ADM-DOC-edit-button']} onClick={() => handleEdit(doc)}>
                                                <FaEdit /> Modifier
                                            </button>
                                            <button className={styles['ADM-DOC-delete-button']} onClick={() => handleDeleteClick(doc)}>
                                                <FaTrash /> Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {(editModalOpen || editModalClosing) && (
                <div className={`${styles['ADM-DOC-modal-overlay']} ${editModalActive && !editModalClosing ? styles['ADM-DOC-active'] : ''}`}>
                    <div className={styles['ADM-DOC-modal-content']}>
                        <h3>
                            <FaEdit /> Modifier Document
                        </h3>
                        <form onSubmit={handleUpdate}>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <FaPen className={styles['ADM-DOC-input-icon']} /> Titre
                                </label>
                                <input
                                    type="text"
                                    placeholder="Titre du document"
                                    value={formData.titre}
                                    onChange={(e) => setFormData({...formData, titre: e.target.value})}
                                    required
                                    className={styles['ADM-DOC-input']}
                                />
                            </div>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <MdDescription className={styles['ADM-DOC-input-icon']} /> Description
                                </label>
                                <textarea
                                    placeholder="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className={styles['ADM-DOC-textarea']}
                                />
                            </div>
                            <div className={styles['ADM-DOC-input-group']}>
                                <label>
                                    <FaFileUpload className={styles['ADM-DOC-input-icon']} /> Télécharger un Nouveau PDF (facultatif)
                                </label>
                                <div className={styles['ADM-DOC-custom-file-input']}>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        id="file-upload-edit"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="file-upload-edit" className={styles['ADM-DOC-custom-file-label']}>
                                        Choisir
                                    </label>
                                    <span className={styles['ADM-DOC-file-name']}>{selectedFileName}</span>
                                </div>
                            </div>
                            <div className={styles['ADM-DOC-button-group']}>
                                <button type="submit" className={styles['ADM-DOC-button']}>
                                    <FaEdit /> Mettre à Jour Document
                                </button>
                                <button type="button" className={styles['ADM-DOC-close-button']} onClick={closeEditModal}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(deleteModalOpen || deleteModalClosing) && (
                <div className={`${styles['ADM-DOC-modal-overlay']} ${deleteModalActive && !deleteModalClosing ? styles['ADM-DOC-active'] : ''}`}>
                    <div className={`${styles['ADM-DOC-modal-content']} ${styles['ADM-DOC-delete-modal']}`}>
                        <h3>
                            <FaExclamationTriangle /> Confirmer la Suppression
                        </h3>
                        <p>Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.titre}" ? Cette action est irréversible.</p>
                        <div className={styles['ADM-DOC-button-group']}>
                            <button className={styles['ADM-DOC-delete-button']} onClick={confirmDelete}>
                                <FaTrash /> Confirmer
                            </button>
                            <button className={styles['ADM-DOC-close-button']} onClick={closeDeleteModal}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(error || errorModalClosing) && (
                <div className={`${styles['ADM-DOC-modal-overlay']} ${errorModalActive && !errorModalClosing ? styles['ADM-DOC-active'] : ''}`}>
                    <div className={`${styles['ADM-DOC-modal-content']} ${styles['ADM-DOC-error-modal']}`}>
                        <h3>
                            <FaExclamationTriangle /> Erreur
                        </h3>
                        <p>{error}</p>
                        <button className={styles['ADM-DOC-close-button']} onClick={closeErrorModal}>
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;