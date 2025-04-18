import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaList, FaDownload, FaHome, FaUsers } from 'react-icons/fa';
import styles from './listetudiant.module.css'; // Updated import

const TeacherDashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [updateNotification, setUpdateNotification] = useState(null);
  const iconColor = '#021A3F';

  // Charger les sections au montage du composant
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await axios.get(`http://localhost:8081/ENSlisteETD/${matricule}/sections`);
        setSections(res.data);
        if (res.data.length > 0) {
          setSelectedSection(res.data[0].ID_section);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Erreur lors de la récupération des sections.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          className: styles['ENS-ETD-custom-toast-error'],
          icon: '❌',
        });
      }
    };

    fetchSections();
  }, [matricule]);

  // Charger les étudiants et vérifier les notifications lorsque la section sélectionnée change
  useEffect(() => {
    if (!selectedSection) return;

    const fetchStudentsAndNotifications = async () => {
      try {
        // Charger les étudiants
        const studentsRes = await axios.get(`http://localhost:8081/ENSlisteETD/${matricule}/section/${selectedSection}/students`);
        setStudents(studentsRes.data);

        // Vérifier les notifications pour cette section
        const notificationsRes = await axios.get(`http://localhost:8081/ENSlisteETD/${matricule}/section/${selectedSection}/notifications`);
        console.log('Notifications récupérées:', notificationsRes.data);
        const notifications = notificationsRes.data;

        if (notifications.length > 0) {
          setUpdateNotification(notifications[0]);
        } else {
          setUpdateNotification(null);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Erreur lors de la récupération des données.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          className: styles['ENS-ETD-custom-toast-error'],
          icon: '❌',
        });
      }
    };

    fetchStudentsAndNotifications();
  }, [selectedSection, matricule]);

  const handleDownloadPDF = async () => {
    if (!selectedSection) return;

    try {
      const res = await axios.get(`http://localhost:8081/ENSlisteETD/${matricule}/section/${selectedSection}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `liste_etudiants_section_${selectedSection}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('PDF téléchargé avec succès !', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        className: styles['ENS-ETD-custom-toast-success'],
        icon: '✅',
      });
    } catch (err) {
      toast.error('Erreur lors du téléchargement du PDF.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        className: styles['ENS-ETD-custom-toast-error'],
        icon: '❌',
      });
    }
  };

  const handleLogout = () => {
    navigate('/enseignant');
  };

  const handleCloseMessage = async () => {
    if (!updateNotification) return;

    try {
      await axios.delete(`http://localhost:8081/ENSlisteETD/notifications/${updateNotification.ID_notification}`);
      setUpdateNotification(null);
      toast.success('Message de mise à jour supprimé.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        className: styles['ENS-ETD-custom-toast-success'],
        icon: '✅',
      });
    } catch (err) {
      toast.error('Erreur lors de la suppression du message.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        className: styles['ENS-ETD-custom-toast-error'],
        icon: '❌',
      });
    }
  };

  return (
    <div >
      <div className={styles['ENS-ETD-sidebar']}>
        <div className={styles['ENS-ETD-logo']}>
          <h1 className={styles['ENS-ETD-h1']}>
             Liste des etudiants
          </h1>
        </div>
        <button
          className={`${styles['ENS-ETD-sidebar-button']} `}
          onClick={handleLogout}
        >
          <FaHome className={styles['ENS-ETD-sidebar-icon']} /> Retour a l'accueil
        </button>
      </div>

      <div className={styles['ENS-ETD-main-content']}>
        <div className={styles['ENS-ETD-main-header']}>
          <h1 className={styles['ENS-ETD-h1']}>
            <FaUsers /> Consultation des Étudiants
          </h1>
          <p>Accédez aux listes des étudiants de vos sections</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={styles['ENS-ETD-student-section']}
        >
          <h2 className={styles['ENS-ETD-h2']}>
            Mes sections <FaList style={{ color: iconColor, fill: iconColor, verticalAlign: 'middle' }} />
          </h2>

          {sections.length === 0 ? (
            <p className={styles['ENS-ETD-no-sections']}>Aucune section trouvée.</p>
          ) : (
            <>
              <div style={{ marginBottom: '30px', textAlign: 'center', position: 'relative' }}>
                <label
                  htmlFor="section-select"
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#003087',
                    marginBottom: '10px',
                    display: 'block',
                  }}
                >
                  Choisir une section :
                </label>
                <div style={{ position: 'relative', display: 'inline-block', width: '60%', maxWidth: '600px' }}>
                  <select
                    id="section-select"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className={styles['ENS-ETD-input']}
                  >
                    {sections.map((section) => (
                      <option key={section.ID_section} value={section.ID_section}>
                        {section.niveau} - {section.nom_specialite} ({section.Nom_departement}, {section.nom_faculte})
                      </option>
                    ))}
                  </select>
                  <FaList
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#003087',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              {students.length === 0 ? (
                <p className={styles['ENS-ETD-no-sections']}>Aucun étudiant trouvé pour cette section.</p>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={styles['ENS-ETD-section-item']}
                >
                  {updateNotification && (
                    <div className={styles['ENS-ETD-notification']}>
                      <span>{updateNotification.contenu}</span>
                      <button
                        onClick={handleCloseMessage}
                        className={styles['ENS-ETD-button']}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <h3 className={styles['ENS-ETD-h3']}>
                    {sections.find((s) => s.ID_section === selectedSection)?.niveau} -{' '}
                    {sections.find((s) => s.ID_section === selectedSection)?.nom_specialite} (
                    {sections.find((s) => s.ID_section === selectedSection)?.Nom_departement},{' '}
                    {sections.find((s) => s.ID_section === selectedSection)?.nom_faculte})
                  </h3>
                  <table className={styles['ENS-ETD-table']}>
                    <thead>
                      <tr>
                        <th>Matricule</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>État</th>
                        <th>Groupe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.Matricule}>
                          <td>{student.Matricule}</td>
                          <td>{student.nom}</td>
                          <td>{student.prenom}</td>
                          <td>{student.etat || 'Non défini'}</td>
                          <td>
                            {student.num_groupe ? `Groupe ${student.num_groupe}` : 'Non assigné'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className={`${styles['ENS-ETD-edit-btn']} ${styles['ENS-ETD-button']}`}
                    onClick={handleDownloadPDF}
                  >
                    <FaDownload /> Télécharger en PDF
                  </button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;