import React,{ useState, useEffect } from 'react';
import FilterForm from '../components/FilterForm';
import ModuleForm from '../components/ModuleForm';
import ModuleList from '../components/ModuleList';
import { FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaBook, FaFilter, FaPlus, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from "../module.module.css";

const API_URL = 'http://courses.localhost/modules';

const Home = () => {
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [filters, setFilters] = useState({
    faculte: '',
    departement: '',
    niveau: '',
    specialite: '',
    section: '',
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const [sectionOptions, setSectionOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get('http://courses.localhost/modules/sections', {
          params: {
            specialite: filters.specialite,
            niveau: filters.niveau,
          },
        });
        setSectionOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des sections:', error);
        setSectionOptions([]);
      }
    };

    if (filters.specialite && filters.niveau) {
      fetchSections();
    } else {
      setSectionOptions([]);
    }
  }, [filters.specialite, filters.niveau]);

  const fetchModules = async (currentFilters) => {
    try {
      const response = await axios.get(API_URL, { params: currentFilters });
      console.log('Fetched modules:', response.data);
      setModules(response.data);
    } catch (err) {
      console.error('Erreur de récupération des modules:', err);
      setError(`Erreur de récupération des modules: ${err.response?.data?.error || err.message}`);
      setModules([]);
    }
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setIsFilterApplied(true);
    fetchModules(newFilters);
  };

  const handleAddModule = async (moduleData) => {
    if (!moduleData.sections.length) {
      setAlertMessage('Veuillez sélectionner au moins une section.');
      return;
    }

    try {
      const addData = {
        ...moduleData,
        ID_specialite: filters.specialite || '1',
        niveau: filters.niveau,
      };

      console.log('Sending addData to backend:', addData);
      await axios.post(API_URL, addData);
      fetchModules(filters);
      setAlertMessage(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      console.log('Error from backend:', errorMessage);
      setAlertMessage(errorMessage);
    }
  };

  const handleDeleteModule = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        params: { sectionId: filters.section },
      });
      fetchModules(filters);
    } catch (err) {
      console.error('Erreur de suppression du module:', err);
      setError(`Erreur de suppression du module: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateModule = (id, updatedData) => {
    setModules(modules.map(module =>
      module.ID_module === id ? { ...module, ...updatedData } : module
    ));
  };

  const handleCloseAlert = () => {
    setAlertMessage(null);
  };

  const CustomAlert = ({ message, onClose }) => {
    return (
      <motion.div
        className={styles['ADM-MDL-modal-overlay']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles['ADM-MDL-custom-alert']}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles['ADM-MDL-alert-content']}>
            <FiAlertCircle className={styles['ADM-MDL-alert-icon']} />
            <p className={styles['ADM-MDL-alert-message']}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={styles['ADM-MDL-button']}
          >
            Fermer
          </button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className={styles['ADM-MDL-container']}>
      <div className={styles['ADM-MDL-sidebar']}>
        <div className={styles['ADM-MDL-logo']}>
          <h2>Gestion des Modules</h2>
        </div>
        <button className={styles['ADM-MDL-sidebar-button']} onClick={() => navigate('/admin')}>
          <FaHome /> Retour à l'accueil
        </button>
      </div>

      <div className={styles['ADM-MDL-main-content']}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <FilterForm onFilter={handleFilter} />
        {modules.length > 0 ? (
          <ModuleList
            modules={modules}
            onDelete={handleDeleteModule}
            onUpdate={handleUpdateModule}
            niveau={filters.niveau}
          />
        ) : (
          <p className={styles['ADM-MDL-no-results']}>
            {filters.section && isFilterApplied ? 'Aucun module trouvé.' : 'Veuillez sélectionner une section pour filtrer ou ajouter un nouveau module.'}
          </p>
        )}
        {filters.specialite && filters.niveau && filters.section && (
          <div className={styles['ADM-MDL-form-section']}>
            <ModuleForm
              onAdd={handleAddModule}
              disabled={!filters.specialite || !filters.niveau || !filters.section}
              niveau={filters.niveau}
              specialite={filters.specialite}
              sectionOptions={sectionOptions}
            />
          </div>
        )}
        {alertMessage && <CustomAlert message={alertMessage} onClose={handleCloseAlert} />}
      </div>
    </div>
  );
};

export default Home;