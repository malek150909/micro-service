import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FilterForm from "../components/FilterForm";
import ExamForm from "../components/ExamForm";
import ExamList from "../components/ExamList";
import '../../../css_files/index.css';

const ExamPlanning = () => {
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [filters, setFilters] = useState({
    faculte: "",
    faculteName: "",
    departement: "",
    departementName: "",
    niveau: "",
    specialite: "",
    specialiteName: "",
    section: "",
    ID_semestre: "",
  });
  const [modules, setModules] = useState([]);
  const [salles, setSalles] = useState([]);
  const [semestres, setSemestres] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083";

  useEffect(() => {
    fetchSalles();
    fetchSemestres();
  }, []);

  const fetchExams = async (currentFilters) => {
    try {
      const response = await axios.get(`${API_URL}/exams`, {
        params: currentFilters,
      });
      // Ensure dates are in YYYY-MM-DD format
      const normalizedExams = response.data.map(exam => ({
        ...exam,
        exam_date: exam.exam_date, // Already in YYYY-MM-DD format from backend
      }));
      setExams(normalizedExams);
      return response;
    } catch (err) {
      setError(`Erreur de récupération des examens: ${err.message}`);
      setExams([]);
      return { data: [] };
    }
  };

  const fetchModulesBySection = async (sectionId, semesterId) => {
    try {
      const response = await axios.get(`${API_URL}/exams/modules/${sectionId}`, {
        params: { ID_semestre: semesterId },
      });
      setModules(response.data);
    } catch (err) {
      console.error("Erreur de récupération des modules:", err);
    }
  };

  const fetchSalles = async () => {
    try {
      const response = await axios.get(`${API_URL}/exams/salles`);
      setSalles(response.data);
    } catch (err) {
      console.error("Erreur de récupération des salles:", err);
    }
  };

  const fetchSemestres = async () => {
    try {
      const response = await axios.get(`${API_URL}/exams/semestres`);
      setSemestres(response.data);
    } catch (err) {
      console.error("Erreur de récupération des semestres:", err);
    }
  };

  const handleFilter = (newFilters) => {
    console.log("New filters applied:", newFilters);
    const updatedFilters = {
      ...newFilters,
      faculteName: newFilters.faculte ? getFaculteName(newFilters.faculte) : "",
      departementName: newFilters.departement ? getDepartementName(newFilters.departement) : "",
      specialiteName: newFilters.specialite ? getSpecialiteName(newFilters.specialite) : "",
    };
    setFilters(updatedFilters);
    if (newFilters.section) {
      fetchModulesBySection(newFilters.section, newFilters.ID_semestre);
    }
    setIsFilterApplied(true);
    fetchExams(newFilters);
  };

  // Placeholder functions to map IDs to names (replace with actual logic)
  const getFaculteName = (faculteId) => {
    const faculteMap = { "1": "Faculty of Computer Science" };
    return faculteMap[faculteId] || "N/A";
  };

  const getDepartementName = (departementId) => {
    const departementMap = { "1": "Computer Science Department" };
    return departementMap[departementId] || "N/A";
  };

  const getSpecialiteName = (specialiteId) => {
    const specialiteMap = { "1": "Software Engineering" };
    return specialiteMap[specialiteId] || "N/A";
  };

  const handleAddExam = async (examData) => {
    const selectedModuleId = parseInt(examData.ID_module);
    if (!filters.section || !modules.some((m) => m.ID_module === selectedModuleId)) {
      throw new Error("Le module doit appartenir à la section sélectionnée.");
    }
    try {
      const response = await axios.post(`${API_URL}/exams`, examData);
      fetchExams(filters);
      setError(null);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || `Erreur d'ajout de l'examen: ${err.message}`
      );
    }
  };

  const handleUpdateExam = async (id, examData) => {
    if (!filters.section || !modules.some((m) => m.ID_module === examData.ID_module)) {
      setError("Le module doit appartenir à la section sélectionnée.");
      return;
    }
    try {
      await axios.put(`${API_URL}/exams/${id}`, examData);
      fetchExams(filters);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || `Erreur de mise à jour de l'examen: ${err.message}`
      );
    }
  };

  const handleDeleteExam = async (id) => {
    try {
      await axios.delete(`${API_URL}/exams/${id}`);
      fetchExams(filters);
    } catch (err) {
      setError(
        err.response?.data?.message || `Erreur de suppression de l'examen: ${err.message}`
      );
    }
  };

