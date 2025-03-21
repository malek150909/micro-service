import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilter } from 'react-icons/fa'; // Icône pour le filtre

const FilterPanel = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    niveau: '',
    idFaculte: '',
    idDepartement: '',
    idSpecialite: ''
  });
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8081/apii/filters')
      .then(res => {
        setFacultes(res.data.facultes || []);
        setDepartements(res.data.departements || []);
        setSpecialites(res.data.specialites || []);
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || 'Impossible de charger les filtres. Veuillez réessayer.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
          icon: '❌',
        });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    if (!filters.niveau || !filters.idFaculte || !filters.idDepartement || !filters.idSpecialite) {
      toast.error('Veuillez remplir tous les champs de filtrage.', {
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

    axios.post('http://localhost:8081/apii/etudiants/filtrer', filters)
      .then(res => {
        onFilter(res.data, filters); // Passer les données au parent
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite lors du filtrage. Veuillez réessayer.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
          icon: '❌',
        });
        onFilter({ message: 'Une erreur s’est produite lors du filtrage.' }, filters);
      });
  };

  return (
    <div id="listetudiants">
    <div className="filter-panel">
      <h2>Filtrer les sections <FaFilter style={{ verticalAlign: 'middle', color: '#1565c0' }} /></h2>
      <select name="niveau" value={filters.niveau} onChange={handleChange} className="filter-select">
        <option value="">Sélectionner un niveau</option>
        <option value="L1">L1</option>
        <option value="L2">L2</option>
        <option value="L3">L3</option>
        <option value="M1">M1</option>
        <option value="M2">M2</option>
      </select>
      <select name="idFaculte" value={filters.idFaculte} onChange={handleChange} className="filter-select">
        <option value="">Sélectionner une faculté</option>
        {facultes.map(fac => (
          <option key={fac.ID_faculte} value={fac.ID_faculte}>{fac.nom_faculte || 'Nom non défini'}</option>
        ))}
      </select>
      <select name="idDepartement" value={filters.idDepartement} onChange={handleChange} className="filter-select">
        <option value="">Sélectionner un département</option>
        {departements.map(dep => (
          <option key={dep.ID_departement} value={dep.ID_departement}>{dep.Nom_departement || 'Nom non défini'}</option>
        ))}
      </select>
      <select name="idSpecialite" value={filters.idSpecialite} onChange={handleChange} className="filter-select">
        <option value="">Sélectionner une spécialité</option>
        {specialites.map(spec => (
          <option key={spec.ID_specialite} value={spec.ID_specialite}>{spec.nom_specialite || 'Nom non défini'}</option>
        ))}
      </select>
      <button onClick={handleFilter} className="filter-btn">
        <FaFilter style={{ marginRight: '5px' }} /> Filtrer
      </button>
    </div>
    </div>
  );
};

export default FilterPanel;