import React from 'react';
import { motion } from 'framer-motion';
import ExamModal from './ExamModal';

const ExamList = ({ exams, onDelete, onUpdate, salles, semestres }) => {
  const [selectedExam, setSelectedExam] = React.useState(null);

  const formatDate = (dateStr) => {
    // Since dateStr is already in YYYY-MM-DD format, just reformat it to DD/MM/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleRowClick = (exam) => {
    setSelectedExam(exam);
  };

  return (
    <motion.div
      className="exam-list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Liste des Examens</h3>
      <table className="exam-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Horaire</th>
            <th>Module</th>
            <th>Salle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => (
            <tr key={exam.ID_exam} onClick={() => handleRowClick(exam)} style={{ cursor: 'pointer' }}>
              <td>{formatDate(exam.exam_date)}</td>
              <td>{exam.time_slot}</td>
              <td>{exam.nom_module}</td>
              <td>{exam.ID_salle}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); setSelectedExam(exam); }}>Modifier</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(exam.ID_exam); }}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedExam && (
        <ExamModal
          exam={selectedExam}
          onClose={() => setSelectedExam(null)}
          onSave={(updatedExam) => {
            onUpdate(selectedExam.ID_exam, updatedExam);
            setSelectedExam(null);
          }}
          modules={exams.map((e) => ({ ID_module: e.ID_module, nom_module: e.nom_module }))}
          salles={salles}
          semestres={semestres}
        />
      )}
    </motion.div>
  );
};

export default ExamList;