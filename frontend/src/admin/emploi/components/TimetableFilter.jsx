// src/components/TimetableFilter.jsx
import { useState, useEffect } from 'react';
import TimetableDisplay from './TimetableDisplay';
import '../../../admin_css_files/TimetableFilter.css';

function TimetableFilter() {
  const [niveaux, setNiveaux] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [sections, setSections] = useState([]);
  const [niveau, setNiveau] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [timetable, setTimetable] = useState({});
  const [error, setError] = useState(null);

  const safeParseJson = (text, endpoint) => {
    try {
      if (!text || text.trim() === '') {
        throw new Error(`Réponse vide de ${endpoint}`);
      }
      return JSON.parse(text);
    } catch (err) {
      console.error(`Erreur de parsing JSON pour ${endpoint}:`, err.message, 'Raw:', text);
      return { success: false, error: `Réponse invalide de ${endpoint}` };
    }
  };

  useEffect(() => {
    const fetchNiveaux = async () => {
      try {
        const response = await fetch('http://localhost:8083/api/filter-options'); // Ajout de /api
        const text = await response.text();
        console.log('Raw response from /api/filter-options (niveaux):', text);
        const data = safeParseJson(text, '/api/filter-options');
        if (data.success) {
          setNiveaux(data.options.niveaux || []);
          setError(null);
        } else {
          setError(data.error || 'Erreur lors du chargement des niveaux');
        }
      } catch (err) {
        setError(`Erreur réseau: ${err.message}`);
      }
    };
    fetchNiveaux();
  }, []);

  useEffect(() => {
    if (!niveau) {
      setFaculties([]);
      setFacultyId('');
      setDepartments([]);
      setDepartmentId('');
      setSpecialties([]);
      setSpecialtyId('');
      setSections([]);
      setSectionId('');
      setTimetable({});
      return;
    }
    const fetchFaculties = async () => {
      try {
        const response = await fetch(`http://localhost:8083/api/filter-options?niveau=${niveau}`);
        const text = await response.text();
        console.log(`Raw response from /api/filter-options?niveau=${niveau}:`, text);
        const data = safeParseJson(text, `/api/filter-options?niveau=${niveau}`);
        if (data.success) {
          setFaculties(data.options.facultes || []);
          setFacultyId('');
          setDepartments([]);
          setDepartmentId('');
          setSpecialties([]);
          setSpecialtyId('');
          setSections([]);
          setSectionId('');
          setTimetable({});
          setError(null);
        } else {
          setError(data.error || 'Erreur lors du chargement des facultés');
        }
      } catch (err) {
        setError(`Erreur réseau: ${err.message}`);
      }
    };
    fetchFaculties();
  }, [niveau]);

  useEffect(() => {
    if (!facultyId) {
      setDepartments([]);
      setDepartmentId('');
      setSpecialties([]);
      setSpecialtyId('');
      setSections([]);
      setSectionId('');
      setTimetable({});
      return;
    }
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`http://localhost:8083/api/filter-options?niveau=${niveau}&faculte=${facultyId}`);
        const text = await response.text();
        console.log(`Raw response from /api/filter-options?faculte=${facultyId}:`, text);
        const data = safeParseJson(text, `/api/filter-options?faculte=${facultyId}`);
        if (data.success) {
          setDepartments(data.options.departements || []);
          setDepartmentId('');
          setSpecialties([]);
          setSpecialtyId('');
          setSections([]);
          setSectionId('');
          setTimetable({});
          setError(null);
        } else {
          setError(data.error || 'Erreur lors du chargement des départements');
        }
      } catch (err) {
        setError(`Erreur réseau: ${err.message}`);
      }
    };
    fetchDepartments();
  }, [facultyId, niveau]);

  useEffect(() => {
    if (!departmentId) {
      setSpecialties([]);
      setSpecialtyId('');
      setSections([]);
      setSectionId('');
      setTimetable({});
      return;
    }
    const fetchSpecialties = async () => {
      try {
        const response = await fetch(`http://localhost:8083/api/filter-options?niveau=${niveau}&faculte=${facultyId}&departement=${departmentId}`);
        const text = await response.text();
        console.log(`Raw response from /api/filter-options?departement=${departmentId}:`, text);
        const data = safeParseJson(text, `/api/filter-options?departement=${departmentId}`);
        if (data.success) {
          setSpecialties(data.options.specialites || []);
          setSpecialtyId('');
          setSections([]);
          setSectionId('');
          setTimetable({});
          setError(null);
        } else {
          setError(data.error || 'Erreur lors du chargement des spécialités');
        }
      } catch (err) {
        setError(`Erreur réseau: ${err.message}`);
      }
    };
    fetchSpecialties();
  }, [departmentId, niveau, facultyId]);

  useEffect(() => {
    if (!specialtyId) {
      setSections([]);
      setSectionId('');
      setTimetable({});
      return;
    }
    const fetchSections = async () => {
      try {
        const response = await fetch(`http://localhost:8083/api/filter-options?niveau=${niveau}&faculte=${facultyId}&departement=${departmentId}&specialite=${specialtyId}`);
        const text = await response.text();
        console.log(`Raw response from /api/filter-options?specialite=${specialtyId}:`, text);
        const data = safeParseJson(text, `/api/filter-options?specialite=${specialtyId}`);
        if (data.success) {
          setSections(data.options.sections || []);
          setSectionId('');
          setTimetable({});
          setError(null);
        } else {
          setError(data.error || 'Erreur lors du chargement des sections');
        }
      } catch (err) {
        setError(`Erreur réseau: ${err.message}`);
      }
    };
    fetchSections();
  }, [specialtyId, niveau, facultyId, departmentId]);

  const fetchTimetable = async () => {
    if (!sectionId) {
      setTimetable({});
      return;
    }
    try {
      const response = await fetch(`http://localhost:8083/api/timetable?sectionId=${sectionId}`); // Ajout de /api
      const text = await response.text();
      console.log(`Raw response from /api/timetable?sectionId=${sectionId}:`, text);
      const data = safeParseJson(text, `/api/timetable?sectionId=${sectionId}`);
      console.log('Fetched data in TimetableFilter:', data);
      if (data.success && Object.keys(data.timetable).length > 0) {
        setTimetable(data.timetable);
        setError(null);
      } else {
        setTimetable({});
        setError(data.error || 'Aucune donnée trouvée pour cette section');
      }
    } catch (err) {
      setTimetable({});
      setError(`Erreur réseau: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    if (sectionId) fetchTimetable();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTimetable();
  };

  return (
    <div className="timetable-filter-container">
      <h2 className="timetable-filter-title">Filtrer l’Emploi du Temps</h2>
      <form onSubmit={handleSubmit} className="timetable-filter-form">
        <div className="form-group">
          <label>Niveau:</label>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
            <option value="">Sélectionner un niveau</option>
            {niveaux.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Faculté:</label>
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} disabled={!niveau}>
            <option value="">Sélectionner une faculté</option>
            {faculties.map(faculty => (
              <option key={faculty.ID_faculte} value={faculty.ID_faculte}>{faculty.nom_faculte}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Département:</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!facultyId}>
            <option value="">Sélectionner un département</option>
            {departments.map(department => (
              <option key={department.ID_departement} value={department.ID_departement}>{department.Nom_departement}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Spécialité:</label>
          <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} disabled={!departmentId}>
            <option value="">Sélectionner une spécialité</option>
            {specialties.map(specialty => (
              <option key={specialty.ID_specialite} value={specialty.ID_specialite}>{specialty.nom_specialite}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Section:</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!specialtyId}>
            <option value="">Sélectionner une section</option>
            {sections.map(section => (
              <option key={section.ID_section} value={section.ID_section}>{section.num_section}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="timetable-filter-btn" disabled={!sectionId}>
          Filtrer
        </button>
      </form>
      {error && <p className="timetable-filter-error">{error}</p>}
      <TimetableDisplay timetable={timetable} sectionId={sectionId} onRefresh={handleRefresh} />
    </div>
  );
}

export default TimetableFilter;