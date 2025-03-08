import { useState } from 'react';

export default function FilterDropdown({
  label,
  options = [],
  displayKey,
  displayFormat,
  onSelect,
  loading,
  idKey // Added idKey prop
}) {
  const [selectedValue, setSelectedValue] = useState(null);

  
  return (
    <div className="filter-dropdown">
      <label>{label}</label>
      <select
        value={selectedValue ? JSON.stringify(selectedValue) : ''}
        onChange={(e) => {
          try {
            const val = e.target.value ? JSON.parse(e.target.value) : null;
            setSelectedValue(val);
            onSelect(val);
          } catch (err) {
            console.error('Error parsing filter value:', err);
          }
        }}
        disabled={loading}
      >
        <option value="">Sélectionner {label}</option>
        {loading ? (
          <option>Chargement...</option>
        ) : (
          options.map((option) => (
            <option
              key={option[idKey] || option[`ID_${label.toLowerCase()}`] || option[displayKey]} // Updated key logic
              value={JSON.stringify(option)}
            >
              {displayFormat ? displayFormat(option) : option[displayKey]}
            </option>
          ))
        )}
      </select>
    </div>
  );
}