import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './prof.module.css';

const FilterPanel = ({ onFilter, onReset }) => {
    const [facultes, setFacultes] = useState([]);
    const [filters, setFilters] = useState({
        idFaculte: ''
    });

    useEffect(() => {
        axios.get('http://users.localhost/api/facultes')
            .then(res => setFacultes(res.data || []))
            .catch(err => {
                toast.error('Erreur lors de la récupération des facultés: ' + err.message, { autoClose: 3000 });
                setFacultes([]);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilter = () => {
        if (!filters.idFaculte) {
            toast.error('Veuillez sélectionner une faculté.', { autoClose: 3000 });
            return;
        }

        axios.get('http://users.localhost/api/enseignants', {
            params: {
                idFaculte: filters.idFaculte || undefined
            }
        })
            .then(res => onFilter(res.data || []))
            .catch(err => {
                toast.error('Erreur lors du filtrage des enseignants: ' + err.message, { autoClose: 3000 });
                onFilter([]);
            });
    };

    const handleReset = () => {
        setFilters({
            idFaculte: ''
        });
        onReset();
    };

    return (
        <div className={styles['ADM-ENS-filter-panel-container']}>
            <h2>Filtrer les enseignants</h2>
            <select name="idFaculte" value={filters.idFaculte} onChange={handleChange}>
                <option value="">Sélectionner une faculté</option>
                {facultes.map(f => (
                    <option key={f.ID_faculte} value={f.ID_faculte}>
                        {f.nom_faculte}
                    </option>
                ))}
            </select>
            <div className={styles['ADM-ENS-button-group']}>
                <button onClick={handleFilter} className={styles['ADM-ENS-submit-btn']}>Filtrer</button>
                <button onClick={handleReset} className={styles['ADM-ENS-reset-btn']}>Réinitialiser</button>
            </div>
            <ToastContainer className={styles['ADM-ENS-Toastify__toast']} />
        </div>
    );
};

export default FilterPanel;