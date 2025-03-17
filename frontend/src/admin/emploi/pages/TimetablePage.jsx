import { useState } from 'react';
import TimetableFilter from '../components/TimetableFilter';
import TimetableDisplay from '../components/TimetableDisplay';
import '../../../admin_css_files/EmploiDuTemps.css';

function TimetablePage() {
  const [timetableData, setTimetableData] = useState(null);

  const handleTimetableFetch = (data) => {
    setTimetableData(data);
  };

  return (
    <div className="timetable-page">
      <TimetableFilter onFetch={handleTimetableFetch} />
      <TimetableDisplay timetable={timetableData} />
    </div>
  );
}

export default TimetablePage;