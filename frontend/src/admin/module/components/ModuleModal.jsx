import React,{ useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import axios from 'axios';
import styles from "../module.module.css";

const ModuleModal = ({ module, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom_module: module.nom_module,
    description_module: module.description_module || '',
    credit: module.credit,
    coefficient: module.coefficient,
    seances: module.seances,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      console.log('Données envoyées au backend pour mise à jour :', formData);
      await axios.put(`http://courses.localhost/modules/${module.ID_module}`, formData);
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur de mise à jour du module:', error);
      alert('Échec de la mise à jour du module');
    }
  };

  return createPortal(
    <motion.div
      className={styles['ADM-MDL-modal-overlay']}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <motion.div
        className={styles['ADM-MDL-modal-content']}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3>Détails du Module</h3>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Nom :</label>
          <input
            type="text"
            name="nom_module"
            value={formData.nom_module}
            onChange={handleChange}
            required
            className={styles['ADM-MDL-input']}
          />
        </div>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Description :</label>
          <textarea
            name="description_module"
            value={formData.description_module}
            onChange={handleChange}
            className={styles['ADM-MDL-textarea']}
          />
        </div>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Crédit :</label>
          <input
            type="number"
            name="credit"
            value={formData.credit}
            onChange={handleChange}
            required
            className={styles['ADM-MDL-input']}
          />
        </div>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Coefficient :</label>
          <input
            type="number"
            name="coefficient"
            value={formData.coefficient}
            onChange={handleChange}
            required
            className={styles['ADM-MDL-input']}
          />
        </div>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Semestre :</label>
          <input
            type="text"
            value={module.semestre}
            disabled
            className={styles['ADM-MDL-input']}
          />
        </div>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Séances :</label>
          <select
            name="seances"
            value={formData.seances}
            onChange={handleChange}
            required
            className={styles['ADM-MDL-select']}
          >
            <option value="Cour">Cour</option>
            <option value="Cour/TD">Cour/TD</option>
            <option value="Cour/TP">Cour/TP</option>
            <option value="Cour/TD/TP">Cour/TD/TP</option>
            <option value="En ligne">En ligne</option>
          </select>
        </div>
        <div className={styles['ADM-MDL-modal-actions']}>
          <button onClick={handleSave} className={styles['ADM-MDL-button']}>Sauvegarder</button>
          <button onClick={onClose} className={styles['ADM-MDL-button']}>Fermer</button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ModuleModal;