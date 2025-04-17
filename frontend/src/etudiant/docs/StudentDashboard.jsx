import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaBook, FaDownload, FaExclamationTriangle, FaHome, FaUser } from 'react-icons/fa';
import styles from "./doc.module.css";

function StudentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null); // État local pour stocker l'utilisateur
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState('');

    // Récupération des données utilisateur depuis localStorage au montage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate('/');
        } else {
            setUser(storedUser);
            console.log('User object from localStorage:', storedUser);
            // Appeler la nouvelle route pour récupérer ID_faculte
            fetchStudentFaculty(storedUser);
        }
    }, [navigate]);

    const fetchStudentFaculty = async (storedUser) => {
        try {
            console.log('Fetching faculty for student:', storedUser.Matricule);
            const response = await axios.get('http://localhost:8083/documents/student/faculty', {
                headers: { matricule: storedUser.Matricule }
            });
            console.log('Response from /documents/student/faculty:', response.data);
            const { ID_faculte } = response.data;
            if (ID_faculte) {
                fetchDocuments(ID_faculte);
            } else {
                setError('Faculté non trouvée pour cet utilisateur.');
            }
        } catch (err) {
            setError('Échec de la récupération de la faculté de l’étudiant');
            console.error('Erreur lors de la récupération de la faculté:', err.response?.data || err.message);
        }
    };

    // Fonction pour récupérer les documents
    const fetchDocuments = async (ID_faculte, matricule) => {
        try {
            console.log('Fetching documents for faculte:', ID_faculte);
            const response = await axios.get(`http://localhost:8083/documents/faculte/${ID_faculte}`, {
                headers: { matricule }
            });
            console.log('Documents fetched:', response.data);
            if (response.data.length === 0) {
                setError('Aucun document trouvé pour cette faculté.');
            }
            setDocuments(response.data);
        } catch (err) {
            setError('Échec de la récupération des documents');
            console.error('Erreur lors de la récupération des documents:', err.response?.data || err.message);
        }
    };

    // Fonction de déconnexion
    const handleBack = () => {
        navigate('/etudiant'); // Redirection vers la page racine
    };

    return (
            <div className={`${styles['ETD-DOC-container']} ${styles['ETD-DOC-student-dashboard']}`}>
                <div className={styles['ETD-DOC-background-shapes']}>
                    <div className={`${styles['ETD-DOC-shape']} ${styles['ETD-DOC-shape1']}`}></div>
                    <div className={`${styles['ETD-DOC-shape']} ${styles['ETD-DOC-shape2']}`}></div>
                </div>

                <div className={styles['ETD-DOC-sidebar']}>
                    <div className={styles['ETD-DOC-logo']}>
                        <h2>Documents Administatifs</h2>
                    </div>
                    <button className={styles['ETD-DOC-sidebar-button']} onClick={handleBack}>
                        <FaHome /> Retour à l’accueil
                    </button>
                </div>

                <div className={styles['ETD-DOC-main-content']}>
                    <div className={styles['ETD-DOC-header']}>
                        <h1>Documents Étudiant</h1>
                        <p>Voir et télécharger les documents de votre faculté</p>
                    </div>

                    <div className={styles['ETD-DOC-document-list']}>
                        <h3>
                            <FaBook /> Documents
                        </h3>
                        {error && (
                            <div className={`${styles['ETD-DOC-modal-overlay']} ${styles['ETD-DOC-active']}`}>
                                <div className={`${styles['ETD-DOC-modal-content']} ${styles['ETD-DOC-error-modal']}`}>
                                    <h3>
                                        <FaExclamationTriangle className={styles['ETD-DOC-icon']} /> Erreur
                                    </h3>
                                    <p>{error}</p>
                                    <button className={styles['ETD-DOC-close-button']} onClick={() => setError('')}>
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        )}
                        {documents.length === 0 ? (
                            <div className={styles['ETD-DOC-no-results']}>Aucun document trouvé pour votre faculté.</div>
                        ) : (
                            <ul>
                                {documents.map(doc => (
                                    <li key={doc.ID_document} className={styles['ETD-DOC-document-item']}>
                                        <div className={styles['ETD-DOC-document-info']}>
                                            <h3>
                                                <FaBook className={styles['ETD-DOC-icon']} /> {doc.titre}
                                            </h3>
                                            <p>{doc.description || 'Aucune description'}</p>
                                            <br />
                                            <a href={`http://localhost:8083${doc.fichier_url}`} download target="_blank" rel="noopener noreferrer">
                                                <FaDownload className={styles['ETD-DOC-icon']} /> Télécharger
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
    );
}

export default StudentDashboard;