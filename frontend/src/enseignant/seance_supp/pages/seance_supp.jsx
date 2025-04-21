import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaFilter, FaPlus, FaUser, FaHome } from 'react-icons/fa';
import SectionSelector from '../components/SectionSelector';
import Timetable from '../components/Timetable';
import AddSession from '../components/AddSession';
import styles from "../css/seance_supp.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const matricule = storedUser?.Matricule;
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionTimetable, setSectionTimetable] = useState({ regular: [], supplementary: [] });
  const [profTimetable, setProfTimetable] = useState({ regular: [], supplementary: [] });
  const [error, setError] = useState('');

  const fetchSections = async () => {
    if (matricule) {
      try {
        const response = await fetch(`http://courses.localhost/SUPPprof/sections/${matricule}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        const fetchedSections = await response.json();
        setSections(fetchedSections);
        const updatedUser = { ...storedUser, sections: fetchedSections };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Erreur lors de la récupération des sections:', error);
        setError('Une erreur est survenue lors du chargement des sections.');
      }
    }
  };

  const fetchTimetables = async () => {
    if (selectedSection && matricule) {
      try {
        const response = await fetch(`http://courses.localhost/SUPPprof/timetables?matricule=${matricule}&sectionId=${selectedSection}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        setSectionTimetable({
          regular: data.sectionTimetable?.regular || [],
          supplementary: data.sectionTimetable?.supplementary || [],
        });
        setProfTimetable({
          regular: data.profTimetable?.regular || [],
          supplementary: data.profTimetable?.supplementary || [],
        });
        setError('');
      } catch (error) {
        console.error('Erreur lors de la récupération des emplois du temps:', error);
        setError('Une erreur est survenue lors du chargement des emplois du temps.');
      }
    }
  };

  useEffect(() => {
    fetchSections();
  }, [matricule]);

  useEffect(() => {
    fetchTimetables();
  }, [selectedSection, matricule]);

  if (!matricule) return <Navigate to="/" />;

  const handleHomeClick = () => navigate('/enseignant');

  return (
    <div className={styles['ENS-SUPP-container']}>
      <aside className={styles['ENS-SUPP-sidebar']}>
        <div className={styles['ENS-SUPP-logo']}>
          <h2>Séances Supplementaire</h2>
        </div>
        <button className={styles['ENS-SUPP-sidebar-button']} onClick={handleHomeClick}>
          <FaHome className={styles['ENS-SUPP-sidebar-icon']} />
          Retour à l'accueil
        </button>
      </aside>
      <main className={styles['ENS-SUPP-main-content']}>
        <header className={styles['ENS-SUPP-header']}>
          <h1>Gestion des séances</h1>
          <p>Gérez vos séances supplémentaires</p>
        </header>
        <div className={styles['ENS-SUPP-document-list']}>
          <h3>
            <FaFilter /> Sélectionner une section
          </h3>
          <SectionSelector sections={sections} onSelect={setSelectedSection} />
          {error && <div className={styles['ENS-SUPP-error-message']}>{error}</div>}
          {selectedSection && (
            <>
              <Timetable
                sectionTimetable={sectionTimetable}
                profTimetable={profTimetable}
                matricule={matricule}
                sectionId={selectedSection}
                onSessionModified={fetchTimetables}
              />
              <div className={styles['ENS-SUPP-add-session-wrapper']}>
                <h3>
                  <FaPlus /> Ajouter une séance supplémentaire
                </h3>
                <AddSession
                  matricule={matricule}
                  sectionId={selectedSection}
                  onSessionAdded={fetchTimetables}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;