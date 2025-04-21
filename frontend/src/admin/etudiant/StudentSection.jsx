import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaUpload, FaArrowLeft, FaFileExport, FaUsers } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import styles from './listetudiant.module.css';

const StudentSection = ({ sectionId, onBack, niveau, idSpecialite, nombreGroupes }) => {
  const [students, setStudents] = useState([]);
  const [nomSpecialite, setNomSpecialite] = useState('');
  const [newStudent, setNewStudent] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    motdepasse: 'default',
    niveau: niveau || '',
    etat: '',
    anneeInscription: '',
    nomSpecialite: '',
    num_groupe: ''
  });
  const [editStudent, setEditStudent] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [importDetails, setImportDetails] = useState(null);

  const groupOptions = Array.from({ length: nombreGroupes }, (_, i) => ({
    value: i + 1,
    label: `Groupe ${i + 1}`
  }));

  const iconColor = '#021A3F';

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://users.localhost/listeETD/sections/${sectionId}/etudiants`);
      const normalizedStudents = res.data.map(student => ({
        ...student,
        num_groupe: student.groupId || student.num_groupe || '',
      }));
      console.log('Données normalisées des étudiants:', normalizedStudents);
      setStudents(normalizedStudents);
    } catch (err) {
      toast.error('Impossible de charger la liste des étudiants.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
    }
  };

  const fetchNomSpecialite = async () => {
    if (!idSpecialite) return;
    try {
      const res = await axios.get(`http://users.localhost/listeETD/specialites/${idSpecialite}`);
      setNomSpecialite(res.data.nom_specialite || '');
      setNewStudent(prev => ({ ...prev, nomSpecialite: res.data.nom_specialite || '' }));
    } catch (err) {
      toast.error('Erreur lors du chargement de la spécialité.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
    }
  };

  useEffect(() => {
    if (sectionId) fetchStudents();
    if (idSpecialite) fetchNomSpecialite();
  }, [sectionId, idSpecialite]);

  const handleAddStudent = async () => {
    if (!newStudent.matricule || !newStudent.nom || !newStudent.prenom || !newStudent.email || !newStudent.anneeInscription || !newStudent.nomSpecialite || !newStudent.num_groupe) {
      toast.error('Veuillez remplir tous les champs obligatoires, y compris le groupe.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    const matriculeNum = parseInt(newStudent.matricule, 10);
    if (isNaN(matriculeNum) || matriculeNum <= 0) {
      toast.error('Le matricule doit être un nombre positif valide.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    try {
      const res = await axios.post(`http://users.localhost/listeETD/sections/${sectionId}/etudiants`, newStudent);
      if (res.status === 201) {
        await fetchStudents();
        toast.success(`Étudiant ajouté avec succès ! Groupe assigné: ${newStudent.num_groupe}`, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
          icon: '✅',
          className: styles['ADM-ETD-custom-toast-success']
        });
        setNewStudent({
          matricule: '',
          nom: '',
          prenom: '',
          email: '',
          motdepasse: 'default',
          niveau: niveau || '',
          etat: '',
          anneeInscription: '',
          nomSpecialite: nomSpecialite,
          num_groupe: ''
        });
        setShowAddStudentForm(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Une erreur s’est produite.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
    }
  };

  const handleEditStudent = async (student) => {
    if (!editStudent) return;

    try {
      const res = await axios.put(`http://users.localhost/listeETD/etudiants/${student.Matricule}`, {
        ...editStudent,
        sectionId: sectionId
      });
      if (res.status === 200) {
        await fetchStudents();
        toast.success('Étudiant modifié avec succès !', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
          icon: '✅',
          className: styles['ADM-ETD-custom-toast-success']
        });
        setEditStudent(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Une erreur s’est produite.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
    }
  };

  const handleDeleteStudent = async (matricule) => {
    const result = await Swal.fire({
      title: 'Confirmer la suppression ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#5483b3',
      cancelButtonColor: '#052659',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#052659',
      customClass: {
        confirmButton: styles['ADM-ETD-swal-confirm-btn'],
        cancelButton: styles['ADM-ETD-swal-cancel-btn']
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`http://users.localhost/listeETD/etudiants/${matricule}`);
        if (res.status === 200) {
          await fetchStudents();
          toast.success('Étudiant supprimé avec succès !', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
            icon: '✅',
            className: styles['ADM-ETD-custom-toast-success']
          });
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
          icon: '❌',
          className: styles['ADM-ETD-custom-toast-error']
        });
      }
    }
  };

  const handleDeleteSection = async () => {
    const result = await Swal.fire({
      title: 'Confirmer la suppression ?',
      text: `Supprimer la Section ${sectionId} ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#5483b3',
      cancelButtonColor: '#052659',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#052659',
      customClass: {
        confirmButton: styles['ADM-ETD-swal-confirm-btn'],
        cancelButton: styles['ADM-ETD-swal-cancel-btn']
      }
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://users.localhost/listeETD/sections/${sectionId}`);
        onBack();
        toast.success('Section supprimée avec succès !', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#50C878', color: '#fff', fontSize: '16px' },
          icon: '✅',
          className: styles['ADM-ETD-custom-toast-success']
        });
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
          icon: '❌',
          className: styles['ADM-ETD-custom-toast-error']
        });
      }
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('Veuillez sélectionner un fichier Excel valide.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
        icon: '❌',
        className: styles['ADM-ETD-custom-toast-error']
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    axios
      .post(`http://users.localhost/listeETD/sections/${sectionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(res => {
        console.log('Données renvoyées par l\'API après importation:', res.data);
        const toastType = res.data.importedCount > 0 ? toast.success : toast.info;
        toastType(res.data.message, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: {
            backgroundColor: res.data.importedCount > 0 ? '#50C878' : '#FFD93D',
            color: '#fff',
            fontSize: '16px',
          },
          icon: res.data.importedCount > 0 ? '✅' : 'ℹ️',
          className: res.data.importedCount > 0 ? styles['ADM-ETD-custom-toast-success'] : styles['ADM-ETD-custom-toast-warning']
        });

        setImportDetails({
          importedCount: res.data.importedCount,
          skippedCount: res.data.skippedCount,
          importedStudents: res.data.importedStudents,
          skippedStudents: res.data.skippedStudents,
        });

        if (res.data.importedCount > 0) {
          fetchStudents();
        }
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite lors de l’importation.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#FF6B6B', color: '#fff', fontSize: '16px' },
          icon: '❌',
          className: styles['ADM-ETD-custom-toast-error']
        });
      });
  };

  const handleExportToExcel = () => {
    const exportData = students.map(student => ({
      Matricule: student.Matricule,
      Nom: student.nom,
      Prénom: student.prenom,
      Email: student.email,
      Niveau: student.niveau,
      État: student.etat || 'Non défini',
      Année: student.annee_inscription || 'Non défini',
      Groupe: student.num_groupe || 'Non assigné',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Étudiants');
    XLSX.writeFile(workbook, `etudiants_section_${sectionId}.xlsx`);
  };

  const handleCloseImportDetails = () => {
    setImportDetails(null);
  };

  return (
    <div className={styles['ADM-ETD-student-section']}>
      <button className={styles['ADM-ETD-back-btn']} onClick={onBack}>
        <FaArrowLeft /> Retour
      </button>
      <h2>Liste des étudiants <FaUsers style={{ color: iconColor, fill: iconColor, verticalAlign: 'middle' }} /></h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Importer via Excel</h3>
        <div className={styles['ADM-ETD-upload-section']} style={{ marginBottom: '20px' }}>
          <input type="file" accept=".xlsx, .xls" onChange={handleUpload} className={styles['ADM-ETD-input']} />
          <button onClick={handleExportToExcel} className={styles['ADM-ETD-edit-btn']} style={{ marginLeft: '10px' }}>
            <FaFileExport /> Exporter vers Excel
          </button>
        </div>

        {importDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className={styles['ADM-ETD-import-details']}
          >
            <h4>Résultat de l'importation :</h4>
            <p>Étudiants importés : {importDetails.importedCount}</p>
            <p>Étudiants ignorés : {importDetails.skippedCount}</p>
            {importDetails.skippedStudents.length > 0 && (
              <div>
                <h5>Étudiants ignorés :</h5>
                <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
                  {importDetails.skippedStudents.map((student, index) => (
                    <li key={index}>
                      {student.nom} {student.prenom} (Matricule: {student.matricule}) - {student.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {importDetails.importedStudents.length > 0 && (
              <div>
                <h5>Étudiants importés :</h5>
                <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
                  {importDetails.importedStudents.map((student, index) => (
                    <li key={index}>
                      {student.nom} {student.prenom} (Matricule: {student.matricule}) - Groupe: {student.num_groupe || 'Non assigné'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className={styles['ADM-ETD-back-btn']}
              onClick={handleCloseImportDetails}
              style={{ marginTop: '15px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            >
              Fermer
            </button>
          </motion.div>
        )}

        <h3>Gestion des étudiants</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className={styles['ADM-ETD-edit-btn']} onClick={() => setShowAddStudentForm(true)}>
            <FaPlus /> Ajouter un étudiant
          </button>
          <button className={styles['ADM-ETD-delete-section-btn']} onClick={handleDeleteSection}>
            <FaTrash /> Supprimer la section
          </button>
        </div>

        <AnimatePresence>
          {showAddStudentForm && (
            <motion.div
              className={styles['ADM-ETD-add-student-form']}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h4>Ajouter un étudiant</h4>
              <input
                placeholder="Matricule"
                value={newStudent.matricule}
                onChange={e => setNewStudent({ ...newStudent, matricule: e.target.value })}
                className={styles['ADM-ETD-input']}
              />
              <input
                placeholder="Nom"
                value={newStudent.nom}
                onChange={e => setNewStudent({ ...newStudent, nom: e.target.value })}
                className={styles['ADM-ETD-input']}
              />
              <input
                placeholder="Prénom"
                value={newStudent.prenom}
                onChange={e => setNewStudent({ ...newStudent, prenom: e.target.value })}
                className={styles['ADM-ETD-input']}
              />
              <input
                placeholder="Email"
                value={newStudent.email}
                onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                className={styles['ADM-ETD-input']}
              />
              <input
                placeholder="Niveau"
                value={newStudent.niveau}
                readOnly
                className={styles['ADM-ETD-input']}
              />
              <select
                value={newStudent.etat}
                onChange={e => setNewStudent({ ...newStudent, etat: e.target.value })}
                className={styles['ADM-ETD-select']}
              >
                <option value="">-- Aucun état --</option>
                {['Ajourné', 'Admis', 'Admis avec dettes', 'Réintégré'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <input
                type="date"
                placeholder="Année d'inscription"
                value={newStudent.anneeInscription}
                onChange={e => setNewStudent({ ...newStudent, anneeInscription: e.target.value })}
                className={styles['ADM-ETD-input']}
              />
              <input
                placeholder="Spécialité"
                value={newStudent.nomSpecialite}
                readOnly
                className={styles['ADM-ETD-input']}
              />
              <select
                value={newStudent.num_groupe}
                onChange={e => setNewStudent({ ...newStudent, num_groupe: e.target.value })}
                className={styles['ADM-ETD-select']}
              >
                <option value="">-- Sélectionner un groupe --</option>
                {groupOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button onClick={handleAddStudent} className={styles['ADM-ETD-edit-btn']}>
                <FaPlus /> Ajouter
              </button>
              <button onClick={() => setShowAddStudentForm(false)} style={{ marginLeft: '10px' }} className={styles['ADM-ETD-back-btn']}>
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <table className={styles['ADM-ETD-table']}>
        <thead>
          <tr className={styles['ADM-ETD-tr']}>
            <th className={styles['ADM-ETD-th']}>Matricule</th>
            <th className={styles['ADM-ETD-th']}>Nom</th>
            <th className={styles['ADM-ETD-th']}>Prénom</th>
            <th className={styles['ADM-ETD-th']}>Email</th>
            <th className={styles['ADM-ETD-th']}>Niveau</th>
            <th className={styles['ADM-ETD-th']}>État</th>
            <th className={styles['ADM-ETD-th']}>Année</th>
            <th className={styles['ADM-ETD-th']}>Groupe</th>
            <th className={styles['ADM-ETD-th']}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.Matricule} className={styles['ADM-ETD-tr']}>
              <td className={styles['ADM-ETD-td']}>{s.Matricule}</td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <input
                    value={editStudent.nom}
                    onChange={e => setEditStudent({ ...editStudent, nom: e.target.value })}
                    className={styles['ADM-ETD-input']}
                  />
                ) : (
                  s.nom
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <input
                    value={editStudent.prenom}
                    onChange={e => setEditStudent({ ...editStudent, prenom: e.target.value })}
                    className={styles['ADM-ETD-input']}
                  />
                ) : (
                  s.prenom
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <input
                    value={editStudent.email}
                    onChange={e => setEditStudent({ ...editStudent, email: e.target.value })}
                    className={styles['ADM-ETD-input']}
                  />
                ) : (
                  s.email
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <input
                    value={editStudent.niveau}
                    onChange={e => setEditStudent({ ...editStudent, niveau: e.target.value })}
                    className={styles['ADM-ETD-input']}
                  />
                ) : (
                  s.niveau
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <select
                    value={editStudent.etat}
                    onChange={e => setEditStudent({ ...editStudent, etat: e.target.value })}
                    className={styles['ADM-ETD-select']}
                  >
                    <option value="">-- Aucun état --</option>
                    {['Ajourné', 'Admis', 'Admis avec dettes', 'Réintégré'].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                ) : (
                  s.etat || 'Non défini'
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>{s.annee_inscription || 'Non défini'}</td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <select
                    value={editStudent.num_groupe}
                    onChange={e => setEditStudent({ ...editStudent, num_groupe: e.target.value })}
                    className={styles['ADM-ETD-select']}
                  >
                    <option value="">-- Sélectionner un groupe --</option>
                    {groupOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  s.num_groupe || 'Non assigné'
                )}
              </td>
              <td className={styles['ADM-ETD-td']}>
                {editStudent?.Matricule === s.Matricule ? (
                  <button className={styles['ADM-ETD-edit-btn']} onClick={() => handleEditStudent(s)}>
                    <FaPlus /> Sauvegarder
                  </button>
                ) : (
                  <button className={styles['ADM-ETD-edit-btn']} onClick={() => setEditStudent(s)}>
                    <FaPlus /> Modifier
                  </button>
                )}
                <button className={styles['ADM-ETD-delete-btn']} onClick={() => handleDeleteStudent(s.Matricule)}>
                  <FaTrash /> Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSection;