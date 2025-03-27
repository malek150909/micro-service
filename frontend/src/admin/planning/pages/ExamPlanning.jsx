import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FilterForm from "../components/FilterForm";
import ExamForm from "../components/ExamForm";
import ExamList from "../components/ExamList";
import "../../../admin_css_files/exam.css";
import { FaFilePdf, FaFileExcel, FaArrowLeft, FaUser } from 'react-icons/fa'; // Added FaUser

// Memoize child components to prevent unnecessary re-renders
const MemoizedFilterForm = memo(FilterForm);
const MemoizedExamForm = memo(ExamForm);
const MemoizedExamList = memo(ExamList);

const ExamPlanning = () => {
  const navigate = useNavigate();
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
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [salles, setSalles] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [nameCache, setNameCache] = useState({
    faculte: {},
    departement: {},
    specialite: {},
  });

  const examListRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8083";

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchSalles(), fetchSemestres()]);
    };
    fetchInitialData();
  }, []);

  const fetchExams = useCallback(async (currentFilters) => {
    try {
      const response = await axios.get(`${API_URL}/exams`, {
        params: currentFilters,
      });
      const normalizedExams = response.data.map((exam) => {
        console.log("Fetched exam:", exam);
        return {
          ...exam,
          exam_date: exam.exam_date,
          ID_exam: exam.ID_exam,
        };
      });
      setExams(normalizedExams);
      return response;
    } catch (err) {
      setError(`Erreur de récupération des examens: ${err.message}`);
      setExams([]);
      return { data: [] };
    }
  }, [API_URL]);

  const fetchModulesBySection = useCallback(async (sectionId, semesterId) => {
    setIsLoadingModules(true);
    try {
      const response = await axios.get(`${API_URL}/exams/modules/${sectionId}`, {
        params: { ID_semestre: semesterId },
      });
      setModules(response.data);
    } catch (err) {
      console.error("Erreur de récupération des modules:", err);
      setModules([]);
    } finally {
      setIsLoadingModules(false);
    }
  }, [API_URL]);

  const fetchSalles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/exams/salles`);
      setSalles(response.data);
    } catch (err) {
      console.error("Erreur de récupération des salles:", err);
    }
  }, [API_URL]);

  const fetchSemestres = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/exams/semestres`);
      setSemestres(response.data);
    } catch (err) {
      console.error("Erreur de récupération des semestres:", err);
    }
  }, [API_URL]);

  const fetchName = useCallback(async (url, id, field, cacheKey) => {
    if (!id) return "";
    if (nameCache[cacheKey][id]) {
      return nameCache[cacheKey][id];
    }
    try {
      const response = await axios.get(url);
      const item = response.data.find((item) => String(item[field]) === String(id));
      let name = item ? (item[field.replace("ID_", "nom_")] || item["Nom_departement"] || "N/A") : "N/A";
      setNameCache((prev) => ({
        ...prev,
        [cacheKey]: { ...prev[cacheKey], [id]: name },
      }));
      return name;
    } catch (err) {
      console.error(`Erreur de récupération de ${cacheKey} (${id}):`, err);
      return "N/A";
    }
  }, [nameCache]);

  const handleFilter = useCallback(async (newFilters) => {
    const faculteName = await fetchName(
      `${API_URL}/exams/facultes`,
      newFilters.faculte,
      "ID_faculte",
      "faculte"
    );
    const departementName = await fetchName(
      `${API_URL}/exams/departements?faculte=${newFilters.faculte}`,
      newFilters.departement,
      "ID_departement",
      "departement"
    );
    const specialiteName = await fetchName(
      `${API_URL}/exams/specialites?departement=${newFilters.departement}&niveau=${newFilters.niveau}`,
      newFilters.specialite,
      "ID_specialite",
      "specialite"
    );

    const updatedFilters = {
      ...newFilters,
      faculteName,
      departementName,
      specialiteName,
    };
    setFilters(updatedFilters);
    if (newFilters.section) {
      await fetchModulesBySection(newFilters.section, newFilters.ID_semestre);
    }
    setIsFilterApplied(true);
    await fetchExams(newFilters);
    if (examListRef.current) {
      examListRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fetchName, fetchModulesBySection, fetchExams]);

  const handleAddExam = async (examData) => {
    const selectedModuleId = parseInt(examData.ID_module);
    if (!filters.section || !modules.some((m) => m.ID_module === selectedModuleId)) {
      throw new Error("Le module doit appartenir à la section sélectionnée.");
    }
    try {
      await axios.post(`${API_URL}/exams`, examData);
      await fetchExams(filters);
      setError(null);
      if (examListRef.current) {
        examListRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      throw new Error(
        err.response?.data?.message || `Erreur d'ajout de l'examen: ${err.message}`
      );
    }
  };

  const handleUpdateExam = async (id, examData) => {
    if (!id) {
      throw new Error("ID de l'examen manquant.");
    }

    // Convert ID_module to number for comparison
    const selectedModuleId = parseInt(examData.ID_module);

    // Validate that the selected module exists in the modules list
    if (!modules.some((m) => m.ID_module === selectedModuleId)) {
      throw new Error("Le module sélectionné n'est pas valide ou n'appartient pas à la section sélectionnée.");
    }

    // Validate for duplicates (same date, time, and module)
    const response = await axios.get(`${API_URL}/exams`, {
      params: {
        ID_section: examData.ID_section,
        ID_semestre: examData.ID_semestre,
      },
    });

    const existingExams = response.data.filter((exam) => exam.ID_exam !== id); // Exclude the current exam

    const hasDuplicate = existingExams.some((exam) => {
      return (
        exam.exam_date === examData.exam_date &&
        exam.time_slot === examData.time_slot &&
        exam.ID_module === selectedModuleId
      );
    });

    if (hasDuplicate) {
      throw new Error(
        'Un examen avec le même module, la même date et le même horaire existe déjà.'
      );
    }

    try {
      const updatedExamData = {
        ...examData,
        ID_exam: id,
        exam_date: examData.exam_date,
        time_slot: examData.time_slot,
        mode: examData.mode,
        ID_salle: examData.mode === 'en ligne' ? null : examData.ID_salle,
        ID_module: selectedModuleId,
      };
      console.log("Sending update request for ID:", id, "with data:", updatedExamData);
      await axios.put(`${API_URL}/exams/${id}`, updatedExamData);
      await fetchExams(filters);
      setError(null);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || `Erreur de mise à jour de l'examen: ${err.message}`
      );
    }
  };

  const handleDeleteExam = async (id) => {
    if (!id) {
      setError("ID de l'examen manquant pour la suppression.");
      return;
    }
    try {
      console.log("Sending delete request for ID:", id);
      await axios.delete(`${API_URL}/exams/${id}`);
      await fetchExams(filters);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || `Erreur de suppression de l'examen: ${err.message}`
      );
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const semesterTitle = filters.ID_semestre ? `Semestre ${filters.ID_semestre}` : "";
    const fileName = `${filters.specialiteName?.toLowerCase().replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.section?.toLowerCase()}`;
  
    const primaryColor = [52, 73, 94];
    const secondaryColor = [220, 220, 220];
    const backgroundColor = [245, 245, 245];
    const white = [255, 255, 255];
  
    const addHeader = () => {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, doc.internal.pageSize.width, 20, "F");
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...white);
    };
  
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
  
    addHeader();
  
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(`Planning des Examens : ${semesterTitle}`, doc.internal.pageSize.width / 2, 35, { align: "center" });
  
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 40, doc.internal.pageSize.width - 20, 40);
  
    doc.setFillColor(...backgroundColor);
    doc.rect(20, 45, doc.internal.pageSize.width - 40, 50, "F");
    doc.setDrawColor(...secondaryColor);
    doc.rect(20, 45, doc.internal.pageSize.width - 40, 50, "S");
  
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
  
    const leftColumnX = 30;
    const rightColumnX = 90;
    const startY = 55;
    const lineHeight = 8;
  
    doc.text("Faculté:", leftColumnX, startY);
    doc.text("Département:", leftColumnX, startY + lineHeight);
    doc.text("Spécialité:", leftColumnX, startY + lineHeight * 2);
    doc.text("Niveau:", leftColumnX, startY + lineHeight * 3);
    doc.text("Section:", leftColumnX, startY + lineHeight * 4);
  
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text(filters.faculteName || "Non sélectionné", rightColumnX, startY);
    doc.text(filters.departementName || "Non sélectionné", rightColumnX, startY + lineHeight);
    doc.text(filters.specialiteName || "Non sélectionné", rightColumnX, startY + lineHeight * 2);
    doc.text(filters.niveau || "Non sélectionné", rightColumnX, startY + lineHeight * 3);
    doc.text(filters.section ? `Section ${filters.section}` : "Non sélectionné", rightColumnX, startY + lineHeight * 4);
  
    const headers = [["Date", "Horaire", "Module", "Salle"]];
    const data = exams.map((exam) => [
      formatDate(exam.exam_date),
      exam.time_slot,
      exam.nom_module,
      exam.mode === 'en ligne' ? 'En Ligne' : exam.ID_salle,
    ]);
  
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 100,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: white,
        fontSize: 12,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [50, 50, 50],
        halign: "center",
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [230, 230, 230],
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: "auto" },
      },
      styles: {
        lineWidth: 0.2,
        lineColor: secondaryColor,
        overflow: "linebreak",
      },
      didDrawPage: (data) => {
        addHeader();
      },
    });
  
    addFooter();
    doc.save(`${fileName}_examen.pdf`);
  
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
    const fileName = `${filters.specialiteName?.toLowerCase().replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.section?.toLowerCase()}`;
  
    const filterData = [
      [`Planning des Examens${semesterTitle}`],
      [""],
      [`Faculté: ${filters.faculteName || "Non sélectionné"}`],
      [`Département: ${filters.departementName || "Non sélectionné"}`],
      [`Spécialité: ${filters.specialiteName || "Non sélectionné"}`],
      [`Niveau: ${filters.niveau || "Non sélectionné"}`],
      [`Section: ${filters.section ? `Section ${filters.section}` : "Non sélectionné"}`],
      [""],
    ];
  
    const examData = exams.map((exam) => ({
      Date: formatDate(exam.exam_date),
      Horaire: exam.time_slot,
      Module: exam.nom_module,
      Salle: exam.mode === 'en ligne' ? 'En Ligne' : exam.ID_salle,
    }));
  
    const ws = XLSX.utils.json_to_sheet(examData, {
      header: ["Date", "Horaire", "Module", "Salle"],
      skipHeader: false,
      origin: { r: 8, c: 0 },
    });
  
    XLSX.utils.sheet_add_aoa(ws, filterData, { origin: "A1" });
  
    ws["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];
  
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    ];
  
    Object.keys(ws).forEach((cell) => {
      if (cell === "!ref" || cell === "!cols" || cell === "!merges") return;
  
      const row = parseInt(cell.match(/\d+/)[0], 10);
      if (row === 1) {
        ws[cell].s = {
          font: { sz: 16, bold: true },
          alignment: { horizontal: "center" },
          fill: { fgColor: { rgb: "2c3e50" } },
        };
      } else if (row >= 3 && row <= 7) {
        ws[cell].s = {
          font: { sz: 12 },
          fill: { fgColor: { rgb: "f9f9f9" } },
          border: { top: { style: "thin", color: { rgb: "dcdcdc" } } },
        };
      } else if (row === 9) {
        ws[cell].s = {
          font: { sz: 12, bold: true },
          fill: { fgColor: { rgb: "34495e" } },
          alignment: { horizontal: "center" },
          color: { rgb: "FFFFFF" },
        };
      } else if (row > 9) {
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
    <div id="exams">
    <div className="app-container">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>
      <div className="sidebar">
        <div className="logo">
          <h2>
            <FaUser style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Admin
          </h2>
        </div>
        <button className="sidebar-button" onClick={() => navigate('/')}>
          <FaArrowLeft /> Retour à l'accueil
        </button>
      </div>
      <div className="main-content">
        <div className="header">
          <h1>Planning des Examens{filters.ID_semestre ? ` - Semestre ${filters.ID_semestre}` : ""}</h1>
          <p>Gérer les plannings des examens des facultés</p>
        </div>
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        <div className="form-row">
          <div className="filter-section">
            <MemoizedFilterForm onFilter={handleFilter} />
          </div>
          <div className="exam-form-section">
            <MemoizedExamForm
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
        </div>
        <div className="list-section" ref={examListRef}>
          {exams.length > 0 ? (
            <>
              {isLoadingModules ? (
                <div className="message-container">
                  <p className="no-results">Chargement des modules...</p>
                </div>
              ) : (
                <MemoizedExamList
                  exams={exams}
                  onDelete={handleDeleteExam}
                  onUpdate={handleUpdateExam}
                  salles={salles}
                  semestres={semestres}
                  modules={modules}
                />
              )}
              <div className="export-buttons">
                <button onClick={exportToPDF}>
                  <FaFilePdf style={{ marginRight: '8px' }} /> Exporter en PDF
                </button>
                <button onClick={exportToExcel}>
                  <FaFileExcel style={{ marginRight: '8px' }} /> Exporter en Excel
                </button>
              </div>
            </>
          ) : (
            <div className="message-container">
              <p className="no-results">
                {filters.section && isFilterApplied
                  ? "Aucun examen trouvé."
                  : "Sélectionnez une section pour afficher ou créer un planning."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ExamPlanning;