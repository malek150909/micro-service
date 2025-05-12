import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./main/login";
import Etudiant from "./main/etudiant";
import Enseignant from "./main/enseignant";
import Admin from "./main/admin";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Annonces from "./admin/annonce/annonces";
import GestionEvenements from "./admin/evenement/GestionEvenements";
import Modules from "./admin/module/pages/Home";
import ExamPlanning from "./admin/planning/pages/ExamPlanning";
import ListEnseignants from "./admin/enseignant/ListEnseignant";
import StudentSection from "./admin/etudiant/listetudiant";
import ModifieProfil from "./main/modifierProfil";
import EmploiDuTemps from "./admin/emploi/pages/TimetablePage";
import Messagerie from "./main/Messages";
import Ressources from "./enseignant/ressources/pages/Home";
import GestionEnseignants from "./enseignant/moyennes/pages/GestionEnseignant";
import AnnoncesENS from "./enseignant/annonces/annonceENS";
import DocsAdmin from "./admin/docs/AdminDashboard";
import DocsEtudiant from "./etudiant/docs/StudentDashboard";
import AnnoncesETD from "./etudiant/annonce/AnnonceEtudiant";
import ClubsETD from "./etudiant/club/EtudiantDashboard";
import ClubsADM from "./admin/club/ClubAdmin";
import ENSemploi from "./enseignant/emploi/components/Timetable";
import ETDemploi from "./etudiant/emploi/StudentTimetableFeed";
import StudentGrades from "./etudiant/moyennes/pages/StudentGrades";
import ENSlistetudiant from "./enseignant/listetudiant/TeacherDashboard";
import ETDressources from "./etudiant/ressource/StudentDashboard";
import ETDNotesFeed from "./etudiant/note/ETDnotes";
import ENSNotesFeed from "./enseignant/note/ENSnotes";
import SeanceSupp from "./enseignant/seance_supp/pages/seance_supp";
import StudentPlanning from "./etudiant/planning/StudentPlanning";
import ETDCalendar from "./etudiant/calendrier/ETDCalendar";
import ENSCalendar from "./enseignant/calendrier/ENSCalendar";

const PrivateRoute = ({ element }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? element : <Navigate to="/" />;
};

PrivateRoute.propTypes = {
    element: PropTypes.node.isRequired,
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/etudiant" element={<PrivateRoute element={<Etudiant />} />} />
                <Route path="/enseignant" element={<PrivateRoute element={<Enseignant />} />} />
                <Route path="/admin" element={<PrivateRoute element={<Admin />} />} />
                <Route path="/annonces" element={<PrivateRoute element={<Annonces />} />} />
                <Route path="/gestionEvenements" element={<GestionEvenements />} />
                <Route path="/modules" element={<Modules />} />
                <Route path="/consult" element={<ExamPlanning />} />
                <Route path="/enseignants" element={<ListEnseignants />} />
                <Route path="/etudiants" element={<StudentSection />} />
                <Route path="/modifierProfil" element={<ModifieProfil />} />
                <Route path="/emploidutemps" element={<EmploiDuTemps />} />
                <Route path="/notes" element={<GestionEnseignants />} />
                <Route path="/messagerie" element={<Messagerie />} />
                <Route path="/ressources" element={<Ressources />} />
                <Route path="/annoncesENS" element={<AnnoncesENS />} />
                <Route path="/docsAdmin" element={<DocsAdmin />} />
                <Route path="/docsEtudiant" element={<DocsEtudiant />} />
                <Route path="/annoncesETD" element={<AnnoncesETD />} />
                <Route path="/clubsETD" element={<ClubsETD />} />
                <Route path="/clubsADM" element={<ClubsADM />} />
                <Route path="/ENSemploi" element={<ENSemploi />} />
                <Route path="/ETDemploi" element={<ETDemploi />} />
                <Route path="/ETDGRD" element={<StudentGrades />} />
                <Route path="/ENSlistetudiant" element={<ENSlistetudiant />} />
                <Route path="/ETDressources" element={<ETDressources />} />
                <Route path="/ETDnotesFeed" element={<ETDNotesFeed />} />
                <Route path="/ENSnotesFeed" element={<ENSNotesFeed />} />
                <Route path="/seanceSupp" element={<SeanceSupp />} />
                <Route path="/studentPlanning" element={<StudentPlanning />} />
                <Route path="/ETDcalendar" element={<ETDCalendar />} />
                <Route path="/ENScalendar" element={<ENSCalendar />} />
            </Routes>
        </Router>
    );
}

export default App;