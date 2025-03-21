import { useState, useEffect } from 'react';
import axios from 'axios';

const FilterPanel = ({ onFilter }) => {
    const [filters, setFilters] = useState({ idFaculte: '', idDepartement: '' });
    const [facultes, setFacultes] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:8081/api/filters')
            .then(res => {
                setFacultes(res.data.facultes || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Impossible de charger les données');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (filters.idFaculte) {
            axios.get(`http://localhost:8081/api/departements/${filters.idFaculte}`)
                .then(res => {
                    setDepartements(res.data || []);
                })
                .catch(err => {
                    setError('Impossible de charger les départements');
                });
        }
    }, [filters.idFaculte]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilter = () => {
        if (!filters.idFaculte || !filters.idDepartement) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        axios.post('http://localhost:8081/api/enseignants/filtrer', filters)
            .then(res => {
                onFilter(res.data);
            })
            .catch(err => {
                alert('Erreur lors du filtrage');
            });
    };

    if (loading) return <div>Chargement des données...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div id="profs">
        <div className="filter-panel">
            <h2>Panneau de filtrage</h2>
            <select name="idFaculte" value={filters.idFaculte} onChange={handleChange}>
                <option value="">Sélectionner une faculté</option>
                {facultes.map(f => (
                    <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
                ))}
            </select>
            <select name="idDepartement" value={filters.idDepartement} onChange={handleChange}>
                <option value="">Sélectionner un département</option>
                {departements.map(d => (
                    <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
                ))}
            </select>
            <button onClick={handleFilter}>Filtrer</button>
        </div>
        </div>
    );
};

export default FilterPanel;