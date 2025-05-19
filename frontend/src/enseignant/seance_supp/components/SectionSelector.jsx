import React from "react"
import styles from "../css/seance_supp.module.css";

function SectionSelector({ sections, onSelect }) {
  return (
    <div id="supps">
      <select
        onChange={(e) => onSelect(e.target.value)}
        className={styles['ENS-SUPP-document-item']}
        style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
      >
        <option value="">Sélectionner</option>
        {sections.map((section) => (
          <option key={section.ID_section} value={section.ID_section}>
            {`${section.nom_section} - ${section.niveau} - ${section.nom_specialite}`}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SectionSelector;