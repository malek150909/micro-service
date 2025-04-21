import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { FaPlusCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from "../exam.module.css";

const ExamForm = ({ onAdd, disabled, modules, salles: initialSalles, semestres, sectionId, selectedSemestre, onFilterReset, isFilterApplied }) => {
  const [examData, setExamData] = useState({
    ID_module: '',
    ID_section: sectionId || '',
    exam_date: '',
    time_slot: '',
    ID_salles: [],
    ID_semestre: selectedSemestre || '',
    mode: 'presentiel',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [salles, setSalles] = useState(initialSalles);
  const [isSalleDropdownOpen, setIsSalleDropdownOpen] = useState(false);

  // Determine if the form should be disabled
  const isFormDisabled = !sectionId || !isFilterApplied;

  // Reset form when sectionId changes or filters are reset
  useEffect(() => {
    setExamData({
      ID_module: '',
      ID_section: sectionId || '',
      exam_date: '',
      time_slot: '',
      ID_salles: [],
      ID_semestre: selectedSemestre || '',
      mode: 'presentiel',
    });
    setIsSalleDropdownOpen(false);
    setErrorMessage('');
  }, [sectionId, selectedSemestre, onFilterReset]);

  // Fetch available rooms based on date and time slot
  useEffect(() => {
    const fetchSalles = async () => {
      if (examData.exam_date && examData.time_slot && examData.mode === 'presentiel') {
        try {
          const response = await axios.get('http://courses.localhost/exams/salles', {
            params: {
              exam_date: examData.exam_date,
              time_slot: examData.time_slot,
            },
          });
          setSalles(response.data);
        } catch (err) {
          console.error('Erreur de récupération des salles:', err);
          setSalles(initialSalles);
        }
      } else {
        setSalles(initialSalles);
      }
    };
    fetchSalles();
  }, [examData.exam_date, examData.time_slot, examData.mode, initialSalles]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  // Handle room selection/deselection
  const handleSalleChange = (salleId) => {
    if (examData.mode === 'en ligne' || isFormDisabled) return; // Prevent changes if mode is "en ligne" or form is disabled
    setExamData((prev) => {
      const ID_salles = prev.ID_salles.includes(salleId)
        ? prev.ID_salles.filter((id) => id !== salleId)
        : [...prev.ID_salles, salleId];
      return { ...prev, ID_salles };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormDisabled || disabled) return; // Prevent submission if form is disabled
    try {
      await onAdd(examData);
      setExamData({
        ID_module: '',
        ID_section: sectionId || '',
        exam_date: '',
        time_slot: '',
        ID_salles: [],
        ID_semestre: selectedSemestre || '',
        mode: 'presentiel',
      });
      setErrorMessage('');
      setIsSalleDropdownOpen(false);
    } catch (err) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l’ajout de l’examen.');
      setShowErrorModal(true);
    }
  };

  // Toggle dropdown visibility
  const toggleSalleDropdown = () => {
    if (examData.mode === 'en ligne' || isFormDisabled) return; // Prevent toggling if mode is "en ligne" or form is disabled
    setIsSalleDropdownOpen((prev) => !prev);
  };

  return (
    <>
        <motion.div
          className={`${styles['ADM-EXM-form-container']} ${isFormDisabled ? styles['ADM-EXM-disabled'] : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h3>
            <FaPlusCircle style={{ marginRight: '8px' }} /> Ajouter un Nouvel Examen
          </h3>
          <form className={styles['ADM-EXM-form']} onSubmit={handleSubmit}>
            <input className={styles['ADM-EXM-input']} type="hidden" name="ID_section" value={examData.ID_section} />
            <select
              className={styles['ADM-EXM-select']}
              name="ID_module"
              value={examData.ID_module}
              onChange={handleChange}
              required
              disabled={isFormDisabled || disabled}
            >
              <option value="">Sélectionner un Module</option>
              {modules.map((module, index) => (
                <option key={`${module.ID_module}-${index}`} value={module.ID_module}>
                  {`${module.nom_module}`}
                </option>
              ))}
            </select>
            <input
              className={styles['ADM-EXM-input']}
              type="date"
              name="exam_date"
              value={examData.exam_date}
              onChange={handleChange}
              required
              disabled={isFormDisabled || disabled}
            />
            <select
              className={styles['ADM-EXM-select']}
              name="time_slot"
              value={examData.time_slot}
              onChange={handleChange}
              required
              disabled={isFormDisabled || disabled}
            >
              <option value="">Sélectionner un Horaire</option>
              {[
                '08:00 - 09:30',
                '09:40 - 11:10',
                '11:20 - 12:50',
                '13:00 - 14:30',
                '14:40 - 16:10',
                '16:20 - 17:50',
              ].map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <select
              className={styles['ADM-EXM-select']}
              name="mode"
              value={examData.mode}
              onChange={handleChange}
              required
              disabled={isFormDisabled || disabled}
            >
              <option value="presentiel">Présentiel</option>
              <option value="en ligne">En Ligne</option>
            </select>
            <div className={`${styles['ADM-EXM-custom-dropdown']} ${isSalleDropdownOpen ? styles['ADM-EXM-open'] : ''} ${examData.mode === 'en ligne' || isFormDisabled ? styles['ADM-EXM-disabled'] : ''}`}>
              <div className={styles['ADM-EXM-dropdown-header']} onClick={toggleSalleDropdown}>
                <span>
                  {examData.ID_salles.length > 0
                    ? `${examData.ID_salles.length} salle(s) sélectionnée(s)`
                    : 'Sélectionner des Salles'}
                </span>
                {isSalleDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {isSalleDropdownOpen && examData.mode === 'presentiel' && !isFormDisabled && (
                <div className={styles['ADM-EXM-dropdown-menu']}>
                  {salles.map((salle, index) => (
                    <label
                      key={`${salle.ID_salle}-${index}`}
                      className={styles['ADM-EXM-checkbox-label']}
                    >
                      <input
                        type="checkbox"
                        value={salle.ID_salle}
                        checked={examData.ID_salles.includes(String(salle.ID_salle))}
                        onChange={() => handleSalleChange(String(salle.ID_salle))}
                        disabled={!salle.available}
                      />
                      {salle.nom_salle} (Capacité: {salle.capacite}) {salle.available ? '' : '- Indisponible'}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={isFormDisabled || disabled}>
              <FaPlusCircle style={{ marginRight: '8px' }} /> Ajouter Examen
            </button>
          </form>
        </motion.div>

        {showErrorModal && createPortal(
          <motion.div
            className={styles['ADM-EXM-modal-overlay']}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div
              className={`${styles['ADM-EXM-modal-content']} ${styles['ADM-EXM-error-modal']}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h3>Erreur</h3>
              <p>{errorMessage}</p>
              <div className={styles['ADM-EXM-modal-actions']}>
                <button onClick={() => setShowErrorModal(false)}>Fermer</button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
    </>
  );
};

export default ExamForm;