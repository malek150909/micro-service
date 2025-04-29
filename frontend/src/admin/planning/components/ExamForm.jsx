import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { FaPlusCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import "../exam.css";

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

  const isFormDisabled = !sectionId || !isFilterApplied;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => {
      // If mode changes to "en ligne", clear the selected rooms
      if (name === 'mode' && value === 'en ligne') {
        return { ...prev, [name]: value, ID_salles: [] };
      }
      return { ...prev, [name]: value };
    });
    setErrorMessage('');
  };

  const handleSalleChange = (salleId) => {
    if (examData.mode === 'en ligne' || isFormDisabled) return;
    setExamData((prev) => {
      const ID_salles = prev.ID_salles.includes(salleId)
        ? prev.ID_salles.filter((id) => id !== salleId)
        : [...prev.ID_salles, salleId];
      return { ...prev, ID_salles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormDisabled || disabled) return;
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

  const toggleSalleDropdown = () => {
    if (examData.mode === 'en ligne' || isFormDisabled) return;
    setIsSalleDropdownOpen((prev) => !prev);
  };

  return (
    <>
      <motion.div
        className={`ADM-EXM-form-container ${isFormDisabled ? 'ADM-EXM-disabled' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h3>
          <FaPlusCircle style={{ marginRight: '8px' }} /> Ajouter un Nouvel Examen
        </h3>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="ID_section" value={examData.ID_section} />
          <select
            name="ID_module"
            value={examData.ID_module}
            onChange={handleChange}
            required
            disabled={isFormDisabled || disabled}
            className="ADM-EXM-select"
          >
            <option value="">Sélectionner un Module</option>
            {modules.map((module, index) => (
              <option key={`${module.ID_module}-${index}`} value={module.ID_module}>
                {`${module.nom_module}`}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="exam_date"
            value={examData.exam_date}
            onChange={handleChange}
            required
            disabled={isFormDisabled || disabled}
            className="ADM-EXM-input"
          />
          <select
            name="time_slot"
            value={examData.time_slot}
            onChange={handleChange}
            required
            disabled={isFormDisabled || disabled}
            className="ADM-EXM-select"
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
            name="mode"
            value={examData.mode}
            onChange={handleChange}
            required
            disabled={isFormDisabled || disabled}
            className="ADM-EXM-select"
          >
            <option value="presentiel">Présentiel</option>
            <option value="en ligne">En Ligne</option>
          </select>
          <div className={`ADM-EXM-custom-dropdown ${isSalleDropdownOpen ? 'ADM-EXM-open' : ''} ${examData.mode === 'en ligne' || isFormDisabled ? 'ADM-EXM-disabled' : ''}`}>
            <div className="ADM-EXM-dropdown-header" onClick={toggleSalleDropdown}>
              <span>
                {examData.ID_salles.length > 0
                  ? `${examData.ID_salles.length} salle(s) sélectionnée(s)`
                  : 'Sélectionner des Salles'}
              </span>
              {isSalleDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            <div className={`ADM-EXM-dropdown-menu ${isSalleDropdownOpen && examData.mode === 'presentiel' && !isFormDisabled ? 'ADM-EXM-dropdown-visible' : ''}`}>
              {salles.map((salle, index) => (
                <label
                  key={`${salle.ID_salle}-${index}`}
                  className="ADM-EXM-checkbox-label"
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
          </div>
          <button type="submit" disabled={isFormDisabled || disabled}>
            <FaPlusCircle style={{ marginRight: '8px' }} /> Ajouter Examen
          </button>
        </form>
      </motion.div>

      {showErrorModal && createPortal(
        <motion.div
          className="ADM-EXM-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <motion.div
            className="ADM-EXM-modal-content ADM-EXM-error-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <h3>Erreur</h3>
            <p>{errorMessage}</p>
            <div className="ADM-EXM-modal-actions">
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