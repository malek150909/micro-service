// src/components/TimetableFilter.jsx
import React, { useState, useEffect } from 'react';
import TimetableDisplay from './TimetableDisplay';

function TimetableFilter() {
  const [filters, setFilters] = useState({
    faculte: '',
    departement: '',
    specialite: '',
    section: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    facultes: [],
    departements: [],
    specialites: [],
    sections: []
  });
  const [timetable, setTimetable] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8083/api/filter-options')
      .then(response => response.json())
      .then(data => {
        if (data.success) setFilterOptions(data.options);
      })
      .catch(err => setError(err.message));
  }, []);

  const fetchTimetable = () => {
    const queryString = new URLSearchParams({ ...filters, t: Date.now() }).toString();
    console.log('Fetching timetable with query:', queryString);
    fetch(`http://localhost:8083/api/timetable?${queryString}`)
      .then(response => {
        if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Timetable data received from Seance:', data);
        if (data.success) setTimetable(data.timetable);
        else setError('Données invalides');
      })
      .catch(error => setError(`Erreur: ${error.message}`));
  };

  const refreshTimetable = () => {
    console.log('Refreshing timetable');
    fetchTimetable();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTimetable();
  };

  return (
    <div>
      <h2>Filtres</h2>
      <form onSubmit={handleSubmit}>
        <select name="faculte" value={filters.faculte} onChange={handleFilterChange}>
          <option value="">Faculté</option>
          {filterOptions.facultes.map(f => <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>)}
        </select>
        <select name="departement" value={filters.departement} onChange={handleFilterChange}>
          <option value="">Département</option>
          {filterOptions.departements.map(d => <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>)}
        </select>
        <select name="specialite" value={filters.specialite} onChange={handleFilterChange}>
          <option value="">Spécialité</option>
          {filterOptions.specialites.map(s => <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>)}
        </select>
        <select name="section" value={filters.section} onChange={handleFilterChange}>
          <option value="">Section</option>
          {filterOptions.sections.map(s => <option key={s.ID_section} value={s.ID_section}>{s.num_section}</option>)}
        </select>
        <button type="submit">Afficher</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <TimetableDisplay timetable={timetable} sectionId={filters.section} onRefresh={refreshTimetable} />
    </div>
  );
}

export default TimetableFilter;