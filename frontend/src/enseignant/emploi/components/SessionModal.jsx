import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SessionModal = ({ session, onClose, styles }) => { // Add styles prop
  const [formData, setFormData] = useState({
    ...session,
    ID_salle: session.ID_salle || '',
    ID_section: session.ID_section || '',
    ID_module: session.ID_module || '',
    type_seance: session.type_seance || '',
    ID_groupe: session.ID_groupe || '',
    ID_specialite: session.ID_specialite || '',
  });
  const [isEditing, setIsEditing] = useState(!session.ID_seance);
  const [error, setError] = useState('');
  const [salles, setSalles] = useState([]);
  const [modules, setModules] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [sections, setSections] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSpecialites = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:8083/timetableENS/specialites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpecialites(res.data);
    } catch (err) {
      console.error('Erreur spécialités :', err);
    }
  };

  const fetchSections = async () => {
    if (!formData.ID_specialite) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:8083/timetableENS/sections?specialite_id=${formData.ID_specialite}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(res.data);
    } catch (err) {
      console.error('Erreur sections :', err);
    }
  };

  const fetchModules = async () => {
    if (!formData.ID_section) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:8083/timetableENS/modules?section_id=${formData.ID_section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModules(res.data);
    } catch (err) {
      console.error('Erreur modules :', err);
    }
  };

  const fetchGroupes = async () => {
    if (!formData.ID_section) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:8083/timetableENS/groupes?section_id=${formData.ID_section}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroupes(res.data);
    } catch (err) {
      console.error('Erreur groupes :', err);
    }
  };

  const fetchSalles = async () => {
    if (!formData.type_seance) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:8083/timetableENS/salles?type_seance=${formData.type_seance}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalles(res.data);
    } catch (err) {
      console.error('Erreur salles :', err);
    }
  };

  useEffect(() => {
    fetchSpecialites();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSections(),
      fetchModules(),
      fetchGroupes(),
      fetchSalles(),
    ]).finally(() => setLoading(false));
  }, [formData.ID_specialite, formData.ID_section, formData.type_seance]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8083/timetableENS', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onClose();
    } catch (err) {
      setError('Erreur lors de l’ajout de la séance');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8083/timetableENS/${formData.ID_seance}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onClose();
    } catch (err) {
      setError('Erreur lors de la modification de la séance');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette séance ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8083/timetableENS/${formData.ID_seance}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onClose();
      } catch (err) {
        setError('Erreur lors de la suppression de la séance');
      }
    }
  };

  if (loading) {
    return <div className={styles['ENS-EDT-modal-content']}>Chargement...</div>;
  }

  return (
    <div className={styles['ENS-EDT-modal-overlay']}>
      <div className={styles['ENS-EDT-modal-content']}>
        {formData.ID_seance && !isEditing ? (
          <div className={styles['ENS-EDT-session-details']}>
            <h3 className={styles['ENS-EDT-timetable-title']}>Détails de la séance</h3>
            <div className={styles['ENS-EDT-details-card']}>
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Type :</span>
                <span className={styles['ENS-EDT-detail-value']}>{formData.type_seance === 'Cour' ? 'Cours' : formData.type_seance}</span>
              </div>
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Module :</span>
                <span className={styles['ENS-EDT-detail-value']}>{formData.nom_module}</span>
              </div>
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Salle :</span>
                <span className={styles['ENS-EDT-detail-value']}>{formData.nom_salle}</span>
              </div>
              {(formData.type_seance === 'TP' || formData.type_seance === 'TD') && (
                <div className={styles['ENS-EDT-detail-item']}>
                  <span className={styles['ENS-EDT-detail-label']}>Groupe :</span>
                  <span className={styles['ENS-EDT-detail-value']}>{formData.num_groupe}</span>
                </div>
              )}
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Jour :</span>
                <span className={styles['ENS-EDT-detail-value']}>{formData.jour}</span>
              </div>
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Horaire :</span>
                <span className={styles['ENS-EDT-detail-value']}>{formData.time_slot}</span>
              </div>
              <div className={styles['ENS-EDT-detail-item']}>
                <span className={styles['ENS-EDT-detail-label']}>Section :</span>
                <span className={styles['ENS-EDT-detail-value']}>{`(${formData.niveau} ${formData.nom_specialite} ${formData.nom_section})`}</span>
              </div>
            </div>
            <div className={styles['ENS-EDT-detail-actions']}>
              <button className={`${styles['ENS-EDT-timetable-btn']} ${styles['ENS-EDT-edit']}`} onClick={() => setIsEditing(true)}>Modifier</button>
              <button className={`${styles['ENS-EDT-timetable-btn']} ${styles['ENS-EDT-delete']}`} onClick={handleDelete}>Supprimer</button>
              <button className={`${styles['ENS-EDT-timetable-btn']} ${styles['ENS-EDT-close-modal']}`} onClick={onClose}>Fermer</button>
            </div>
          </div>
        ) : (
          <form className={styles['ENS-EDT-session-form']} onSubmit={formData.ID_seance ? handleUpdate : handleAdd}>
            <h3 className={styles['ENS-EDT-timetable-title']}>{formData.ID_seance ? 'Modifier la séance' : 'Ajouter une séance'}</h3>
            <div className={styles['ENS-EDT-form-grid']}>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Jour</label>
                <select name="jour" value={formData.jour || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Horaire</label>
                <select name="time_slot" value={formData.time_slot || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Type</label>
                <select name="type_seance" value={formData.type_seance || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  <option value="Cour">Cours</option>
                  <option value="TD">TD</option>
                  <option value="TP">TP</option>
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Spécialité</label>
                <select name="ID_specialite" value={formData.ID_specialite || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {specialites.map(sp => (
                    <option key={sp.ID_specialite} value={sp.ID_specialite}>{sp.nom_specialite}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Section</label>
                <select name="ID_section" value={formData.ID_section || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {sections.map(sec => (
                    <option key={sec.ID_section} value={sec.ID_section}>{sec.nom_section}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Module</label>
                <select name="ID_module" value={formData.ID_module || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {modules.map(m => (
                    <option key={m.ID_module} value={m.ID_module}>{m.nom_module}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Salle</label>
                <select name="ID_salle" value={formData.ID_salle || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {salles.map(s => (
                    <option key={s.ID_salle} value={s.ID_salle}>{s.nom_salle}</option>
                  ))}
                </select>
              </div>
              <div className={styles['ENS-EDT-form-group']}>
                <label>Groupe</label>
                <select name="ID_groupe" value={formData.ID_groupe || ''} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  {groupes.map(g => (
                    <option key={g.ID_groupe} value={g.ID_groupe}>{g.num_groupe}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className={`${styles['ENS-EDT-timetable-error']} ${styles['ENS-EDT-modal-error']}`}>{error}</p>}
            <div className={styles['ENS-EDT-form-actions']}>
              <button type="submit" className={`${styles['ENS-EDT-timetable-btn']} ${styles['ENS-EDT-save']}`}>
                {formData.ID_seance ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button type="button" className={`${styles['ENS-EDT-timetable-btn']} ${styles['ENS-EDT-cancel']}`} onClick={onClose}>Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SessionModal;