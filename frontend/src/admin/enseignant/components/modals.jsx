import React from "react";
import styles from "../styles/prof.module.css"
import { FaTrash, FaTimes, FaEdit } from "react-icons/fa"
import api, { generateRandomPassword, isValidEmail, normalizeTeacher } from "./api-config"
import * as XLSX from "xlsx"

// Autres modales (AddTeacherModal, ImportTeachersModal, DeleteConfirmationModal, AssignmentsModal) restent inchangées
export const AddTeacherModal = ({ showAddModal, setShowAddModal, formData, setFormData, faculties, filteredDepartments, handleInputChange, resetFormData, setSelectedTeacher, setShowDetailsModal, fetchTeachers, error, setError, success, setSuccess }) => {
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
        ID_faculte: Number.parseInt(formData.facultyId),
        ID_departement: Number.parseInt(formData.departmentId),
      };
      const res = await api.post("/teachers", teacherData);
      const newTeacher = normalizeTeacher({ ...res.data, motdepasse: password });
      setSuccess(`Enseignant ajouté avec succès ! Mot de passe: ${password}`);
      resetFormData();
      setShowAddModal(false);
      setSelectedTeacher(newTeacher);
      setShowDetailsModal(true);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout de l'enseignant.");
    }
  };

  if (!showAddModal) return null;

  return (
    <div className={styles["ADM-ENS-modal-overlay"]}>
      <div className={styles["ADM-ENS-modal-content"]}>
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
                resetFormData();
                setShowAddModal(false);
                setSelectedTeacher(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TeacherDetailsModal = ({ showDetailsModal, setShowDetailsModal, selectedTeacher, setSelectedTeacher, formData, setFormData, isEditing, setIsEditing, faculties, departments, filteredDepartments, handleInputChange, resetFormData, setTeacherToDelete, setShowDeleteModal, fetchTeachers, error, setError, success, setSuccess }) => {
  // Suppression de l'état et des effets liés aux sections et modules
  // const [sections, setSections] = React.useState([]);
  // const [modules, setModules] = React.useState([]);
  // const [groups, setGroups] = React.useState([]);
  //
  // React.useEffect(() => {
  //   if (isEditing && formData.assignedSections.length > 0) {
  //     api.get(`/enseignants/groups?sectionIds=${formData.assignedSections.join(',')}`, {
  //       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  //     })
  //       .then(response => setGroups(response.data))
  //       .catch(err => setError('Erreur lors de la récupération des groupes'));
  //
  //     const specialtyIds = sections
  //       .filter(section => formData.assignedSections.includes(section.ID_section))
  //       .map(section => section.ID_specialite);
  //     if (specialtyIds.length > 0) {
  //       api.post(`/enseignants/modules/by-sections-specialty`, {
  //         sectionIds: formData.assignedSections,
  //         specialtyId: specialtyIds[0]
  //       }, {
  //         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  //       })
  //         .then(response => setModules(response.data))
  //         .catch(err => setError('Erreur lors de la récupération des modules'));
  //     }
  //   } else {
  //     setModules([]);
  //     setGroups([]);
  //   }
  // }, [formData.assignedSections, sections, isEditing, setError]);

  // Suppression des fonctions de gestion des sections, modules et groupes
  // const handleSectionChange = (sectionId) => { ... };
  // const handleModuleChange = (moduleId) => { ... };
  // const handleSessionTypeChange = (moduleId, courseType) => { ... };
  // const handleGroupChange = (moduleId, courseType, groupId) => { ... };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedTeacher.matricule) {
      setError("Enseignant invalide ou matricule manquant.");
      return;
    }
    try {
      const updatedData = {
        nom: formData.nom || selectedTeacher.nom,
        prenom: formData.prenom || selectedTeacher.prenom,
        email: formData.email || selectedTeacher.email,
        ID_faculte: Number.parseInt(formData.facultyId) || selectedTeacher.ID_faculte,
        ID_departement: Number.parseInt(formData.departmentId) || selectedTeacher.ID_departement,
        // Suppression des champs liés aux sections, modules et groupes
        // assignedModules: formData.assignedModules,
        // assignedSections: derivedSections,
        // moduleSessionTypes: formData.moduleSessionTypes,
        // assignedGroups: formData.assignedGroups
      };
      console.log("Data being sent to backend:", updatedData);
      await api.put(`/teachers/${selectedTeacher.matricule}`, updatedData);
      setSuccess("Enseignant mis à jour avec succès.");
      setError("");
      setIsEditing(false);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour de l'enseignant.");
      setSuccess("");
    }
  };

  if (!showDetailsModal || !selectedTeacher) return null;

  return (
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
              {/* Suppression des sections pour les sections et modules */}
              <div className={styles["ADM-ENS-modal-actions"]}>
                <button type="submit" className={styles["ADM-ENS-button"]}>
                  Enregistrer
                </button>
                <button
                  type="button"
                  className={styles["ADM-ENS-close-button"]}
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      nom: selectedTeacher.nom || "",
                      prenom: selectedTeacher.prenom || "",
                      email: selectedTeacher.email || "",
                      facultyId: selectedTeacher.ID_faculte || "",
                      departmentId: selectedTeacher.ID_departement || "",
                      specialtyId: "",
                      level: "",
                      // Suppression des initialisations liées aux sections, modules et groupes
                      assignedModules: [],
                      assignedSections: [],
                      moduleSessionTypes: {},
                      moduleSections: {},
                      assignedGroups: {},
                    });
                    setError("");
                    setSuccess("");
                  }}
                >
                  Annuler
                </button>
                {/* Suppression du bouton Supprimer */}
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
                <strong>Matricule:</strong> {selectedTeacher.Matricule || selectedTeacher.matricule || "N/A"}
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
                {faculties.find((fac) => fac.ID_faculte === selectedTeacher.ID_faculte)?.nom_faculte || "N/A"}
              </p>
              <p>
                <strong>Département:</strong>{" "}
                {departments.find((dep) => dep.ID_departement === selectedTeacher.ID_departement)?.Nom_departement ||
                  "N/A"}
              </p>
              <p>
                <strong>Année d'inscription:</strong> {selectedTeacher.annee_inscription || "N/A"}
              </p>
            </div>
            <div className={styles["ADM-ENS-modal-actions"]}>
              <button
                className={styles["ADM-ENS-button"]}
                onClick={() => {
                  setIsEditing(true);
                  setFormData({
                    nom: selectedTeacher.nom || "",
                    prenom: selectedTeacher.prenom || "",
                    email: selectedTeacher.email || "",
                    facultyId: selectedTeacher.ID_faculte || "",
                    departmentId: selectedTeacher.ID_departement || "",
                    specialtyId: "",
                    level: "",
                    // Suppression des initialisations liées aux sections, modules et groupes
                    assignedModules: [],
                    assignedSections: [],
                    moduleSessionTypes: {},
                    moduleSections: {},
                    assignedGroups: {},
                  });
                  setError("");
                  setSuccess("");
                }}
              >
                <FaEdit /> Modifier
              </button>
              <button
                className={styles["ADM-ENS-close-button"]}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTeacher(null);
                  resetFormData();
                }}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ImportTeachersModal, DeleteConfirmationModal, et AssignmentsModal restent inchangés
