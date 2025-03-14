// components/ModuleList.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import ModuleModal from './ModuleModal';
import '../../../admin_css_files/module.css';

const ModuleList = ({ modules, onDelete, onUpdate }) => {
  const semestre1 = modules.filter(module => module.semestre === '1');
  const semestre2 = modules.filter(module => module.semestre === '2');
  const [selectedModule, setSelectedModule] = useState(null);

  const handleModuleClick = (module) => {
    setSelectedModule(module);
  };

  const handleCloseModal = () => {
    setSelectedModule(null);
  };

  const handleSave = (updatedData) => {
    onUpdate(selectedModule.ID_module, updatedData);
  };

  return (
    <div className="module-list">
      <div className="semestre-columns">
        <div className="semestre-column">
          <h3>Semestre 1</h3>
          {semestre1.length > 0 ? (
            semestre1.map((module) => (
              <motion.div
                key={module.ID_module}
                className="module-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="module-name"
                  onClick={() => handleModuleClick(module)}
                >
                  {module.nom_module}
                </span>
                <button
                  onClick={() => onDelete(module.ID_module)}
                  className="delete-button"
                >
                  Supprimer
                </button>
              </motion.div>
            ))
          ) : (
            <p>Aucun module pour le Semestre 1</p>
          )}
        </div>
        <div className="semestre-column">
          <h3>Semestre 2</h3>
          {semestre2.length > 0 ? (
            semestre2.map((module) => (
              <motion.div
                key={module.ID_module}
                className="module-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="module-name"
                  onClick={() => handleModuleClick(module)}
                >
                  {module.nom_module}
                </span>
                <button
                  onClick={() => onDelete(module.ID_module)}
                  className="delete-button"
                >
                  Supprimer
                </button>
              </motion.div>
            ))
          ) : (
            <p>Aucun module pour le Semestre 2</p>
          )}
        </div>
      </div>

      {selectedModule && (
        <ModuleModal
          module={selectedModule}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ModuleList;