import React,{ useState } from 'react';
import TimetableFilter from '../components/TimetableFilter';
import styles from '../ADM_EDT.module.css';

function TimetablePage() {
  const [timetableData, setTimetableData] = useState(null);

  const handleTimetableFetch = (data) => {
    setTimetableData(data);
  };

  return (
    <div className={styles['ADM-EDT-timetable-page']}>
      <TimetableFilter onFetch={handleTimetableFetch} />
    </div>
  );
}

export default TimetablePage;