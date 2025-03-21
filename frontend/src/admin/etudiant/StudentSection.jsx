import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaUpload, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

const StudentSection = ({ sectionId, onBack, niveau, idSpecialite }) => {
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
    nomSpecialite: ''
  });
  const [editStudent, setEditStudent] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [importDetails, setImportDetails] = useState(null); // État pour stocker les détails de l'importation

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:8081/apii/sections/${sectionId}/etudiants`);
      setStudents(res.data);
    } catch (err) {
      toast.error('Impossible de charger la liste des étudiants. Veuillez réessayer.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  const fetchNomSpecialite = async () => {
    if (!idSpecialite) return;
    try {
      const res = await axios.get(`http://localhost:8081/apii/specialites/${idSpecialite}`);
      setNomSpecialite(res.data.nom_specialite || '');
      setNewStudent(prev => ({ ...prev, nomSpecialite: res.data.nom_specialite || '' }));
    } catch (err) {
      toast.error('Erreur lors du chargement de la spécialité. Veuillez réessayer.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  useEffect(() => {
    if (sectionId) fetchStudents();
    if (idSpecialite) fetchNomSpecialite();
  }, [sectionId, idSpecialite]);

  const handleAddStudent = async () => {
    if (!newStudent.matricule || !newStudent.nom || !newStudent.prenom || !newStudent.email || !newStudent.anneeInscription || !newStudent.nomSpecialite) {
      toast.error('Veuillez remplir tous les champs obligatoires (sauf état).', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
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
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
      return;
    }

    try {
      const res = await axios.post(`http://localhost:8081/apii/sections/${sectionId}/etudiants`, newStudent);
      if (res.status === 200 || res.status === 201) {
        await fetchStudents(); // Rafraîchir la liste
        toast.success('Étudiant ajouté avec succès !', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
          icon: '✅',
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
          nomSpecialite: nomSpecialite
        });
        setShowAddStudentForm(false); // Masquer le formulaire après ajout
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Une erreur s’est produite. Veuillez réessayer.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  const handleEditStudent = async (student) => {
    if (!editStudent) return;

    try {
      const res = await axios.put(`http://localhost:8081/apii/etudiants/${student.Matricule}`, editStudent);
      if (res.status === 200) {
        await fetchStudents();
        toast.success('Étudiant modifié avec succès !', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
          icon: '✅',
        });
        setEditStudent(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Une erreur s’est produite. Veuillez réessayer.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
    }
  };

  const handleDeleteStudent = async (matricule) => {
    const result = await Swal.fire({
      title: 'Confirmer la suppression ?',
      text: 'Vous êtes sur le point de supprimer cet étudiant. Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f0932b',
      background: '#fff',
      color: '#333',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`http://localhost:8081/apii/etudiants/${matricule}`);
        if (res.status === 200) {
          await fetchStudents();
          toast.success('Étudiant supprimé avec succès !', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
            icon: '✅',
          });
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite. Veuillez réessayer.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
          icon: '❌',
        });
      }
    }
  };

  const handleDeleteSection = async () => {
    const result = await Swal.fire({
      title: 'Confirmer la suppression ?',
      text: `Êtes-vous sûr de vouloir supprimer la Section ${sectionId} ? Cette action est irréversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f0932b',
      background: '#fff',
      color: '#333',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8081/apii/sections/${sectionId}`);
        onBack();
        toast.success('Section supprimée avec succès !', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#28a745', color: '#ffffff', fontSize: '16px' },
          icon: '✅',
        });
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite. Veuillez réessayer.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
          icon: '❌',
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
        style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
        icon: '❌',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    axios
      .post(`http://localhost:8081/apii/sections/${sectionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(res => {
        const toastType = res.data.importedCount > 0 ? toast.success : toast.info;
        toastType(res.data.message, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: {
            backgroundColor: res.data.importedCount > 0 ? '#28a745' : '#ff9800',
            color: '#ffffff',
            fontSize: '16px',
          },
          icon: res.data.importedCount > 0 ? '✅' : 'ℹ️',
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
        const errorMessage = err.response?.data?.error || 'Une erreur s’est produite lors de l’importation. Vérifiez le fichier et réessayez.';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          style: { backgroundColor: '#ff4444', color: '#ffffff', fontSize: '16px' },
          icon: '❌',
        });
      });
  };

  // Fonction pour fermer les détails de l'importation
  const handleCloseImportDetails = () => {
    setImportDetails(null); // Réinitialiser l'état pour masquer les détails
  };

  return (
    <div id="listetudiants">
    <div className="student-section">
      <button className="back-btn" onClick={onBack}>
        <FaArrowLeft /> Retour
      </button>
      <h2>Liste des étudiants</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Importer via Excel <FaUpload style={{ verticalAlign: 'middle', color: '#1565c0' }} /></h3>
        <div className="upload-section" style={{ marginBottom: '20px' }}>
          <input type="file" accept=".xlsx, .xls" onChange={handleUpload} />
        </div>

        {/* Afficher les détails de l'importation */}
        {importDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              marginBottom: '20px',
              padding: '10px',
              border: '1px solid #b3d4fc',
              borderRadius: '5px',
              backgroundColor: '#f0faff',
            }}
          >
            <h4 style={{ color: '#1a3c6d' }}>Résultat de l'importation :</h4>
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
                      {student.nom} {student.prenom} (Matricule: {student.matricule})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Bouton Fermer */}
            <button
              className="back-btn"
              onClick={handleCloseImportDetails}
              style={{ marginTop: '15px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            >
              Fermer
            </button>
          </motion.div>
        )}

        <h3>Gestion des étudiants</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className="edit-btn" onClick={() => setShowAddStudentForm(true)}>
            <FaPlus /> Ajouter un étudiant
          </button>
          <button className="delete-section-btn" onClick={handleDeleteSection}>
            <FaTrash /> Supprimer la section
          </button>
        </div>

        <AnimatePresence>
          {showAddStudentForm && (
            <motion.div
              className="add-student-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h4>Ajouter un étudiant <FaPlus style={{ verticalAlign: 'middle', color: '#5e35b1' }} /></h4>
              <input placeholder="Matricule" value={newStudent.matricule} onChange={e => setNewStudent({ ...newStudent, matricule: e.target.value })} />
              <input placeholder="Nom" value={newStudent.nom} onChange={e => setNewStudent({ ...newStudent, nom: e.target.value })} />
              <input placeholder="Prénom" value={newStudent.prenom} onChange={e => setNewStudent({ ...newStudent, prenom: e.target.value })} />
              <input placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
              <input placeholder="Niveau" value={newStudent.niveau} readOnly />
              <select value={newStudent.etat} onChange={e => setNewStudent({ ...newStudent, etat: e.target.value })}>
                <option value="">-- Aucun état --</option>
                {['Ajourné', 'Admis', 'Admis avec dettes', 'Réintégré'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <input type="date" placeholder="Année d'inscription" value={newStudent.anneeInscription} onChange={e => setNewStudent({ ...newStudent, anneeInscription: e.target.value })} />
              <input placeholder="Spécialité" value={newStudent.nomSpecialite} readOnly />
              <button onClick={handleAddStudent} className="edit-btn">
                <FaPlus /> Ajouter
              </button>
              <button onClick={() => setShowAddStudentForm(false)} style={{ marginLeft: '10px' }} className="back-btn">
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <table>
        <thead>
          <tr>
            <th>Matricule</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Niveau</th><th>État</th><th>Année</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.Matricule}>
              <td>{s.Matricule}</td>
              <td>{editStudent?.Matricule === s.Matricule ? <input value={editStudent.nom} onChange={e => setEditStudent({ ...editStudent, nom: e.target.value })} /> : s.nom}</td>
              <td>{editStudent?.Matricule === s.Matricule ? <input value={editStudent.prenom} onChange={e => setEditStudent({ ...editStudent, prenom: e.target.value })} /> : s.prenom}</td>
              <td>{editStudent?.Matricule === s.Matricule ? <input value={editStudent.email} onChange={e => setEditStudent({ ...editStudent, email: e.target.value })} /> : s.email}</td>
              <td>{editStudent?.Matricule === s.Matricule ? <input value={editStudent.niveau} onChange={e => setEditStudent({ ...editStudent, niveau: e.target.value })} /> : s.niveau}</td>
              <td>{editStudent?.Matricule === s.Matricule ? (
                <select value={editStudent.etat} onChange={e => setEditStudent({ ...editStudent, etat: e.target.value })}>
                  <option value="">-- Aucun état --</option>
                  {['Ajourné', 'Admis', 'Admis avec dettes', 'Réintégré'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              ) : s.etat || 'Non défini'}</td>
              <td>{s.annee_inscription || 'Non défini'}</td>
              <td>
                {editStudent?.Matricule === s.Matricule ? (
                  <button className="edit-btn" onClick={() => handleEditStudent(s)}>
                    <FaPlus /> Sauvegarder
                  </button>
                ) : (
                  <button className="edit-btn" onClick={() => setEditStudent(s)}>
                    <FaPlus /> Modifier
                  </button>
                )}
                <button className="delete-btn" onClick={() => handleDeleteStudent(s.Matricule)}>
                  <FaTrash /> Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default StudentSection;