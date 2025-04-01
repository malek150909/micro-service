import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaList, FaDownload, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import "./listetudiant.css";

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
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
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
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
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
        style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
        icon: '✅',
      });
    } catch (err) {
      toast.error('Erreur lors du téléchargement du PDF.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  const handleLogout = () => {
    toast.success('Déconnexion réussie !', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
      icon: '✅',
    });
    navigate('/');
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
        style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
        icon: '✅',
      });
    } catch (err) {
      toast.error('Erreur lors de la suppression du message.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  return (
    <>
    <div id="ENSlistetuidants">
      <div className="sidebar" style={{ backgroundColor: '#003087', borderRight: 'none', padding: '20px' }}>
        <div className="logo" style={{ borderBottom: 'none' }}>
          <h1 style={{ color: '#ffffff', fontSize: '25px', fontWeight: 'normal', margin: 0, textDecoration: 'none' }}>
            <FaList /> Liste de mes etudiants
          </h1>
        </div>
        <button
          className="sidebar-button"
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            marginTop: '20px',
          }}
        >
          <FaSignOutAlt className="sidebar-icon" style={{ marginRight: '5px', color: '#ffffff' }} /> Déconnexion
        </button>
      </div>

      <div className="main-content">
        <div className="main-header" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ color: '#003087', fontSize: '36px', fontWeight: 'bold', margin: 0, fontFamily: 'Arial, sans-serif' }}>
            <FaUsers /> Consultation des Étudiants
          </h1>
          <p style={{ color: '#003087', fontSize: '16px', marginTop: '5px', fontStyle: 'italic' }}>
            Accédez aux listes des étudiants de vos sections
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="student-section"
        >
          <h2>
            Mes sections <FaList style={{ color: iconColor, fill: iconColor, verticalAlign: 'middle' }} />
          </h2>

          {sections.length === 0 ? (
            <p className="no-sections">Aucune section trouvée.</p>
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
                    style={{
                      padding: '12px 40px 12px 20px',
                      borderRadius: '25px',
                      border: '2px solid #003087',
                      backgroundColor: '#ffffff',
                      fontSize: '16px',
                      color: '#333333',
                      width: '100%',
                      cursor: 'pointer',
                      appearance: 'none',
                      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.target.style.borderColor = '#0056d2')}
                    onMouseLeave={(e) => (e.target.style.borderColor = '#003087')}
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
                <p className="no-sections">Aucun étudiant trouvé pour cette section.</p>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="section-item"
                >
                  {updateNotification && (
                    <div
                      style={{
                        backgroundColor: '#50C878',
                        color: '#ffffff',
                        padding: '10px',
                        borderRadius: '5px',
                        textAlign: 'center',
                        marginBottom: '20px',
                        fontSize: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{updateNotification.contenu}</span>
                      <button
                        onClick={handleCloseMessage}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '16px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <h3>
                    {sections.find((s) => s.ID_section === selectedSection)?.niveau} -{' '}
                    {sections.find((s) => s.ID_section === selectedSection)?.nom_specialite} (
                    {sections.find((s) => s.ID_section === selectedSection)?.Nom_departement},{' '}
                    {sections.find((s) => s.ID_section === selectedSection)?.nom_faculte})
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e6e6e6' }}>
                        <th style={{ padding: '10px', border: '1px solid #d3d3d3' }}>Matricule</th>
                        <th style={{ padding: '10px', border: '1px solid #d3d3d3' }}>Nom</th>
                        <th style={{ padding: '10px', border: '1px solid #d3d3d3' }}>Prénom</th>
                        <th style={{ padding: '10px', border: '1px solid #d3d3d3' }}>État</th>
                        <th style={{ padding: '10px', border: '1px solid #d3d3d3' }}>Groupe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.Matricule}>
                          <td style={{ padding: '10px', border: '1px solid #d3d3d3' }}>{student.Matricule}</td>
                          <td style={{ padding: '10px', border: '1px solid #d3d3d3' }}>{student.nom}</td>
                          <td style={{ padding: '10px', border: '1px solid #d3d3d3' }}>{student.prenom}</td>
                          <td style={{ padding: '10px', border: '1px solid #d3d3d3' }}>{student.etat || 'Non défini'}</td>
                          <td style={{ padding: '10px', border: '1px solid #d3d3d3' }}>
                            {student.num_groupe ? `Groupe ${student.num_groupe}` : 'Non assigné'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className="edit-btn"
                    onClick={handleDownloadPDF}
                    style={{
                      marginTop: '20px',
                      padding: '10px 20px',
                      backgroundColor: '#003087',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <FaDownload style={{ color: '#ffffff', fill: '#ffffff' }} /> Télécharger en PDF
                  </button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
      </div>
    </>
  );
};

export default TeacherDashboard;