import React,{ useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import styles from "../module.module.css";

const FilterForm = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    faculte: '',
    departement: '',
    niveau: '',
    specialite: '',
    section: '',
  });
  const [error, setError] = useState(null);

  const [faculteOptions, setFaculteOptions] = useState([]);
  const [departementOptions, setDepartementOptions] = useState([]);
  const [niveauOptions, setNiveauOptions] = useState([]);
  const [specialiteOptions, setSpecialiteOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  useEffect(() => {
    const fetchFacultes = async () => {
      try {
        setError(null);
        const response = await axios.get('http://courses.localhost/modules/facultes');
        setFaculteOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des facultés:', error);
        setError('Impossible de charger les facultés. Veuillez réessayer.');
      }
    };
    fetchFacultes();
  }, []);

  useEffect(() => {
    const fetchDepartements = async () => {
      try {
        setError(null);
        const response = await axios.get('http://courses.localhost/modules/departements', {
          params: { faculte: filters.faculte },
        });
        setDepartementOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des départements:', error);
        setError('Impossible de charger les départements. Veuillez vérifier la sélection de la faculté.');
      }
    };

    if (filters.faculte) {
      fetchDepartements();
    } else {
      setDepartementOptions([]);
    }
    setFilters((prev) => ({
      ...prev,
      departement: '',
      niveau: '',
      specialite: '',
      section: '',
    }));
    setNiveauOptions([]);
    setSpecialiteOptions([]);
    setSectionOptions([]);
  }, [filters.faculte]);

  useEffect(() => {
    const fetchNiveaux = async () => {
      try {
        setError(null);
        const response = await axios.get('http://courses.localhost/modules/niveaux', {
          params: { departement: filters.departement },
        });
        setNiveauOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des niveaux:', error);
        setError('Impossible de charger les niveaux. Veuillez vérifier la sélection du département.');
      }
    };

    if (filters.departement) {
      fetchNiveaux();
    } else {
      setNiveauOptions([]);
    }
    setFilters((prev) => ({
      ...prev,
      niveau: '',
      specialite: '',
      section: '',
    }));
    setSpecialiteOptions([]);
    setSectionOptions([]);
  }, [filters.departement]);

  useEffect(() => {
    const fetchSpecialites = async () => {
      try {
        setError(null);
        const response = await axios.get('http://courses.localhost/modules/specialites', {
          params: { departement: filters.departement, niveau: filters.niveau },
        });
        setSpecialiteOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des spécialités:', error);
        setError('Impossible de charger les spécialités. Veuillez vérifier les sélections.');
      }
    };

    if (filters.departement && filters.niveau) {
      fetchSpecialites();
    } else {
      setSpecialiteOptions([]);
    }
    setFilters((prev) => ({
      ...prev,
      specialite: '',
      section: '',
    }));
    setSectionOptions([]);
  }, [filters.departement, filters.niveau]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setError(null);
        const response = await axios.get('http://courses.localhost/modules/sections', {
          params: {
            specialite: filters.specialite,
            niveau: filters.niveau,
          },
        });
        setSectionOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des sections:', error);
        setError('Impossible de charger les sections. Veuillez vérifier les sélections.');
      }
    };

    if (filters.specialite && filters.niveau) {
      fetchSections();
    } else {
      setSectionOptions([]);
    }
    setFilters((prev) => ({
      ...prev,
      section: '',
    }));
  }, [filters.specialite, filters.niveau]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (filters.section) {
      onFilter({ ...filters, section: filters.section });
    } else {
      onFilter({ ...filters, section: '' });
    }
  };

  return (
    <div className={styles['ADM-MDL-form-container']}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>Chercher les modules d'une Section</h3>
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        <form className={styles['ADM-MDL-form']} onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <select name="faculte" value={filters.faculte} onChange={handleChange} className={styles['ADM-MDL-select']}>
            <option value="">Sélectionner une Faculté</option>
            {faculteOptions.map((option) => (
              <option key={option.ID_faculte} value={option.ID_faculte}>
                {option.nom_faculte}
              </option>
            ))}
          </select>

          <select name="departement" value={filters.departement} onChange={handleChange} className={styles['ADM-MDL-select']}>
            <option value="">Sélectionner un Département</option>
            {departementOptions.map((option) => (
              <option key={option.ID_departement} value={option.ID_departement}>
                {option.Nom_departement}
              </option>
            ))}
          </select>

          <select name="niveau" value={filters.niveau} onChange={handleChange} className={styles['ADM-MDL-select']}>
            <option value="">Sélectionner un Niveau</option>
            {niveauOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select name="specialite" value={filters.specialite} onChange={handleChange} className={styles['ADM-MDL-select']}>
            <option value="">Sélectionner une Spécialité</option>
            {specialiteOptions.map((option) => (
              <option key={option.ID_specialite} value={option.ID_specialite}>
                {option.nom_specialite}
              </option>
            ))}
          </select>

          <select
            name="section"
            value={filters.section}
            onChange={handleChange}
            className={styles['ADM-MDL-select']}
          >
            <option value="">Sélectionner une Section</option>
            {sectionOptions.map((option) => (
              <option key={option.ID_section} value={option.ID_section}>
                {option.nom_section}
              </option>
            ))}
          </select>

          <button type="submit" className={styles['ADM-MDL-button']}>Filtrer</button>
        </form>
      </motion.div>
    </div>
  );
};

export default FilterForm;