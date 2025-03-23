import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import "../../../admin_css_files/module.css";

const ModuleForm = ({ onAdd, disabled, niveau }) => {
  let semesterOptions = [];
  let defaultSemestre = '1';
  
  if (niveau === 'L1') {
    semesterOptions = ['1', '2'];
    defaultSemestre = '1';
  } else if (niveau === 'L2') {
    semesterOptions = ['3', '4'];
    defaultSemestre = '3';
  } else if (niveau === 'L3') {
    semesterOptions = ['5', '6'];
    defaultSemestre = '5';
  } else {
    semesterOptions = ['1', '2'];
    defaultSemestre = '1';
  }

  const [moduleData, setModuleData] = useState({
    nom_module: '',
    description_module: '',
    credit: '',
    coefficient: '',
    semestre: defaultSemestre,
    seances: 'Cour/TD', // Valeur par défaut reste Cour/TD
  });

  const handleChange = (e) => {
    setModuleData({ ...moduleData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled) {
      onAdd(moduleData);
      setModuleData({
        nom_module: '',
        description_module: '',
        credit: '',
        coefficient: '',
        semestre: defaultSemestre,
        seances: 'Cour/TD',
      });
    }
  };

  return (
    <div id="modules">
      <motion.div
        className="form-container"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>Ajouter un Nouveau Module</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nom_module"
            placeholder="Nom du Module"
            value={moduleData.nom_module}
            onChange={handleChange}
            required
            disabled={disabled}
          />
          <input
            type="text"
            name="description_module"
            placeholder="Description"
            value={moduleData.description_module}
            onChange={handleChange}
            disabled={disabled}
          />
          <input
            type="number"
            name="credit"
            placeholder="Crédit"
            value={moduleData.credit}
            onChange={handleChange}
            required
            disabled={disabled}
          />
          <input
            type="number"
            name="coefficient"
            placeholder="Coefficient"
            value={moduleData.coefficient}
            onChange={handleChange}
            required
            disabled={disabled}
          />
          <select
            name="semestre"
            value={moduleData.semestre}
            onChange={handleChange}
            required
            className="semester-select"
            disabled={disabled}
          >
            <option value="">Sélectionner un Semestre</option>
            {semesterOptions.map((semestre) => (
              <option key={semestre} value={semestre}>
                Semestre {semestre}
              </option>
            ))}
          </select>
          <select
            name="seances"
            value={moduleData.seances}
            onChange={handleChange}
            required
            className="seances-select"
            disabled={disabled}
          >
            <option value="">Sélectionner les Séances</option>
            <option value="Cour">Cour</option>
            <option value="Cour/TD">Cour/TD</option>
            <option value="Cour/TP">Cour/TP</option>
            <option value="Cour/TD/TP">Cour/TD/TP</option>
            <option value="En ligne">En ligne</option>
          </select>
          <button type="submit" disabled={disabled}>Ajouter Module</button>
        </form>
      </motion.div>
    </div>
  );
};

export default ModuleForm;