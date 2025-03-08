export default function EditableScheduleTable({ data, isEditing, onExamChange, onDeleteExam }) {
    return (
      <div className="schedule-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Horaire</th>
              <th>Module</th>
              <th>Salle</th>
              {isEditing && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((exam, index) => (
              <tr key={exam.ID_exam}>
                <td>
                {isEditing ? (
                    <input
                    type="date"
                    value={exam.exam_date ? exam.exam_date.split('T')[0] : ''}
                    onChange={(e) => onExamChange(index, 'exam_date', e.target.value)}
                    />
                ) : (
                    new Date(exam.exam_date).toLocaleDateString()
                )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      value={exam.time_slot}
                      onChange={(e) => onExamChange(index, 'time_slot', e.target.value)}
                    >
                      <option value="08:00 - 09:30">08:00 - 09:30</option>
                      <option value="09:40 - 11:10">09:40 - 11:10</option>
                      <option value="11:20 - 12:50">11:20 - 12:50</option>
                      <option value="13:00 - 14:30">13:00 - 14:30</option>
                      <option value="14:40 - 16:10">14:40 - 16:10</option>
                      <option value="16:20 - 17:50">16:20 - 17:50</option>
                    </select>
                  ) : (
                    exam.time_slot
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exam.nom_module}
                      onChange={(e) => onExamChange(index, 'nom_module', e.target.value)}
                    />
                  ) : (
                    exam.nom_module
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={exam.ID_salle}
                      onChange={(e) => onExamChange(index, 'ID_salle', e.target.value)}
                    />
                  ) : (
                    exam.ID_salle
                  )}
                </td>
                {isEditing && (
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => onDeleteExam(exam.ID_exam)}
                    >
                      Supprimer
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan="4" className="no-data">
                  Aucun planning trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }