"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import styles from "../styles/prof.module.css"
import { FaChalkboardTeacher, FaPlus, FaFileImport, FaBook, FaUsers, FaHome } from "react-icons/fa"
import api, { normalizeTeacher } from "./api-config"
import TeacherList from "./TeacherList"
import TeacherModule from "./TeacherModule"

const ListEnseignant = () => {
  // Modifier la déclaration des états pour les modaux
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [faculties, setFaculties] = useState([])
  const [departments, setDepartments] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [modules, setModules] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const navigate = useNavigate()
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
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filteredModules, setFilteredModules] = useState([])
  const [activeTab, setActiveTab] = useState("teachers")
  // Ajouter un nouvel état pour stocker les groupes
  const [groups, setGroups] = useState([])

  // Fixed list of levels
  const levels = ["L1", "L2", "L3", "M1", "M2", "ING1", "ING2", "ING3"]

  const resetFormData = () => {
    console.log("resetFormData called, resetting assignedSections")
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
    })
    setFilteredModules([])
    setError("")
    setSuccess("")
  }

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
      const teachRes = await api.get("/teachers")
      setTeachers(teachRes.data.map(normalizeTeacher))
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement des enseignants.")
    }
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
      }
      console.log("Updated assignedSections:", updatedFormData.assignedSections) // Debug log
      return updatedFormData
    })
  }

  // Ajouter cette fonction pour récupérer les groupes par section
  const fetchGroupsBySections = async (sectionIds) => {
    if (!sectionIds || sectionIds.length === 0) {
      return []
    }
    try {
      const res = await api.get(`/groups?sectionIds=${sectionIds.join(",")}`)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la récupération des groupes.")
      return []
    }
  }

  // Ajouter cette fonction pour gérer la sélection des groupes
  const handleGroupSelect = (moduleId, courseType, groupIds) => {
    setFormData((prev) => {
      const updatedGroups = {
        ...prev.assignedGroups,
        [moduleId]: {
          ...prev.assignedGroups[moduleId],
          [courseType]: groupIds,
        },
      }
      return {
        ...prev,
        assignedGroups: updatedGroups,
      }
    })
  }

  // Modifier useEffect pour surveiller les changements de sections sélectionnées
  useEffect(() => {
    const updateGroups = async () => {
      if (formData.assignedSections.length > 0) {
        const fetchedGroups = await fetchGroupsBySections(formData.assignedSections)
        setGroups(fetchedGroups)
      } else {
        setGroups([])
      }
    }
    updateGroups()
  }, [formData.assignedSections])

  // Handle module selection
  const handleModuleSelect = (moduleId, sectionId) => {
    setFormData((prev) => {
      const updatedModules = prev.assignedModules.includes(moduleId)
        ? prev.assignedModules.filter((id) => id !== moduleId)
        : [...prev.assignedModules, moduleId]
      const updatedSessionTypes = { ...prev.moduleSessionTypes }
      const updatedModuleSections = { ...prev.moduleSections }
      if (!prev.assignedModules.includes(moduleId)) {
        updatedSessionTypes[moduleId] = "Cour"
        updatedModuleSections[moduleId] = sectionId
      } else {
        delete updatedSessionTypes[moduleId]
        delete updatedModuleSections[moduleId]
      }
      const updatedFormData = {
        ...prev,
        assignedModules: updatedModules,
        moduleSessionTypes: updatedSessionTypes,
        moduleSections: updatedModuleSections,
      }
      console.log("Updated formData after module select:", updatedFormData) // Debug log
      return updatedFormData
    })
  }

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
      sec.ID_specialite === Number.parseInt(formData.specialtyId) && (!formData.level || sec.niveau === formData.level),
  )

  return (
    <div className={styles["ADM-ENS-container"]}>
      <aside className={styles["ADM-ENS-sidebar"]}>
        <div className={styles["ADM-ENS-logo"]}>
          <FaChalkboardTeacher />
          <h2>Gestion Enseignants</h2>
        </div>
        < button className={styles["ADM-ENS-sidebar-button"]} onClick={() => navigate('/admin')}> <FaHome/> Retour a l'accueil </button>
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
        {/* Remplacer les boutons du sidebar par ceux-ci */}
        <button
          className={`${styles["ADM-ENS-sidebar-button"]}`}
          onClick={() => {
            resetFormData()
            setActiveTab("teachers")
            setShowAddModal(true)
          }}
        >
          <FaPlus /> Ajouter Enseignant
        </button>
        <button
          className={`${styles["ADM-ENS-sidebar-button"]}`}
          onClick={() => {
            resetImportData()
            setActiveTab("teachers")
            setShowImportModal(true)
          }}
        >
          <FaFileImport /> Importer Enseignants
        </button>
      </aside>
      <main className={styles["ADM-ENS-main-content"]}>
        {activeTab === "teachers" ? (
          /* Modifier la façon dont nous passons les props à TeacherList */
          <TeacherList
            faculties={faculties}
            departments={departments}
            teachers={teachers}
            setTeachers={setTeachers}
            formData={formData}
            setFormData={setFormData}
            importData={importData}
            setImportData={setImportData}
            filterData={filterData}
            setFilterData={setFilterData}
            filteredDepartments={filteredDepartments}
            handleInputChange={handleInputChange}
            handleImportInputChange={handleImportInputChange}
            resetFormData={resetFormData}
            resetImportData={resetImportData}
            fetchTeachers={fetchTeachers}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
            setActiveTab={setActiveTab}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            showImportModal={showImportModal}
            setShowImportModal={setShowImportModal}
          />
        ) : (
          <TeacherModule
            faculties={faculties}
            departments={departments}
            specialties={specialties}
            modules={modules}
            sections={sections}
            teachers={teachers}
            formData={formData}
            setFormData={setFormData}
            filterData={filterData}
            setFilterData={setFilterData}
            filteredDepartments={filteredDepartments}
            filteredSpecialties={filteredSpecialties}
            filteredSections={filteredSections}
            filteredModules={filteredModules}
            levels={levels}
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
            groups={groups}
            fetchGroupsBySections={fetchGroupsBySections}
          />
        )}
      </main>

      {/* Supprimer les boutons cachés à la fin du composant (les deux derniers boutons avec style={{ display: "none" }}) */}
    </div>
  )
}

export default ListEnseignant
