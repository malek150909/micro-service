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
import ModifieProfilAdmin from "./main/modifierProfilAdmin";
import EmploiDuTemps from "./admin/emploi/pages/TimetablePage";
import MessagesAdmin from "./main/messagesAdmin";
import ModifieProfilEnseignant from "./main/modifierProfilEnseignant";
import MessagesEnseignant from "./main/messagesEnseignant";
import ModifierProfilEtudiant from "./main/modifierProfilEtudiant";
import MessagesEtudiant from "./main/messagesEtudiant";
import Ressources from "./enseignant/ressources/pages/Home";
import Notes from "./enseignant/notes/pages/ProfessorHome";
import GestionNotes from "./enseignant/notes/pages/GestionEnseignants";
import AnnoncesENS from "./enseignant/annonces/annonceENS";
import DocsAdmin from "./admin/docs/AdminDashboard";
import DocsEtudiant from "./etudiant/docs/StudentDashboard";
import AnnoncesETD from "./etudiant/annonce/AnnonceEtudiant";
import ClubsETD from "./etudiant/club/EtudiantDashboard";
import ClubsADM from "./admin/club/ClubAdmin";
import ENSemploi from "./enseignant/emploi/components/Timetable";
import ETDemploi from "./etudiant/emploi/StudentTimetableFeed";
import GestionEnseignants from "./enseignant/notes/pages/GestionEnseignants";
import ProfessorReclamations from "./enseignant/notes/pages/ProfessorReclamations";
import StudentGrades from "./etudiant/notes/pages/StudentGrades";
import StudentHome from "./etudiant/notes/pages/StudentHome";
import ENSlistetudiant from "./enseignant/listetudiant/TeacherDashboard";

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
                <Route path="/modifierProfilAdmin" element={<ModifieProfilAdmin />} />
                <Route path="/emploidutemps" element={<EmploiDuTemps />} />
                <Route path="/messagesAdmin" element={<MessagesAdmin />} />
                <Route path="/modifierProfilEnseignant" element={<ModifieProfilEnseignant />} />
                <Route path="/messagesEnseignant" element={<MessagesEnseignant />} />
                <Route path="/modifierProfilEtudiant" element={<ModifierProfilEtudiant />} />
                <Route path="/messagesEtudiant" element={<MessagesEtudiant />} />
                <Route path="/ressources" element={<Ressources />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/gestionNotes" element={<GestionNotes />} />
                <Route path="/annoncesENS" element={<AnnoncesENS />} />
                <Route path="/docsAdmin" element={<DocsAdmin />} />
                <Route path="/docsEtudiant" element={<DocsEtudiant />} />
                <Route path="/annoncesETD" element={<AnnoncesETD />} />
                <Route path="/clubsETD" element={<ClubsETD />} />
                <Route path="/clubsADM" element={<ClubsADM />} />
                <Route path="/ENSemploi" element={<ENSemploi />} />
                <Route path="/ETDemploi" element={<ETDemploi />} />
                <Route path="/GESENS" element={<GestionEnseignants />} />
                <Route path="/PROFREC" element={<ProfessorReclamations />} />
                <Route path="/ETDGRD" element={<StudentGrades />} />
                <Route path="/ETD" element={<StudentHome />} />
                <Route path="/ENSlistetudiant" element={<ENSlistetudiant />} />
            </Routes>
        </Router>
    );
}

export default App;