export const ImportTeachersModal = ({ showImportModal, setShowImportModal, importData, setImportData, faculties, filteredDepartments, handleImportInputChange, resetImportData, setTeachers, error, setError, success, setSuccess, setSelectedTeacher }) => {
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!importData.facultyId || !importData.departmentId || !importData.file) {
      setError("Veuillez sélectionner une faculté, un département et un fichier Excel.");
      return;
    }
    try {
      const facultyId = Number.parseInt(importData.facultyId);
      const departmentId = Number.parseInt(importData.departmentId);
      if (isNaN(facultyId) || isNaN(departmentId)) {
        setError("Faculté ou département invalide.");
        return;
      }
      const facultyExists = faculties.some((fac) => fac.ID_faculte === facultyId);
      const departmentExists = filteredDepartments.some(
        (dep) => dep.ID_departement === departmentId && dep.ID_faculte === facultyId,
      );
      if (!facultyExists || !departmentExists) {
        setError("Faculté ou département sélectionné non valide.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: ["NOM", "EMAIL"], range: 1 });

        const teachers = [];
        const invalidRows = [];

        rows.forEach((row, index) => {
          if (!row.NOM || !row.EMAIL || !isValidEmail(row.EMAIL)) {
            invalidRows.push({ row, index: index + 2, reason: "NOM ou EMAIL invalide" });
            return;
          }

          const nameParts = row.NOM.split(",").map((s) =>
            s
              .trim()
              .replace(/$$.*$$/, "")
              .trim(),
          );
          if (nameParts.length !== 2 || !nameParts[0] || !nameParts[1]) {
            invalidRows.push({ row, index: index + 2, reason: "Format NOM incorrect (doit être 'Nom, Prénom')" });
            return;
          }

          const [nom, prenom] = nameParts;
          const password = generateRandomPassword();

          teachers.push({
            nom,
            prenom,
            email: row.EMAIL.trim(),
            motdepasse: password,
            annee_inscription: new Date().toISOString().split("T")[0],
            ID_faculte: facultyId,
            ID_departement: departmentId,
            assignedSections: [],
          });
        });

        if (teachers.length === 0) {
          setError(`Aucun enseignant valide trouvé dans le fichier Excel. ${invalidRows.length} lignes invalides.`);
          console.error("Lignes invalides:", invalidRows);
          return;
        }

        try {
          console.log("Sending teachers to backend:", teachers);
          const res = await api.post("/teachers/bulk", { teachers });
          setTeachers((prev) => [...prev, ...res.data.teachers.map(normalizeTeacher)]);
          setSuccess(`${res.data.count} enseignant(s) importé(s) avec succès !`);

          if (invalidRows.length > 0) {
            console.warn(`${invalidRows.length} lignes ignorées dans le fichier Excel:`, invalidRows);
          }

          resetImportData();
          setShowImportModal(false);
        } catch (err) {
          console.error("Erreur API lors de l'importation:", err);
          if (err.response?.data?.error) {
            setError(err.response.data.error);
          } else if (err.message) {
            setError(`Erreur lors de l'importation: ${err.message}`);
          } else {
            setError("Erreur inconnue lors de l'importation des enseignants.");
          }
        }
      };
      reader.readAsArrayBuffer(importData.file);
    } catch (err) {
      console.error("Erreur lors de la lecture du fichier:", err);
      setError("Erreur lors de la lecture du fichier Excel.");
    }
  };

  if (!showImportModal) return null;

  return (
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
                resetImportData();
                setShowImportModal(false);
                setSelectedTeacher(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DeleteConfirmationModal = ({ showDeleteModal, setShowDeleteModal, teacherToDelete, setTeacherToDelete, setSelectedTeacher, setShowDetailsModal, setShowAssignmentsModal, setTeachers, teachers, fetchTeachers, error, setError, success, setSuccess }) => {
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
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression de l'enseignant.");
      setShowDeleteModal(false);
      setTeacherToDelete(null);
    }
  };

  if (!showDeleteModal || !teacherToDelete) return null;

  return (
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
              setShowDeleteModal(false);
              setTeacherToDelete(null);
              setSelectedTeacher(null);
              setError("");
              setSuccess("");
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export const AssignmentsModal = ({ showAssignmentsModal, setShowAssignmentsModal, selectedTeacher, setSelectedTeacher, formData, setFormData, isEditingAssignments, setIsEditingAssignments, showAddModuleForm, setShowAddModuleForm, faculties, departments, filteredDepartments, filteredSpecialties, filteredSections, filteredModules, filteredGroups = [], levels, modules, sections, specialties, handleInputChange, handleSectionSelect, handleModuleSelect, handleSessionTypeChange, handleGroupSelect, resetFormData, fetchTeachers, error, setError, success, setSuccess }) => {
  const onGroupSelect = (moduleId, courseType, groupIds) => {
    setFormData(prev => {
      const assignedGroups = { ...prev.assignedGroups };
      if (!assignedGroups[moduleId]) {
        assignedGroups[moduleId] = { TD: [], TP: [] };
      }
      assignedGroups[moduleId][courseType] = groupIds;
      return { ...prev, assignedGroups };
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedTeacher.matricule) {
      setError("Enseignant invalide ou matricule manquant.");
      return;
    }
    try {
      const derivedSections =
        formData.assignedSections.length > 0
          ? formData.assignedSections
          : [...new Set(Object.values(formData.moduleSections).filter((id) => id))];

      const updatedData = {
        nom: formData.nom || selectedTeacher.nom,
        prenom: formData.prenom || selectedTeacher.prenom,
        email: formData.email || selectedTeacher.email,
        ID_faculte: Number.parseInt(formData.facultyId) || selectedTeacher.ID_faculte,
        ID_departement: Number.parseInt(formData.departmentId) || selectedTeacher.ID_departement,
        assignedModules: formData.assignedModules,
        assignedSections: derivedSections,
        moduleSessionTypes: formData.moduleSessionTypes,
        assignedGroups: formData.assignedGroups
      };
      console.log("Data being sent to backend:", updatedData);
      await api.put(`/teachers/${selectedTeacher.matricule}`, updatedData);
      setSuccess("Assignations mises à jour avec succès.");
      setError("");
      setIsEditingAssignments(false);
      setShowAddModuleForm(false);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour des assignations.");
      setSuccess("");
    }
  };

  if (!showAssignmentsModal || !selectedTeacher) return null;

  return (
    <div className={styles["ADM-ENS-modal-overlay"]}>
      <div className={styles["ADM-ENS-modal-content"]}>
        <h3>
          Assignations de {selectedTeacher.nom} {selectedTeacher.prenom}
        </h3>
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
                      const module = modules.find((m) => m.ID_module === modId);
                      const sectionId = formData.moduleSections[modId];
                      const section = sections.find((s) => s.ID_section === sectionId);
                      const specialty = specialties.find((sp) => sp.ID_specialite === section?.ID_specialite);
                      return (
                        <div
                          key={modId}
                          className={styles["ADM-ENS-section-tag"]}
                          style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}
                        >
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span>
                              {specialty?.nom_specialite || "N/A"} - {section?.nom_section || "N/A"} -{" "}
                              {module?.nom_module || "Module inconnu"} ({formData.moduleSessionTypes[modId] || "N/A"})
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
                          {(formData.moduleSessionTypes[modId]?.includes("TD") ||
                            formData.moduleSessionTypes[modId]?.includes("TP")) && (
                            <div style={{ marginTop: "10px" }}>
                              {formData.moduleSessionTypes[modId]?.includes("TD") && (
                                <div className={styles["ADM-ENS-form-section"]}>
                                  <label>Groupes pour TD</label>
                                  {filteredGroups.length > 0 ? (
                                    <select
                                      multiple
                                      value={formData.assignedGroups[modId]?.TD || []}
                                      onChange={(e) =>
                                        onGroupSelect(
                                          modId,
                                          "TD",
                                          Array.from(e.target.selectedOptions, (option) =>
                                            Number.parseInt(option.value)
                                          )
                                        )
                                      }
                                      className={styles["ADM-ENS-select"]}
                                    >
                                      {filteredGroups.map((group) => (
                                        <option key={group.ID_groupe} value={group.ID_groupe}>
                                          Groupe {group.num_groupe} (
                                          {sections.find((s) => s.ID_section === group.ID_section)?.nom_section ||
                                            group.ID_section}
                                          )
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p>Aucun groupe disponible pour cette section.</p>
                                  )}
                                </div>
                              )}
                              {formData.moduleSessionTypes[modId]?.includes("TP") && (
                                <div className={styles["ADM-ENS-form-section"]}>
                                  <label>Groupes pour TP</label>
                                  {filteredGroups.length > 0 ? (
                                    <select
                                      multiple
                                      value={formData.assignedGroups[modId]?.TP || []}
                                      onChange={(e) =>
                                        onGroupSelect(
                                          modId,
                                          "TP",
                                          Array.from(e.target.selectedOptions, (option) =>
                                            Number.parseInt(option.value)
                                          )
                                        )
                                      }
                                      className={styles["ADM-ENS-select"]}
                                    >
                                      {filteredGroups.map((group) => (
                                        <option key={group.ID_groupe} value={group.ID_groupe}>
                                          Groupe {group.num_groupe} (
                                          {sections.find((s) => s.ID_section === group.ID_section)?.nom_section ||
                                            group.ID_section}
                                          )
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p>Aucun groupe disponible pour cette section.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p>Aucun module assigné.</p>
                  )}
                </div>
                <button
                  type="button"
                  className={styles["ADM-ENS-button"]}
                  onClick={() => {
                    setShowAddModuleForm(true);
                    setFormData((prev) => ({
                      ...prev,
                      facultyId: selectedTeacher.ID_faculte || "",
                      departmentId: selectedTeacher.ID_departement || "",
                      specialtyId: "",
                      level: "",
                      assignedSections: [],
                      assignedGroups: {},
                    }));
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
                        const sectionId = Number.parseInt(e.target.value);
                        if (sectionId) handleSectionSelect(sectionId);
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
                            const module = modules.find((m) => m.ID_module === modId);
                            const section = sections.find((s) => s.ID_section === formData.assignedSections[0]);
                            return (
                              module &&
                              section &&
                              module.ID_specialite === section.ID_specialite &&
                              !(
                                Array.isArray(selectedTeacher.modules) &&
                                selectedTeacher.modules.some((m) => m.ID_module === modId)
                              )
                            );
                          })
                          .map((modId) => {
                            const module = filteredModules.find((m) => m.ID_module === modId);
                            return (
                              <div
                                key={modId}
                                className={styles["ADM-ENS-section-tag"]}
                                style={{ display: "flex", alignItems: "center" }}
                              >
                                {module?.nom_module || "Module inconnu"}
                                <FaTimes
                                  className={styles["ADM-ENS-section-remove"]}
                                  onClick={() => handleModuleSelect(modId, formData.assignedSections[0])}
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
                            );
                          })}
                      </div>
                      <select
                        className={styles["ADM-ENS-select"]}
                        onChange={(e) => {
                          const moduleId = Number.parseInt(e.target.value);
                          if (moduleId) handleModuleSelect(moduleId, formData.assignedSections[0]);
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
                        setShowAddModuleForm(false);
                        setFormData((prev) => ({
                          ...prev,
                          specialtyId: "",
                          level: "",
                        }));
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
                    setIsEditingAssignments(false);
                    setShowAddModuleForm(false);
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
                            {}
                          )
                        : {},
                      moduleSections: Array.isArray(selectedTeacher.modules)
                        ? selectedTeacher.modules.reduce(
                            (acc, m) => ({
                              ...acc,
                              [m.ID_module]: m.ID_section,
                            }),
                            {}
                          )
                        : {},
                      assignedGroups: Array.isArray(selectedTeacher.groups)
                        ? selectedTeacher.groups.reduce(
                            (acc, g) => ({
                              ...acc,
                              [g.ID_module]: {
                                ...acc[g.ID_module],
                                [g.course_type]: [...(acc[g.ID_module]?.[g.course_type] || []), g.ID_groupe],
                              },
                            }),
                            {}
                          )
                        : {},
                    });
                    setError("");
                    setSuccess("");
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
                      <th>Groupes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeacher.modules.map((mod, index) => {
                      const groupsForModule = Array.isArray(selectedTeacher.groups)
                        ? selectedTeacher.groups
                            .filter((g) => g.ID_module === mod.ID_module)
                            .map((g) => `Groupe ${g.num_groupe} (${g.course_type})`)
                            .join(", ")
                        : "Aucun";
                      return (
                        <tr key={`${mod.ID_module}-${index}`}>
                          <td>{mod.nom_specialite || "N/A"}</td>
                          <td>{mod.nom_section || `Section ${mod.niveau || mod.ID_section}` || "N/A"}</td>
                          <td>{mod.nom_module || "N/A"}</td>
                          <td>{mod.course_type || "N/A"}</td>
                          <td>{groupsForModule}</td>
                        </tr>
                      );
                    })}
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
                  setIsEditingAssignments(true);
                  setError("");
                  setSuccess("");
                }}
              >
                <FaEdit /> Modifier Assignations
              </button>
              <button
                className={styles["ADM-ENS-close-button"]}
                onClick={() => {
                  setShowAssignmentsModal(false);
                  setSelectedTeacher(null);
                  resetFormData();
                }}
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};