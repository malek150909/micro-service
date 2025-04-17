import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { FaFilter } from 'react-icons/fa';
import styles from '../exam.module.css';

const FilterForm = ({ onFilter, onChange }) => {
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
  const [error, setError] = useState('');

  const [cache, setCache] = useState({
    facultes: null,
    departements: {},
    niveaux: {},
    specialites: {},
    sections: {},
    semestres: {},
  });

  const API_URL = 'http://localhost:8083';

  // Fetch Facultes
  useEffect(() => {
    const fetchFacultes = async () => {
      if (cache.facultes) {
        setFaculteOptions(cache.facultes);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/facultes`);
        setFaculteOptions(response.data);
        setCache((prev) => ({ ...prev, facultes: response.data }));
      } catch (error) {
        console.error('Erreur de récupération des facultés:', error);
        setError('Erreur de chargement des facultés.');
      }
    };

    fetchFacultes();
  }, [cache]);

  // Fetch Semestres
  useEffect(() => {
    const fetchSemestres = async () => {
      if (!filters.niveau) {
        setSemestreOptions([]);
        setFilters((prev) => ({ ...prev, ID_semestre: '' }));
        return;
      }
      const cacheKey = filters.niveau;
      if (cache.semestres[cacheKey]) {
        setSemestreOptions(cache.semestres[cacheKey]);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/semestres`, {
          params: { niveau: filters.niveau },
        });
        setSemestreOptions(response.data);
        setCache((prev) => ({
          ...prev,
          semestres: { ...prev.semestres, [cacheKey]: response.data },
        }));
      } catch (error) {
        console.error('Erreur de récupération des semestres:', error);
        setError('Erreur de chargement des semestres.');
      }
    };

    fetchSemestres();
  }, [filters.niveau, cache]);

  // Fetch Departements
  useEffect(() => {
    const fetchDepartements = async () => {
      if (!filters.faculte) {
        setDepartementOptions([]);
        setFilters((prev) => ({ ...prev, departement: '', niveau: '', specialite: '', section: '', ID_semestre: '' }));
        return;
      }
      if (cache.departements[filters.faculte]) {
        setDepartementOptions(cache.departements[filters.faculte]);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/departements`, {
          params: { faculte: filters.faculte },
        });
        setDepartementOptions(response.data);
        setCache((prev) => ({
          ...prev,
          departements: { ...prev.departements, [filters.faculte]: response.data },
        }));
      } catch (error) {
        console.error('Erreur de récupération des départements:', error);
        setError('Erreur de chargement des départements.');
      }
    };
    fetchDepartements();
  }, [filters.faculte, cache]);

  // Fetch Niveaux
  useEffect(() => {
    const fetchNiveaux = async () => {
      if (!filters.departement) {
        setNiveauOptions([]);
        setFilters((prev) => ({ ...prev, niveau: '', specialite: '', section: '', ID_semestre: '' }));
        return;
      }
      const cacheKey = `${filters.departement}`;
      if (cache.niveaux[cacheKey]) {
        setNiveauOptions(cache.niveaux[cacheKey]);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/niveaux`, {
          params: { departement: filters.departement },
        });
        setNiveauOptions(response.data);
        setCache((prev) => ({
          ...prev,
          niveaux: { ...prev.niveaux, [cacheKey]: response.data },
        }));
      } catch (error) {
        console.error('Erreur de récupération des niveaux:', error);
        setError('Erreur de chargement des niveaux.');
      }
    };
    fetchNiveaux();
  }, [filters.departement, cache]);

  // Fetch Specialites
  useEffect(() => {
    const fetchSpecialites = async () => {
      if (!filters.departement || !filters.niveau) {
        setSpecialiteOptions([]);
        setFilters((prev) => ({ ...prev, specialite: '', section: '', ID_semestre: '' }));
        return;
      }
      const cacheKey = `${filters.departement}-${filters.niveau}`;
      if (cache.specialites[cacheKey]) {
        setSpecialiteOptions(cache.specialites[cacheKey]);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/specialites`, {
          params: { departement: filters.departement, niveau: filters.niveau },
        });
        setSpecialiteOptions(response.data);
        setCache((prev) => ({
          ...prev,
          specialites: { ...prev.specialites, [cacheKey]: response.data },
        }));
      } catch (error) {
        console.error('Erreur de récupération des spécialités:', error);
        setError('Erreur de chargement des spécialités.');
      }
    };
    fetchSpecialites();
  }, [filters.departement, filters.niveau, cache]);

  // Fetch Sections
  useEffect(() => {
    const fetchSections = async () => {
      if (!filters.specialite || !filters.niveau) {
        setSectionOptions([]);
        setFilters((prev) => ({ ...prev, section: '', ID_semestre: '' }));
        return;
      }
      const cacheKey = `${filters.specialite}-${filters.niveau}`;
      if (cache.sections[cacheKey]) {
        setSectionOptions(cache.sections[cacheKey]);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/exams/sections`, {
          params: { specialite: filters.specialite, niveau: filters.niveau },
        });
        setSectionOptions(response.data);
        setCache((prev) => ({
          ...prev,
          sections: { ...prev.sections, [cacheKey]: response.data },
        }));
      } catch (error) {
        console.error('Erreur de récupération des sections:', error);
        setError('Erreur de chargement des sections.');
      }
    };
    fetchSections();
  }, [filters.specialite, filters.niveau, cache]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setError(''); // Clear error on change
    // Notify parent of the change immediately
    if (onChange) {
      onChange({ ...filters, [name]: value });
    }
  };

  // Debounce the onFilter callback to prevent rapid submissions
  const debouncedOnFilter = useCallback(
    debounce((filters) => {
      onFilter(filters);
    }, 500),
    [onFilter]
  );

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
    debouncedOnFilter(filters);
  };

  return (
      <motion.div
        className={styles['ADM-EXM-form-container']}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h3>
          <FaFilter style={{ marginRight: '8px' }} /> Filtrer les Examens
        </h3>
        {error && <p style={{ color: '#ff4d4f' }}>{error}</p>}
        <form className={styles['ADM-EXM-form']} onSubmit={handleSubmit}>
          <select className={styles['ADM-EXM-select']} name="faculte" value={filters.faculte} onChange={handleChange}>
            <option value="">Sélectionner une Faculté</option>
            {faculteOptions.map((option) => (
              <option key={option.ID_faculte} value={option.ID_faculte}>
                {option.nom_faculte}
              </option>
            ))}
          </select>
          <select className={styles['ADM-EXM-select']} name="departement" value={filters.departement} onChange={handleChange}>
            <option value="">Sélectionner un Département</option>
            {departementOptions.map((option) => (
              <option key={option.ID_departement} value={option.ID_departement}>
                {option.Nom_departement}
              </option>
            ))}
          </select>
          <select className={styles['ADM-EXM-select']} name="niveau" value={filters.niveau} onChange={handleChange}>
            <option value="">Sélectionner un Niveau</option>
            {niveauOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <select className={styles['ADM-EXM-select']} name="specialite" value={filters.specialite} onChange={handleChange}>
            <option value="">Sélectionner une Spécialité</option>
            {specialiteOptions.map((option) => (
              <option key={option.ID_specialite} value={option.ID_specialite}>
                {option.nom_specialite}
              </option>
            ))}
          </select>
          <select className={styles['ADM-EXM-select']} name="section" value={filters.section} onChange={handleChange} required>
            <option value="">Sélectionner une Section</option>
            {sectionOptions.map((option) => (
              <option key={option.ID_section} value={option.ID_section}>
                {`${option.nom_section} (Étudiants: ${option.num_etudiant})`}
              </option>
            ))}
          </select>
          <select className={styles['ADM-EXM-select']} name="ID_semestre" value={filters.ID_semestre} onChange={handleChange} required>
            <option value="">Sélectionner un Semestre</option>
            {semestreOptions.map((semestre) => (
              <option key={semestre.ID_semestre} value={semestre.ID_semestre}>
                {`Semestre ${semestre.ID_semestre} (${semestre.date_debut} - ${semestre.date_fin})`}
              </option>
            ))}
          </select>
          <button type="submit">
            <FaFilter style={{ marginRight: '8px' }} /> Filtrer
          </button>
        </form>
      </motion.div>
  );
};

export default FilterForm;