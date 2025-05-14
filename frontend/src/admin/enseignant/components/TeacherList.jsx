"use client"

import { useState } from "react"
import styles from "../styles/prof.module.css"
import { FaTrash, FaFilter, FaList } from "react-icons/fa"
import api, { normalizeTeacher } from "./api-config"
import { AddTeacherModal, ImportTeachersModal, DeleteConfirmationModal, TeacherDetailsModal } from "./modals"

const TeacherList = ({
  faculties,
  departments,
  teachers,
  setTeachers,
  formData,
  setFormData,
  importData,
  setImportData,
  filterData,
  setFilterData,
  filteredDepartments,
  handleInputChange,
  handleImportInputChange,
  resetFormData,
  resetImportData,
  fetchTeachers,
  error,
  setError,
  success,
  setSuccess,
  setActiveTab,
  showAddModal,
  setShowAddModal,
  showImportModal,
  setShowImportModal,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "facultyId" && { departmentId: "" }),
    }))
  }

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

  // Filter and sort teachers by selected faculty, department, and alphabetically by nom + prenom
  const filteredTeachers = teachers
    .filter(
      (teacher) =>
        (!filterData.facultyId || teacher.ID_faculte === Number.parseInt(filterData.facultyId)) &&
        (!filterData.departmentId || teacher.ID_departement === Number.parseInt(filterData.departmentId)),
    )
    .sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })

  return (
    <>
      {/* Filter Section */}
      <div className={styles["ADM-ENS-filter-section"]}>
        <h3>
          <FaFilter style={{ marginRight: "8px" }} /> Filtrer les Enseignants
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
          <FaList style={{ marginRight: "8px" }} /> Liste des Enseignants
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

      {/* Modals */}
      <AddTeacherModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        formData={formData}
        setFormData={setFormData}
        faculties={faculties}
        filteredDepartments={filteredDepartments}
        handleInputChange={handleInputChange}
        resetFormData={resetFormData}
        setSelectedTeacher={setSelectedTeacher}
        setShowDetailsModal={setShowDetailsModal}
        fetchTeachers={fetchTeachers}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
      />

      <ImportTeachersModal
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importData={importData}
        setImportData={setImportData}
        faculties={faculties}
        filteredDepartments={filteredDepartments}
        handleImportInputChange={handleImportInputChange}
        resetImportData={resetImportData}
        setTeachers={setTeachers}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
        setSelectedTeacher={setSelectedTeacher}
      />

      <DeleteConfirmationModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        teacherToDelete={teacherToDelete}
        setTeacherToDelete={setTeacherToDelete}
        setSelectedTeacher={setSelectedTeacher}
        setShowDetailsModal={setShowDetailsModal}
        setShowAssignmentsModal={() => {}}
        setTeachers={setTeachers}
        teachers={teachers}
        fetchTeachers={fetchTeachers}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
      />

      <TeacherDetailsModal
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        selectedTeacher={selectedTeacher}
        setSelectedTeacher={setSelectedTeacher}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        faculties={faculties}
        departments={departments}
        filteredDepartments={filteredDepartments}
        handleInputChange={handleInputChange}
        resetFormData={resetFormData}
        setTeacherToDelete={setTeacherToDelete}
        setShowDeleteModal={setShowDeleteModal}
        fetchTeachers={fetchTeachers}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
      />
    </>
  )
}

export default TeacherList
