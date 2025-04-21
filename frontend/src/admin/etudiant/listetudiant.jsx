import React, { useState } from 'react';
import FilterPanel from './FilterPanel.jsx';
import StudentSection from './StudentSection.jsx';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaUsers, FaPlus, FaSignOutAlt, FaList } from 'react-icons/fa';
import Swal from 'sweetalert2';
import styles from './listetudiant.module.css';

const listetudiant = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [nombreGroupes, setNombreGroupes] = useState('');
  const [nomSection, setNomSection] = useState('');
  const navigate = useNavigate();

  const iconColor = '#021A3F';

  const handleFilter = (filteredSections, filters) => {
    setCurrentFilters(filters);
    if (filteredSections.message) {
      setSections([]);
      setSelectedSection(null);
      toast.warning(filteredSections.message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FFD93D', color: '#fff', fontSize: '16px' },
        icon: '⚠️',
        className: styles['ADM-ETD-custom-toast-warning']
      });
    } else if (Array.isArray(filteredSections) && filteredSections.length > 0) {
      setSections(filteredSections);
      setSelectedSection(null);
      toast.success('Filtrage effectué avec succès ! Liste des sections mise à jour.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
        icon: '✅',
        className: styles['ADM-ETD-custom-toast-success']
      });
    } else {
      setSections([]);
      setSelectedSection(null);
      toast.error('Aucune section trouvée ou erreur lors du filtrage. Veuillez réessayer.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
    }
  };

  const handleAddSection = () => {
    const idSpecialite = parseInt(currentFilters.idSpecialite);
    const niveau = currentFilters.niveau;

    if (!idSpecialite || isNaN(idSpecialite) || idSpecialite <= 0 || !niveau) {
      toast.error('Aucune spécialité ou niveau sélectionné. Veuillez appliquer un filtre valide.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    const nombreGroupesInt = parseInt(nombreGroupes, 10);
    if (!nombreGroupes || isNaN(nombreGroupesInt) || nombreGroupesInt < 1) {
      toast.error('Le nombre de groupes doit être un nombre supérieur ou égal à 1.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    if (!nomSection) {
      toast.error('Veuillez donner un nom à la section.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    Swal.fire({
      title: 'Confirmer l’ajout ?',
      text: `Voulez-vous ajouter la section "${nomSection}" pour la spécialité au niveau ${niveau} avec ${nombreGroupesInt} groupe(s) ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#5483b3',
      cancelButtonColor: '#052659',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#052659',
      customClass: {
        confirmButton: styles['ADM-ETD-swal-confirm-btn'],
        cancelButton: styles['ADM-ETD-swal-cancel-btn'],
      },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch('http://users.localhost/listeETD/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idSpecialite, niveau, nombreGroupes: nombreGroupesInt, nom_section: nomSection }),
        })
          .then(res => {
            if (!res.ok) {
              return res.json().then(err => {
                throw new Error(err.error || 'Échec de la requête');
              });
            }
            return res.json();
          })
          .then(data => {
            toast.success(data.message || 'Section ajoutée avec succès !', {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
              icon: '✅',
              className: styles['ADM-ETD-custom-toast-success']
            });
            setSections(prevSections => [
              ...prevSections,
              { ID_section: data.idSection, nom_specialite: data.nom_specialite, niveau: data.niveau, nom_section: nomSection, nombreGroupes: nombreGroupesInt }
            ]);
            setSelectedSection(null);
            setNombreGroupes('');
            setNomSection('');
          })
          .catch(err => {
            toast.error(`Erreur : ${err.message}`, {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
              icon: '❌',
              className: styles['ADM-ETD-custom-toast-error']
            });
          });
      }
    });
  };

  const handleDeleteSection = (idSection, nomSection) => {
    Swal.fire({
      title: 'Confirmer la suppression ?',
      text: `Êtes-vous sûr de vouloir supprimer la section "${nomSection}" ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#5483b3',
      cancelButtonColor: '#052659',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#052659',
      customClass: {
        confirmButton: styles['ADM-ETD-swal-confirm-btn'],
        cancelButton: styles['ADM-ETD-swal-cancel-btn'],
      },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://users.localhost/listeETD/sections/${idSection}`, {
          method: 'DELETE',
        })
          .then(res => {
            if (!res.ok) {
              return res.json().then(err => {
                throw new Error(err.error || 'Échec de la suppression');
              });
            }
            return res.json();
          })
          .then(data => {
            toast.success(data.message, {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
              icon: '✅',
              className: styles['ADM-ETD-custom-toast-success']
            });
            setSections(sections.filter(s => s.ID_section !== idSection));
            if (selectedSection === idSection) setSelectedSection(null);
          })
          .catch(err => {
            toast.error(`Erreur : ${err.message}`, {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
              icon: '❌',
              className: styles['ADM-ETD-custom-toast-error']
            });
          });
      }
    });
  };

  const handleAddSectionRedirect = () => {
    setSelectedSection(null);
    setTimeout(() => {
      const addSectionForm = document.getElementById('add-section-form');
      if (addSectionForm) {
        addSectionForm.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <div className={styles['ADM-ETD-container']}>
      <div className={styles['ADM-ETD-background-shapes']}>
        <div className={`${styles['ADM-ETD-shape']} ${styles['ADM-ETD-shape1']}`}></div>
        <div className={`${styles['ADM-ETD-shape']} ${styles['ADM-ETD-shape2']}`}></div>
      </div>

      <div className={styles['ADM-ETD-sidebar']}>
        <div className={styles['ADM-ETD-logo']}>
          <h2>Gestion des etudiants</h2>
        </div>
        
        <button className={styles['ADM-ETD-sidebar-button']} onClick={() => navigate('/admin')}>
          <FaHome className={styles['ADM-ETD-sidebar-icon']} /> Retour á l'accueil
        </button>
        <button className={styles['ADM-ETD-sidebar-button']} onClick={() => setSelectedSection(null)}>
          <FaUsers className={styles['ADM-ETD-sidebar-icon']} /> Liste des Sections
        </button>
        <button className={styles['ADM-ETD-sidebar-button']} onClick={handleAddSectionRedirect}>
          <FaPlus className={styles['ADM-ETD-sidebar-icon']} /> Ajouter Section
        </button>
        
      </div>

      <div className={styles['ADM-ETD-main-content']}>
        <div className={styles['ADM-ETD-main-header']}>
          <h1>Liste des Étudiants</h1>
          <p>Gérez les sections et les étudiants de votre établissement</p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedSection ? (
            <motion.div
              key="sections-list"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <FilterPanel onFilter={handleFilter} />
              <div className={styles['ADM-ETD-sections-list']}>
                <h3>Sections filtrées : <FaList style={{ color: iconColor, fill: iconColor, verticalAlign: 'middle' }} /></h3>
                {sections.length === 0 ? (
                  <p className={styles['ADM-ETD-no-sections']}>
                    Aucune section trouvée. Vous pouvez ajouter une nouvelle section ci-dessous.
                  </p>
                ) : (
                  sections.map((s, index) => (
                    <motion.div
                      key={s.ID_section}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={styles['ADM-ETD-section-item']}
                      onClick={() => setSelectedSection(s.ID_section)}
                    >
                      <span>
                        {s.nom_section} - {s.nom_specialite} (Niveau: {s.niveau || 'Non défini'})
                      </span>
                      <button
                        className={styles['ADM-ETD-delete-section-btn']}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(s.ID_section, s.nom_section);
                        }}
                      >
                        Supprimer
                      </button>
                    </motion.div>
                  ))
                )}
                <div id="add-section-form" style={{ marginTop: '20px' }}>
                  <h4>Ajouter une nouvelle section</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nom de la section"
                      value={nomSection}
                      onChange={(e) => setNomSection(e.target.value)}
                      className={styles['ADM-ETD-input']}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Nombre de groupes"
                      value={nombreGroupes}
                      onChange={(e) => setNombreGroupes(e.target.value)}
                      className={styles['ADM-ETD-input']}
                    />
                    <button type="button" onClick={handleAddSection} className={styles['ADM-ETD-edit-btn']}>
                      <FaPlus /> Ajouter Section
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="student-section"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <StudentSection
                sectionId={selectedSection}
                onBack={() => setSelectedSection(null)}
                niveau={currentFilters.niveau}
                idSpecialite={currentFilters.idSpecialite}
                nombreGroupes={sections.find(s => s.ID_section === selectedSection)?.nombreGroupes || 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={true}
        className={styles['ADM-ETD-custom-toast']}
      />
    </div>
  );
};

export default listetudiant;