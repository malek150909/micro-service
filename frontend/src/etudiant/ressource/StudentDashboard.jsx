import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBook, FaBookOpen, FaChalkboardTeacher, FaPen, FaLaptopCode, FaFolderOpen, FaHome, FaTimes, FaCalendarAlt, FaUser, FaSearch } from 'react-icons/fa';
import "./ETDressource.css"; // Importer le fichier CSS pour le style

function StudentDashboard() {
  const [modules, setModules] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [semesterSelected, setSemesterSelected] = useState(false);
  const [resourceType, setResourceType] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [sectionId, setSectionId] = useState(null); // État pour sectionId
  const [niveau, setNiveau] = useState(null); // État pour niveau
  const navigate = useNavigate();
  const moduleListRef = useRef(null);

  const matricule = localStorage.getItem('matricule');

  useEffect(() => {
    if (!matricule) {
      navigate('/');
    } else {
      // Récupérer sectionId et niveau depuis le backend
      const fetchStudentData = async () => {
        try {
          const response = await axios.post('http://localhost:8083/ETDressources/login', { matricule });
          setSectionId(response.data.sectionId);
          setNiveau(response.data.niveau);
          setIsMounted(true);
        } catch (err) {
          console.error('Error fetching student data:', err.response || err);
          navigate('/');
        }
      };
      fetchStudentData();
    }
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
    try {
      const response = await axios.get('http://localhost:8083/ETDressources/modules', {
        params: { sectionId, semester },
      });
      const modulesData = Array.isArray(response.data) ? response.data : [];
      setModules(modulesData);
      setSemesterSelected(true);
    } catch (err) {
      console.error('Error fetching modules:', err.response || err);
      setModules([]);
    }
  };

  const fetchResources = async (moduleId, type) => {
    try {
      const response = await axios.get('http://localhost:8083/ETDressources/resources', {
        params: { moduleId, sectionId, type },
      });
      const resourcesData = Array.isArray(response.data) ? response.data : [];
      setResources(resourcesData);
      setResourceType(type);
      setShowResourceModal(true);
    } catch (err) {
      console.error('Error fetching resources:', err.response || err);
      setResources([]);
    }
  };

  const handleSemesterClick = (semester) => {
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
      case 'Cours': return <FaChalkboardTeacher className="resource-icon" />;
      case 'TD': return <FaPen className="resource-icon" />;
      case 'TP': return <FaLaptopCode className="resource-icon" />;
      default: return <FaChalkboardTeacher className="resource-icon" />;
    }
  };

  let semesterButtons;
  switch (niveau) {
    case 'L1':
      semesterButtons = (
        <>
            <div id="ETDressources">
            <button className="sidebar-button" onClick={() => handleSemesterClick('1')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 1
            </button>
            <button className="sidebar-button" onClick={() => handleSemesterClick('2')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 2
            </button>
            </div>
        </>
      );
      break;
    case 'L2':
      semesterButtons = (
        <>
            <div id="ETDressources">
            <button className="sidebar-button" onClick={() => handleSemesterClick('3')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 3
            </button>
            <button className="sidebar-button" onClick={() => handleSemesterClick('4')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 4
            </button>
            </div>
        </>
      );
      break;
    case 'L3':
      semesterButtons = (
        <>
            <div id="ETDressources">
            <button className="sidebar-button" onClick={() => handleSemesterClick('5')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 5
            </button>
            <button className="sidebar-button" onClick={() => handleSemesterClick('6')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 6
            </button>
            </div>
        </>
      );
      break;
    default:
      semesterButtons = (
        <>
            <div id="ETDressources">
            <button className="sidebar-button" onClick={() => handleSemesterClick('1')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 1
            </button>
            <button className="sidebar-button" onClick={() => handleSemesterClick('2')}>
                <FaCalendarAlt className="sidebar-icon" /> Semestre 2
            </button>
            </div>
        </>
      );
      break;
  }

  return (
    <div id="ETDressources">
    <div className="container">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>
      <div className="sidebar">
        <div className="logo">
          <FaUser className="sidebar-icon" />
          <h2>Étudiant</h2>
        </div>
        <button className="sidebar-button" onClick={() => navigate('/etudiant')}>
          <FaHome className="sidebar-icon" /> Retour à l'accueil
        </button>
        {semesterButtons}
      </div>
      <div className="main-content">
        <div className={`header ${isMounted ? 'animate-in' : ''}`}>
          <h1>
            <FaFolderOpen style={{ marginRight: '10px' }} /> Ressources Étudiant
          </h1>
          <p>Consultez les ressources de vos modules</p>
        </div>
        <div className={`document-list ${isMounted ? 'animate-in' : ''}`} ref={moduleListRef}>
          <h3>
            <FaBook style={{ marginRight: '10px' }} /> Modules
          </h3>
          {!semesterSelected ? (
            <div className="no-results">
              Veuillez sélectionner un semestre pour consulter vos ressources
            </div>
          ) : !Array.isArray(modules) || modules.length === 0 ? (
            <div className="no-results">
              Aucun module trouvé pour ce semestre.
            </div>
          ) : (
            <ul>
              {modules.map((module) => (
                <li
                  key={module.ID_module}
                  className={`document-item ${selectedModule?.ID_module === module.ID_module ? 'expanded' : ''}`}
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="document-info">
                    <FaBookOpen className="module-icon" />
                    <h3>{module.nom_module}</h3>
                  </div>
                  <div className="type-options">
                    <button
                      className="type-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTypeClick(module.ID_module, 'Cours');
                      }}
                    >
                      Cours
                    </button>
                    <button
                      className="type-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTypeClick(module.ID_module, 'TD');
                      }}
                    >
                      TD
                    </button>
                    <button
                      className="type-option"
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
      <div className={`modal-overlay ${showResourceModal ? 'active' : ''}`}>
        <div className={`modal-content ${showResourceModal ? 'active' : ''}`}>
          <h3>
            {getResourceIcon(resourceType)} {resourceType}
          </h3>
          <ul className="resource-list">
            {!Array.isArray(resources) || resources.length === 0 ? (
              <li className="no-results">
                Aucune ressource trouvée pour ce type.
              </li>
            ) : (
              resources.map((resource, index) => (
                <li key={index} className="resource-item">
                  <div className="resource-info">
                    <div className="resource-header">
                      {getResourceIcon(resourceType)}
                      <h3>{resource.nom_ressource}</h3>
                    </div>
                    <p className="resource-description">{resource.description}</p>
                    <div className="resource-footer">
                      <span className="resource-date">
                        <FaCalendarAlt className="date-icon" />
                        {resource.date_upload}
                      </span>
                      <a
                        href={`http://localhost:8082${resource.fichier_url}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-button"
                      >
                        <FaSearch style={{ marginRight: '8px' }} /> Consulter
                      </a>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="button-group">
            <button
              className="close-button"
              onClick={() => setShowResourceModal(false)}
            >
              <FaTimes style={{ marginRight: '8px' }} /> Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default StudentDashboard;