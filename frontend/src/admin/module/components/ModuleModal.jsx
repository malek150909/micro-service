import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import "../../../admin_css_files/module.css";

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
      await axios.put(`http://localhost:8083/modules/${module.ID_module}`, formData);
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur de mise à jour du module:', error);
      alert('Échec de la mise à jour du module');
    }
  };

  return (
    <div id="modules">
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
          <h3>Détails du Module</h3>
          <div className="modal-field">
            <label>Nom :</label>
            <input
              type="text"
              name="nom_module"
              value={formData.nom_module}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-field">
            <label>Description :</label>
            <textarea
              name="description_module"
              value={formData.description_module}
              onChange={handleChange}
            />
          </div>
          <div className="modal-field">
            <label>Crédit :</label>
            <input
              type="number"
              name="credit"
              value={formData.credit}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-field">
            <label>Coefficient :</label>
            <input
              type="number"
              name="coefficient"
              value={formData.coefficient}
              onChange={handleChange}
              required
            />
          </div>
          <div className="modal-field">
            <label>Semestre :</label>
            <input
              type="text"
              value={module.semestre}
              disabled
            />
          </div>
          <div className="modal-field">
            <label>Séances :</label>
            <select
              name="seances"
              value={formData.seances}
              onChange={handleChange}
              required
            >
              <option value="Cour">Cour</option>
              <option value="Cour/TD">Cour/TD</option>
              <option value="Cour/TP">Cour/TP</option>
              <option value="Cour/TD/TP">Cour/TD/TP</option>
              <option value="En ligne">En ligne</option>
            </select>
          </div>
          <div className="modal-actions">
            <button onClick={handleSave}>Sauvegarder</button>
            <button onClick={onClose}>Fermer</button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ModuleModal;