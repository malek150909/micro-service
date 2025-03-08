import { useState, useEffect } from 'react';
import axios from 'axios';
import FilterDropdown from '../components/FilterDropdown';

export default function CreatePage() {
  const [metadata, setMetadata] = useState({
    faculty: null,
    department: null,
    speciality: null,
    section: null,
    semester: ''
  });
  
  const [options, setOptions] = useState({
    faculties: [],
    departments: [],
    specialities: [],
    sections: [],
    modules: [],
    rooms: []
  });

  // Add loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [faculties, rooms] = await Promise.all([
          axios.get('/api/faculties').catch(() => ({ data: [] })),
          axios.get('/api/rooms').catch(() => ({ data: [] }))
        ]);

        setOptions(prev => ({
          ...prev,
          faculties: faculties.data || [],
          rooms: rooms.data || []
        }));
      } catch (err) {
        setError('Erreur de chargement des données initiales');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const [schedule, setSchedule] = useState([]);

  const timeSlots = [
    '08:00 - 09:30',
    '09:40 - 11:10',
    '11:20 - 12:50',
    '13:00 - 14:30',
    '14:40 - 16:10',
    '16:20 - 17:50'
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const [faculties, rooms] = await Promise.all([
        axios.get('/api/faculties'),
        axios.get('/api/rooms')
      ]);
      
      setOptions(prev => ({
        ...prev,
        faculties: faculties.data,
        rooms: rooms.data
      }));
    };
    loadInitialData();
  }, []);

  // Add error boundary
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  // Handle metadata changes
  const handleMetadataChange = async (type, value) => {
    const newMetadata = { ...metadata, [type]: value };
    
    try {
      switch(type) {
        case 'faculty': {
          const departments = await axios.get(`/api/departments/${value.ID_faculte}`);
          setOptions(prev => ({
            ...prev,
            departments: departments.data,
            specialities: [],
            sections: []
          }));
          break;
        }
          
        case 'department': {
          const specialities = await axios.get(`/api/specialities/${value.ID_departement}`);
          setOptions(prev => ({
            ...prev,
            specialities: specialities.data,
            sections: []
          }));
          break;
        }
          
        case 'speciality': {
          const sections = await axios.get(`/api/sections/${value.ID_specialite}`);
          const modules = await axios.get(`/api/modules/${value.ID_specialite}`);
          setOptions(prev => ({
            ...prev,
            sections: sections.data,
            modules: modules.data
          }));
          break;
        }
          
        case 'section': {
          // Load existing schedule when section changes
          const scheduleRes = await axios.get(`/api/exams/${value.ID_section}`);
          setSchedule(scheduleRes.data);
          break;
        }
      }
      
      setMetadata(newMetadata);
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
    }
  };

  // Add new schedule row
  const addScheduleRow = () => {
    setSchedule([...schedule, {
      temp_id: Date.now(),
      exam_date: '',
      time_slot: '',
      ID_module: '',
      ID_salle: '',
      ID_section: metadata.section?.ID_section || null
    }]);
  };

  // Update schedule row
  const updateScheduleRow = (temp_id, field, value) => {
    setSchedule(schedule.map(row => 
      row.temp_id === temp_id ? { ...row, [field]: value } : row
    ));
  };

  // Delete schedule row
  const deleteScheduleRow = (temp_id) => {
    setSchedule(schedule.filter(row => row.temp_id !== temp_id));
  };

  // Save complete schedule
  const saveSchedule = async () => {
    try {
      const payload = {
        sectionId: metadata.section?.ID_section,
        semester: metadata.semester,
        schedule: schedule.map(row => ({
          ID_module: row.ID_module,
          exam_date: row.exam_date,
          time_slot: row.time_slot,
          ID_salle: row.ID_salle
        }))
      };

      await axios.post('/api/exams/bulk', payload);
      alert('Planning sauvegardé avec succès!');
      setSchedule([]);
    } catch (err) {
      console.error('Sauvegarde échouée:', err);
      alert(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="create-container">
      <h2>Créer un nouveau planning</h2>
      
      <div className="metadata-section">
        <FilterDropdown
          label="Faculté"
          options={options.faculties}
          displayKey="nom_faculte"
          onSelect={val => handleMetadataChange('faculty', val)}
        />
        
        <FilterDropdown
          label="Département"
          options={options.departments}
          displayKey="Nom_departement"
          onSelect={val => handleMetadataChange('department', val)}
        />
        
        <FilterDropdown
          label="Spécialité"
          options={options.specialities}
          displayKey="nom_specialite"
          onSelect={val => handleMetadataChange('speciality', val)}
        />
        
        <FilterDropdown
          label="Section"
          options={options.sections}
          displayKey="ID_section"
          onSelect={val => handleMetadataChange('section', val)}
        />
        
        <div className="form-group">
          <label>Semestre</label>
          <input
            type="text"
            value={metadata.semester}
            onChange={e => setMetadata({ ...metadata, semester: e.target.value })}
            placeholder="Ex: 2023-2024"
          />
        </div>
      </div>

      <div className="schedule-editor">
        <div className="editor-header">
          <h3>Emploi du temps</h3>
          <button onClick={addScheduleRow} className="add-row-btn">
            + Ajouter une ligne
          </button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Horaire</th>
              <th>Module</th>
              <th>Salle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(row => (
              <tr key={row.temp_id || row.ID_exam}>
                <td>
                  <input
                    type="date"
                    value={row.exam_date}
                    onChange={e => updateScheduleRow(row.temp_id, 'exam_date', e.target.value)}
                  />
                </td>
                <td>
                  <select
                    value={row.time_slot}
                    onChange={e => updateScheduleRow(row.temp_id, 'time_slot', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={row.ID_module}
                    onChange={e => updateScheduleRow(row.temp_id, 'ID_module', e.target.value)}
                  >
                    <option value="">Sélectionner module</option>
                    {options.modules.map(module => (
                      <option key={module.ID_module} value={module.ID_module}>
                        {module.nom_module}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={row.ID_salle}
                    onChange={e => updateScheduleRow(row.temp_id, 'ID_salle', e.target.value)}
                  >
                    <option value="">Sélectionner salle</option>
                    {options.rooms.map(room => (
                      <option key={room.ID_salle} value={room.ID_salle}>
                        Salle {room.ID_salle} ({room.capacite} places)
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteScheduleRow(row.temp_id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <button className="save-btn" onClick={saveSchedule}>
          Sauvegarder le planning
        </button>
        <button 
          className="cancel-btn"
          onClick={() => window.history.back()}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}