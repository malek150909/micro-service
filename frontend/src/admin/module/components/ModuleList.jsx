import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import styles from "../module.module.css";

const API_URL = 'http://courses.localhost/modules';

const ModuleList = ({ modules, onDelete, onUpdate, niveau }) => {
  const [editingModule, setEditingModule] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nom_module: '',
    description_module: '',
    credit: '',
    coefficient: '',
    seances: '',
  });

  const handleEditClick = (module) => {
    setEditingModule(module.ID_module);
    setEditFormData({
      nom_module: module.nom_module,
      description_module: module.description_module || '',
      credit: module.credit,
      coefficient: module.coefficient,
      seances: module.seances,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${editingModule}`, editFormData);
      onUpdate(editingModule, editFormData);
      setEditingModule(null);
    } catch (err) {
      console.error('Erreur de mise à jour du module:', err);
      alert(`Erreur de mise à jour du module: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingModule(null);
  };

  // Ensure semesters are strings for consistent grouping
  const groupedModules = modules.reduce((acc, module) => {
    const semestre = String(module.semestre || 'Non spécifié'); // Convert to string
    if (!acc[semestre]) {
      acc[semestre] = [];
    }
    acc[semestre].push(module);
    return acc;
  }, {});
  console.log('Grouped modules:', groupedModules); // Debug log

  // Sort semesters numerically (1, 2, 3, ..., 6)
  const sortedSemestres = Object.keys(groupedModules)
    .filter(semestre => semestre !== 'Non spécifié')
    .sort((a, b) => Number(a) - Number(b));

  // Add "Non spécifié" at the end if it exists
  if (groupedModules['Non spécifié']) {
    sortedSemestres.push('Non spécifié');
  }

  return (
    <div className={styles['ADM-MDL-module-list']}>
      <h2>Liste des Modules</h2>
      {sortedSemestres.length > 0 ? (
        <div className={styles['ADM-MDL-semestre-columns']}>
          {sortedSemestres.map((semestre) => (
            <div key={semestre} className={styles['ADM-MDL-semestre-column']}>
              <h3>Semestre {semestre}</h3>
              {groupedModules[semestre].map((module) => (
                <motion.div
                  key={module.ID_module}
                  className={styles['ADM-MDL-module-item']}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span
                    className={styles['ADM-MDL-module-name']}
                    onClick={() => handleEditClick(module)}
                  >
                    {module.nom_module} (Section: {module.nom_section})
                  </span>
                  <div>
                    <button
                      onClick={() => onDelete(module.ID_module)}
                      className={`${styles['ADM-MDL-button']} ${styles['ADM-MDL-delete-button']}`}
                    >
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles['ADM-MDL-no-results']}>Aucun module disponible pour ce semestre.</p>
      )}

      {editingModule && (
        <motion.div
          className={styles['ADM-MDL-modal-overlay']}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles['ADM-MDL-modal-content']}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Modifier le Module</h3>
            <form onSubmit={handleEditSubmit}>
              <div className={styles['ADM-MDL-modal-field']}>
                <label>Nom du Module</label>
                <input
                  type="text"
                  name="nom_module"
                  value={editFormData.nom_module}
                  onChange={handleEditChange}
                  className={styles['ADM-MDL-input']}
                  required
                />
              </div>
              <div className={styles['ADM-MDL-modal-field']}>
                <label>Description</label>
                <textarea
                  name="description_module"
                  value={editFormData.description_module}
                  onChange={handleEditChange}
                  className={styles['ADM-MDL-textarea']}
                />
              </div>
              <div className={styles['ADM-MDL-modal-field']}>
                <label>Crédit</label>
                <input
                  type="number"
                  name="credit"
                  value={editFormData.credit}
                  onChange={handleEditChange}
                  className={styles['ADM-MDL-input']}
                  required
                  min="1"
                />
              </div>
              <div className={styles['ADM-MDL-modal-field']}>
                <label>Coefficient</label>
                <input
                  type="number"
                  name="coefficient"
                  value={editFormData.coefficient}
                  onChange={handleEditChange}
                  className={styles['ADM-MDL-input']}
                  required
                  min="1"
                />
              </div>
              <div className={styles['ADM-MDL-modal-field']}>
                <label>Séances</label>
                <select
                  name="seances"
                  value={editFormData.seances}
                  onChange={handleEditChange}
                  className={styles['ADM-MDL-select']}
                  required
                >
                  <option value="Cour">Cour</option>
                  <option value="Cour/TD">Cour/TD</option>
                  <option value="Cour/TP">Cour/TP</option>
                  <option value="Cour/TD/TP">Cour/TD/TP</option>
                  <option value="En Ligne">En Ligne</option>
                </select>
              </div>
              <div className={styles['ADM-MDL-modal-actions']}>
                <button type="submit" className={styles['ADM-MDL-button']}>
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`${styles['ADM-MDL-button']} ${styles['ADM-MDL-delete-button']}`}
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ModuleList;