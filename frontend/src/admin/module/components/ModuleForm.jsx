import React,{ useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from "../module.module.css";

const ModuleForm = ({ onAdd, disabled, sectionOptions, niveau }) => {
  const [formData, setFormData] = useState({
    nom_module: '',
    description_module: '',
    credit: '',
    coefficient: '',
    seances: 'Cour',
    semestre: '',
    sections: [],
  });
  const [semestreOptions, setSemestreOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Set semesters based on the niveau prop
    let semesters;
    if (niveau === 'L1') {
      semesters = [{ semestre: '1' }, { semestre: '2' }];
    } else if (niveau === 'L2') {
      semesters = [{ semestre: '3' }, { semestre: '4' }];
    } else if (niveau === 'L3') {
      semesters = [{ semestre: '5' }, { semestre: '6' }];
    } else {
      semesters = [];
    }
    setSemestreOptions(semesters);
  }, [niveau]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSectionAdd = (sectionId) => {
    if (!formData.sections.includes(sectionId)) {
      setFormData({ ...formData, sections: [...formData.sections, sectionId] });
    }
    setIsDropdownOpen(false);
  };

  const handleSectionRemove = (sectionId) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((id) => id !== sectionId),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      nom_module: '',
      description_module: '',
      credit: '',
      coefficient: '',
      seances: 'Cour',
      semestre: '',
      sections: [],
    });
  };

  const availableSections = sectionOptions.filter(
    (section) => !formData.sections.includes(section.ID_section)
  );

  return (
    <motion.div
      className={styles['ADM-MDL-form-container']}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Ajouter un Module</h3>
      <form onSubmit={handleSubmit} className={styles['ADM-MDL-form']} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <div className={styles['ADM-MDL-modal-field']}>
          <label>Nom du Module</label>
          <input
            type="text"
            name="nom_module"
            value={formData.nom_module}
            onChange={handleChange}
            className={styles['ADM-MDL-input']}
            required
            disabled={disabled}
          />
        </div>

        <div className={styles['ADM-MDL-modal-field']}>
          <label>Description</label>
          <textarea
            name="description_module"
            value={formData.description_module}
            onChange={handleChange}
            className={styles['ADM-MDL-textarea']}
            disabled={disabled}
          />
        </div>

        <div className={styles['ADM-MDL-modal-field']}>
          <label>Crédit</label>
          <input
            type="number"
            name="credit"
            value={formData.credit}
            onChange={handleChange}
            className={styles['ADM-MDL-input']}
            required
            disabled={disabled}
            min="1"
          />
        </div>

        <div className={styles['ADM-MDL-modal-field']}>
          <label>Coefficient</label>
          <input
            type="number"
            name="coefficient"
            value={formData.coefficient}
            onChange={handleChange}
            className={styles['ADM-MDL-input']}
            required
            disabled={disabled}
            min="1"
          />
        </div>

        <div className={styles['ADM-MDL-modal-field']}>
          <label>Séances</label>
          <select
            name="seances"
            value={formData.seances}
            onChange={handleChange}
            className={styles['ADM-MDL-select']}
            required
            disabled={disabled}
          >
            <option value="Cour">Cour</option>
            <option value="Cour/TD">Cour/TD</option>
            <option value="Cour/TP">Cour/TP</option>
            <option value="Cour/TD/TP">Cour/TD/TP</option>
            <option value="En Ligne">En Ligne</option>
          </select>
        </div>

        <div className={styles['ADM-MDL-modal-field']}>
          <label>Semestre</label>
          <select
            name="semestre"
            value={formData.semestre}
            onChange={handleChange}
            className={styles['ADM-MDL-select']}
            required
            disabled={disabled}
          >
            <option value="">Sélectionner un Semestre</option>
            {semestreOptions.map((semestre) => (
              <option key={semestre.semestre} value={semestre.semestre}>
                Semestre {semestre.semestre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['ADM-MDL-modal-field']} ref={dropdownRef}>
          <label>Sections</label>
          <div className={styles['ADM-MDL-section-tags']}>
            {formData.sections.map((sectionId) => {
              const section = sectionOptions.find((s) => s.ID_section === sectionId);
              return (
                <span key={sectionId} className={styles['ADM-MDL-section-tag']}>
                  {section ? section.nom_section : sectionId}
                  <span
                    className={styles['ADM-MDL-section-remove']}
                    onClick={() => handleSectionRemove(sectionId)}
                  >
                    ×
                  </span>
                </span>
              );
            })}
          </div>
          {availableSections.length > 0 ? (
            <div className={styles['ADM-MDL-section-select']}>
              <button
                type="button"
                className={styles['ADM-MDL-section-button']}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={disabled}
              >
                Ajouter une Section
              </button>
              {isDropdownOpen && (
                <div className={styles['ADM-MDL-section-dropdown']}>
                  {availableSections.map((section) => (
                    <div
                      key={section.ID_section}
                      className={styles['ADM-MDL-section-option']}
                      onClick={() => handleSectionAdd(section.ID_section)}
                    >
                      {section.nom_section}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className={styles['ADM-MDL-no-sections']}>Aucune section disponible à ajouter.</p>
          )}
        </div>

        <button type="submit" className={styles['ADM-MDL-button']} disabled={disabled}>
          Ajouter Module
        </button>
      </form>
    </motion.div>
  );
};

export default ModuleForm;