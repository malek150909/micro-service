import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom'; // Ajouter cette importation
import TimetableDisplay from './TimetableDisplay';
import styles from '../ADM_EDT.module.css';
import { FaHome, FaFilePdf, FaFileExcel } from 'react-icons/fa';

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
  const [semestre, setSemestre] = useState('');
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const semestreOptions = {
    L1: ['1', '2'],
    L2: ['3', '4'],
    L3: ['5', '6'],
  };

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
        const response = await fetch('http://courses.localhost/timetable/filter-options');
        const text = await response.text();
        console.log('Raw response from /timetable/filter-options (niveaux):', text);
        const data = safeParseJson(text, '/timetable/filter-options');
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
    setSemestre('');
  }, [niveau]);

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
        const response = await fetch(`http://courses.localhost/timetable/filter-options?niveau=${niveau}`);
        const text = await response.text();
        console.log(`Raw response from /timetable/filter-options?niveau=${niveau}:`, text);
        const data = safeParseJson(text, `/timetable/filter-options?niveau=${niveau}`);
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
        const response = await fetch(`http://courses.localhost/timetable/filter-options?niveau=${niveau}&faculte=${facultyId}`);
        const text = await response.text();
        console.log(`Raw response from /timetable/filter-options?faculte=${facultyId}:`, text);
        const data = safeParseJson(text, `/timetable/filter-options?faculte=${facultyId}`);
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
        const response = await fetch(`http://courses.localhost/timetable/filter-options?niveau=${niveau}&faculte=${facultyId}&departement=${departmentId}`);
        const text = await response.text();
        console.log(`Raw response from /timetable/filter-options?departement=${departmentId}:`, text);
        const data = safeParseJson(text, `/timetable/filter-options?departement=${departmentId}`);
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
        const response = await fetch(`http://courses.localhost/timetable/filter-options?niveau=${niveau}&faculte=${facultyId}&departement=${departmentId}&specialite=${specialtyId}`);
        const text = await response.text();
        console.log(`Raw response from /timetable/filter-options?specialite=${specialtyId}:`, text);
        const data = safeParseJson(text, `/timetable/filter-options?specialite=${specialtyId}`);
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
    if (!sectionId || !semestre) {
      setTimetable({});
      return;
    }
    try {
      const response = await fetch(`http://courses.localhost/timetable/timetable?sectionId=${sectionId}&semestre=${semestre}`);
      const text = await response.text();
      console.log(`Raw response from /timetable/timetable?sectionId=${sectionId}:`, text);
      const data = safeParseJson(text, `/timetable/timetable?sectionId=${sectionId}`);
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
    if (sectionId && semestre) fetchTimetable();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTimetable();
  };

  const handleGenerateTimetables = () => {
    setShowModal(true);
  };

  const handleModalChoice = async (choice) => {
    setShowModal(false);
    const semestreGroup = choice ? '1' : '2';
    try {
      setError(null);
      const response = await fetch('http://courses.localhost/timetable/generate-timetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semestreGroup }),
      });
      const data = await response.json();
      if (data.success) {
        console.log('Timetables generated successfully for semestre group:', semestreGroup);
        if (sectionId && semestre) fetchTimetable();
        alert(`Emplois du temps générés avec succès pour le groupe de semestres ${semestreGroup} !`);
      } else {
        setError(data.error || 'Erreur lors de la génération des emplois du temps');
      }
    } catch (err) {
      setError(`Erreur réseau: ${err.message}`);
    }
  };

  // Fonction pour rendre le modal
  const renderModal = () => {
    if (!showModal) return null;

    return ReactDOM.createPortal(
      <div className={styles['ADM-EDT-modal-overlay']}>
        <div className={styles['ADM-EDT-modal-content']}>
          <h3>Génération des emplois</h3>
          <p>Génération pour semestre 1 ou semestre 2 ?</p>
          <div className={styles['ADM-EDT-modal-actions']}>
            <button onClick={() => handleModalChoice(true)} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-save']}`}>
              Semestre 1
            </button>
            <button onClick={() => handleModalChoice(false)} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-save']}`}>
              Semestre 2
            </button>
            <button onClick={() => setShowModal(false)} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-cancel']}`}>
              Annuler
            </button>
          </div>
        </div>
      </div>,
      document.body // Rendre le modal directement dans document.body
    );
  };

  return (
    <div>
      <div className={styles['ADM-EDT-background-shapes']}>
        <div className={`${styles['ADM-EDT-shape']} ${styles['ADM-EDT-shape1']}`}></div>
        <div className={`${styles['ADM-EDT-shape']} ${styles['ADM-EDT-shape2']}`}></div>
      </div>
      <div className={styles['ADM-EDT-sidebar']}>
        <div className={styles['ADM-EDT-logo']}>
          <h2>Emplois Du Temps</h2>
        </div>
        <button className={styles['ADM-EDT-sidebar-button']} onClick={() => navigate('/admin')}>
          <FaHome /> Retour à l'accueil
        </button> 
        <button
          type="button"
          onClick={handleGenerateTimetables}
          className={`${styles['ADM-EDT-sidebar-button']} ${styles['ADM-EDT-generate-btn']}`}
        >
          Générer tous les emplois
        </button>
      </div>
      <div className={styles['ADM-EDT-timetable-filter-container']}>
        <h2 className={styles['ADM-EDT-timetable-filter-title']}>Filtrer l’Emploi du Temps</h2>
        <form onSubmit={handleSubmit} className={styles['ADM-EDT-timetable-filter-form']}>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Niveau:</label>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
              <option value="">Sélectionner un niveau</option>
              {niveaux.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Faculté:</label>
            <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} disabled={!niveau}>
              <option value="">Sélectionner une faculté</option>
              {faculties.map(faculty => (
                <option key={faculty.ID_faculte} value={faculty.ID_faculte}>{faculty.nom_faculte}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Département:</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!facultyId}>
              <option value="">Sélectionner un département</option>
              {departments.map(department => (
                <option key={department.ID_departement} value={department.ID_departement}>{department.Nom_departement}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Spécialité:</label>
            <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} disabled={!departmentId}>
              <option value="">Sélectionner une spécialité</option>
              {specialties.map(specialty => (
                <option key={specialty.ID_specialite} value={specialty.ID_specialite}>{specialty.nom_specialite}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Section:</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!specialtyId}>
              <option value="">Sélectionner une section</option>
              {sections.map(section => (
                <option key={section.ID_section} value={section.ID_section}>{section.nom_section}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-group']}>
            <label>Semestre:</label>
            <select
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              disabled={!niveau || !semestreOptions[niveau]}
            >
              <option value="">Sélectionner un semestre</option>
              {niveau && semestreOptions[niveau]?.map(s => (
                <option key={s} value={s}>{`Semestre ${s}`}</option>
              ))}
            </select>
          </div>
          <div className={styles['ADM-EDT-form-buttons']}>
            <button type="submit" className={styles['ADM-EDT-timetable-filter-btn']} disabled={!sectionId || !semestre}>
              Filtrer
            </button>
          </div>
        </form>

        {error && <p className={styles['ADM-EDT-timetable-filter-error']}>{error}</p>}
        <TimetableDisplay
          timetable={timetable}
          sectionId={sectionId}
          niveau={niveau}
          semestre={semestre}
          onRefresh={handleRefresh}
        />
      </div>
      {renderModal()} {/* Ajouter le rendu du modal ici */}
    </div>
  );
}

export default TimetableFilter;