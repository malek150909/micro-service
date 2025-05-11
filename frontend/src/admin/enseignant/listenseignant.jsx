import { useState, useEffect } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import styles from "./prof.module.css"
import { FaChalkboardTeacher, FaPlus, FaTrash, FaTimes, FaEdit, FaFileImport } from "react-icons/fa"

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
    assignedSections: [],
    assignedModules: [],
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
  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filteredModules, setFilteredModules] = useState([])

  // Reset form data
  const resetFormData = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      facultyId: "",
      departmentId: "",
      specialtyId: "",
      assignedSections: [],
      assignedModules: [],
    })
    setFilteredModules([])
  }

  // Reset import data
  const resetImportData = () => {
    setImportData({
      facultyId: "",
      departmentId: "",
      file: null,
    })
  }

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
        setTeachers(teachRes.data)
      } catch (err) {
        setError(err.response?.data?.error || "Erreur lors du chargement des données.")
      }
    }
    fetchData()
  }, [])

  // Fetch modules by sections and specialty when assignedSections or specialtyId changes
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
      ...(name === "facultyId" && { departmentId: "", specialtyId: "", assignedSections: [], assignedModules: [] }),
      ...(name === "departmentId" && { specialtyId: "", assignedSections: [], assignedModules: [] }),
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
      const updatedSections = prev.assignedSections.includes(sectionId)
        ? prev.assignedSections.filter((id) => id !== sectionId)
        : [...prev.assignedSections, sectionId]
      return {
        ...prev,
        assignedSections: updatedSections,
      }
    })
  }

  // Handle module selection
  const handleModuleSelect = (moduleId) => {
    setFormData((prev) => ({
      ...prev,
      assignedModules: prev.assignedModules.includes(moduleId)
        ? prev.assignedModules.filter((id) => id !== moduleId)
        : [...prev.assignedModules, moduleId],
    }))
  }

  // Handle form submission for adding teacher
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const password = generateRandomPassword()
    try {
      const teacherData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        motdepasse: password,
        annee_inscription: new Date().toISOString().split("T")[0],
        ID_faculte: formData.facultyId,
        ID_departement: formData.departmentId,
        assignedSections: formData.assignedSections,
      }
      const res = await api.post("/teachers", teacherData)
      const newTeacher = res.data
      setTeachers((prev) => [...prev, newTeacher])
      setSuccess(`Enseignant ajouté avec succès ! Mot de passe: ${password}`)
      resetFormData()
      setShowAddModal(false)
      setSelectedTeacher(newTeacher)
      setShowDetailsModal(true)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout de l'enseignant.")
    }
  }

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
            return {
              nom,
              prenom,
              email: row.EMAIL,
              motdepasse: generateRandomPassword(),
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
        setTeachers((prev) => [...prev, ...res.data.teachers])
        setSuccess(`${res.data.count} enseignant(s) importé(s) avec succès !`)
        resetImportData()
        setShowImportModal(false)
      }
      reader.readAsArrayBuffer(importData.file)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'importation des enseignants.")
    }
  }

  // Handle teacher deletion with confirmation modal
  const handleDelete = async () => {
    if (!teacherToDelete) return
    try {
      await api.delete(`/teachers/${teacherToDelete.Matricule}`)
      setTeachers(teachers.filter((teacher) => teacher.Matricule !== teacherToDelete.Matricule))
      setSuccess("Enseignant supprimé avec succès !")
      setShowDetailsModal(false)
      setSelectedTeacher(null)
      setShowDeleteModal(false)
      setTeacherToDelete(null)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression de l'enseignant.")
      setShowDeleteModal(false)
      setTeacherToDelete(null)
    }
  }

  // Initiate deletion by showing confirmation modal
  const initiateDelete = (teacher) => {
    setTeacherToDelete(teacher)
    setShowDeleteModal(true)
  }

  // Handle teacher details fetch with retry
  const handleShowDetails = async (teacher, retryCount = 3, delayMs = 1000) => {
    try {
      const res = await api.get(`/teachers/${teacher.Matricule}`)
      if (!res.data) {
        throw new Error("Aucune donnée reçue pour l'enseignant.")
      }
      setSelectedTeacher(res.data)
      setShowDetailsModal(true)
      setIsEditing(false)
    } catch (err) {
      if (err.response?.status === 404 && retryCount > 0) {
        setTimeout(() => {
          handleShowDetails(teacher, retryCount - 1, delayMs)
        }, delayMs)
      } else {
        setError(
          err.response?.data?.error ||
            "Erreur lors de la récupération des détails de l'enseignant. Veuillez réessayer ou rafraîchir la page.",
        )
        setShowDetailsModal(false)
        setSelectedTeacher(null)
      }
    }
  }

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    try {
      const updatedData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        ID_faculte: formData.facultyId,
        ID_departement: formData.departmentId,
        assignedModules: formData.assignedModules,
        assignedSections: formData.assignedSections,
      }
      const res = await api.put(`/teachers/${selectedTeacher.matricule}`, updatedData)
      setTeachers(teachers.map((t) => (t.Matricule === selectedTeacher.matricule ? res.data : t)))
      setSuccess("Enseignant mis à jour avec succès !")
      setShowDetailsModal(false)
      setSelectedTeacher(null)
      resetFormData()
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour de l'enseignant.")
    }
  }

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

  // Filter sections by selected specialty
  const filteredSections = sections.filter((sec) => sec.ID_specialite === Number.parseInt(formData.specialtyId))

  // Filter teachers by selected faculty and department
  const filteredTeachers = teachers.filter(
    (teacher) =>
      (!filterData.facultyId || teacher.ID_faculte === Number.parseInt(filterData.facultyId)) &&
      (!filterData.departmentId || teacher.ID_departement === Number.parseInt(filterData.departmentId)),
  )

  return (
    <div className={styles["ADM-ENS-container"]}>
      <aside className={styles["ADM-ENS-sidebar"]}>
        <div className={styles["ADM-ENS-logo"]}>
          <FaChalkboardTeacher />
          <h2>Gestion Enseignants</h2>
        </div>
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
        {/* Filter Section */}
        <div className={styles["ADM-ENS-filter-section"]}>
          <h3>Filtrer les Enseignants</h3>
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

        {/* Alerts */}
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

        {/* Teacher List */}
        <div className={styles["ADM-ENS-teacher-list"]}>
          <h2>Liste des Enseignants</h2>
          {filteredTeachers.length === 0 ? (
            <div className={styles["ADM-ENS-no-results"]}>Aucun enseignant trouvé.</div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div key={teacher.Matricule} className={styles["ADM-ENS-teacher-item"]}>
                <span
                  className={styles["ADM-ENS-teacher-name"]}
                  onClick={() => handleShowDetails(teacher)}
                  style={{ cursor: "pointer", color: "#007bff" }}
                >
                  {teacher.prenom} {teacher.nom} ({teacher.email})
                </span>
                <button className={styles["ADM-ENS-delete-button"]} onClick={() => initiateDelete(teacher)}>
                  <FaTrash /> Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className={styles["ADM-ENS-modal-overlay"]}>
          <div className={styles["ADM-ENS-modal-content-compact"]}>
            <h3>Ajouter un Enseignant</h3>
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
                <label>Spécialité (pour filtrer les sections)</label>
                <select
                  name="specialtyId"
                  value={formData.specialtyId}
                  onChange={handleInputChange}
                  className={styles["ADM-ENS-select"]}
                  disabled={!formData.departmentId}
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
              <div className={styles["ADM-ENS-form-section"]}>
                <label>Sections Assignées</label>
                <div className={styles["ADM-ENS-section-tags"]}>
                  {formData.assignedSections.map((secId) => {
                    const section = sections.find((s) => s.ID_section === secId)
                    return (
                      <div key={secId} className={styles["ADM-ENS-section-tag"]}>
                        {section?.nom_section || "Section inconnue"}
                        <span className={styles["ADM-ENS-section-remove"]} onClick={() => handleSectionSelect(secId)}>
                          ×
                        </span>
                      </div>
                    )
                  })}
                </div>
                <select
                  className={styles["ADM-ENS-select"]}
                  onChange={(e) => handleSectionSelect(Number.parseInt(e.target.value))}
                  value=""
                  disabled={!formData.specialtyId}
                >
                  <option value="">Sélectionner une section</option>
                  {filteredSections.map((sec) => (
                    <option key={sec.ID_section} value={sec.ID_section}>
                      {sec.nom_section} (Niveau: {sec.niveau})
                    </option>
                  ))}
                </select>
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
            <p>
              Êtes-vous sûr de vouloir supprimer l'enseignant{" "}
              <strong>
                {teacherToDelete.prenom} {teacherToDelete.nom}
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
                    <label>Spécialité (pour filtrer les sections)</label>
                    <select
                      name="specialtyId"
                      value={formData.specialtyId}
                      onChange={handleInputChange}
                      className={styles["ADM-ENS-select"]}
                      disabled={!formData.departmentId}
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
                  <div className={styles["ADM-ENS-form-section"]}>
                    <label>Sections Assignées</label>
                    <div className={styles["ADM-ENS-section-tags"]}>
                      {formData.assignedSections.map((secId) => {
                        const section = sections.find((s) => s.ID_section === secId)
                        return (
                          <div key={secId} className={styles["ADM-ENS-section-tag"]}>
                            {section?.nom_section || "Section inconnue"}
                            <span
                              className={styles["ADM-ENS-section-remove"]}
                              onClick={() => handleSectionSelect(secId)}
                            >
                              ×
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <select
                      className={styles["ADM-ENS-select"]}
                      onChange={(e) => handleSectionSelect(Number.parseInt(e.target.value))}
                      value=""
                      disabled={!formData.specialtyId}
                    >
                      <option value="">Sélectionner une section</option>
                      {filteredSections.map((sec) => (
                        <option key={sec.ID_section} value={sec.ID_section}>
                          {sec.nom_section} (Niveau: {sec.niveau})
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.specialtyId && (
                    <div className={styles["ADM-ENS-form-section"]}>
                      <label>Modules Assignés</label>
                      <div className={styles["ADM-ENS-section-tags"]}>
                        {formData.assignedModules.map((modId) => {
                          const module = filteredModules.find((m) => m.ID_module === modId)
                          return (
                            <div key={modId} className={styles["ADM-ENS-section-tag"]}>
                              {module?.nom_module || "Module inconnu"}
                              <span
                                className={styles["ADM-ENS-section-remove"]}
                                onClick={() => handleModuleSelect(modId)}
                              >
                                ×
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <select
                        className={styles["ADM-ENS-select"]}
                        onChange={(e) => handleModuleSelect(Number.parseInt(e.target.value))}
                        value=""
                        disabled={!formData.assignedSections.length}
                      >
                        <option value="">Sélectionner un module</option>
                        {filteredModules.map((mod) => (
                          <option key={mod.ID_module} value={mod.ID_module}>
                            {mod.nom_module}
                          </option>
                        ))}
                      </select>
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
                        setIsEditing(false)
                        resetFormData()
                        setSelectedTeacher(null)
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3>Détails de l'Enseignant</h3>
                <div className={styles["ADM-ENS-details-section"]}>
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
                    <strong>Faculté:</strong> {selectedTeacher.facultyName || "N/A"}
                  </p>
                  <p>
                    <strong>Département:</strong> {selectedTeacher.departmentName || "N/A"}
                  </p>
                  <p>
                    <strong>Année d'inscription:</strong> {selectedTeacher.annee_inscription || "N/A"}
                  </p>
                  <p>
                    <strong>Assignations:</strong>
                  </p>
                  <ul className={styles["ADM-ENS-details-list"]}>
                    {Array.isArray(selectedTeacher.sections) && selectedTeacher.sections.length > 0 ? (
                      selectedTeacher.sections.map((sec) => {
                        const specialty = specialties.find((sp) => sp.ID_specialite === sec.ID_specialite)
                        const module =
                          Array.isArray(selectedTeacher.modules) &&
                          selectedTeacher.modules.find((mod) => mod.ID_specialite === sec.ID_specialite)
                        return (
                          <li key={sec.ID_section || Math.random()}>
                            {specialty?.nom_specialite || "N/A"} {sec.niveau || ""} {sec.nom_section || "N/A"}{" "}
                            <strong>{module?.nom_module || "Aucun module"}</strong>
                          </li>
                        )
                      })
                    ) : (
                      <li>Aucune assignation</li>
                    )}
                  </ul>
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
                        assignedModules: Array.isArray(selectedTeacher.modules)
                          ? selectedTeacher.modules.map((m) => m.ID_module)
                          : [],
                        assignedSections: Array.isArray(selectedTeacher.sections)
                          ? selectedTeacher.sections.map((s) => s.ID_section)
                          : [],
                      })
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
    </div>
  )
}

export default ListEnseignant