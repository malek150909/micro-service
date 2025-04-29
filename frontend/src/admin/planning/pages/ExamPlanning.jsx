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
import { FaHome, FaFilePdf, FaFileExcel, FaArrowLeft, FaUser, FaFileImport } from 'react-icons/fa';
import "../exam.css";

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
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const examListRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = "http://courses.localhost";

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
      const normalizedExams = response.data.map((exam) => ({
        ...exam,
        exam_date: exam.exam_date,
        ID_exam: exam.ID_exam,
      }));
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
    if (nameCache[cacheKey][id]) return nameCache[cacheKey][id];
    try {
      const response = await axios.get(url);
      const item = response.data.find((item) => String(item[field]) === String(id));
      const name = item ? (item[field.replace("ID_", "nom_")] || item["Nom_departement"] || "N/A") : "N/A";
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

  const handleFilterChange = useCallback((newFilters) => {
    setIsFilterApplied(false);
    setExams([]);
    setModules([]);
    setFilters({
      faculte: newFilters.faculte,
      faculteName: filters.faculteName,
      departement: newFilters.departement,
      departementName: filters.departementName,
      niveau: newFilters.niveau,
      specialite: newFilters.specialite,
      specialiteName: filters.specialiteName,
      section: newFilters.section,
      ID_semestre: newFilters.ID_semestre,
    });
  }, [filters]);

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

    setIsFilterApplied(true);
    await fetchModulesBySection(newFilters.section, newFilters.ID_semestre);
    await fetchExams(updatedFilters);
    if (examListRef.current) {
      examListRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fetchName, fetchModulesBySection, fetchExams]);

  const handleResetFilters = useCallback(() => {
    setFilters({
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
    setModules([]);
    setExams([]);
    setIsFilterApplied(false);
  }, []);

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
    if (!id) throw new Error("ID de l'examen manquant.");
    const selectedModuleId = parseInt(examData.ID_module);
    if (!modules.some((m) => m.ID_module === selectedModuleId)) {
      throw new Error("Le module sélectionné n'est pas valide ou n'appartient pas à la section sélectionnée.");
    }
    const response = await axios.get(`${API_URL}/exams`, {
      params: { ID_section: examData.ID_section, ID_semestre: examData.ID_semestre },
    });
    const existingExams = response.data.filter((exam) => exam.ID_exam !== id);
    const hasDuplicate = existingExams.some(
      (exam) =>
        exam.exam_date === examData.exam_date &&
        exam.time_slot === examData.time_slot &&
        exam.ID_module === selectedModuleId
    );
    if (hasDuplicate) {
      throw new Error(
        "Un examen avec le même module, la même date et le même horaire existe déjà."
      );
    }
    try {
      const updatedExamData = {
        ...examData,
        ID_exam: id,
        exam_date: examData.exam_date,
        time_slot: examData.time_slot,
        mode: examData.mode,
        ID_salles: examData.mode === "en ligne" ? [] : examData.ID_salles,
        ID_module: selectedModuleId,
      };
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
      await axios.delete(`${API_URL}/exams/${id}`);
      await fetchExams(filters);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || `Erreur de suppression de l'examen: ${err.message}`
      );
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setUploadStatus({ type: "error", message: "Aucun fichier sélectionné." });
      setShowErrorModal(true);
      return;
    }
    if (!filters.section || !filters.ID_semestre) {
      setUploadStatus({
        type: "error",
        message: "Veuillez sélectionner une section et un semestre avant de téléverser.",
      });
      setShowErrorModal(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionId", filters.section);
    formData.append("semestreId", filters.ID_semestre);

    try {
      const response = await axios.post(`${API_URL}/exams/upload-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchExams(filters);
      if (response.data.errors && response.data.errors.length > 0) {
        setUploadStatus({
          type: "error",
          message: response.data.message,
          errors: response.data.errors,
        });
        setShowErrorModal(true);
      } else {
        setUploadStatus({
          type: "success",
          message: response.data.message,
        });
        setTimeout(() => setUploadStatus(null), 5000);
      }
      fileInputRef.current.value = "";
      if (examListRef.current) {
        examListRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors du téléversement du fichier.";
      const errorDetails = err.response?.data?.errors || [];
      setUploadStatus({
        type: "error",
        message: errorMessage,
        errors: errorDetails,
      });
      setShowErrorModal(true);
      await fetchExams(filters);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setUploadStatus(null);
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

    const headers = [["Date", "Horaire", "Module", "Salle(s)"]];
    const data = exams.map((exam) => [
      formatDate(exam.exam_date),
      exam.time_slot,
      exam.nom_module,
      exam.mode === "en ligne" ? "En Ligne" : exam.nom_salle || "N/A",
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
      didDrawPage: () => addHeader(),
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
      "Salle(s)": exam.mode === "en ligne" ? "En Ligne" : exam.nom_salle || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(examData, {
      header: ["Date", "Horaire", "Module", "Salle(s)"],
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

    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    Object.keys(ws).forEach((cell) => {
      if (cell === "!ref" || cell === "!cols" || cell === "!merges") return;
      const row = parseInt(cell.match(/\d+/)[0], 10);
      ws[cell].s = {
        font: { sz: row === 1 ? 16 : row >= 3 && row <= 7 ? 12 : row === 9 ? 12 : 10, bold: row === 1 || row === 9 },
        alignment: { horizontal: row >= 9 ? "center" : "left" },
        fill: {
          fgColor: {
            rgb:
              row === 1 ? "2c3e50" : row === 9 ? "34495e" : row > 9 && row % 2 === 0 ? "f9f9f9" : undefined,
          },
        },
        color: { rgb: row === 9 ? "FFFFFF" : undefined },
        border: {
          bottom: { style: row > 9 || row >= 3 && row <= 7 ? "thin" : undefined, color: { rgb: "dcdcdc" } },
          top: { style: row >= 3 && row <= 7 ? "thin" : undefined, color: { rgb: "dcdcdc" } },
        },
      };
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
    <div className="ADM-EXM-app-container">
      <div className="ADM-EXM-background-shapes">
        <div className="ADM-EXM-shape ADM-EXM-shape1"></div>
        <div className="ADM-EXM-shape ADM-EXM-shape2"></div>
      </div>
      <div className="ADM-EXM-sidebar">
        <div className="ADM-EXM-logo">
          <h2>
            <FaUser style={{ marginRight: "8px", verticalAlign: "middle" }} /> Planning
          </h2>
        </div>
        <button className="ADM-EXM-sidebar-button" onClick={() => navigate("/admin")}>
          <FaHome /> Retour à l'accueil
        </button>
      </div>
      <div className="ADM-EXM-main-content">
        <div className="ADM-EXM-header">
          <h1>Planning des Examens{filters.ID_semestre ? ` - Semestre ${filters.ID_semestre}` : ""}</h1>
          <p>Gérer les plannings des examens des facultés</p>
        </div>
        {error && (
          <div className="ADM-EXM-error-message">
            <p>{error}</p>
          </div>
        )}
        <div className="ADM-EXM-form-row">
          <div className="ADM-EXM-filter-section">
            <MemoizedFilterForm
              onFilter={handleFilter}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </div>
          <div className="ADM-EXM-exam-form-section">
            <MemoizedExamForm
              onAdd={handleAddExam}
              disabled={false}
              modules={modules}
              salles={salles}
              semestres={semestres}
              sectionId={filters.section}
              selectedSemestre={filters.ID_semestre}
              onFilterReset={handleResetFilters}
              isFilterApplied={isFilterApplied}
            />
            <div className="ADM-EXM-upload-section">
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={!isFilterApplied}
                style={{ display: "none" }} // Hide the file input
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={!isFilterApplied}
                className="ADM-EXM-upload-button"
              >
                <FaFileImport style={{ marginRight: "8px" }} /> Importer Excel
              </button>
            </div>
          </div>
        </div>
        <div className="ADM-EXM-list-section" ref={examListRef}>
          {exams.length > 0 ? (
            <>
              {isLoadingModules ? (
                <div className="ADM-EXM-message-container">
                  <p className="ADM-EXM-no-results">Chargement des modules...</p>
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
              <div className="ADM-EXM-export-buttons">
                <button onClick={exportToPDF}>
                  <FaFilePdf style={{ marginRight: "8px" }} /> Exporter en PDF
                </button>
                <button onClick={exportToExcel}>
                  <FaFileExcel style={{ marginRight: "8px" }} /> Exporter en Excel
                </button>
              </div>
              {uploadStatus && uploadStatus.type === "success" && (
                <div className="ADM-EXM-message-container ADM-EXM-success-message">
                  <p>{uploadStatus.message}</p>
                </div>
              )}
            </>
          ) : (
            <div className="ADM-EXM-message-container">
              <p className="ADM-EXM-no-results">
                {filters.section && isFilterApplied
                  ? "Aucun examen trouvé."
                  : "Sélectionnez une section et appliquez le filtre pour afficher ou créer un planning."}
              </p>
            </div>
          )}
        </div>
      </div>

      {showErrorModal && uploadStatus && uploadStatus.type === "error" && (
        <div className="ADM-EXM-modal-overlay">
          <div className="ADM-EXM-modal-content ADM-EXM-error-modal">
            <h3>Erreur lors de l'importation</h3>
            <p style={{ color: '#ff4d4f' }}>{uploadStatus.message}</p>
            {uploadStatus.errors && uploadStatus.errors.length > 0 && (
              <ul className="ADM-EXM-error-list">
                {uploadStatus.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
            <div className="ADM-EXM-modal-actions">
              <button onClick={closeErrorModal}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPlanning;