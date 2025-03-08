export default function ScheduleTable({ data }) {
    const timeSlots = [
      '08:00 - 09:30',
      '09:40 - 11:10',
      '11:20 - 12:50',
      '13:00 - 14:30',
      '14:40 - 16:10',
      '16:20 - 17:50'
    ];
  
    return (
      <div className="schedule-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Horaire</th>
              <th>Module</th>
              <th>Salle</th>
            </tr>
          </thead>
          <tbody>
            {data.map((exam) => (
              <tr key={exam.ID_exam}>
                <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                <td>{exam.time_slot}</td>
                <td>{exam.nom_module}</td>
                <td>{exam.ID_salle}</td>
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