const exportToPDF = () => {
  const doc = new jsPDF();
  const semesterTitle = filters.ID_semestre ? `Semestre ${filters.ID_semestre}` : "";
  const fileName = `${filters.specialiteName
    ?.toLowerCase()
    .replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.section?.toLowerCase()}`;

  // Colors
  const primaryColor = [52, 73, 94]; // #34495e (Dark Blue)
  const secondaryColor = [220, 220, 220]; // #dcdcdc (Light Gray)
  const backgroundColor = [245, 245, 245]; // #f5f5f5 (Very Light Gray)
  const white = [255, 255, 255];

  // Helper function to add header
  const addHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 20, "F"); // Header background
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...white);
    
  };

  // Helper function to add footer
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      const pageStr = `Page ${i} of ${pageCount}`;
      const dateStr = new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(pageStr, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10, { align: "right" });
      doc.text(`Généré le ${dateStr}`, 20, doc.internal.pageSize.height - 10);
    }
  };

  // Add header to all pages
  addHeader();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(`Planning des Examens : ${semesterTitle}`, doc.internal.pageSize.width / 2, 35, { align: "center" });

  // Separator line below title
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 40, doc.internal.pageSize.width - 20, 40);

  // Metadata Section
  doc.setFillColor(...backgroundColor);
  doc.rect(20, 45, doc.internal.pageSize.width - 40, 50, "F"); // Background for metadata
  doc.setDrawColor(...secondaryColor);
  doc.rect(20, 45, doc.internal.pageSize.width - 40, 50, "S"); // Border

  // Metadata Grid Layout
  doc.setFontSize(12);
  doc.setTextColor(100); // Dark gray for metadata text
  doc.setFont("helvetica", "normal");

  const leftColumnX = 30; // Left column for labels
  const rightColumnX = 90; // Right column for values
  const startY = 55; // Starting Y position
  const lineHeight = 8; // Space between lines

  // Labels (left column)
  doc.text("Faculté:", leftColumnX, startY);
  doc.text("Département:", leftColumnX, startY + lineHeight);
  doc.text("Spécialité:", leftColumnX, startY + lineHeight * 2);
  doc.text("Niveau:", leftColumnX, startY + lineHeight * 3);
  doc.text("Section:", leftColumnX, startY + lineHeight * 4);

  // Values (right column)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(filters.faculteName || "Non sélectionné", rightColumnX, startY);
  doc.text(filters.departementName || "Non sélectionné", rightColumnX, startY + lineHeight);
  doc.text(filters.specialiteName || "Non sélectionné", rightColumnX, startY + lineHeight * 2);
  doc.text(filters.niveau || "Non sélectionné", rightColumnX, startY + lineHeight * 3);
  doc.text(filters.section ? `Section ${filters.section}` : "Non sélectionné", rightColumnX, startY + lineHeight * 4);

  // Table
  const headers = [["Date", "Horaire", "Module", "Salle"]];
  const data = exams.map((exam) => [
    formatDate(exam.exam_date),
    exam.time_slot,
    exam.nom_module,
    exam.ID_salle,
  ]);

  autoTable(doc, {
    head: headers,
    body: data,
    startY: 100, // Adjusted startY after metadata
    theme: "grid", // Use grid theme for better table structure
    headStyles: {
      fillColor: primaryColor, // Dark blue header
      textColor: white, // White text in header
      fontSize: 12,
      fontStyle: "bold",
      halign: "center", // Center-align header text
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [50, 50, 50], // Dark gray for body text
      halign: "center", // Center-align body text
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [230, 230, 230], // Light gray for alternating rows
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: "auto" }, // Date
      1: { cellWidth: "auto" }, // Horaire
      2: { cellWidth: "auto" }, // Module
      3: { cellWidth: "auto" }, // Salle
    },
    styles: {
      lineWidth: 0.2,
      lineColor: secondaryColor, // Light gray grid lines
      overflow: "linebreak", // Handle overflow text
    },
    didDrawPage: (data) => {
      addHeader(); // Add header to each page
    },
  });

  // Add footer after table is drawn
  addFooter();

  // Save the PDF
  doc.save(`${fileName}_examen.pdf`);

  // Helper function to format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

  const exportToExcel = () => {
    const semesterTitle = filters.ID_semestre ? ` - Semestre ${filters.ID_semestre}` : "";
    const fileName = `${filters.specialiteName
      ?.toLowerCase()
      .replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.section?.toLowerCase()}`;

    // Prepare data with filter information as headers
    const filterData = [
      [`Planning des Examens${semesterTitle}`],
      [""],
      [`Faculté: ${filters.faculteName || "Non sélectionné"}`],
      [`Département: ${filters.departementName || "Non sélectionné"}`],
      [`Spécialité: ${filters.specialityName || "Non sélectionné"}`],
      [`Niveau: ${filters.niveau || "Non sélectionné"}`],
      [`Section: ${filters.section ? `Section ${filters.section}` : "Non sélectionné"}`],
      [""],
    ];

    // Prepare exam data
    const examData = exams.map((exam) => ({
      Date: formatDate(exam.exam_date),
      Horaire: exam.time_slot,
      Module: exam.nom_module,
      Salle: exam.ID_salle,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(examData, {
      header: ["Date", "Horaire", "Module", "Salle"],
      skipHeader: false,
      origin: { r: 8, c: 0 }, // Start exam data after filter info
    });

    // Add filter information to the top
    XLSX.utils.sheet_add_aoa(ws, filterData, { origin: "A1" });

    // Styling the worksheet (basic structure; advanced styling requires xlsx-style)
    ws["!cols"] = [
      { wch: 15 }, // Date column width
      { wch: 15 }, // Horaire column width
      { wch: 20 }, // Module column width
      { wch: 10 }, // Salle column width
    ];

    // Merge cells for the title
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Merge title across 4 columns
    ];

    // Placeholder for styling (requires xlsx-style for actual application)
    Object.keys(ws).forEach((cell) => {
      if (cell === "!ref" || cell === "!cols" || cell === "!merges") return;

      const row = parseInt(cell.match(/\d+/)[0], 10);
      if (row === 1) {
        // Title row
        ws[cell].s = {
          font: { sz: 16, bold: true },
          alignment: { horizontal: "center" },
          fill: { fgColor: { rgb: "2c3e50" } }, // Darker elegant color (background)
        };
      } else if (row >= 3 && row <= 7) {
        // Filter info rows
        ws[cell].s = {
          font: { sz: 12 },
          fill: { fgColor: { rgb: "f9f9f9" } }, // Subtle background
          border: { top: { style: "thin", color: { rgb: "dcdcdc" } } },
        };
      } else if (row === 9) {
        // Header row
        ws[cell].s = {
          font: { sz: 12, bold: true },
          fill: { fgColor: { rgb: "34495e" } }, // Dark blue background
          alignment: { horizontal: "center" },
          color: { rgb: "FFFFFF" }, // White text
        };
      } else if (row > 9) {
        // Data rows
        ws[cell].s = {
          font: { sz: 10 },
          alignment: { horizontal: "center" },
          border: { bottom: { style: "thin", color: { rgb: "dcdcdc" } } },
        };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Examens${semesterTitle}`);
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, `${fileName}_examen.xlsx`);

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  return (
    <div className="exam-container">
      <h1>Planning des Examens{filters.ID_semestre ? ` - Semestre ${filters.ID_semestre}` : ""}</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <FilterForm onFilter={handleFilter} />
      {exams.length > 0 ? (
        <div>
          <ExamList
            exams={exams}
            onDelete={handleDeleteExam}
            onUpdate={handleUpdateExam}
            salles={salles}
            semestres={semestres}
          />
          <div className="export-buttons">
            <button onClick={exportToPDF}>Exporter en PDF</button>
            <button onClick={exportToExcel}>Exporter en Excel</button>
          </div>
        </div>
      ) : (
        <p className="no-results">
          {filters.section && isFilterApplied
            ? "Aucun examen trouvé."
            : "Veuillez sélectionner une section pour filtrer ou créer un nouveau planning."}
        </p>
      )}
      <ExamForm
        onAdd={handleAddExam}
        disabled={!filters.section}
        modules={modules}
        salles={salles}
        semestres={semestres}
        sectionId={filters.section}
        selectedSemestre={filters.ID_semestre}
        onFilterReset={() => true}
      />
    </div>
  );
};

export default ExamPlanning;