import { useState, useEffect } from 'react';
import axios from 'axios';
import TeacherSection from './TeacherSection'; // Adjust the import path as needed
import '../../admin_css_files/prof.css';

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [facultes, setFacultes] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [specialites, setSpecialites] = useState([]);
    const [filters, setFilters] = useState({ idFaculte: '', idDepartement: '', idSpecialite: '' });
    const [showTeachers, setShowTeachers] = useState(false); // Controls whether to display the teacher list

    // Fetch all facultes on mount
    useEffect(() => {
        axios.get('http://localhost:8081/api/facultes')
            .then(res => {
                setFacultes(res.data);
            })
            .catch(err => {
                console.error('Error fetching facultes:', err);
            });
    }, []);

    // Fetch departments when faculty is selected
    useEffect(() => {
        if (filters.idFaculte) {
            axios.get(`http://localhost:8081/api/departements/${filters.idFaculte}`)
                .then(res => {
                    setDepartements(res.data);
                    setFilters(prev => ({ ...prev, idDepartement: '', idSpecialite: '' })); // Reset dependent filters
                })
                .catch(err => {
                    console.error('Error fetching departements:', err);
                });
        } else {
            setDepartements([]);
            setSpecialites([]);
            setFilters(prev => ({ ...prev, idDepartement: '', idSpecialite: '' }));
        }
    }, [filters.idFaculte]);

    // Fetch specialites when department is selected
    useEffect(() => {
        if (filters.idDepartement) {
            axios.get(`http://localhost:8081/api/specialites/${filters.idDepartement}`)
                .then(res => {
                    setSpecialites(res.data);
                    setFilters(prev => ({ ...prev, idSpecialite: '' })); // Reset dependent filter
                })
                .catch(err => {
                    console.error('Error fetching specialites:', err);
                });
        } else {
            setSpecialites([]);
            setFilters(prev => ({ ...prev, idSpecialite: '' }));
        }
    }, [filters.idDepartement]);

    // Fetch teachers when filters are applied
    const handleFilterSubmit = () => {
        if (filters.idSpecialite) {
            axios.get('http://localhost:8081/api/enseignants/filtered', {
                params: {
                    idFaculte: filters.idFaculte,
                    idDepartement: filters.idDepartement,
                    idSpecialite: filters.idSpecialite
                }
            })
                .then(res => {
                    setTeachers(res.data);
                    setShowTeachers(true); // Show the teacher list after filtering
                })
                .catch(err => {
                    console.error('Error fetching teachers:', err);
                    setTeachers([]); // Clear teachers on error
                });
        } else {
            setTeachers([]); // Clear teachers if no specialty selected
            setShowTeachers(false);
        }
    };

    // Handle teacher selection to view details
    const handleTeacherClick = (teacher) => {
        setSelectedTeacher(teacher);
    };

    // Handle return from TeacherSection
    const handleBack = (resetList) => {
        setSelectedTeacher(null);
        if (resetList) {
            setTeachers([]); // Clear the teacher list
            setShowTeachers(false); // Hide the teacher list
        }
    };

    return (
        <div>
            <h2>Liste des enseignants</h2>

            {selectedTeacher ? (
                <TeacherSection teacher={selectedTeacher} onBack={handleBack} />
            ) : (
                <div>
                    <h3>Filtres</h3>
                    <div className="filters-container">
                        <select
                            name="idFaculte"
                            value={filters.idFaculte}
                            onChange={(e) => setFilters({ ...filters, idFaculte: e.target.value })}
                            className="filter-select"
                        >
                            <option value="">Sélectionner une faculté</option>
                            {facultes.map(f => (
                                <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
                            ))}
                        </select>

                        <select
                            name="idDepartement"
                            value={filters.idDepartement}
                            onChange={(e) => setFilters({ ...filters, idDepartement: e.target.value })}
                            className="filter-select"
                            disabled={!filters.idFaculte}
                        >
                            <option value="">Sélectionner un département</option>
                            {departements.map(d => (
                                <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
                            ))}
                        </select>

                        <select
                            name="idSpecialite"
                            value={filters.idSpecialite}
                            onChange={(e) => setFilters({ ...filters, idSpecialite: e.target.value })}
                            className="filter-select"
                            disabled={!filters.idDepartement}
                        >
                            <option value="">Sélectionner une spécialité</option>
                            {specialites.map(s => (
                                <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>
                            ))}
                        </select>

                        <button onClick={handleFilterSubmit} className="filter-button">
                            Filtrer
                        </button>
                    </div>

                    {showTeachers && (
                        <div>
                            <h3>Enseignants</h3>
                            {teachers.length > 0 ? (
                                <ul className="teachers-list">
                                    {teachers.map(teacher => (
                                        <li key={teacher.Matricule} onClick={() => handleTeacherClick(teacher)} className="teacher-item">
                                            {teacher.nom} {teacher.prenom}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Aucun enseignant trouvé.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherList;