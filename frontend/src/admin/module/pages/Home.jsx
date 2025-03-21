import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterForm from '../components/FilterForm';
import ModuleForm from '../components/ModuleForm';
import ModuleList from '../components/ModuleList';
import { getModules, addModule, deleteModule } from '../api/moduleApi';
import '../../../admin_css_files/module.css';

const Home = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    faculte: '',
    departement: '',
    niveau: '',
    specialite: '',
    section: '',
  });

  const fetchModules = async (currentFilters) => {
    try {
      const data = await getModules(currentFilters);
      console.log('Modules fetched in Home:', data);
      setModules(data);
    } catch (err) {
      console.error('Erreur de récupération des modules:', err);
      setError(`Erreur de récupération des modules: ${err.message}`);
      setModules([]);
    }
  };

  const handleFilter = (newFilters) => {
    console.log('Filters received in Home:', newFilters);
    setFilters(newFilters);
    fetchModules(newFilters);
  };

  const handleAddModule = async (moduleData) => {
    if (!filters.section) {
      setError('Veuillez sélectionner une section avant d\'ajouter un module.');
      return;
    }
    try {
      const addData = {
        ...moduleData,
        ID_specialite: filters.specialite || '1',
        section: filters.section,
      };
      await addModule(addData);
      fetchModules(filters);
      setError(null);
    } catch (err) {
      console.error('Erreur d\'ajout du module:', err);
      setError(`Erreur d'ajout du module: ${err.message}`);
    }
  };

  const handleDeleteModule = async (id) => {
    try {
      await deleteModule(id);
      fetchModules(filters);
    } catch (err) {
      console.error('Erreur de suppression du module:', err);
      setError(`Erreur de suppression du module: ${err.message}`);
    }
  };

  const handleUpdateModule = (id, updatedData) => {
    setModules(modules.map(module =>
      module.ID_module === id ? { ...module, ...updatedData } : module
    ));
  };

  const handleBackToAdmin = () => {
    navigate("/Admin");
  };

  return (
    <div id="modules">
      <div className="container">
        <button onClick={handleBackToAdmin} className="button">
          Retour à l&apos;accueil
        </button>
        <h1>Gestion des Modules</h1>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <FilterForm onFilter={handleFilter} />
        {modules.length > 0 ? (
          <ModuleList
            modules={modules}
            onDelete={handleDeleteModule}
            onUpdate={handleUpdateModule}
            niveau={filters.niveau} // Ajouter la prop niveau ici
          />
        ) : (
          <p className="no-results">Aucun module trouvé. Veuillez sélectionner une section pour filtrer ou ajouter un nouveau module.</p>
        )}
        <ModuleForm
          onAdd={handleAddModule}
          disabled={!filters.section}
          niveau={filters.niveau} // Déjà correct ici
        />
      </div>
    </div>
  );
};

export default Home;