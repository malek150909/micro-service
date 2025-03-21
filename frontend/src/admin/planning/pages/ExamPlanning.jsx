import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from 'react-router-dom';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FilterForm from "../components/FilterForm";
import ExamForm from "../components/ExamForm";
import ExamList from "../components/ExamList";

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
    sectionName: "", // Ajout de sectionName
    ID_semestre: "",
  });
  const [modules, setModules] = useState([]);
  const [salles, setSalles] = useState([]);
  const [semestres, setSemestres] = useState([]);

  const [nameCache, setNameCache] = useState({
    faculte: {},
    departement: {},
    specialite: {},
    section: {}, // Ajout de cache pour section
  });

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
      const normalizedExams = response.data.map((exam) => ({
        ...exam,
        exam_date: exam.exam_date,
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

  const fetchName = async (url, id, field, cacheKey) => {
    if (!id) return "";
    if (nameCache[cacheKey][id]) {
      console.log(`Cache hit for ${cacheKey} (${id}):`, nameCache[cacheKey][id]);
      return nameCache[cacheKey][id];
    }
    try {
      console.log(`Fetching ${cacheKey} from URL: ${url}`);
      const response = await axios.get(url);
      console.log(`Response for ${cacheKey}:`, response.data);
      const item = response.data.find((item) => String(item[field]) === String(id));
      console.log(`Found item for ${field} = ${id}:`, item);
      let name;
      if (item) {
        const expectedField = field.replace("ID_", "nom_");
        name = item[expectedField] || item["Nom_departement"] || "N/A"; // Fallback pour Nom_departement
      } else {
        name = "N/A";
      }
      console.log(`Extracted name for ${cacheKey} (${id}): ${name}`);
      setNameCache((prev) => ({
        ...prev,
        [cacheKey]: { ...prev[cacheKey], [id]: name },
      }));
      return name;
    } catch (err) {
      console.error(`Erreur de récupération de ${cacheKey} (${id}):`, err);
      return "N/A";
    }
  };

  const handleFilter = async (newFilters) => {
    console.log("New filters applied:", newFilters);

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
    const sectionName = await fetchName(
      `${API_URL}/exams/sections?specialite=${newFilters.specialite}&niveau=${newFilters.niveau}`,
      newFilters.section,
      "ID_section",
      "section"
    );

    console.log("Fetched names:", { faculteName, departementName, specialiteName, sectionName });

    const updatedFilters = {
      ...newFilters,
      faculteName,
      departementName,
      specialiteName,
      sectionName, // Ajout de sectionName
    };
    setFilters(updatedFilters);
    if (newFilters.section) {
      fetchModulesBySection(newFilters.section, newFilters.ID_semestre);
    }
    setIsFilterApplied(true);
    fetchExams(newFilters);
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
      .replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.sectionName?.toLowerCase().replace(/ /g, "_") || filters.section}`;

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
    doc.text(filters.sectionName || "Non sélectionné", rightColumnX, startY + lineHeight * 4); // Utiliser sectionName

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
    const fileName = `${filters.specialiteName
      ?.toLowerCase()
      .replace(/ /g, "_")}_${filters.niveau?.toLowerCase()}_${filters.sectionName?.toLowerCase().replace(/ /g, "_") || filters.section}`;

    const filterData = [
      [`Planning des Examens${semesterTitle}`],
      [""],
      [`Faculté: ${filters.faculteName || "Non sélectionné"}`],
      [`Département: ${filters.departementName || "Non sélectionné"}`],
      [`Spécialité: ${filters.specialiteName || "Non sélectionné"}`],
      [`Niveau: ${filters.niveau || "Non sélectionné"}`],
      [`Section: ${filters.sectionName || "Non sélectionné"}`], // Utiliser sectionName
      [""],
    ];

    const examData = exams.map((exam) => ({
      Date: formatDate(exam.exam_date),
      Horaire: exam.time_slot,
      Module: exam.nom_module,
      Salle: exam.ID_salle,
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
      { wch: 10 },
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

  const handleBackToAdmin = () => {
    navigate("/Admin");
  };

  return (
    <div id="exams">
      <div className="container">
        <button onClick={handleBackToAdmin} className="button">
          Retour à l&apos;accueil
        </button>
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
    </div>
  );
};

export default ExamPlanning;