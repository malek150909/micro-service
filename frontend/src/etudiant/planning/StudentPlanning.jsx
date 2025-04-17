import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaUser, FaTable, FaPen, FaCalendarAlt, FaClock } from 'react-icons/fa';
import styles from './StudentPlanning.module.css';

function StudentPlanning() {
  const [exams, setExams] = useState([]);
  const [modules, setModules] = useState([]);
  const [allExamsAvailable, setAllExamsAvailable] = useState(true);
  const [semesterSelected, setSemesterSelected] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sectionId, setSectionId] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const navigate = useNavigate();

  // Récupérer les données de l'utilisateur depuis localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const matricule = userData?.Matricule;

  // Récupérer sectionId et niveau au montage du composant
  useEffect(() => {
    if (!matricule) {
      console.log('Matricule absent, redirection vers /');
      navigate('/');
      return;
    }

    // Appeler l'API studentPlanning/login pour récupérer sectionId et niveau
    const fetchStudentData = async () => {
      try {
        console.log('Appel API /studentPlanning/login avec matricule:', matricule);
        const response = await axios.post('http://localhost:8083/studentPlanning/login', {
          matricule,
        });
        console.log('Réponse API /studentPlanning/login:', response.data);
        const { sectionId, niveau } = response.data;
        if (!sectionId || !niveau) {
          console.error('sectionId ou niveau manquant dans la réponse:', response.data);
          navigate('/');
          return;
        }
        setSectionId(sectionId);
        setNiveau(niveau);
        setIsMounted(true);
      } catch (err) {
        console.error('Erreur lors de la récupération des données étudiant:', err.response?.data || err.message);
        navigate('/');
      }
    };

    fetchStudentData();
  }, [matricule, navigate]);

  const fetchExams = async (semester) => {
    if (!sectionId) {
      console.log('sectionId non disponible, fetchExams annulé');
      return;
    }

    // Convertir semester en entier pour correspondre à ID_semestre
    const semesterInt = parseInt(semester, 10);

    try {
      console.log('Appel API /studentPlanning/exams avec:', { sectionId, semester: semesterInt });
      const response = await axios.get('http://localhost:8083/studentPlanning/exams', {
        params: { sectionId, semester: semesterInt },
      });
      console.log('Réponse API /studentPlanning/exams:', response.data);

      // Vérifier si des données sont renvoyées
      if (!response.data.exams || !response.data.modules) {
        console.warn('Données exams ou modules absentes dans la réponse');
      }

      // Grouper les examens par ID_exam et combiner nom_salle
      const groupedExams = response.data.exams.reduce((acc, exam) => {
        const existingExam = acc.find((e) => e.ID_exam === exam.ID_exam);
        if (existingExam) {
          if (existingExam.mode !== 'en ligne' && exam.mode !== 'en ligne') {
            existingExam.nom_salle = existingExam.nom_salle
              ? `${existingExam.nom_salle} + ${exam.nom_salle || 'N/A'}`
              : exam.nom_salle || 'N/A';
          }
        } else {
          acc.push({ ...exam });
        }
        return acc;
      }, []);

      console.log('Examens groupés:', groupedExams);
      console.log('Modules:', response.data.modules);
      console.log('allExamsAvailable:', response.data.allExamsAvailable);

      setExams(groupedExams);
      setModules(response.data.modules);
      setAllExamsAvailable(response.data.allExamsAvailable);
      setSemesterSelected(true);
      setSelectedSemester(semester);
    } catch (err) {
      console.error('Erreur lors de la récupération des examens:', err.response?.data || err.message);
      setExams([]);
      setModules([]);
      setAllExamsAvailable(false);
      setSemesterSelected(true);
      setSelectedSemester(semester);
    }
  };

  const handleSemesterClick = (semester) => {
    console.log('Clic sur semestre:', semester);
    fetchExams(semester);
  };

  // Déterminer les boutons de semestre en fonction du niveau
  let semesterButtons;
  switch (niveau) {
    case 'L1':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('1')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('2')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
    case 'L2':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('3')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 3
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('4')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 4
          </button>
        </>
      );
      break;
    case 'L3':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('5')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 5
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('6')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 6
          </button>
        </>
      );
      break;
    case 'ING1':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('1')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('2')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
    case 'ING2':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('3')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 3
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('4')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 4
          </button>
        </>
      );
      break;
    case 'M1':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('1')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('2')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
    case 'M2':
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('3')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 3
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('4')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 4
          </button>
        </>
      );
      break;
    default:
      semesterButtons = (
        <>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('1')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 1
          </button>
          <button className={styles['sp-sidebar-button']} onClick={() => handleSemesterClick('2')}>
            <FaCalendarAlt className={styles['sp-sidebar-icon']} /> Semestre 2
          </button>
        </>
      );
      break;
  }

  return (
    <div className={styles['sp-container']}>
      <div className={styles['sp-background-shapes']}>
        <div className={`${styles['sp-shape']} ${styles['sp-shape1']}`}></div>
        <div className={`${styles['sp-shape']} ${styles['sp-shape2']}`}></div>
      </div>
      <div className={styles['sp-sidebar']}>
        <div className={styles['sp-logo']}>
          <h2>Planning Des Examens</h2>
        </div>
        <button className={styles['sp-sidebar-button']} onClick={() => navigate('/etudiant')}>
          <FaHome className={styles['sp-sidebar-icon']} /> Retour à l'accueil
        </button>
        {semesterButtons}
      </div>
      <div className={styles['sp-main-content']}>
        <div className={`${styles['sp-header']} ${isMounted ? 'animate-in' : ''}`}>
          <h1>
            <FaTable style={{ marginRight: '10px' }} /> Planning des Examens
          </h1>
          <p>Consultez le planning des examens de vos modules</p>
        </div>
        <div className={`${styles['sp-document-list']} ${isMounted ? 'animate-in' : ''}`}>
          <h3>
            <FaClock style={{ marginRight: '10px' }} />
            Examens : Semestre {selectedSemester || '?'}
          </h3>
          {!sectionId ? (
            <div className={styles['sp-no-results']}>
              Chargement des données de l'étudiant...
            </div>
          ) : !semesterSelected ? (
            <div className={styles['sp-no-results']}>
              Veuillez sélectionner un semestre pour consulter le planning
            </div>
          ) : exams.length === 0 ? (
            <div className={styles['sp-no-results']}>
              Aucun examen trouvé pour ce semestre
            </div>
          ) : (
            <table className={styles['sp-exam-table']}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Horaire</th>
                  <th>Module</th>
                  <th>Salle</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.ID_exam}>
                    <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                    <td>{exam.time_slot}</td>
                    <td>{exam.nom_module}</td>
                    <td>{exam.mode === 'en ligne' ? 'En ligne' : (exam.nom_salle || 'N/A')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPlanning;