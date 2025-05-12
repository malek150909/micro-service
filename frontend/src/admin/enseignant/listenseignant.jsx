import { useState, useEffect } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import styles from "./prof.module.css"
import { FaChalkboardTeacher, FaPlus, FaTrash, FaTimes, FaEdit, FaFileImport, FaBook, FaUsers, FaBookOpen, FaFilter, FaList } from "react-icons/fa"

// Configure Axios with base URL and auth interceptor
const api = axios.create({
  baseURL: "http://users.localhost/api",
})

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Function to generate a random password
const generateRandomPassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const ListEnseignant = () => {
  const [faculties, setFaculties] = useState([])
  const [departments, setDepartments] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [modules, setModules] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    facultyId: "",
    departmentId: "",
    specialtyId: "",
    level: "",
    assignedSections: [],
    assignedModules: [],
    moduleSessionTypes: {},
    moduleSections: {}, // Maps moduleId to sectionId
  })
  const [importData, setImportData] = useState({
    facultyId: "",
    departmentId: "",
    file: null,
  })
  const [filterData, setFilterData] = useState({
    facultyId: "",
    departmentId: "",
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false)
  const [showAddModuleForm, setShowAddModuleForm] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAssignments, setIsEditingAssignments] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filteredModules, setFilteredModules] = useState([])
  const [activeTab, setActiveTab] = useState("teachers")

  // Fixed list of levels
  const levels = ['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3']

  // Normalize teacher data to ensure Matricule and modules consistency
  const normalizeTeacher = (teacher) => ({
    ...teacher,
    Matricule: teacher.matricule || teacher.Matricule,
    matricule: teacher.matricule || teacher.Matricule,
    motdepasse: teacher.motdepasse || "",
    sections: Array.isArray(teacher.sections) ? teacher.sections : [],
    modules: Array.isArray(teacher.modules) ? teacher.modules : [],
  })

  const resetFormData = () => {
    console.log("resetFormData called, resetting assignedSections");
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      facultyId: "",
      departmentId: "",
      specialtyId: "",
      level: "",
      assignedSections: [],
      assignedModules: [],
      moduleSessionTypes: {},
      moduleSections: {},
    });
    setFilteredModules([]);
    setError("");
    setSuccess("");
  };

  // Reset import data
  const resetImportData = () => {
    setImportData({
      facultyId: "",
      departmentId: "",
      file: null,
    })
    setError("")
    setSuccess("")
  }

  // Fetch teachers data
  const fetchTeachers = async () => {
    try {
      const teachRes = await api.get("/teachers");
      setTeachers(teachRes.data.map(normalizeTeacher));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement des enseignants.");
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, depRes, specRes, modRes, secRes, teachRes] = await Promise.all([
          api.get("/faculties"),
          api.get("/departments"),
          api.get("/specialties"),
          api.get("/modules"),
          api.get("/sections"),
          api.get("/teachers"),
        ])
        setFaculties(facRes.data)
        setDepartments(depRes.data)
        setSpecialties(specRes.data)
        setModules(modRes.data)
        setSections(secRes.data)
        setTeachers(teachRes.data.map(normalizeTeacher))
      } catch (err) {
        setError(err.response?.data?.error || "Erreur lors du chargement des données initiales.")
      }
    }
    fetchData()
  }, [])

  // Fetch modules by sections and specialty
  useEffect(() => {
    const fetchModulesBySectionsAndSpecialty = async () => {
      if (formData.specialtyId && formData.assignedSections.length > 0) {
        try {
          const res = await api.post("/modules/by-sections-specialty", {
            sectionIds: formData.assignedSections,
            specialtyId: Number.parseInt(formData.specialtyId),
          })
          setFilteredModules(res.data)
        } catch (err) {
          setError(err.response?.data?.error || "Erreur lors de la récupération des modules.")
          setFilteredModules([])
        }
      } else {
        setFilteredModules([])
      }
    }
    fetchModulesBySectionsAndSpecialty()
  }, [formData.specialtyId, formData.assignedSections])

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "facultyId" && { departmentId: "" }),
    }))
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "facultyId" && { departmentId: "", specialtyId: "", level: "", assignedSections: [] }),
      ...(name === "departmentId" && { specialtyId: "", level: "", assignedSections: [] }),
      ...(name === "level" && { specialtyId: "", assignedSections: [] }),
      ...(name === "specialtyId" && { assignedSections: [] }),
    }))
  }

  // Handle import input changes
  const handleImportInputChange = (e) => {
    const { name, value, files } = e.target
    setImportData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
      ...(name === "facultyId" && { departmentId: "" }),
    }))
  }

  // Handle section selection
const handleSectionSelect = (sectionId) => {
  setFormData((prev) => {
    const updatedFormData = {
      ...prev,
      assignedSections: [sectionId], // Only one section at a time
    };
    console.log("Updated assignedSections:", updatedFormData.assignedSections); // Debug log
    return updatedFormData;
  });
};

  // Handle module selection
