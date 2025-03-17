import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilter } from 'react-icons/fa'; 
import '../../admin_css_files/listetudiant.css';

const FilterPanel = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    niveau: '',
    idFaculte: '',
    idDepartement: '',
    idSpecialite: '',
    idSection: ''  // Ajout du champ idSection
  });

  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [sections, setSections] = useState([]); // État pour les sections

  useEffect(() => {
    axios.get('http://localhost:8081/api/facultes')
      .then(res => setFacultes(res.data))
      .catch(() => toast.error('Erreur lors du chargement des facultés.'));
  }, []);

  useEffect(() => {
    if (filters.idFaculte) {
      axios.get(`http://localhost:8081/api/departements/${filters.idFaculte}`)
        .then(res => setDepartements(res.data))
        .catch(() => toast.error('Erreur lors du chargement des départements.'));
    } else {
      setDepartements([]);
    }
  }, [filters.idFaculte]);

  useEffect(() => {
    if (filters.idDepartement) {
      axios.get(`http://localhost:8081/api/specialites/${filters.idDepartement}`)
        .then(res => setSpecialites(res.data))
        .catch(() => toast.error('Erreur lors du chargement des spécialités.'));
    } else {
      setSpecialites([]);
    }
  }, [filters.idDepartement]);

  useEffect(() => {
    if (filters.idSpecialite) {
      axios.get(`http://localhost:8081/api/sections/${filters.idSpecialite}`)
        .then(res => setSections(res.data))
        .catch(() => toast.error('Erreur lors du chargement des sections.'));
    } else {
      setSections([]);
    }
  }, [filters.idSpecialite]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    if (!filters.niveau || !filters.idFaculte || !filters.idDepartement || !filters.idSpecialite || !filters.idSection) {
      toast.error('Veuillez remplir tous les champs de filtrage.');
      return;
    }

    axios.post('http://localhost:8081/api/etudiants/filtrer', filters)
      .then(res => onFilter(res.data, filters))
      .catch(() => toast.error('Une erreur est survenue lors du filtrage.'));
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
            <option key={fac.ID_faculte} value={fac.ID_faculte}>{fac.nom_faculte}</option>
          ))}
        </select>

        <select name="idDepartement" value={filters.idDepartement} onChange={handleChange} className="filter-select">
          <option value="">Sélectionner un département</option>
          {departements.map(dep => (
            <option key={dep.ID_departement} value={dep.ID_departement}>{dep.Nom_departement}</option>
          ))}
        </select>

        <select name="idSpecialite" value={filters.idSpecialite} onChange={handleChange} className="filter-select">
          <option value="">Sélectionner une spécialité</option>
          {specialites.map(spec => (
            <option key={spec.ID_specialite} value={spec.ID_specialite}>{spec.nom_specialite}</option>
          ))}
        </select>

        <select name="idSection" value={filters.idSection} onChange={handleChange} className="filter-select">
          <option value="">Sélectionner une section</option>
          {sections.map(sec => (
            <option key={sec.ID_section} value={sec.ID_section}>{sec.niveau}</option>
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
