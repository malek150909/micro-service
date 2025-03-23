import { useState } from 'react';
import FilterForm from '../components/FilterForm';
import ModuleForm from '../components/ModuleForm';
import ModuleList from '../components/ModuleList';
import { FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';
import "../../../admin_css_files/module.css";

const API_URL = 'http://localhost:8083/modules';

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

  const fetchModules = async (currentFilters) => {
    try {
      const response = await axios.get(API_URL, { params: currentFilters });
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
    if (!filters.section) {
      setAlertMessage('Veuillez sélectionner une section avant d\'ajouter un module.');
      return;
    }
  
    try {
      const addData = {
        ...moduleData,
        ID_specialite: filters.specialite || '1',
        section: filters.section,
        niveau: filters.niveau, // Ajouter le niveau
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
      await axios.delete(`${API_URL}/${id}`);
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
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="custom-alert"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="alert-content">
            <FiAlertCircle className="alert-icon" />
            <p className="alert-message">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="alert-close-button"
          >
            Fermer
          </button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div id="modules">
      <div className="container">
        <h1>Gestion des Modules</h1>
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
          <p className="no-results">
            {filters.section && isFilterApplied ? 'Aucun module trouvé.' : 'Veuillez sélectionner une section pour filtrer ou ajouter un nouveau module.'}
          </p>
        )}

        <div className="form-section">
          <ModuleForm
            onAdd={handleAddModule}
            disabled={!filters.section || !filters.specialite}
            niveau={filters.niveau} // Pass niveau to ModuleForm
          />
        </div>

        {alertMessage && <CustomAlert message={alertMessage} onClose={handleCloseAlert} />}
      </div>
    </div>
  );
};

export default Home;