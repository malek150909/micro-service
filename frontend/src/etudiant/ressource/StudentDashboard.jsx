import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBook, FaBookOpen, FaChalkboardTeacher, FaPen, FaLaptopCode, FaFolderOpen, FaHome, FaTimes, FaCalendarAlt, FaUser, FaSearch } from 'react-icons/fa';
import styles from './ETDressources.module.css'; // Import CSS module

function StudentDashboard() {
  const [modules, setModules] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [semesterSelected, setSemesterSelected] = useState(false);
  const [resourceType, setResourceType] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [sectionId, setSectionId] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();
  const moduleListRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const matricule = userData?.Matricule;

  useEffect(() => {
    if (!matricule) {
      console.log('Matricule absent, redirection vers /');
      navigate('/');
      return;
    }

    const fetchStudentData = async () => {
      try {
        console.log('Appel API /ETDressources/login avec matricule:', matricule);
        const response = await axios.post('http://courses.localhost/ETDressources/login', { matricule });
        console.log('Réponse API /ETDressources/login:', response.data);
        const { sectionId, niveau } = response.data;
        if (!sectionId || !niveau) {
          console.error('sectionId ou niveau manquant dans la réponse:', response.data);
          navigate('/');
          return;
        }
        setSectionId(sectionId);
        setNiveau(niveau);
        setIsMounted(true);
      } catch (err) {
        console.error('Erreur lors de la récupération des données étudiant:', err.response?.data || err.message);
        navigate('/');
      }
    };

    fetchStudentData();
  }, [matricule, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moduleListRef.current && !moduleListRef.current.contains(event.target)) {
        setSelectedModule(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchModules = async (semester) => {
    if (!sectionId) {
      console.log('sectionId non disponible, fetchModules annulé');
      return;
    }

    if (isFetching) {
      console.log('Requête déjà en cours, fetchModules annulé');
      return;
    }

    setIsFetching(true);
    try {
      console.log('Appel API /ETDressources/modules avec:', { sectionId, semester });
      const response = await axios.get('http://courses.localhost/ETDressources/modules', {
        params: { sectionId, semester },
      });
      console.log('Réponse API /ETDressources/modules:', response.data);
      const modulesData = Array.isArray(response.data) ? response.data : [];
      setModules(modulesData);
      setSemesterSelected(true);
      console.log('Après setModules, modules:', modulesData);
      console.log('Après setSemesterSelected, semesterSelected:', true);
    } catch (err) {
      console.error('Erreur lors de la récupération des modules:', err.response?.data || err.message);
      setModules([]);
      setSemesterSelected(true);
      console.log('Après erreur, modules:', []);
      console.log('Après erreur, semesterSelected:', true);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchResources = async (moduleId, type) => {
    try {
      console.log('Appel API /ETDressources/resources avec:', { moduleId, sectionId, type });
      const response = await axios.get('http://courses.localhost/ETDressources/resources', {
        params: { moduleId, sectionId, type },
      });
      console.log('Réponse API /ETDressources/resources:', response.data);
      const resourcesData = Array.isArray(response.data) ? response.data : [];
      setResources(resourcesData);
      setResourceType(type);
      setShowResourceModal(true);
    } catch (err) {
      console.error('Erreur lors de la récupération des ressources:', err.response?.data || err.message);
      setResources([]);
    }
  };

  const handleSemesterClick = (semester) => {
    console.log('Clic sur semestre:', semester);
    fetchModules(semester);
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module === selectedModule ? null : module);
  };

  const handleTypeClick = (moduleId, type) => {
    fetchResources(moduleId, type);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'Cours': return <FaChalkboardTeacher className={styles['ETD-resource-icon']} />;
      case 'TD': return <FaPen className={styles['ETD-resource-icon']} />;
      case 'TP': return <FaLaptopCode className={styles['ETD-resource-icon']} />;
      default: return <FaChalkboardTeacher className={styles['ETD-resource-icon']} />;
    }
  };

  let semesterButtons;
  switch (niveau) {
    case 'L1':
      semesterButtons = (
        <>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('1')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('2')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
    case 'L2':
      semesterButtons = (
        <>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('3')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 3
          </button>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('4')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 4
          </button>
        </>
      );
      break;
    case 'L3':
      semesterButtons = (
        <>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('5')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 5
          </button>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('6')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 6
          </button>
        </>
      );
      break;
    default:
      semesterButtons = (
        <>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('1')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['ETD-sidebar-button']} onClick={() => handleSemesterClick('2')} disabled={isFetching}>
            <FaCalendarAlt className={styles['ETD-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
  }

  return (
      <div className={styles['ETD-container']}>
        <div className={styles['ETD-background-shapes']}>
          <div className={styles['ETD-shape'] + ' ' + styles['ETD-shape1']}></div>
          <div className={styles['ETD-shape'] + ' ' + styles['ETD-shape2']}></div>
        </div>
        <div className={styles['ETD-sidebar']}>
          <div className={styles['ETD-logo']}>
            <FaUser className={styles['ETD-sidebar-icon']} />
            <h2>Ressources</h2>
          </div>
          <button className={styles['ETD-sidebar-button']} onClick={() => navigate('/etudiant')}>
            <FaHome className={styles['ETD-sidebar-icon']} /> Retour à l'accueil
          </button>
          {semesterButtons}
        </div>
        <div className={styles['ETD-main-content']}>
          <div className={`${styles['ETD-header']} ${isMounted ? 'animate-in' : ''}`}>
            <h1>
              <FaFolderOpen style={{ marginRight: '10px' }} /> Ressources Étudiant
            </h1>
            <p>Consultez les ressources de vos modules</p>
          </div>
          <div className={`${styles['ETD-document-list']} ${isMounted ? 'animate-in' : ''}`} ref={moduleListRef}>
            <h3>
              <FaBook style={{ marginRight: '10px' }} /> Modules
            </h3>
            {!sectionId ? (
              <div className={styles['ETD-no-results']}>
                Chargement des données de l'étudiant...
              </div>
            ) : !semesterSelected ? (
              <div className={styles['ETD-no-results']}>
                Veuillez sélectionner un semestre pour consulter vos ressources
              </div>
            ) : !Array.isArray(modules) || modules.length === 0 ? (
              <div className={styles['ETD-no-results']}>
                Aucun module trouvé pour ce semestre.
              </div>
            ) : (
              <ul>
                {modules.map((module) => (
                  <li
                    key={module.ID_module}
                    className={`${styles['ETD-document-item']} ${selectedModule?.ID_module === module.ID_module ? styles['ETD-expanded'] : ''}`}
                    onClick={() => handleModuleClick(module)}
                  >
                    <div className={styles['ETD-document-info']}>
                      <FaBookOpen className={styles['ETD-module-icon']} />
                      <h3>{module.nom_module}</h3>
                    </div>
                    <div className={styles['ETD-type-options']}>
                      <button
                        className={styles['ETD-type-option']}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeClick(module.ID_module, 'Cours');
                        }}
                      >
                        Cours
                      </button>
                      <button
                        className={styles['ETD-type-option']}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeClick(module.ID_module, 'TD');
                        }}
                      >
                        TD
                      </button>
                      <button
                        className={styles['ETD-type-option']}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeClick(module.ID_module, 'TP');
                        }}
                      >
                        TP
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className={`${styles['ETD-modal-overlay']} ${showResourceModal ? styles['ETD-active'] : ''}`}>
          <div className={`${styles['ETD-modal-content']} ${showResourceModal ? styles['ETD-active'] : ''}`}>
            <h3>
              {getResourceIcon(resourceType)} {resourceType}
            </h3>
            <ul className={styles['ETD-resource-list']}>
              {!Array.isArray(resources) || resources.length === 0 ? (
                <li className={styles['ETD-no-results']}>
                  Aucune ressource trouvée pour ce type.
                </li>
              ) : (
                resources.map((resource, index) => (
                  <li key={index} className={styles['ETD-resource-item']}>
                    <div className={styles['ETD-resource-info']}>
                      <div className={styles['ETD-resource-header']}>
                        {getResourceIcon(resourceType)}
                        <h3>{resource.nom_ressource}</h3>
                      </div>
                      <p className={styles['ETD-resource-description']}>{resource.description}</p>
                      <div className={styles['ETD-resource-footer']}>
                        <span className={styles['ETD-resource-date']}>
                          <FaCalendarAlt className={styles['ETD-date-icon']} />
                          {resource.date_upload}
                        </span>
                        <a
                          href={`http://messaging.localhost${resource.fichier_url}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles['ETD-download-button']}
                        >
                          <FaSearch style={{ marginRight: '8px' }} /> Consulter
                        </a>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className={styles['ETD-button-group']}>
              <button
                className={styles['ETD-close-button']}
                onClick={() => setShowResourceModal(false)}
              >
                <FaTimes style={{ marginRight: '8px' }} /> Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

export default StudentDashboard;