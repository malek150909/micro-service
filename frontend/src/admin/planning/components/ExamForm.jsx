import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ExamForm = ({ onAdd, disabled, modules, salles: initialSalles, semestres, sectionId, selectedSemestre, onFilterReset }) => {
  const [examData, setExamData] = useState({
    ID_module: '',
    ID_section: sectionId || '',
    exam_date: '',
    time_slot: '',
    ID_salle: '',
    ID_semestre: selectedSemestre || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [salles, setSalles] = useState(initialSalles);

  // Reset form when filter changes
  useEffect(() => {
    if (onFilterReset) {
      setExamData({
        ID_module: '',
        ID_section: sectionId || '',
        exam_date: '',
        time_slot: '',
        ID_salle: '',
        ID_semestre: selectedSemestre || '',
      });
    }
  }, [sectionId, selectedSemestre, onFilterReset]);

  useEffect(() => {
    const fetchSalles = async () => {
      if (examData.exam_date && examData.time_slot) {
        try {
          const response = await axios.get('http://localhost:8083/exams/salles', {
            params: {
              exam_date: examData.exam_date,
              time_slot: examData.time_slot,
            },
          });
          setSalles(response.data);
        } catch (err) {
          console.error('Erreur de récupération des salles:', err);
        }
      } else {
        setSalles(initialSalles);
      }
    };
    fetchSalles();
  }, [examData.exam_date, examData.time_slot, initialSalles]);

  const handleChange = (e) => {
    setExamData({ ...examData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!disabled && examData.ID_section) {
      try {
        await onAdd(examData);
        setExamData({
          ID_module: '',
          ID_section: sectionId || '',
          exam_date: '',
          time_slot: '',
          ID_salle: '',
          ID_semestre: selectedSemestre || '',
        });
        setErrorMessage('');
      } catch (err) {
        setErrorMessage(err.message || 'Une erreur est survenue lors de l’ajout de l’examen.');
        setShowErrorModal(true);
      }
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Ajouter un Nouvel Examen</h3>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="ID_section" value={examData.ID_section} />
        <select name="ID_module" value={examData.ID_module} onChange={handleChange} required disabled={disabled}>
          <option value="">Sélectionner un Module</option>
          {modules.map((module, index) => (
            <option key={`${module.ID_module}-${index}`} value={module.ID_module}>
              {module.nom_module}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="exam_date"
          value={examData.exam_date}
          onChange={handleChange}
          required
          disabled={disabled}
        />
        <select name="time_slot" value={examData.time_slot} onChange={handleChange} required disabled={disabled}>
          <option value="">Sélectionner un Horaire</option>
          {['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'].map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        <select name="ID_salle" value={examData.ID_salle} onChange={handleChange} required disabled={disabled}>
          <option value="">Sélectionner une Salle</option>
          {salles.map((salle, index) => (
            <option key={`${salle.ID_salle}-${index}`} value={salle.ID_salle} disabled={!salle.available}>
              {salle.ID_salle} (Capacité: {salle.capacite}) {salle.available ? '' : '- Indisponible'}
            </option>
          ))}
        </select>
        <button type="submit" disabled={disabled}>Ajouter Examen</button>
      </form>

      {showErrorModal && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Erreur</h3>
            <p>{errorMessage}</p>
            <div className="modal-actions">
              <button onClick={() => setShowErrorModal(false)}>Fermer</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExamForm;