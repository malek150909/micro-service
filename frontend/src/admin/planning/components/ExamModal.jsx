import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../../../admin_css_files/exam.css';

const ExamModal = ({ exam, onClose, onSave, modules, salles: initialSalles, semestres }) => {
  const [formData, setFormData] = useState({
    ID_module: exam.ID_module || '',
    ID_section: exam.ID_section || '',
    exam_date: exam.exam_date || '',
    time_slot: exam.time_slot || '',
    ID_salles: exam.nom_salle
      ? exam.nom_salle.split(' + ').map((name) => {
          const salle = initialSalles.find((s) => s.nom_salle === name);
          return salle ? String(salle.ID_salle) : '';
        }).filter((id) => id)
      : [],
    mode: exam.mode || 'presentiel',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [salles, setSalles] = useState(initialSalles);
  const [isValid, setIsValid] = useState(true);
  const [isSalleDropdownOpen, setIsSalleDropdownOpen] = useState(false);

  // Fetch available rooms based on date and time slot
  useEffect(() => {
    const fetchSalles = async () => {
      if (formData.exam_date && formData.time_slot && formData.mode === 'presentiel') {
        try {
          const response = await axios.get('http://localhost:8800/exams/salles', {
            params: {
              exam_date: formData.exam_date,
              time_slot: formData.time_slot,
              exclude_exam_id: exam.ID_exam, // Exclude the current exam to allow its rooms to be available
            },
          });
          // Ensure pre-selected rooms are marked as available
          const updatedSalles = response.data.map((salle) => {
            if (formData.ID_salles.includes(String(salle.ID_salle))) {
              return { ...salle, available: true };
            }
            return salle;
          });
          setSalles(updatedSalles);
        } catch (err) {
          console.error('Erreur de récupération des salles:', err);
          setSalles(initialSalles);
        }
      } else {
        setSalles(initialSalles);
      }
    };
    fetchSalles();
  }, [formData.exam_date, formData.time_slot, formData.mode, initialSalles, exam.ID_exam]);

  // Validate form data
  useEffect(() => {
    const validateForm = async () => {
      try {
        const response = await axios.put(`http://localhost:8800/exams/${exam.ID_exam}`, {
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle room selection/deselection
  const handleSalleChange = (salleId) => {
    setFormData((prev) => {
      const ID_salles = prev.ID_salles.includes(salleId)
        ? prev.ID_salles.filter((id) => id !== salleId)
        : [...prev.ID_salles, salleId];
      return { ...prev, ID_salles };
    });
  };

  // Handle form submission
  const handleSave = () => {
    if (isValid) {
      const normalizedFormData = {
        ...formData,
        exam_date: formData.exam_date,
        ID_semestre: exam.ID_semestre,
      };
      onSave(normalizedFormData);
      onClose();
    }
  };

  // Toggle dropdown visibility
  const toggleSalleDropdown = () => {
    setIsSalleDropdownOpen((prev) => !prev);
  };

  return  createPortal(
    <div id="exams">
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
            <select
              name="ID_module"
              value={formData.ID_module}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un Module</option>
              {modules.map((module, index) => (
                <option key={`${module.ID_module}-${index}`} value={module.ID_module}>
                  {`${module.nom_module} (${module.seances})`}
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
            <select
              name="time_slot"
              value={formData.time_slot}
              onChange={handleChange}
              required
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
          </div>
          <div className="modal-field">
            <label>Mode :</label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              required
            >
              <option value="presentiel">Présentiel</option>
              <option value="en ligne">En Ligne</option>
            </select>
          </div>
          <div className="modal-field">
            <label>Salle(s) :</label>
            <div className={`custom-dropdown ${isSalleDropdownOpen ? 'open' : ''}`}>
              <div className="dropdown-header" onClick={toggleSalleDropdown}>
                <span>
                  {formData.ID_salles.length > 0
                    ? `${formData.ID_salles.length} salle(s) sélectionnée(s)`
                    : 'Sélectionner des Salles'}
                </span>
                {isSalleDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {isSalleDropdownOpen && formData.mode === 'presentiel' && (
                <div className="dropdown-menu">
                  {salles.map((salle, index) => (
                    <label
                      key={`${salle.ID_salle}-${index}`}
                      className="checkbox-label"
                    >
                      <input
                        type="checkbox"
                        value={salle.ID_salle}
                        checked={formData.ID_salles.includes(String(salle.ID_salle))}
                        onChange={() => handleSalleChange(String(salle.ID_salle))}
                        disabled={!salle.available}
                      />
                      {salle.nom_salle} (Capacité: {salle.capacite || 'N/A'}) {salle.available ? '' : '- Indisponible'}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={handleSave} disabled={!isValid}>
              Sauvegarder
            </button>
            <button onClick={onClose}>Annuler</button>
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body
  );
};

export default ExamModal;