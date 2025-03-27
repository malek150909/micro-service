import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FaEdit, FaTrash, FaList, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import "../../../admin_css_files/exam.css";


const ExamList = ({ exams, onDelete, onUpdate, salles, semestres, modules = [] }) => {
  const [editExam, setEditExam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  const API_URL = "http://localhost:8083"; // Adjust based on your API URL

  // Reset error message when closing the modal
  const closeModal = () => {
    setShowModal(false);
    setEditExam(null);
    setErrorMessage(''); // Clear error message on close
  };

  const handleEdit = (exam) => {
    setEditExam({ ...exam });
    setShowModal(true);
    setErrorMessage(''); // Clear error message when opening the modal
  };

  // Real-time validation function
  const validateForm = async (examData) => {
    if (!examData) return;

    const { ID_module, exam_date, time_slot, ID_exam } = examData;

    // Skip validation if required fields are not filled
    if (!ID_module || !exam_date || !time_slot) {
      setErrorMessage('');
      return;
    }

    try {
      // Check for duplicate exam (same date, time, and module, excluding the current exam)
      const response = await axios.get(`${API_URL}/exams`, {
        params: {
          ID_section: examData.ID_section,
          ID_semestre: examData.ID_semestre,
        },
      });

      const existingExams = response.data.filter((exam) => exam.ID_exam !== ID_exam); // Exclude the current exam

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

      // If no errors, clear the error message
      setErrorMessage('');
    } catch (err) {
      setErrorMessage('Erreur lors de la validation des données.');
    }
  };

  // Run validation whenever editExam changes
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

    // If there's an error message, prevent submission
    if (errorMessage) {
      return;
    }

    try {
      await onUpdate(editExam.ID_exam, editExam);
      setShowModal(false);
      setEditExam(null);
      setErrorMessage('');
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

  return (
    <>
      <div id="exams">
      <motion.div
        className="exam-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h3>
          <FaList style={{ marginRight: '8px' }} /> Liste des Examens
        </h3>
        <table className="exam-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Horaire</th>
              <th>Module</th>
              <th>Salle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.ID_exam}>
                <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                <td>{exam.time_slot}</td>
                <td>{exam.nom_module}</td>
                <td>{exam.mode === 'en ligne' ? 'En Ligne' : exam.ID_salle}</td>
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

      {/* Edit Exam Modal */}
      {showModal && createPortal(
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <motion.div
            className="modal-content"
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
              <form onSubmit={handleUpdate}>
                <div className="modal-field">
                  <label>Module</label>
                  <select
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
                <div className="modal-field">
                  <label>Date</label>
                  <input
                    type="date"
                    name="exam_date"
                    value={editExam?.exam_date?.split('T')[0] || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Horaire</label>
                  <select name="time_slot" value={editExam?.time_slot || ''} onChange={handleChange} required>
                    <option value="">Sélectionner un Horaire</option>
                    {['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'].map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Mode</label>
                  <select name="mode" value={editExam?.mode || ''} onChange={handleChange} required>
                    <option value="presentiel">Présentiel</option>
                    <option value="en ligne">En Ligne</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>Salle</label>
                  <select
                    name="ID_salle"
                    value={editExam?.ID_salle || ''}
                    onChange={handleChange}
                    required={editExam?.mode === 'presentiel'}
                    disabled={editExam?.mode === 'en ligne'}
                  >
                    <option value="">Sélectionner une Salle</option>
                    {salles.map((salle) => (
                      <option key={salle.ID_salle} value={salle.ID_salle}>
                        {salle.ID_salle} (Capacité: {salle.capacite})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" disabled={!!errorMessage}>Enregistrer</button>
                  <button type="button" onClick={closeModal}>Annuler</button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <motion.div
            className="modal-content delete-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="delete-modal-header">
              <FaExclamationTriangle style={{ color: '#ff4d4f', marginRight: '10px', fontSize: '24px' }} />
              <h3>Confirmer la Suppression</h3>
            </div>
            <p className="delete-modal-text">
              Êtes-vous sûr de vouloir supprimer cet examen ? Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button
                className="delete-confirm-button"
                onClick={handleDelete}
              >
                Supprimer
              </button>
              <button
                className="delete-cancel-button"
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
      </div>
    </>
  );
};

export default ExamList;