const handleModuleSelect = (moduleId, sectionId) => {
  setFormData((prev) => {
    const updatedModules = prev.assignedModules.includes(moduleId)
      ? prev.assignedModules.filter((id) => id !== moduleId)
      : [...prev.assignedModules, moduleId];
    const updatedSessionTypes = { ...prev.moduleSessionTypes };
    const updatedModuleSections = { ...prev.moduleSections };
    if (!prev.assignedModules.includes(moduleId)) {
      updatedSessionTypes[moduleId] = "Cour";
      updatedModuleSections[moduleId] = sectionId;
    } else {
      delete updatedSessionTypes[moduleId];
      delete updatedModuleSections[moduleId];
    }
    const updatedFormData = {
      ...prev,
      assignedModules: updatedModules,
      moduleSessionTypes: updatedSessionTypes,
      moduleSections: updatedModuleSections,
    };
    console.log("Updated formData after module select:", updatedFormData); // Debug log
    return updatedFormData;
  });
};

  // Handle session type change
  const handleSessionTypeChange = (moduleId, sessionType) => {
    setFormData((prev) => ({
      ...prev,
      moduleSessionTypes: {
        ...prev.moduleSessionTypes,
        [moduleId]: sessionType,
      },
    }))
  }

  // Handle form submission for adding teacher
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const password = generateRandomPassword();
    try {
      const teacherData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motdepasse: password,
        annee_inscription: new Date().toISOString().split("T")[0],
        ID_faculte: formData.facultyId,
        ID_departement: formData.departmentId,
        assignedSections: [],
      };
      const res = await api.post("/teachers", teacherData);
      const newTeacher = normalizeTeacher({ ...res.data, motdepasse: password });
      setTeachers((prev) => [...prev, newTeacher]);
      setSuccess(`Enseignant ajouté avec succès ! Mot de passe: ${password}`);
      resetFormData();
      setShowAddModal(false);
      setSelectedTeacher(newTeacher);
      setShowDetailsModal(true);
      fetchTeachers(); // Refresh the teacher list
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout de l'enseignant.");
    }
  };

  // Handle import form submission
  const handleImportSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!importData.facultyId || !importData.departmentId || !importData.file) {
      setError("Veuillez sélectionner une faculté, un département et un fichier Excel.")
      return
    }
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: ["NOM", "EMAIL"], range: 1 })

        const teachers = rows
          .map((row, index) => {
            if (!row.NOM || !row.EMAIL || !isValidEmail(row.EMAIL)) {
              console.warn(`Ligne ${index + 2} ignorée : NOM ou EMAIL invalide`, row)
              return null
            }
            const [nom, prenom] = row.NOM.split(",").map((s) => s.trim())
            if (!prenom) {
              console.warn(`Ligne ${index + 2} ignorée : Format NOM incorrect`, row)
              return null
            }
            const password = generateRandomPassword()
            return {
              nom,
              prenom,
              email: row.EMAIL,
              motdepasse: password,
              annee_inscription: new Date().toISOString().split("T")[0],
              ID_faculte: importData.facultyId,
              ID_departement: importData.departmentId,
              assignedSections: [],
            }
          })
          .filter((teacher) => teacher !== null)

        if (teachers.length === 0) {
          setError("Aucun enseignant valide trouvé dans le fichier Excel.")
          return
        }

        const res = await api.post("/teachers/bulk", { teachers })
        setTeachers((prev) => [...prev, ...res.data.teachers.map(normalizeTeacher)])
        setSuccess(`${res.data.count} enseignant(s) importé(s) avec succès !`)
        resetImportData()
        setShowImportModal(false)
      }
      reader.readAsArrayBuffer(importData.file)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'importation des enseignants.")
    }
  }

  // Handle teacher deletion
  const handleDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await api.delete(`/teachers/${teacherToDelete.Matricule}`);
      setTeachers(teachers.filter((teacher) => teacher.Matricule !== teacherToDelete.Matricule));
      setSuccess("Enseignant supprimé avec succès !");
      setShowDetailsModal(false);
      setShowAssignmentsModal(false);
      setSelectedTeacher(null);
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      fetchTeachers(); // Refresh the teacher list
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression de l'enseignant.");
      setShowDeleteModal(false);
      setTeacherToDelete(null);
    }
  };

  // Update handleEditSubmit to log the data being sent
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedTeacher.matricule) {
      setError("Enseignant invalide ou matricule manquant.");
      return;
    }
    try {
      // Ensure assignedSections includes sections from moduleSections if empty
      const derivedSections = formData.assignedSections.length > 0
        ? formData.assignedSections
        : [...new Set(Object.values(formData.moduleSections).filter(id => id))];
  
      const updatedData = {
        nom: formData.nom || selectedTeacher.nom,
        prenom: formData.prenom || selectedTeacher.prenom,
        email: formData.email || selectedTeacher.email,
        ID_faculte: formData.facultyId || selectedTeacher.ID_faculte,
        ID_departement: formData.departmentId || selectedTeacher.ID_departement,
        assignedModules: formData.assignedModules,
        assignedSections: derivedSections,  // Use derived sections if assignedSections is empty
        moduleSessionTypes: formData.moduleSessionTypes,
        moduleSections: formData.moduleSections,
      };
      console.log("Data being sent to backend:", updatedData);
      await api.put(`/teachers/${selectedTeacher.matricule}`, updatedData);
      setSuccess("Enseignant mis à jour avec succès.");
      setError("");
      setShowAssignmentsModal(false);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour de l'enseignant.");
      setSuccess("");
    }
  };

  // Handle show details for teacher info
  const handleShowDetails = async (teacher) => {
    if (!teacher || (!teacher.Matricule && !teacher.matricule)) {
      setError("Enseignant invalide ou matricule manquant.")
      return
    }
    const matricule = teacher.Matricule || teacher.matricule
    try {
      const res = await api.get(`/teachers/${matricule}`)
      if (!res.data || (!res.data.matricule && !res.data.Matricule)) {
        throw new Error("Données de l'enseignant invalides ou matricule manquant.")
      }
      const normalizedTeacher = normalizeTeacher(res.data)
      setSelectedTeacher(normalizedTeacher)
      setFormData({
        nom: normalizedTeacher.nom || "",
        prenom: normalizedTeacher.prenom || "",
        email: normalizedTeacher.email || "",
        facultyId: normalizedTeacher.ID_faculte || "",
        departmentId: normalizedTeacher.ID_departement || "",
        specialtyId: "",
        level: "",
        assignedModules: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.map((m) => m.ID_module)
          : [],
        assignedSections: Array.isArray(normalizedTeacher.sections)
          ? normalizedTeacher.sections.map((s) => s.ID_section)
          : [],
        moduleSessionTypes: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.reduce(
              (acc, m) => ({
                ...acc,
                [m.ID_module]: m.course_type,
              }),
              {},
            )
          : {},
        moduleSections: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.reduce(
              (acc, m) => ({
                ...acc,
                [m.ID_module]: m.ID_section,
              }),
              {},
            )
          : {},
      })
      setShowDetailsModal(true)
      setError("")
      setSuccess("")
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la récupération des détails de l'enseignant.")
      const normalizedTeacher = normalizeTeacher(teacher)
      setSelectedTeacher(normalizedTeacher)
      setFormData({
        nom: normalizedTeacher.nom || "",
        prenom: normalizedTeacher.prenom || "",
        email: normalizedTeacher.email || "",
        facultyId: normalizedTeacher.ID_faculte || "",
        departmentId: normalizedTeacher.ID_departement || "",
        specialtyId: "",
        level: "",
        assignedModules: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.map((m) => m.ID_module)
          : [],
        assignedSections: Array.isArray(normalizedTeacher.sections)
          ? normalizedTeacher.sections.map((s) => s.ID_section)
          : [],
        moduleSessionTypes: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.reduce(
              (acc, m) => ({
                ...acc,
                [m.ID_module]: m.course_type,
              }),
              {},
            )
          : {},
        moduleSections: Array.isArray(normalizedTeacher.modules)
          ? normalizedTeacher.modules.reduce(
              (acc, m) => ({
                ...acc,
                [m.ID_module]: m.ID_section,
              }),
              {},
            )
          : {},
      })
      setShowDetailsModal(true)
      setSuccess("Données partielles chargées. Certaines informations peuvent être manquantes.")
    }
  }

  // Handle show assignments for module assignments
  const handleShowAssignments = async (teacher) => {
    if (!teacher || (!teacher.Matricule && !teacher.matricule)) {
        setError("Enseignant invalide ou matricule manquant.");
        return;
    }
    const matricule = teacher.Matricule || teacher.matricule;
    try {
        const res = await api.get(`/teachers/${matricule}`);
        if (!res.data || (!res.data.matricule && !res.data.Matricule)) {
            throw new Error("Données de l'enseignant invalides ou matricule manquant.");
        }
        const normalizedTeacher = normalizeTeacher(res.data);
        setSelectedTeacher(normalizedTeacher);
        setFormData({
            nom: normalizedTeacher.nom || "",
            prenom: normalizedTeacher.prenom || "",
            email: normalizedTeacher.email || "",
            facultyId: normalizedTeacher.ID_faculte || "",
            departmentId: normalizedTeacher.ID_departement || "",
            specialtyId: "",
            level: "",
            assignedModules: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.map((m) => m.ID_module)
                : [],
            assignedSections: Array.isArray(normalizedTeacher.sections)
                ? normalizedTeacher.sections.map((s) => s.ID_section)
                : [],
            moduleSessionTypes: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.reduce(
                      (acc, m) => ({
                          ...acc,
                          [m.ID_module]: m.course_type,
                      }),
                      {}
                  )
                : {},
            moduleSections: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.reduce(
                      (acc, m) => ({
                          ...acc,
                          [m.ID_module]: m.ID_section,
                      }),
                      {}
                  )
                : {},
        });
        setShowAssignmentsModal(true);
        setIsEditingAssignments(false);
        setError("");
        setSuccess("");
    } catch (err) {
        setError(err.response?.data?.error || "Erreur lors de la récupération des assignations.");
        const normalizedTeacher = normalizeTeacher(teacher);
        setSelectedTeacher(normalizedTeacher);
        setFormData({
            nom: normalizedTeacher.nom || "",
            prenom: normalizedTeacher.prenom || "",
            email: normalizedTeacher.email || "",
            facultyId: normalizedTeacher.ID_faculte || "",
            departmentId: normalizedTeacher.ID_departement || "",
            specialtyId: "",
            level: "",
            assignedModules: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.map((m) => m.ID_module)
                : [],
            assignedSections: Array.isArray(normalizedTeacher.sections)
                ? normalizedTeacher.sections.map((s) => s.ID_section)
                : [],
            moduleSessionTypes: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.reduce(
                      (acc, m) => ({
                          ...acc,
                          [m.ID_module]: m.course_type,
                      }),
                      {}
                  )
                : {},
            moduleSections: Array.isArray(normalizedTeacher.modules)
                ? normalizedTeacher.modules.reduce(
                      (acc, m) => ({
                          ...acc,
                          [m.ID_module]: m.ID_section,
                      }),
                      {}
                  )
                : {},
        });
        setShowAssignmentsModal(true);
        setIsEditingAssignments(false);
        setSuccess("Données partielles chargées. Certaines informations peuvent être manquantes.");
    }
};

  // Filter departments by selected faculty
  const filteredDepartments = departments.filter(
    (dep) =>
      dep.ID_faculte === Number.parseInt(filterData.facultyId) ||
      dep.ID_faculte === Number.parseInt(formData.facultyId) ||
      dep.ID_faculte === Number.parseInt(importData.facultyId),
  )

  // Filter specialties by selected department
  const filteredSpecialties = specialties.filter(
    (spec) => spec.ID_departement === Number.parseInt(formData.departmentId),
  )

  // Filter sections by selected specialty and level
  const filteredSections = sections.filter(
    (sec) =>
      sec.ID_specialite === Number.parseInt(formData.specialtyId) &&
      (!formData.level || sec.niveau === formData.level),
  )

  // Filter and sort teachers by selected faculty, department, and alphabetically by nom + prenom
  const filteredTeachers = teachers
    .filter(
      (teacher) =>
        (!filterData.facultyId || teacher.ID_faculte === Number.parseInt(filterData.facultyId)) &&
        (!filterData.departmentId ||
          teacher.ID_departement === Number.parseInt(filterData.departmentId)),
    )
    .sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })

  return (
    <div className={styles["ADM-ENS-container"]}>
      <aside className={styles["ADM-ENS-sidebar"]}>
        <div className={styles["ADM-ENS-logo"]}>
          <FaChalkboardTeacher />
          <h2>Gestion Enseignants</h2>
        </div>
        <button
          className={`${styles["ADM-ENS-sidebar-button"]} ${
            activeTab === "teachers" ? styles["ADM-ENS-sidebar-button-active"] : ""
          }`}
          onClick={() => setActiveTab("teachers")}
        >
          <FaUsers /> Gestion Enseignants
        </button>
        <button
          className={`${styles["ADM-ENS-sidebar-button"]} ${
            activeTab === "module-enseignant" ? styles["ADM-ENS-sidebar-button-active"] : ""
          }`}
          onClick={() => setActiveTab("module-enseignant")}
        >
          <FaBook /> Gestion Modules
        </button>
        <button
          className={styles["ADM-ENS-sidebar-button"]}
          onClick={() => {
            resetFormData()
            setSelectedTeacher(null)
            setShowAddModal(true)
          }}
        >
          <FaPlus /> Ajouter Enseignant
        </button>
        <button
          className={styles["ADM-ENS-sidebar-button"]}
          onClick={() => {
            resetImportData()
            setShowImportModal(true)
          }}
        >
          <FaFileImport /> Importer Enseignants
        </button>
      </aside>
      <main className={styles["ADM-ENS-main-content"]}>
        {activeTab === "teachers" ? (
          <>
            {/* Filter Section */}
            <div className={styles["ADM-ENS-filter-section"]}>
              <h3>
                <FaFilter style={{ marginRight: '8px' }} /> Filtrer les Enseignants
              </h3>
              <div className={styles["ADM-ENS-filter-group"]}>
                <select
                  name="facultyId"
                  value={filterData.facultyId}
                  onChange={handleFilterChange}
                  className={styles["ADM-ENS-select"]}
                >
                  <option value="">Toutes les facultés</option>
                  {faculties.map((fac) => (
                    <option key={fac.ID_faculte} value={fac.ID_faculte}>
                      {fac.nom_faculte}
                    </option>
                  ))}
                </select>
                <select
                  name="departmentId"
                  value={filterData.departmentId}
                  onChange={handleFilterChange}
                  className={styles["ADM-ENS-select"]}
                  disabled={!filterData.facultyId}
                >
                  <option value="">Tous les départements</option>
                  {filteredDepartments
                    .filter((dep) => dep.ID_faculte === Number.parseInt(filterData.facultyId))
                    .map((dep) => (
                      <option key={dep.ID_departement} value={dep.ID_departement}>
                        {dep.Nom_departement}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Teacher List */}
            <div className={styles["ADM-ENS-teacher-list"]}>
              <h2>
                <FaList style={{ marginRight: '8px' }} /> Liste des Enseignants
              </h2>
              <div className={styles["ADM-ENS-teacher-list-content"]}>
                {filteredTeachers.length === 0 ? (
                  <div className={styles["ADM-ENS-no-results"]}>Aucun enseignant trouvé.</div>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <div key={teacher.Matricule} className={styles["ADM-ENS-teacher-item"]}>
                      <span
                        className={styles["ADM-ENS-teacher-name"]}
                        onClick={() => handleShowDetails(teacher)}
                        style={{ cursor: "pointer", color: "#082e54" }}
                      >
                        {teacher.nom} {teacher.prenom} ({teacher.email}) 
                        {filterData.facultyId === "" && (
                          <span className={styles["ADM-ENS-teacher-faculty"]}>
                            - {faculties.find((fac) => fac.ID_faculte === teacher.ID_faculte)?.nom_faculte || "N/A"}
                          </span>
                        )}
                      </span>
                      <button
                        className={styles["ADM-ENS-delete-button"]}
                        onClick={() => {
                          setTeacherToDelete(teacher)
                          setShowDeleteModal(true)
                        }}
                      >
                        <FaTrash /> 
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Module/Enseignant View */}
            <div className={styles["ADM-ENS-filter-section"]}>
              <h3>
                <FaFilter style={{ marginRight: '8px' }} /> Filtrer les Enseignants
              </h3>
              <div className={styles["ADM-ENS-filter-group"]}>
                <select
                  name="facultyId"
                  value={filterData.facultyId}
                  onChange={handleFilterChange}
                  className={styles["ADM-ENS-select"]}
                >
                  <option value="">Toutes les facultés</option>
                  {faculties.map((fac) => (
                    <option key={fac.ID_faculte} value={fac.ID_faculte}>
                      {fac.nom_faculte}
                    </option>
                  ))}
                </select>
                <select
                  name="departmentId"
                  value={filterData.departmentId}
                  onChange={handleFilterChange}
                  className={styles["ADM-ENS-select"]}
                  disabled={!filterData.facultyId}
                >
                  <option value="">Tous les départements</option>
                  {filteredDepartments
                    .filter((dep) => dep.ID_faculte === Number.parseInt(filterData.facultyId))
                    .map((dep) => (
                      <option key={dep.ID_departement} value={dep.ID_departement}>
                        {dep.Nom_departement}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Module/Enseignant Teacher List */}
            <div className={styles["ADM-ENS-teacher-list"]}>
              <h2>
                <FaList style={{ marginRight: '8px' }} /> Assignations des Enseignants
              </h2>
              <div className={styles["ADM-ENS-teacher-list-content"]}>
                {filteredTeachers.length === 0 ? (
                  <div className={styles["ADM-ENS-no-results"]}>Aucun enseignant trouvé.</div>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <div key={teacher.Matricule} className={styles["ADM-ENS-teacher-item"]}>
                      <span
                        className={styles["ADM-ENS-teacher-name"]}
                        onClick={() => handleShowAssignments(teacher)}
                        style={{ cursor: "pointer", color: "#082e54" }}
                      >
                        {teacher.nom} {teacher.prenom}
                        {filterData.facultyId === "" && (
                          <span className={styles["ADM-ENS-teacher-faculty"]}>
                            - {faculties.find((fac) => fac.ID_faculte === teacher.ID_faculte)?.nom_faculte || "N/A"}
                          </span>
                        )}
                      </span>
                      <button
                        className={styles["ADM-ENS-details-button"]}
                        onClick={() => handleShowAssignments(teacher)}
                      >
                        <FaBook /> Détails
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content-compact"]}>
            <h3>Ajouter un Enseignant</h3>
            {error && (
              <div className={styles["ADM-ENS-custom-alert"]}>
                <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
              </div>
            )}
            {success && (
              <div className={styles["ADM-ENS-custom-alert-success"]}>
                <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
              </div>
            )}
            <form onSubmit={handleAddSubmit} className={styles["ADM-ENS-form"]}>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Faculté</label>
                <select
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-select"]}
                  required
                >
                  <option value="">Sélectionner une faculté</option>
                  {faculties.map((fac) => (
                    <option key={fac.ID_faculte} value={fac.ID_faculte}>
                      {fac.nom_faculte}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Département</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-select"]}
                  required
                  disabled={!formData.facultyId}
                >
                  <option value="">Sélectionner un département</option>
                  {filteredDepartments
                    .filter((dep) => dep.ID_faculte === Number.parseInt(formData.facultyId))
                    .map((dep) => (
                      <option key={dep.ID_departement} value={dep.ID_departement}>
                        {dep.Nom_departement}
                      </option>
                    ))}
                </select>
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-input"]}
                  required
                />
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-input"]}
                  required
                />
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-input"]}
                  required
                />
              </div>
              <div className={styles["ADM-ENS-modal-actions"]}>
                <button type="submit" className={styles["ADM-ENS-button"]}>
                  Ajouter
                </button>
                <button
                  type="button"
                  className={styles["ADM-ENS-close-button"]}
                  onClick={() => {
                    resetFormData()
                    setShowAddModal(false)
                    setSelectedTeacher(null)
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Teachers Modal */}
      {showImportModal && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content-compact"]}>
            <h3>Importer des Enseignants</h3>
            {error && (
              <div className={styles["ADM-ENS-custom-alert"]}>
                <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
              </div>
            )}
            {success && (
              <div className={styles["ADM-ENS-custom-alert-success"]}>
                <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
              </div>
            )}
            <form onSubmit={handleImportSubmit} className={styles["ADM-ENS-form"]}>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Faculté</label>
                <select
                  name="facultyId"
                  value={importData.facultyId}
                  onChange={handleImportInputChange}
                  className={styles["ADM-ENS-select"]}
                  required
                >
                  <option value="">Sélectionner une faculté</option>
                  {faculties.map((fac) => (
                    <option key={fac.ID_faculte} value={fac.ID_faculte}>
                      {fac.nom_faculte}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Département</label>
                <select
                  name="departmentId"
                  value={importData.departmentId}
                  onChange={handleImportInputChange}
                  className={styles["ADM-ENS-select"]}
                  required
                  disabled={!importData.facultyId}
                >
                  <option value="">Sélectionner un département</option>
                  {filteredDepartments
                    .filter((dep) => dep.ID_faculte === Number.parseInt(importData.facultyId))
                    .map((dep) => (
                      <option key={dep.ID_departement} value={dep.ID_departement}>
                        {dep.Nom_departement}
                      </option>
                    ))}
                </select>
              </div>
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Fichier Excel (NOM, EMAIL)</label>
                <input
                  type="file"
                  name="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportInputChange}
                  className={styles["ADM-ENS-input"]}
                  required
                />
              </div>
              <div className={styles["ADM-ENS-modal-actions"]}>
                <button type="submit" className={styles["ADM-ENS-button"]}>
                  Importer
                </button>
                <button
                  type="button"
                  className={styles["ADM-ENS-close-button"]}
                  onClick={() => {
                    resetImportData()
                    setShowImportModal(false)
                    setSelectedTeacher(null)
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && teacherToDelete && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content-compact"]}>
            <h3>Confirmer la Suppression</h3>
            {error && (
              <div className={styles["ADM-ENS-custom-alert"]}>
                <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
              </div>
            )}
            {success && (
              <div className={styles["ADM-ENS-custom-alert-success"]}>
                <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
              </div>
            )}
            <p>
              Êtes-vous sûr de vouloir supprimer l'enseignant{" "}
              <strong>
                {teacherToDelete.nom} {teacherToDelete.prenom}
              </strong>
              ?
            </p>
            <div className={styles["ADM-ENS-modal-actions"]}>
              <button className={styles["ADM-ENS-button"]} onClick={handleDelete}>
                Supprimer
              </button>
              <button
                className={styles["ADM-ENS-close-button"]}
                onClick={() => {
                  setShowDeleteModal(false)
                  setTeacherToDelete(null)
                  setSelectedTeacher(null)
                  setError("")
                  setSuccess("")
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details/Edit Modal */}
      {showDetailsModal && selectedTeacher && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content"]}>
            {isEditing ? (
              <>
                <h3>Modifier l'Enseignant</h3>
                {error && (
                  <div className={styles["ADM-ENS-custom-alert"]}>
                    <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                    <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
                  </div>
                )}
                {success && (
                  <div className={styles["ADM-ENS-custom-alert-success"]}>
                    <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
                  </div>
                )}
                <form onSubmit={handleEditSubmit} className={styles["ADM-ENS-form"]}>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Faculté</label>
                    <select
                      name="facultyId"
                      value={formData.facultyId}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-select"]}
                      required
                    >
                      <option value="">Sélectionner une faculté</option>
                      {faculties.map((fac) => (
                        <option key={fac.ID_faculte} value={fac.ID_faculte}>
                          {fac.nom_faculte}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Département</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-select"]}
                      required
                      disabled={!formData.facultyId}
                    >
                      <option value="">Sélectionner un département</option>
                      {filteredDepartments
                        .filter((dep) => dep.ID_faculte === Number.parseInt(formData.facultyId))
                        .map((dep) => (
                          <option key={dep.ID_departement} value={dep.ID_departement}>
                            {dep.Nom_departement}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Nom</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-input"]}
                      required
                    />
                  </div>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Prénom</label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-input"]}
                      required
                    />
                  </div>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-input"]}
                      required
                    />
                  </div>
                  <div className={styles["ADM-ENS-modal-actions"]}>
                    <button type="submit" className={styles["ADM-ENS-button"]}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className={styles["ADM-ENS-close-button"]}
                      onClick={() => {
                        setIsEditing(false)
                        setFormData({
                          nom: selectedTeacher.nom || "",
                          prenom: selectedTeacher.prenom || "",
                          email: selectedTeacher.email || "",
                          facultyId: selectedTeacher.ID_faculte || "",
                          departmentId: selectedTeacher.ID_departement || "",
                          specialtyId: "",
                          level: "",
                          assignedModules: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.map((m) => m.ID_module)
                            : [],
                          assignedSections: Array.isArray(selectedTeacher.sections)
                            ? selectedTeacher.sections.map((s) => s.ID_section)
                            : [],
                          moduleSessionTypes: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.reduce(
                                (acc, m) => ({
                                  ...acc,
                                  [m.ID_module]: m.course_type,
                                }),
                                {},
                              )
                            : {},
                          moduleSections: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.reduce(
                                (acc, m) => ({
                                  ...acc,
                                  [m.ID_module]: m.ID_section,
                                }),
                                {},
                              )
                            : {},
                        })
                        setError("")
                        setSuccess("")
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      className={styles["ADM-ENS-delete-button"]}
                      onClick={() => {
                        setTeacherToDelete(selectedTeacher)
                        setShowDeleteModal(true)
                      }}
                    >
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>Détails de l'Enseignant</h3>
                {error && (
                  <div className={styles["ADM-ENS-custom-alert"]}>
                    <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                    <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
                  </div>
                )}
                {success && (
                  <div className={styles["ADM-ENS-custom-alert-success"]}>
                    <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
                  </div>
                )}
                <div className={styles["ADM-ENS-details-section"]}>
                  <p>
                    <strong>Matricule:</strong>{" "}
                    {selectedTeacher.Matricule || selectedTeacher.matricule || "N/A"}
                  </p>
                  <p>
                    <strong>Nom:</strong> {selectedTeacher.nom || "N/A"}
                  </p>
                  <p>
                    <strong>Prénom:</strong> {selectedTeacher.prenom || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedTeacher.email || "N/A"}
                  </p>
                  <p>
                    <strong>Mot de passe:</strong> {selectedTeacher.motdepasse || "N/A"}
                  </p>
                  <p>
                    <strong>Faculté:</strong>{" "}
                    {faculties.find((fac) => fac.ID_faculte === selectedTeacher.ID_faculte)
                      ?.nom_faculte || "N/A"}
                  </p>
                  <p>
                    <strong>Département:</strong>{" "}
                    {departments.find((dep) => dep.ID_departement === selectedTeacher.ID_departement)
                      ?.Nom_departement || "N/A"}
                  </p>
                  <p>
                    <strong>Année d'inscription:</strong> {selectedTeacher.annee_inscription || "N/A"}
                  </p>
                </div>
                <div className={styles["ADM-ENS-modal-actions"]}>
                  <button
                    className={styles["ADM-ENS-button"]}
                    onClick={() => {
                      setIsEditing(true)
                      setFormData({
                        nom: selectedTeacher.nom || "",
                        prenom: selectedTeacher.prenom || "",
                        email: selectedTeacher.email || "",
                        facultyId: selectedTeacher.ID_faculte || "",
                        departmentId: selectedTeacher.ID_departement || "",
                        specialtyId: "",
                        level: "",
                        assignedModules: Array.isArray(selectedTeacher.modules)
                          ? selectedTeacher.modules.map((m) => m.ID_module)
                          : [],
                        assignedSections: Array.isArray(selectedTeacher.sections)
                          ? selectedTeacher.sections.map((s) => s.ID_section)
                          : [],
                        moduleSessionTypes: Array.isArray(selectedTeacher.modules)
                          ? selectedTeacher.modules.reduce(
                              (acc, m) => ({
                                ...acc,
                                [m.ID_module]: m.course_type,
                              }),
                              {},
                            )
                          : {},
                        moduleSections: Array.isArray(selectedTeacher.modules)
                          ? selectedTeacher.modules.reduce(
                              (acc, m) => ({
                                ...acc,
                                [m.ID_module]: m.ID_section,
                              }),
                              {},
                            )
                          : {},
                      })
                      setError("")
                      setSuccess("")
                    }}
                  >
                    <FaEdit /> Modifier
                  </button>
                  <button
                    className={styles["ADM-ENS-close-button"]}
                    onClick={() => {
                      setShowDetailsModal(false)
                      setSelectedTeacher(null)
                      resetFormData()
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assignments Modal */}
      {showAssignmentsModal && selectedTeacher && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content"]}>
            <h3>Assignations de {selectedTeacher.nom} {selectedTeacher.prenom}</h3>
            {error && (
              <div className={styles["ADM-ENS-custom-alert"]}>
                <FaTimes className={styles["ADM-ENS-alert-icon"]} />
                <p className={styles["ADM-ENS-alert-message"]}>{error}</p>
              </div>
            )}
            {success && (
              <div className={styles["ADM-ENS-custom-alert-success"]}>
                <p className={styles["ADM-ENS-alert-message"]}>{success}</p>
              </div>
            )}
            {isEditingAssignments ? (
              <>
                <form onSubmit={handleEditSubmit} className={styles["ADM-ENS-form"]}>
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Modules Assignés</label>
                    <div className={styles["ADM-ENS-section-tags"]}>
                      {formData.assignedModules.length > 0 ? (
                        formData.assignedModules.map((modId) => {
                          const module = modules.find((m) => m.ID_module === modId)
                          const sectionId = formData.moduleSections[modId]
                          const section = sections.find((s) => s.ID_section === sectionId)
                          const specialty = specialties.find(
                            (sp) => sp.ID_specialite === section?.ID_specialite,
                          )
                          return (
                            <div
                              key={modId}
                              className={styles["ADM-ENS-section-tag"]}
                              style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
                            >
                              <span>
                                {specialty?.nom_specialite || "N/A"} - {section?.nom_section || "N/A"} -{" "}
                                {module?.nom_module || "Module inconnu"} (
                                {formData.moduleSessionTypes[modId] || "N/A"})
                              </span>
                              <select
                                value={formData.moduleSessionTypes[modId] || "Cour"}
                                onChange={(e) => handleSessionTypeChange(modId, e.target.value)}
                                className={styles["ADM-ENS-select"]}
                                style={{ marginLeft: "10px", width: "150px" }}
                              >
                                <option value="Cour">Cours</option>
                                <option value="TD">TD</option>
                                <option value="TP">TP</option>
                                <option value="Cour/TD">Cours/TD</option>
                                <option value="Cour/TP">Cours/TP</option>
                                <option value="Cour/TD/TP">Cours/TD/TP</option>
                                <option value="Cour/TD/TP">TD/TP</option>
                                <option value="enligne">En ligne</option>
                              </select>
                              <button
                                type="button"
                                className={styles["ADM-ENS-delete-button"]}
                                style={{ marginLeft: "10px" }}
                                onClick={() => handleModuleSelect(modId, sectionId)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <p>Aucun module assigné.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles["ADM-ENS-button"]}
                      onClick={() => {
                        setShowAddModuleForm(true)
                        setFormData((prev) => ({
                          ...prev,
                          facultyId: selectedTeacher.ID_faculte || "",
                          departmentId: selectedTeacher.ID_departement || "",
                          specialtyId: "",
                          level: "",
                          assignedSections: [],
                        }))
                      }}
                    >
                      Ajouter Module
                    </button>
                  </div>

                  {showAddModuleForm && (
                    <div className={styles["ADM-ENS-form-section"]}>
                      <h4>Ajouter un Module</h4>
                      <div className={styles["ADM-ENS-form-section"]}>
                        <label>Faculté</label>
                        <select
                          name="facultyId"
                          value={formData.facultyId}
                          onChange={handleInputChange}
                          className={styles["ADM-ENS-select"]}
                        >
                          <option value="">Sélectionner une faculté</option>
                          {faculties.map((fac) => (
                            <option key={fac.ID_faculte} value={fac.ID_faculte}>
                              {fac.nom_faculte}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles["ADM-ENS-form-section"]}>
                        <label>Département</label>
                        <select
                          name="departmentId"
                          value={formData.departmentId}
                          onChange={handleInputChange}
                          className={styles["ADM-ENS-select"]}
                          disabled={!formData.facultyId}
                        >
                          <option value="">Sélectionner un département</option>
                          {filteredDepartments
                            .filter((dep) => dep.ID_faculte === Number.parseInt(formData.facultyId))
                            .map((dep) => (
                              <option key={dep.ID_departement} value={dep.ID_departement}>
                                {dep.Nom_departement}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className={styles["ADM-ENS-form-section"]}>
                        <label>Niveau</label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className={styles["ADM-ENS-select"]}
                          disabled={!formData.departmentId}
                        >
                          <option value="">Sélectionner un niveau</option>
                          {levels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles["ADM-ENS-form-section"]}>
                        <label>Spécialité</label>
                        <select
                          name="specialtyId"
                          value={formData.specialtyId}
                          onChange={handleInputChange}
                          className={styles["ADM-ENS-select"]}
                          disabled={!formData.level}
                        >
                          <option value="">Sélectionner une spécialité</option>
                          {filteredSpecialties.map((spec) => (
                            <option key={spec.ID_specialite} value={spec.ID_specialite}>
                              {spec.nom_specialite}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles["ADM-ENS-form-section"]}>
                        <label>Section</label>
                        <select
                          className={styles["ADM-ENS-select"]}
                          onChange={(e) => {
                            const sectionId = Number.parseInt(e.target.value)
                            if (sectionId) handleSectionSelect(sectionId)
                          }}
                          value={formData.assignedSections[0] || ""}
                          disabled={!formData.specialtyId || !formData.level}
                        >
                          <option value="">Sélectionner une section</option>
                          {filteredSections.map((sec) => (
                            <option key={sec.ID_section} value={sec.ID_section}>
                              {sec.nom_section} (Niveau: {sec.niveau})
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.specialtyId && formData.assignedSections.length === 1 && (
                        <div className={styles["ADM-ENS-form-section"]}>
                          <label>Modules</label>
                          <div className={styles["ADM-ENS-section-tags"]}>
                            {formData.assignedModules
                              .filter((modId) => {
                                const module = modules.find((m) => m.ID_module === modId)
                                const section = sections.find(
                                  (s) => s.ID_section === formData.assignedSections[0],
                                )
                                return (
                                  module &&
                                  section &&
                                  module.ID_specialite === section.ID_specialite &&
                                  !(Array.isArray(selectedTeacher.modules) &&
                                    selectedTeacher.modules.some((m) => m.ID_module === modId))
                                )
                              })
                              .map((modId) => {
                                const module = filteredModules.find((m) => m.ID_module === modId)
                                return (
                                  <div
                                    key={modId}
                                    className={styles["ADM-ENS-section-tag"]}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    {module?.nom_module || "Module inconnu"}
                                    <FaTimes
                                      className={styles["ADM-ENS-section-remove"]}
                                      onClick={() =>
                                        handleModuleSelect(modId, formData.assignedSections[0])
                                      }
                                    />
                                    <select
                                      value={formData.moduleSessionTypes[modId] || "Cour"}
                                      onChange={(e) => handleSessionTypeChange(modId, e.target.value)}
                                      className={styles["ADM-ENS-select"]}
                                      style={{ marginLeft: "10px", width: "150px" }}
                                    >
                                      <option value="Cour">Cours</option>
                                      <option value="TD">TD</option>
                                      <option value="TP">TP</option>
                                      <option value="Cour/TD">Cours/TD</option>
                                      <option value="Cour/TP">Cours/TP</option>
                                      <option value="Cour/TD/TP">Cours/TD/TP</option>
                                      <option value="enligne">En ligne</option>
                                    </select>
                                  </div>
                                )
                              })}
                          </div>
                          <select
                            className={styles["ADM-ENS-select"]}
                            onChange={(e) => {
                              const moduleId = Number.parseInt(e.target.value)
                              if (moduleId) handleModuleSelect(moduleId, formData.assignedSections[0])
                            }}
                            value=""
                            disabled={!formData.assignedSections.length}
                          >
                            <option value="">Ajouter un module</option>
                            {filteredModules
                              .filter((mod) => !formData.assignedModules.includes(mod.ID_module))
                              .map((mod) => (
                                <option key={mod.ID_module} value={mod.ID_module}>
                                  {mod.nom_module}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      <div className={styles["ADM-ENS-modal-actions"]}>
                        <button
                          type="button"
                          className={styles["ADM-ENS-button"]}
                          onClick={() => {
                            setShowAddModuleForm(false)
                            setFormData((prev) => ({
                              ...prev,
                              specialtyId: "",
                              level: "",
                            }))
                          }}
                        >
                          Terminer
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={styles["ADM-ENS-modal-actions"]}>
                    <button type="submit" className={styles["ADM-ENS-button"]}>
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className={styles["ADM-ENS-close-button"]}
                      onClick={() => {
                        setIsEditingAssignments(false)
                        setShowAddModuleForm(false)
                        setFormData({
                          nom: selectedTeacher.nom || "",
                          prenom: selectedTeacher.prenom || "",
                          email: selectedTeacher.email || "",
                          facultyId: selectedTeacher.ID_faculte || "",
                          departmentId: selectedTeacher.ID_departement || "",
                          specialtyId: "",
                          level: "",
                          assignedModules: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.map((m) => m.ID_module)
                            : [],
                          assignedSections: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.map((s) => s.ID_section)
                            : [],
                          moduleSessionTypes: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.reduce(
                                (acc, m) => ({
                                  ...acc,
                                  [m.ID_module]: m.course_type,
                                }),
                                {},
                              )
                            : {},
                          moduleSections: Array.isArray(selectedTeacher.modules)
                            ? selectedTeacher.modules.reduce(
                                (acc, m) => ({
                                  ...acc,
                                  [m.ID_module]: m.ID_section,
                                }),
                                {},
                              )
                            : {},
                        })
                        setError("")
                        setSuccess("")
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className={styles["ADM-ENS-details-section"]}>
                  <h4>Modules Assignés</h4>
                  {selectedTeacher && selectedTeacher.modules && selectedTeacher.modules.length > 0 ? (
                      <table className={styles["ADM-ENS-assignment-table"]}>
                          <thead>
                              <tr>
                                  <th>Spécialité</th>
                                  <th>Section</th>
                                  <th>Module</th>
                                  <th>Type de Séance</th>
                              </tr>
                          </thead>
                          <tbody>
                              {selectedTeacher.modules.map((mod, index) => (
                                  <tr key={`${mod.ID_module}-${index}`}>
                                      <td>{mod.nom_specialite || "N/A"}</td>
                                      <td>{mod.nom_section || `Section ${mod.niveau || mod.ID_section}` || "N/A"}</td>
                                      <td>{mod.nom_module || "N/A"}</td>
                                      <td>{mod.course_type || "N/A"}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <p>Aucune assignation.</p>
                  )}
                </div>
                <div className={styles["ADM-ENS-modal-actions"]}>
                  <button
                    className={styles["ADM-ENS-button"]}
                    onClick={() => {
                      setIsEditingAssignments(true)
                      setError("")
                      setSuccess("")
                    }}
                  >
                    <FaEdit /> Modifier Assignations
                  </button>
                  <button
                    className={styles["ADM-ENS-close-button"]}
                    onClick={() => {
                      setShowAssignmentsModal(false)
                      setSelectedTeacher(null)
                      resetFormData()
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ListEnseignant