"use client"

import { useState } from "react"
import styles from "../styles/prof.module.css"
import { FaFilter, FaList, FaBook } from "react-icons/fa"
import api, { normalizeTeacher } from "./api-config"
import { AssignmentsModal } from "./modals"

const TeacherModule = ({
  faculties,
  departments,
  specialties,
  modules,
  sections,
  groups = [], // Ajouter une valeur par défaut
  filteredGroups,
  teachers,
  formData,
  setFormData,
  filterData,
  setFilterData,
  filteredDepartments,
  filteredSpecialties,
  filteredSections,
  filteredModules,
  levels,
  handleInputChange,
  handleSectionSelect,
  handleModuleSelect,
  handleSessionTypeChange,
  handleGroupSelect,
  resetFormData,
  fetchTeachers,
  error,
  setError,
  success,
  setSuccess,
  fetchGroupsBySections,
}) => {
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false)
  const [showAddModuleForm, setShowAddModuleForm] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [isEditingAssignments, setIsEditingAssignments] = useState(false)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilterData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "facultyId" && { departmentId: "" }),
    }))
  }

  const handleShowAssignments = async (teacher) => {
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
      // Derive sections from modules if sections are empty
      const derivedSections =
        Array.isArray(normalizedTeacher.sections) && normalizedTeacher.sections.length > 0
          ? normalizedTeacher.sections.map((s) => s.ID_section)
          : Array.isArray(normalizedTeacher.modules)
            ? [...new Set(normalizedTeacher.modules.map((m) => m.ID_section).filter((id) => id))]
            : []
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
        assignedSections: derivedSections,
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
        assignedGroups: Array.isArray(normalizedTeacher.groups)
          ? normalizedTeacher.groups.reduce(
              (acc, g) => ({
                ...acc,
                [g.ID_module]: {
                  ...acc[g.ID_module],
                  [g.course_type]: [...(acc[g.ID_module]?.[g.course_type] || []), g.ID_groupe],
                },
              }),
              {},
            )
          : {},
      })
      setShowAssignmentsModal(true)
      setIsEditingAssignments(false)
      setError("")
      setSuccess("")
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la récupération des assignations.")
      const normalizedTeacher = normalizeTeacher(teacher)
      // Derive sections from modules in error case
      const derivedSections =
        Array.isArray(normalizedTeacher.sections) && normalizedTeacher.sections.length > 0
          ? normalizedTeacher.sections.map((s) => s.ID_section)
          : Array.isArray(normalizedTeacher.modules)
            ? [...new Set(normalizedTeacher.modules.map((m) => m.ID_section).filter((id) => id))]
            : []
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
        assignedSections: derivedSections,
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
        assignedGroups: Array.isArray(normalizedTeacher.groups)
          ? normalizedTeacher.groups.reduce(
              (acc, g) => ({
                ...acc,
                [g.ID_module]: {
                  ...acc[g.ID_module],
                  [g.course_type]: [...(acc[g.ID_module]?.[g.course_type] || []), g.ID_groupe],
                },
              }),
              {},
            )
          : {},
      })
      setShowAssignmentsModal(true)
      setIsEditingAssignments(false)
      setSuccess("Données partielles chargées. Certaines informations peuvent être manquantes.")
    }
  }

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

      <div className={styles["ADM-ENS-teacher-list"]}>
        <h2>
          <FaList style={{ marginRight: "8px" }} /> Assignations des Enseignants
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
                <button className={styles["ADM-ENS-details-button"]} onClick={() => handleShowAssignments(teacher)}>
                  <FaBook /> Détails
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <AssignmentsModal
        showAssignmentsModal={showAssignmentsModal}
        setShowAssignmentsModal={setShowAssignmentsModal}
        selectedTeacher={selectedTeacher}
        setSelectedTeacher={setSelectedTeacher}
        formData={formData}
        setFormData={setFormData}
        isEditingAssignments={isEditingAssignments}
        setIsEditingAssignments={setIsEditingAssignments}
        showAddModuleForm={showAddModuleForm}
        setShowAddModuleForm={setShowAddModuleForm}
        faculties={faculties}
        departments={departments}
        filteredDepartments={filteredDepartments}
        filteredSpecialties={filteredSpecialties}
        filteredSections={filteredSections}
        filteredModules={filteredModules}
        filteredGroups={(groups || []).filter((g) => formData.assignedSections.includes(g.ID_section))}
        levels={levels}
        modules={modules}
        sections={sections}
        specialties={specialties}
        handleInputChange={handleInputChange}
        handleSectionSelect={handleSectionSelect}
        handleModuleSelect={handleModuleSelect}
        handleSessionTypeChange={handleSessionTypeChange}
        handleGroupSelect={handleGroupSelect}
        resetFormData={resetFormData}
        fetchTeachers={fetchTeachers}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
      />
    </>
  )
}

export default TeacherModule
