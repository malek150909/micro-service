import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from './FilterPanel';
import StudentSection from './StudentSection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaList, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../../admin_css_files/listetudiant.css';

const listetudiant = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});

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
        style: { backgroundColor: '#ff9800', color: '#ffffff', fontSize: '16px' },
        icon: '⚠️',
      });
    } else if (Array.isArray(filteredSections) && filteredSections.length > 0) {
      setSections(filteredSections);
      setSelectedSection(null); // Ne pas rediriger vers une section, rester sur la liste
      toast.success('Filtrage effectué avec succès ! Liste des sections mise à jour.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
        icon: '✅',
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
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
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
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
      return;
    }

    Swal.fire({
      title: 'Confirmer l’ajout ?',
      text: `Voulez-vous ajouter une nouvelle section pour la spécialité au niveau ${niveau} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f0932b',
      background: '#fff',
      color: '#333',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch('http://localhost:8081/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idSpecialite, niveau }),
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
              style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
              icon: '✅',
            });
            setSections(prevSections => [
              ...prevSections,
              { ID_section: data.idSection, nom_specialite: data.nom_specialite, niveau: data.niveau }
            ]);
            setSelectedSection(null); // Rester sur la liste après ajout
          })
          .catch(err => {
            toast.error(`Erreur : ${err.message}`, {
              position: 'top-right',
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
              icon: '❌',
            });
          });
      }
    });
  };

  const handleDeleteSection = (idSection, displayNumber) => {
    Swal.fire({
      title: 'Confirmer la suppression ?',
      text: `Êtes-vous sûr de vouloir supprimer la Section ${displayNumber} ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f0932b',
      background: '#fff',
      color: '#333',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:8081/api/sections/${idSection}`, {
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
              style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
              icon: '✅',
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
              style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
              icon: '❌',
            });
          });
      }
    });
  };

  const handleBackToAdmin = () => {
    navigate("/Admin"); // Navigation vers la page Admin
  };

  return (
    <div id="listetudiants">
    <div className="container">
    <button
      onClick={handleBackToAdmin}
      className="button" // Ajoutez cette classe personnalisée
    >
      Retour à l&apos;accueil
    </button>
      <h1><FaList /> Liste des Étudiants</h1>
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
            <div className="sections-list">
              <h3>Sections filtrées :</h3>
              {sections.length === 0 ? (
                <p className="no-sections">Aucune section trouvée. Vous pouvez ajouter une nouvelle section ci-dessous.</p>
              ) : (
                sections.map((s, index) => (
                  <motion.div
                    key={s.ID_section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="section-item"
                    onClick={() => setSelectedSection(s.ID_section)}
                  >
                    Section {index + 1} - {s.nom_specialite} (Niveau: {s.niveau || 'Non défini'})
                    <button
                      className="delete-section-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(s.ID_section, index + 1); }}
                    >
                      Supprimer
                    </button>
                  </motion.div>
                ))
              )}
              <div style={{ marginTop: '20px' }}>
                <h4>Ajouter une nouvelle section <FaPlus style={{ verticalAlign: 'middle' }} /></h4>
                <button type="button" onClick={handleAddSection} className="edit-btn">
                  <FaPlus /> Ajouter Section
                </button>
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
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={true}
        className="custom-toast"
      />
    </div>
    </div>
  );
};

export default listetudiant; 