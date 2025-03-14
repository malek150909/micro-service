import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import '../../../admin_css_files/exam.css';

const FilterForm = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    faculte: '',
    departement: '',
    niveau: '',
    specialite: '',
    section: '',
    ID_semestre: '',
  });

  const [faculteOptions, setFaculteOptions] = useState([]);
  const [departementOptions, setDepartementOptions] = useState([]);
  const [niveauOptions, setNiveauOptions] = useState([]);
  const [specialiteOptions, setSpecialiteOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [semestreOptions, setSemestreOptions] = useState([]);
  const [error, setError] = useState(''); // Added to display error messages

  useEffect(() => {
    const fetchFacultes = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/facultes');
        setFaculteOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des facultés:', error);
      }
    };
    fetchFacultes();

    const fetchSemestres = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/semestres');
        setSemestreOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des semestres:', error);
      }
    };
    fetchSemestres();
  }, []);

  useEffect(() => {
    const fetchDepartements = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/departements', {
          params: { faculte: filters.faculte },
        });
        setDepartementOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des départements:', error);
      }
    };
    if (filters.faculte) fetchDepartements();
    else setDepartementOptions([]);
    setFilters((prev) => ({ ...prev, departement: '', niveau: '', specialite: '', section: '', ID_semestre: '' }));
    setNiveauOptions([]);
    setSpecialiteOptions([]);
    setSectionOptions([]);
  }, [filters.faculte]);

  useEffect(() => {
    const fetchNiveaux = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/niveaux', {
          params: { departement: filters.departement },
        });
        setNiveauOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des niveaux:', error);
      }
    };
    if (filters.departement) fetchNiveaux();
    else setNiveauOptions([]);
    setFilters((prev) => ({ ...prev, niveau: '', specialite: '', section: '', ID_semestre: '' }));
    setSpecialiteOptions([]);
    setSectionOptions([]);
  }, [filters.departement]);

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/specialites', {
          params: { departement: filters.departement, niveau: filters.niveau },
        });
        setSpecialiteOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des spécialités:', error);
      }
    };
    if (filters.departement && filters.niveau) fetchSpecialites();
    else setSpecialiteOptions([]);
    setFilters((prev) => ({ ...prev, specialite: '', section: '', ID_semestre: '' }));
    setSectionOptions([]);
  }, [filters.departement, filters.niveau]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get('http://localhost:8083/exams/sections', {
          params: { specialite: filters.specialite, niveau: filters.niveau },
        });
        setSectionOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des sections:', error);
      }
    };
    if (filters.specialite && filters.niveau) fetchSections();
    else setSectionOptions([]);
    setFilters((prev) => ({ ...prev, section: '', ID_semestre: '' }));
  }, [filters.specialite, filters.niveau]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setError(''); // Clear error on change
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!filters.section) {
      setError('Veuillez sélectionner une section.');
      return;
    }
    if (!filters.ID_semestre) {
      setError('Veuillez sélectionner un semestre.');
      return;
    }
    setError('');
    onFilter(filters);
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Filtrer les Examens</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select name="faculte" value={filters.faculte} onChange={handleChange}>
          <option value="">Sélectionner une Faculté</option>
          {faculteOptions.map((option) => (
            <option key={option.ID_faculte} value={option.ID_faculte}>
              {option.nom_faculte}
            </option>
          ))}
        </select>
        <select name="departement" value={filters.departement} onChange={handleChange}>
          <option value="">Sélectionner un Département</option>
          {departementOptions.map((option) => (
            <option key={option.ID_departement} value={option.ID_departement}>
              {option.Nom_departement}
            </option>
          ))}
        </select>
        <select name="niveau" value={filters.niveau} onChange={handleChange}>
          <option value="">Sélectionner un Niveau</option>
          {niveauOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select name="specialite" value={filters.specialite} onChange={handleChange}>
          <option value="">Sélectionner une Spécialité</option>
          {specialiteOptions.map((option) => (
            <option key={option.ID_specialite} value={option.ID_specialite}>
              {option.nom_specialite}
            </option>
          ))}
        </select>
        <select name="section" value={filters.section} onChange={handleChange} required>
          <option value="">Sélectionner une Section</option>
          {sectionOptions.map((option) => (
            <option key={option.ID_section} value={option.ID_section}>
              {`Section ${option.ID_section} (Niveau: ${option.niveau})`}
            </option>
          ))}
        </select>
        <select name="ID_semestre" value={filters.ID_semestre} onChange={handleChange} required>
          <option value="">Sélectionner un Semestre</option>
          {semestreOptions.map((semestre, index) => (
            <option key={`${semestre.ID_semestre}-${index}`} value={semestre.ID_semestre}>
              {`Semestre ${semestre.ID_semestre} (${semestre.date_debut} - ${semestre.date_fin})`}
            </option>
          ))}
        </select>
        <button type="submit">Filtrer</button>
      </form>
    </motion.div>
  );
};

export default FilterForm;