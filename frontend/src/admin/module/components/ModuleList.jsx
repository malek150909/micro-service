import { useState } from 'react';
import { motion } from 'framer-motion';
import ModuleModal from './ModuleModal';
import '../../../admin_css_files/module.css';

const ModuleList = ({ modules, onDelete, onUpdate, niveau }) => {
  console.log('Niveau received in ModuleList:', niveau);
  console.log('Modules received:', modules);
  // Définir les semestres à afficher en fonction du niveau
  let semestreA, semestreB;
  if (niveau === 'L1') {
    semestreA = modules.filter(module => module.semestre === '1');
    semestreB = modules.filter(module => module.semestre === '2');
  } else if (niveau === 'L2') {
    semestreA = modules.filter(module => module.semestre === '3');
    semestreB = modules.filter(module => module.semestre === '4');
  } else if (niveau === 'L3') {
    semestreA = modules.filter(module => module.semestre === '5');
    semestreB = modules.filter(module => module.semestre === '6');
  } else {
    // Par défaut, afficher tous les modules sans filtrage par semestre
    semestreA = modules;
    semestreB = [];
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
    <div className="module-list">
      <div className="semestre-columns">
        <div className="semestre-column">
          <h3>{niveau === 'L1' ? 'Semestre 1' : niveau === 'L2' ? 'Semestre 3' : niveau === 'L3' ? 'Semestre 5' : 'Modules'}</h3>
          {semestreA.length > 0 ? (
            semestreA.map((module) => (
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
            <p>Aucun module pour ce semestre</p>
          )}
        </div>
        <div className="semestre-column">
          <h3>{niveau === 'L1' ? 'Semestre 2' : niveau === 'L2' ? 'Semestre 4' : niveau === 'L3' ? 'Semestre 6' : ''}</h3>
          {semestreB.length > 0 ? (
            semestreB.map((module) => (
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
            <p>Aucun module pour ce semestre</p>
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