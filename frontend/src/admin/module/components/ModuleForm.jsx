// components/ModuleForm.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ModuleForm = ({ onAdd, disabled }) => {
  const [moduleData, setModuleData] = useState({
    nom_module: '',
    description_module: '',
    credit: '',
    coefficient: '',
    semestre: '1',
  });
  const [semestreOptions, setSemestreOptions] = useState([]);

  useEffect(() => {
    const fetchSemestres = async () => {
      try {
        const response = await axios.get('http://localhost:8083/modules/semestres');
        setSemestreOptions(response.data);
      } catch (error) {
        console.error('Erreur de récupération des semestres:', error);
      }
    };
    fetchSemestres();
  }, []);

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
        semestre: '1',
      });
    }
  };

  return (
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
          {semestreOptions.map((option) => (
            <option key={option.semestre} value={option.semestre}>
              Semestre {option.semestre}
            </option>
          ))}
        </select>
        <button type="submit" disabled={disabled}>Ajouter Module</button>
      </form>
    </motion.div>
  );
};

export default ModuleForm;