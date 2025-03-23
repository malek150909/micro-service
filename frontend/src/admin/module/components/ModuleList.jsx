import { useState } from 'react';
import { motion } from 'framer-motion';
import ModuleModal from './ModuleModal';
import "../../../admin_css_files/module.css";

const ModuleList = ({ modules, onDelete, onUpdate, niveau }) => {
  let semestreGroup1, semestreGroup2, label1, label2;
  if (niveau === 'L1') {
    semestreGroup1 = modules.filter(module => module.semestre === '1');
    semestreGroup2 = modules.filter(module => module.semestre === '2');
    label1 = 'Semestre 1';
    label2 = 'Semestre 2';
  } else if (niveau === 'L2') {
    semestreGroup1 = modules.filter(module => module.semestre === '3');
    semestreGroup2 = modules.filter(module => module.semestre === '4');
    label1 = 'Semestre 3';
    label2 = 'Semestre 4';
  } else if (niveau === 'L3') {
    semestreGroup1 = modules.filter(module => module.semestre === '5');
    semestreGroup2 = modules.filter(module => module.semestre === '6');
    label1 = 'Semestre 5';
    label2 = 'Semestre 6';
  } else {
    semestreGroup1 = modules.filter(module => ['1', '3', '5'].includes(module.semestre));
    semestreGroup2 = modules.filter(module => ['2', '4', '6'].includes(module.semestre));
    label1 = 'Semestres Impairs';
    label2 = 'Semestres Pairs';
  }

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
    <div id="modules">
      <div className="module-list">
        <div className="semestre-columns">
          <div className="semestre-column">
            <h3>{label1}</h3>
            {semestreGroup1.length > 0 ? (
              semestreGroup1.map((module) => (
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
                    {module.nom_module} ({module.seances})
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
              <p>Aucun module pour {label1}</p>
            )}
          </div>
          <div className="semestre-column">
            <h3>{label2}</h3>
            {semestreGroup2.length > 0 ? (
              semestreGroup2.map((module) => (
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
                    {module.nom_module} ({module.seances})
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
              <p>Aucun module pour {label2}</p>
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
    </div>
  );
};

export default ModuleList;