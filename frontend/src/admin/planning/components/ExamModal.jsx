import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ExamModal = ({ exam, onClose, onSave, modules, salles: initialSalles, semestres }) => {
  const [formData, setFormData] = useState({
    ID_module: exam.ID_module,
    ID_section: exam.ID_section,
    exam_date: exam.exam_date, // Already in YYYY-MM-DD format
    time_slot: exam.time_slot,
    ID_salle: exam.ID_salle,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [salles, setSalles] = useState(initialSalles);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const fetchSalles = async () => {
      if (formData.exam_date && formData.time_slot) {
        try {
          const response = await axios.get('http://localhost:8083/exams/salles', {
            params: {
              exam_date: formData.exam_date,
              time_slot: formData.time_slot,
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
  }, [formData.exam_date, formData.time_slot, initialSalles]);

  useEffect(() => {
    const validateForm = async () => {
      try {
        const response = await axios.put(`http://localhost:8083/exams/${exam.ID_exam}`, {
          ...formData,
          ID_semestre: exam.ID_semestre,
        });
        setErrorMessage('');
        setIsValid(true);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Une erreur est survenue.');
        setIsValid(false);
      }
    };
    validateForm();
  }, [formData, exam.ID_exam, exam.ID_semestre]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (isValid) {
      // Ensure the exam_date is in YYYY-MM-DD format
      const normalizedFormData = {
        ...formData,
        exam_date: formData.exam_date, // Already in YYYY-MM-DD format from <input type="date">
        ID_semestre: exam.ID_semestre,
      };
      onSave(normalizedFormData);
      onClose();
    }
  };

  return (
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
        <h3>Détails de l'Examen</h3>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <div className="modal-field">
          <label>Module :</label>
          <select name="ID_module" value={formData.ID_module} onChange={handleChange} required>
            <option value="">Sélectionner un Module</option>
            {modules.map((module, index) => (
              <option key={`${module.ID_module}-${index}`} value={module.ID_module}>
                {module.nom_module}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label>Date :</label>
          <input
            type="date"
            name="exam_date"
            value={formData.exam_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="modal-field">
          <label>Horaire :</label>
          <select name="time_slot" value={formData.time_slot} onChange={handleChange} required>
            <option value="">Sélectionner un Horaire</option>
            {['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'].map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        <div className="modal-field">
          <label>Salle :</label>
          <select name="ID_salle" value={formData.ID_salle} onChange={handleChange} required>
            <option value="">Sélectionner une Salle</option>
            {salles.map((salle, index) => (
              <option key={`${salle.ID_salle}-${index}`} value={salle.ID_salle} disabled={!salle.available}>
                {salle.ID_salle} (Capacité: {salle.capacite || 'N/A'}) {salle.available ? '' : '- Indisponible'}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} disabled={!isValid}>Sauvegarder</button>
          <button onClick={onClose}>Annuler</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExamModal;