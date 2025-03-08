import { useState, useEffect } from 'react';
import axios from 'axios';
import FilterDropdown from '../components/FilterDropdown';
import EditableScheduleTable from '../components/EditableScheduleTable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica', // Clean font
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#2c3e50', // Darker, elegant color
  },
  metadataSection: {
    marginBottom: 25,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderStyle: 'solid',
    borderRadius: 5,
    backgroundColor: '#f9f9f9', // Subtle background
    textAlign: 'center', // Center-align metadata
  },
  metadataText: {
    fontSize: 12,
    marginBottom: 5,
    color: '#34495e', // Muted, professional color
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#34495e', // Darker table border
    borderRadius: 5, // Rounded corners
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdcdc', // Light row separators
  },
  headerRow: {
    backgroundColor: '#34495e', // Dark blue header
    color: '#ffffff', // White text
    fontWeight: 'bold',
  },
  cell: {
    width: '25%', // Equal column width
    padding: 8,
    fontSize: 10,
    textAlign: 'center', // Center-align text
    borderRightWidth: 1,
    borderRightColor: '#dcdcdc', // Vertical separators
  },
  cellLast: {
    borderRightWidth: 0, // No right border for last column
  },
});

// Updated SchedulePDF component
const SchedulePDF = ({ data, filters }) => (
  <Document>
    <Page style={styles.page}>
      {/* Title */}
      <Text style={styles.header}>Planning des Examens</Text>

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        <Text style={styles.metadataText}>
          Faculté: {filters.faculty?.nom_faculte || 'Non sélectionné'}
        </Text>
        <Text style={styles.metadataText}>
          Département: {filters.department?.Nom_departement || 'Non sélectionné'}
        </Text>
        <Text style={styles.metadataText}>
          Spécialité: {filters.speciality?.nom_specialite || 'Non sélectionné'}
        </Text>
        <Text style={styles.metadataText}>
          Niveau: {filters.niveau?.niveau || 'Non sélectionné'}
        </Text>
        <Text style={styles.metadataText}>
          Section: {filters.section?.ID_section || 'Non sélectionné'}
        </Text>
      </View>

      {/* Planning Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={styles.cell}>Date</Text>
          <Text style={styles.cell}>Horaire</Text>
          <Text style={styles.cell}>Module</Text>
          <Text style={[styles.cell, styles.cellLast]}>Salle</Text>
        </View>

        {/* Table Rows */}
        {data?.length > 0 ? data.map((exam, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.cell}>
              {new Date(exam.exam_date).toLocaleDateString()}
            </Text>
            <Text style={styles.cell}>{exam.time_slot}</Text>
            <Text style={styles.cell}>{exam.nom_module}</Text>
            <Text style={[styles.cell, styles.cellLast]}>{exam.ID_salle}</Text>
          </View>
        )) : <Text>Aucun examen disponible</Text>}

      {data.map((exam, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.cell}>
            {new Date(exam.exam_date).toLocaleDateString()}
          </Text>
          <Text style={styles.cell}>{exam.time_slot}</Text>
          <Text style={styles.cell}>{exam.nom_module}</Text>
          <Text style={[styles.cell, styles.cellLast]}>{exam.ID_salle}</Text>
        </View>
      ))}
      </View>
    </Page>
  </Document>
);

SchedulePDF.propTypes = {
  data: PropTypes.array.isRequired,
  filters: PropTypes.object.isRequired,
};




export default function ConsultPage() {
  const [filters, setFilters] = useState({
    faculty: null,
    department: null,
    speciality: null,
    niveau: null,
    section: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState([]);
  const navigate = useNavigate();

  const [options, setOptions] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFaculties = async () => {
      try {
        const res = await axios.get('http://localhost:8083/api/faculties');
        setOptions(prev => ({ ...prev, faculties: res.data }));
      } catch (err) {
        console.error('Failed to load faculties:', err);
      }
    };
    loadFaculties();
  }, []);

  const handleFilterChange = async (type, value) => {
    const resetMap = {
      faculty: ['department', 'speciality', 'niveau', 'section'],
      department: ['speciality', 'niveau', 'section'],
      speciality: ['niveau', 'section'],
      niveau: ['section'],
      section: []
    };
  
    setFilters(prev => ({
      ...prev,
      [type]: value,
      ...Object.fromEntries(resetMap[type].map(key => [key, null]))
    }));
  
    setOptions(prev => ({
      ...prev,
      ...Object.fromEntries(resetMap[type].map(key => [key, []]))
    }));
  
    setLoading(true);
    try {
      switch (type) {
        case 'faculty': {
          const departments = await axios.get(`http://localhost:8083/api/departments/${value.ID_faculte}`);
          setOptions(prev => ({ ...prev, departments: departments.data }));
          break;
        }
        case 'department': {
          const specialities = await axios.get(`http://localhost:8083/api/specialities/${value.ID_departement}`);
          setOptions(prev => ({ ...prev, specialities: specialities.data }));
          break;
        }
        case 'speciality': {
          console.log('Selected speciality:', value); // Debugging log
          if (!value?.ID_specialite) {
            console.error('Invalid speciality object:', value);
            return;
          }
  
          const requestUrl = `http://localhost:8083/api/niveaux/${value.ID_specialite}`;
          console.log('Request URL for niveaux:', requestUrl); // Debugging log
          try {
            const niveaux = await axios.get(requestUrl);
            console.log('Fetched niveaux:', niveaux.data); // Debugging log
            setOptions(prev => ({ ...prev, niveaux: niveaux.data }));
          } catch (err) {
            console.error('Levels fetch error:', err);
            setOptions(prev => ({ ...prev, niveaux: [] }));
          }
          break;
        }
        case 'niveau': {
          console.log('Selected niveau:', value); // Debugging log
          const sections = await axios.get('http://localhost:8083/api/sections', {
            params: {
              specialityId: filters.speciality.ID_specialite,
              niveau: value.niveau
            }
          });
          console.log('Fetched sections:', sections.data); // Debugging log
          setOptions(prev => ({ ...prev, sections: sections.data }));
          break;
        }
        case 'section': {
          if (!value?.ID_section) {
            console.error("ID_section est invalide ou non sélectionné !");
            return;
          }          
          const scheduleRes = await axios.get(`http://localhost:8083/api/exams/${value.ID_section}`);
          setSchedule(scheduleRes.data);
          break;
        }
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      alert(`Failed to fetch ${type}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  
  const exportToExcel = () => {
    // Prepare metadata from filters
    const metadata = [
      ['Informations du Planning'], // Title row
      ['Faculté', filters.faculty?.nom_faculte || 'Non sélectionné'],
      ['Département', filters.department?.Nom_departement || 'Non sélectionné'],
      ['Spécialité', filters.speciality?.nom_specialite || 'Non sélectionné'],
      ['Niveau', filters.niveau?.niveau || 'Non sélectionné'],
      ['Section', filters.section?.ID_section || 'Non sélectionné'],
    ];
  
    // Convert schedule data to worksheet format
    const scheduleData = schedule.map((exam) => ({
      Date: new Date(exam.exam_date).toLocaleDateString(),
      Horaire: exam.time_slot,
      Module: exam.nom_module,
      Salle: exam.ID_salle,
    }));
  
    // Create a new worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(metadata);
  
    // Add a blank row between metadata and table
    XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: metadata.length });
  
    // Add table headers
    const tableHeaders = [['Date', 'Horaire', 'Module', 'Salle']];
    XLSX.utils.sheet_add_aoa(worksheet, tableHeaders, { origin: metadata.length + 1 });
  
    // Add schedule data
    XLSX.utils.sheet_add_json(worksheet, scheduleData, {
      origin: metadata.length + 2,
      skipHeader: true,
    });
  
    // Define column widths for better readability
    worksheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 15 }, // Horaire
      { wch: 25 }, // Module
      { wch: 10 }, // Salle
    ];
  
    // Apply styles to the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!worksheet[cellRef]) continue;
  
        // Default cell styling
        worksheet[cellRef].s = {
          font: { name: 'Calibri', sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } },
          },
        };
  
        // Title styling (first row)
        if (R === 0) {
          worksheet[cellRef].s = {
            font: { name: 'Calibri', sz: 14, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: '34495E' } }, // Dark blue background
            fontColor: { rgb: 'FFFFFF' }, // White text
          };
        }
  
        // Metadata styling (rows 1-5)
        if (R >= 1 && R <= 5) {
          if (C === 0) {
            // Label column
            worksheet[cellRef].s.font.bold = true;
            worksheet[cellRef].s.fill = { fgColor: { rgb: 'F9F9F9' } }; // Light gray background
          } else {
            // Value column
            worksheet[cellRef].s.fill = { fgColor: { rgb: 'FFFFFF' } }; // White background
          }
        }
  
        // Table header styling (row after metadata + blank row)
        if (R === metadata.length + 1) {
          worksheet[cellRef].s = {
            font: { name: 'Calibri', sz: 11, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: '34495E' } }, // Dark blue background
            fontColor: { rgb: 'FFFFFF' }, // White text
            border: {
              top: { style: 'medium', color: { rgb: '34495E' } },
              bottom: { style: 'medium', color: { rgb: '34495E' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } },
            },
          };
        }
  
        // Table data rows (alternating colors)
        if (R >= metadata.length + 2) {
          worksheet[cellRef].s.fill = {
            fgColor: { rgb: R % 2 === 0 ? 'F2F2F2' : 'FFFFFF' }, // Alternating light gray/white
          };
        }
      }
    }
  
    // Merge cells for the title row
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  
    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning');
  
    // Export the file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(data, `planning_${filters.section?.ID_section || 'export'}.xlsx`);
  };



  const enableEditing = () => {
    setEditedSchedule([...schedule]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedSchedule([]);
  };

  const handleExamChange = (index, field, value) => {
    const updatedSchedule = [...editedSchedule];
    updatedSchedule[index][field] = value;
    setEditedSchedule(updatedSchedule);
  };

  const handleAddExam = () => {
    setEditedSchedule([...editedSchedule, {
      ID_exam: `new-${Date.now()}`,
      exam_date: '',
      time_slot: '',
      nom_module: '',
      ID_salle: '',
      ID_module: null,
      ID_section: filters.section?.ID_section
    }]);
  };

  const handleDeleteExam = async (examId) => {
    if (examId.startsWith('new')) {
      setEditedSchedule(editedSchedule.filter(e => e.ID_exam !== examId));
      return;
    }

    try {
      await axios.delete(`http://localhost:8083/api/exams/${examId}`);
      const updated = editedSchedule.filter(e => e.ID_exam !== examId);
      setEditedSchedule(updated);
      setSchedule(updated);
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };
  const newExams = editedSchedule.filter(e => String(e.ID_exam).startsWith('new'));
  const handleSaveChanges = async () => {
    try {
        try {
          const updates = editedSchedule.filter(e => !String(e.ID_exam).startsWith('new'));
          
          // Ajouter une validation de l'ID_exam
          updates.forEach(exam => {
            if (!/^\d+$/.test(exam.ID_exam)) {
              throw new Error(`ID_exam invalide : ${exam.ID_exam}`);
          }
          });
      
          await Promise.all(updates.map(exam => 
            axios.put(`http://localhost:8083/api/exams/${exam.ID_exam}`, {
              ...exam,
              exam_date: exam.exam_date.split('T')[0]
            })
          ));
        } catch (err) {
          console.error('Erreur:', err);
          alert(`Erreur lors de la sauvegarde : ${err.message}`);
        }
  
      const updates = editedSchedule.filter(e => !String(e.ID_exam).startsWith('new'));
      if (newExams.length > 0) {
        // Add validation for required fields
        if (!filters.section?.ID_section) {
          throw new Error('No section selected');
        }
  
        const { data } = await axios.post('http://localhost:8083/api/exams/bulk', {
          sectionId: filters.section.ID_section,
          exams: newExams
        }).catch(err => {
          throw new Error(`Bulk create failed: ${err.response?.data?.error || err.message}`);
        });
        
        setSchedule([...updates, ...data]);
      }
  
      setIsEditing(false);
      alert('Modifications enregistrées avec succès!');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert(`Erreur lors de la sauvegarde: ${err.message}`);
    }
  };

  return (
    <div className="consult-container">
  <div className="navigation-controls">
    <button className="back-btn" onClick={() => navigate('/admin')}>
      &larr; Retour à l&apos;accueil
    </button>
    <h2>Consultation des plannings</h2>
    
    <div className="edit-controls">
      {!isEditing ? (
        <button 
          className="edit-btn"
          onClick={enableEditing}
          disabled={!filters.section}
        >
          ✏️ Modifier le planning
        </button>
      ) : (
        <div className="editing-buttons">
          <button 
            className="add-exam-btn"
            onClick={handleAddExam}
          >
            ➕ Ajouter Examen
          </button>
          <button 
            className="cancel-btn"
            onClick={cancelEditing}
          >
            ❌ Annuler
          </button>
          <button 
            className="save-btn"
            onClick={handleSaveChanges}
          >
            💾 Enregistrer
          </button>
        </div>
      )}
    </div>
  </div>

  <div className="filters-section">
    <FilterDropdown
      label="Faculté"
      options={options.faculties || []}
      displayKey="nom_faculte"
      onSelect={val => handleFilterChange('faculty', val)}
      loading={loading}
    />
    <FilterDropdown
      label="Département"
      options={options.departments || []}
      displayKey="Nom_departement"
      onSelect={val => handleFilterChange('department', val)}
      loading={loading}
    />
    <FilterDropdown
      label="Spécialité"
      options={options.specialities || []}
      displayKey="nom_specialite"
      idKey="ID_specialite" // ⬅️ CRUCIAL FIX ADDED HERE
      onSelect={val => handleFilterChange('speciality', val)}
      loading={loading}
    />
    <FilterDropdown
      label="Niveau"
      options={options.niveaux || []}
      displayKey="niveau"
      onSelect={val => handleFilterChange('niveau', val)}
      loading={loading}
    />
    <FilterDropdown
      label="Section"
      options={options.sections || []}
      displayFormat={section => `${section.ID_section} - ${section.niveau}`}
      onSelect={val => handleFilterChange('section', val)}
      loading={loading}
    />
  </div>

  {loading ? (
    <div className="loading">
      <div className="spinner"></div>
      Chargement en cours...
    </div>
  ) : (
    <div className="table-export-container">
      <EditableScheduleTable
        data={isEditing ? editedSchedule : schedule}
        isEditing={isEditing}
        onExamChange={handleExamChange}
        onDeleteExam={handleDeleteExam}
      />

      <div className="export-buttons">
        <button
          className="export-btn excel"
          onClick={exportToExcel}
          disabled={!schedule.length || isEditing}
        >
          📊 Exporter en Excel
        </button>
        
        <PDFDownloadLink
  document={<SchedulePDF data={schedule} filters={filters} />}
  fileName={`planning_${filters.section?.ID_section || 'export'}.pdf`}
  className="export-btn pdf"
  disabled={!schedule.length || isEditing}
>
  {({ loading }) => (loading ? '⏳ Génération PDF...' : '📄 Exporter en PDF')}
</PDFDownloadLink>
      </div>
    </div>
  )}
</div>
  );
}