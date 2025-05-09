import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TeacherSection from './TeacherSection';
import styles from './prof.module.css';

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [filters, setFilters] = useState({ idFaculte: '', idDepartement: '', idSpecialite: '' });
  const [newTeacher, setNewTeacher] = useState({
    nom: '',
    prenom: '',
    email: '',
    idFaculte: '',
    idDepartement: '',
    modules: [],
  });
  const [showTeachers, setShowTeachers] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    axios.get('http://users.localhost/api/facultes')
      .then(res => setFacultes(res.data))
      .catch(err => console.error('Error fetching facultes:', err));
  }, []);

  useEffect(() => {
    if (filters.idFaculte) {
      axios.get(`http://users.localhost/api/departements/${filters.idFaculte}`)
        .then(res => {
          setDepartements(res.data);
          setFilters((prev) => ({ ...prev, idDepartement: '', idSpecialite: '' }));
        })
        .catch(err => console.error('Error fetching departements:', err));
    } else {
      setDepartements([]);
      setSpecialites([]);
    }
  }, [filters.idFaculte]);

  useEffect(() => {
    if (filters.idDepartement) {
      axios.get(`http://users.localhost/api/specialites/${filters.idDepartement}`)
        .then(res => {
          setSpecialites(res.data);
          setFilters((prev) => ({ ...prev, idSpecialite: '' }));
        })
        .catch(err => console.error('Error fetching specialites:', err));
    } else {
      setSpecialites([]);
    }
  }, [filters.idDepartement]);

  const handleFilterSubmit = () => {
    if (filters.idSpecialite) {
      axios.get('http://users.localhost/api/enseignants/filtered', { params: filters })
        .then(res => {
          setTeachers(res.data);
          setShowTeachers(true);
        })
        .catch(err => {
          console.error('Error fetching teachers:', err);
          setTeachers([]);
        });
    } else {
      setTeachers([]);
      setShowTeachers(false);
    }
  };

  const handleTeacherClick = (teacher) => setSelectedTeacher(teacher);

  const handleBack = (resetList) => {
    setSelectedTeacher(null);
    if (resetList) {
      setTeachers([]);
      setShowTeachers(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://users.localhost/api/enseignants', {
        ...newTeacher,
        modules: newTeacher.modules.map(m => parseInt(m)),
      });
      setNewTeacher({ nom: '', prenom: '', email: '', idFaculte: '', idDepartement: '', modules: [] });
      setShowAddForm(false);
      handleFilterSubmit();
    } catch (err) {
      console.error('Error adding teacher:', err);
    }
  };

  return (
    <div className={styles['ADM-ENS-container']}>
      <h1 className={styles['ADM-ENS-title-with-square']}>Gestion des Enseignants</h1>
      <button
        className={styles['ADM-ENS-submit-btn']}
        onClick={() => setShowAddForm(true)}
      >
        Ajouter un nouvel enseignant
      </button>
      {selectedTeacher ? (
        <TeacherSection teacher={selectedTeacher} onBack={handleBack} />
      ) : (
        <>
          {showAddForm && (
            <form onSubmit={handleAddTeacher} className={styles['ADM-ENS-section-card']}>
              <input
                type="text"
                placeholder="Nom"
                value={newTeacher.nom}
                onChange={(e) => setNewTeacher({ ...newTeacher, nom: e.target.value })}
                required
                className={styles['ADM-ENS-input']}
              />
              <input
                type="text"
                placeholder="Prénom"
                value={newTeacher.prenom}
                onChange={(e) => setNewTeacher({ ...newTeacher, prenom: e.target.value })}
                required
                className={styles['ADM-ENS-input']}
              />
              <input
                type="email"
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                required
                className={styles['ADM-ENS-input']}
              />
              <select
                value={newTeacher.idFaculte}
                onChange={(e) => setNewTeacher({ ...newTeacher, idFaculte: e.target.value })}
                required
                className={styles['ADM-ENS-select']}
              >
                <option value="">Sélectionner une faculté</option>
                {facultes.map((f) => (
                  <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
                ))}
              </select>
              <select
                value={newTeacher.idDepartement}
                onChange={(e) => setNewTeacher({ ...newTeacher, idDepartement: e.target.value })}
                disabled={!newTeacher.idFaculte}
                required
                className={styles['ADM-ENS-select']}
              >
                <option value="">Sélectionner un département</option>
                {departements.map((d) => (
                  <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
                ))}
              </select>
              <select
                multiple
                value={newTeacher.modules}
                onChange={(e) => setNewTeacher({ ...newTeacher, modules: Array.from(e.target.selectedOptions, option => option.value) })}
                disabled={!newTeacher.idDepartement}
                className={styles['ADM-ENS-select']}
              >
                {specialites.map((s) => (
                  <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>
                ))}
              </select>
              <div className={styles['ADM-ENS-button-group']}>
                <button
                  type="submit"
                  className={styles['ADM-ENS-submit-btn']}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className={styles['ADM-ENS-back-btn']}
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
          <div className={styles['ADM-ENS-filters']}>
            <select
              name="idFaculte"
              value={filters.idFaculte}
              onChange={(e) => setFilters({ ...filters, idFaculte: e.target.value })}
              className={styles['ADM-ENS-select']}
            >
              <option value="">Sélectionner une faculté</option>
              {facultes.map((f) => (
                <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
              ))}
            </select>
            <select
              name="idDepartement"
              value={filters.idDepartement}
              onChange={(e) => setFilters({ ...filters, idDepartement: e.target.value })}
              disabled={!filters.idFaculte}
              className={styles['ADM-ENS-select']}
            >
              <option value="">Sélectionner un département</option>
              {departements.map((d) => (
                <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
              ))}
            </select>
            <select
              name="idSpecialite"
              value={filters.idSpecialite}
              onChange={(e) => setFilters({ ...filters, idSpecialite: e.target.value })}
              disabled={!filters.idDepartement}
              className={styles['ADM-ENS-select']}
            >
              <option value="">Sélectionner une spécialité</option>
              {specialites.map((s) => (
                <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>
              ))}
            </select>
            <button
              onClick={handleFilterSubmit}
              className={styles['ADM-ENS-submit-btn']}
            >
              Filtrer
            </button>
          </div>
          {showTeachers && (
            <div className={styles['ADM-ENS-teachers-list']}>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <div
                    key={teacher.Matricule}
                    className={styles['ADM-ENS-teacher-card']}
                    onClick={() => handleTeacherClick(teacher)}
                  >
                    {teacher.nom} {teacher.prenom}
                  </div>
                ))
              ) : (
                <p className={styles['ADM-ENS-empty-list-message']}>Aucun enseignant trouvé.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherList;