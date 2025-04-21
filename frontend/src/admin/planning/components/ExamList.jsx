import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FaEdit, FaTrash, FaList, FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import styles from "../exam.module.css";

const ExamList = ({ exams, onDelete, onUpdate, salles, semestres, modules = [] }) => {
  const [editExam, setEditExam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [availableSalles, setAvailableSalles] = useState(salles);
  const [isSalleDropdownOpen, setIsSalleDropdownOpen] = useState(false);

  const API_URL = "http://courses.localhost";

  const closeModal = () => {
    setShowModal(false);
    setEditExam(null);
    setErrorMessage('');
    setIsSalleDropdownOpen(false);
  };

  const handleEdit = async (exam) => {
    try {
      const response = await axios.get(`${API_URL}/exams`);
      const currentExam = response.data.find(e => e.ID_exam === exam.ID_exam);
      if (!currentExam) {
        throw new Error('Examen introuvable.');
      }

      const salleNames = currentExam.nom_salle ? currentExam.nom_salle.split(' + ') : [];
      const salleIds = salleNames
        .map(name => {
          const salle = salles.find(s => s.nom_salle === name.trim());
          return salle ? String(salle.ID_salle) : null;
        })
        .filter(id => id !== null);

      let availableRooms = [];
      if (exam.exam_date && exam.time_slot && exam.mode === 'presentiel') {
        const salleAvailabilityResponse = await axios.get(`${API_URL}/exams/salles`, {
          params: {
            exam_date: exam.exam_date,
            time_slot: exam.time_slot,
            exclude_exam_id: exam.ID_exam,
          },
        });
        availableRooms = salleAvailabilityResponse.data;
      } else {
        availableRooms = salles;
      }

      const updatedAvailableSalles = availableRooms.map(salle => {
        if (salleIds.includes(String(salle.ID_salle))) {
          return { ...salle, available: true };
        }
        return salle;
      });

      setAvailableSalles(updatedAvailableSalles);
      setEditExam({
        ...exam,
        ID_salles: salleIds,
      });
      setShowModal(true);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Erreur lors du chargement des données de l’examen.');
    }
  };

  const validateForm = async (examData) => {
    if (!examData) return;

    const { ID_module, exam_date, time_slot, ID_exam } = examData;

    if (!ID_module || !exam_date || !time_slot) {
      setErrorMessage('');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/exams`, {
        params: {
          ID_section: examData.ID_section,
          ID_semestre: examData.ID_semestre,
        },
      });

      const existingExams = response.data.filter((exam) => exam.ID_exam !== ID_exam);

      const hasDuplicate = existingExams.some((exam) => {
        return (
          exam.exam_date === exam_date &&
          exam.time_slot === time_slot &&
          exam.ID_module === parseInt(ID_module)
        );
      });

      if (hasDuplicate) {
        setErrorMessage(
          'Un examen avec le même module, la même date et le même horaire existe déjà.'
        );
        return;
      }

      setErrorMessage('');
    } catch (err) {
      setErrorMessage('Erreur lors de la validation des données.');
    }
  };

  useEffect(() => {
    if (editExam) {
      validateForm(editExam);
    }
  }, [editExam]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editExam || !editExam.ID_exam) {
      setErrorMessage('ID de l’examen manquant.');
      return;
    }

    if (errorMessage) {
      return;
    }

    try {
      await onUpdate(editExam.ID_exam, editExam);
      setShowModal(false);
      setEditExam(null);
      setErrorMessage('');
      setIsSalleDropdownOpen(false);
    } catch (err) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la mise à jour.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditExam((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSalleChange = (salleId) => {
    setEditExam((prev) => {
      const ID_salles = prev.ID_salles.includes(salleId)
        ? prev.ID_salles.filter((id) => id !== salleId)
        : [...prev.ID_salles, salleId];
      return { ...prev, ID_salles };
    });
  };

  const handleDeletePrompt = (id) => {
    setExamToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (examToDelete) {
      try {
        await onDelete(examToDelete);
        setShowDeleteModal(false);
        setExamToDelete(null);
      } catch (err) {
        setErrorMessage(err.message || 'Une erreur est survenue lors de la suppression.');
        setShowDeleteModal(false);
        setExamToDelete(null);
      }
    }
  };

  const toggleSalleDropdown = () => {
    setIsSalleDropdownOpen((prev) => !prev);
  };

  return (
    <>
        <motion.div
          className={styles['ADM-EXM-exam-list']}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h3>
            <FaList style={{ marginRight: '8px' }} /> Liste des Examens
          </h3>
          <table className={styles['ADM-EXM-exam-table']}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Module</th>
                <th>Salle(s)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.ID_exam}>
                  <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                  <td>{exam.time_slot}</td>
                  <td>{exam.nom_module}</td>
                  <td>{exam.mode === 'en ligne' ? 'En Ligne' : exam.nom_salle || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEdit(exam)} disabled={!modules || modules.length === 0}>
                      <FaEdit style={{ marginRight: '5px' }} /> Modifier
                    </button>
                    <button onClick={() => handleDeletePrompt(exam.ID_exam)}>
                      <FaTrash style={{ marginRight: '5px' }} /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {showModal && createPortal(
          <motion.div
            className={styles['ADM-EXM-modal-overlay']}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div
              className={styles['ADM-EXM-modal-content']}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h3>Modifier l'Examen</h3>
              {errorMessage && <p style={{ color: '#ff4d4f' }}>{errorMessage}</p>}
              {(!modules || modules.length === 0) ? (
                <p style={{ color: '#5483b3' }}>Chargement des modules...</p>
              ) : (
                <form className={styles['ADM-EXM-form']} onSubmit={handleUpdate}>
                  <div className={styles['ADM-EXM-modal-field']}>
                    <label>Module</label>
                    <select
                      className={styles['ADM-EXM-select']}
                      name="ID_module"
                      value={editExam?.ID_module || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner un Module</option>
                      {modules.map((module) => (
                        <option key={module.ID_module} value={module.ID_module}>
                          {module.nom_module}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-EXM-modal-field']}>
                    <label>Date</label>
                    <input
                      className={styles['ADM-EXM-input']}
                      type="date"
                      name="exam_date"
                      value={editExam?.exam_date?.split('T')[0] || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles['ADM-EXM-modal-field']}>
                    <label>Horaire</label>
                    <select
                      className={styles['ADM-EXM-select']}
                      name="time_slot"
                      value={editExam?.time_slot || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner un Horaire</option>
                      {['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'].map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-EXM-modal-field']}>
                    <label>Mode</label>
                    <select
                      className={styles['ADM-EXM-select']}
                      name="mode"
                      value={editExam?.mode || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="presentiel">Présentiel</option>
                      <option value="en ligne">En Ligne</option>
                    </select>
                  </div>
                  <div className={styles['ADM-EXM-modal-field']}>
                    <label>Salle(s)</label>
                    <div className={`${styles['ADM-EXM-custom-dropdown']} ${isSalleDropdownOpen ? styles['ADM-EXM-open'] : ''}`}>
                      <div className={styles['ADM-EXM-dropdown-header']} onClick={toggleSalleDropdown}>
                        <span>
                          {editExam?.ID_salles.length > 0
                            ? `${editExam.ID_salles.length} salle(s) sélectionnée(s)`
                            : 'Sélectionner des Salles'}
                        </span>
                        {isSalleDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {isSalleDropdownOpen && editExam?.mode === 'presentiel' && (
                        <div className={styles['ADM-EXM-dropdown-menu']}>
                          {availableSalles.map((salle) => (
                            <label key={salle.ID_salle} className={styles['ADM-EXM-checkbox-label']}>
                              <input
                                type="checkbox"
                                value={salle.ID_salle}
                                checked={editExam?.ID_salles.includes(String(salle.ID_salle))}
                                onChange={() => handleSalleChange(String(salle.ID_salle))}
                                disabled={!salle.available}
                              />
                              {salle.nom_salle} (Capacité: {salle.capacite}) {salle.available ? '' : '- Indisponible'}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles['ADM-EXM-modal-actions']}>
                    <button type="submit" disabled={!!errorMessage}>Enregistrer</button>
                    <button type="button" onClick={closeModal}>Annuler</button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}

        {showDeleteModal && createPortal(
          <motion.div
            className={styles['ADM-EXM-modal-overlay']}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div
              className={styles['ADM-EXM-modal-content']}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className={styles['ADM-EXM-delete-modal-header']}>
                <FaExclamationTriangle style={{ color: '#ff4d4f', marginRight: '10px', fontSize: '24px' }} />
                <h3>Confirmer la Suppression</h3>
              </div>
              <p className={styles['ADM-EXM-delete-modal-text']}>
                Êtes-vous sûr de vouloir supprimer cet examen ? Cette action est irréversible.
              </p>
              <div className={styles['ADM-EXM-modal-actions']}>
                <button
                  className={styles['ADM-EXM-delete-confirm-button']}
                  onClick={handleDelete}
                >
                  Supprimer
                </button>
                <button
                  className={styles['ADM-EXM-delete-cancel-button']}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExamToDelete(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
    </>
  );
};

export default ExamList;