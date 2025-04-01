import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFilter, FaSearch } from 'react-icons/fa'; // Ajout de FaSearch
import "../../admin_css_files/listetudiant.css" ;

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

  const iconColor = '#021A3F'; // Bleu très foncé

  useEffect(() => {
    console.log('FilterPanel monté');
  }, []);

  useEffect(() => {
    setFacultes([]);
    setDepartements([]);
    setSpecialites([]);

    axios.get('http://localhost:8081/listeETD/filters')
      .then(res => {
        const fetchedFacultes = res.data.facultes || [];
        const fetchedDepartements = res.data.departements || [];
        const fetchedSpecialites = res.data.specialites || [];

        const uniqueFacultes = [...new Map(fetchedFacultes.map(f => [f.ID_faculte, f])).values()];
        const uniqueDepartements = [...new Map(fetchedDepartements.map(d => [d.ID_departement, d])).values()];
        const uniqueSpecialites = [...new Map(fetchedSpecialites.map(s => [s.ID_specialite, s])).values()];

        console.log('Facultés uniques chargées :', uniqueFacultes);
        console.log('Départements uniques chargés :', uniqueDepartements);
        console.log('Spécialités uniques chargées :', uniqueSpecialites);

        console.log('Mise à jour des états :', { facultes: uniqueFacultes, departements: uniqueDepartements, specialites: uniqueSpecialites });

        setFacultes(uniqueFacultes);
        setDepartements(uniqueDepartements);
        setSpecialites(uniqueSpecialites);
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || 'Impossible de charger les filtres. Veuillez réessayer.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
          icon: '❌',
        });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const updatedFilters = { ...prev, [name]: value };

      if (name === 'idFaculte') {
        updatedFilters.idDepartement = '';
        updatedFilters.idSpecialite = '';
      } else if (name === 'idDepartement') {
        updatedFilters.idSpecialite = '';
      }

      console.log('Filtres mis à jour :', updatedFilters);
      return updatedFilters;
    });
  };

  const handleFilterSubmit = async () => {
    if (!filters.niveau || !filters.idFaculte || !filters.idDepartement || !filters.idSpecialite) {
      toast.error('Veuillez remplir tous les champs de filtrage.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
      });
      return;
    }

    try {
      const res = await axios.post('http://localhost:8081/listeETD/etudiants/filtrer', {
        niveau: filters.niveau,
        idFaculte: parseInt(filters.idFaculte),
        idDepartement: parseInt(filters.idDepartement),
        idSpecialite: parseInt(filters.idSpecialite),
      });

      console.log('Réponse du filtrage :', res.data);

      if (res.data.message) {
        onFilter(res.data, filters);
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        onFilter(res.data, filters);
      } else {
        onFilter({ message: 'Aucune section trouvée avec ces critères.' }, filters);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors du filtrage. Veuillez réessayer.';
      console.error('Erreur lors du filtrage :', err);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  const filteredDepartements = departements.filter(d => {
    const matches = !filters.idFaculte || d.ID_faculte === parseInt(filters.idFaculte);
    console.log(`Filtrage département : ID_faculte=${d.ID_faculte}, filters.idFaculte=${filters.idFaculte}, matches=${matches}`);
    return matches;
  });

  const filteredSpecialites = specialites.filter(s => {
    const matches = !filters.idDepartement || s.ID_departement === parseInt(filters.idDepartement);
    console.log(`Filtrage spécialité : ID_departement=${s.ID_departement}, filters.idDepartement=${filters.idDepartement}, matches=${matches}`);
    return matches;
  });

  return (
    <div id="listetudiants">
    <div className="filter-panel">
      <h3>Filtrer les sections <FaSearch style={{ color: iconColor, fill: iconColor, verticalAlign: 'middle' }} /></h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <select
          name="niveau"
          value={filters.niveau}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Sélectionner un niveau --</option>
          {['L1', 'L2', 'L3', 'M1', 'M2'].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select
          name="idFaculte"
          value={filters.idFaculte}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">-- Sélectionner une faculté --</option>
          {facultes.map(f => {
            console.log(`Rendu faculté : ID=${f.ID_faculte}, nom=${f.nom_faculte}`);
            return (
              <option key={f.ID_faculte} value={f.ID_faculte}>
                {f.nom_faculte}
              </option>
            );
          })}
        </select>

        <select
          name="idDepartement"
          value={filters.idDepartement}
          onChange={handleChange}
          className="filter-select"
          disabled={!filters.idFaculte}
        >
          <option value="">-- Sélectionner un département --</option>
          {filteredDepartements.length > 0 ? (
            filteredDepartements.map(d => {
              console.log(`Rendu département : ID=${d.ID_departement}, nom=${d.Nom_departement}`);
              return (
                <option key={d.ID_departement} value={d.ID_departement}>
                  {d.Nom_departement || 'Nom non défini'}
                </option>
              );
            })
          ) : (
            <option value="" disabled>Aucun département disponible</option>
          )}
        </select>

        <select
          name="idSpecialite"
          value={filters.idSpecialite}
          onChange={handleChange}
          className="filter-select"
          disabled={!filters.idDepartement}
        >
          <option value="">-- Sélectionner une spécialité --</option>
          {filteredSpecialites.length > 0 ? (
            filteredSpecialites.map(s => {
              console.log(`Rendu spécialité : ID=${s.ID_specialite}, nom=${s.nom_specialite}`);
              return (
                <option key={s.ID_specialite} value={s.ID_specialite}>
                  {s.nom_specialite || 'Nom non défini'}
                </option>
              );
            })
          ) : (
            <option value="" disabled>Aucune spécialité disponible</option>
          )}
        </select>

        <button onClick={handleFilterSubmit} className="filter-btn">
          <FaFilter /> Filtrer
        </button>
      </div>
    </div>
    </div>
  );
};

export default FilterPanel;