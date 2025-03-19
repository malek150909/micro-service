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
import TeacherSection from "./admin/enseignant/listenseignant";
import StudentSection from "./admin/etudiant/listetudiant";
import ModifieProfilAdmin from "./main/modifierProfilAdmin";
import EmploiDuTemps from "./admin/emploi/pages/TimetablePage";
import MessagesAdmin from "./main/messagesAdmin";
import ModifieProfilEnseignant from "./main/modifierProfilEnseignant";
import MessagesEnseignant from "./main/messagesEnseignant";
import ModifierProfilEtudiant from "./main/modifierProfilEtudiant";
import MessagesEtudiant from "./main/messagesEtudiant";


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
                <Route path="/enseignants" element={<TeacherSection />} />
                <Route path="/etudiants" element={<StudentSection />} />
                <Route path="/modifierProfilAdmin" element={<ModifieProfilAdmin />} />
                <Route path="/emploidutemps" element={<EmploiDuTemps />} />
                <Route path="/messagesAdmin" element={<MessagesAdmin />} />
                <Route path="/modifierProfilEnseignant" element={<ModifieProfilEnseignant />} />
                <Route path="/messagesEnseignant" element={<MessagesEnseignant />} />
                <Route path="/modifierProfilEtudiant" element={<ModifierProfilEtudiant />} />
                <Route path="/messagesEtudiant" element={<MessagesEtudiant />} />
            </Routes>
        </Router>
    );
}

export default App;