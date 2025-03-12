import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./main/login";
import Etudiant from "./main/etudiant";
import Enseignant from "./main/enseignant";
import Admin from "./main/admin";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Annonces from "./admin/annonce/annonces";
import ListeEtudiants from "./admin/etudiant/listeEtudiants";
import GestionEvenements from "./admin/evenement/GestionEvenements";
import Modules from "./admin/module/pages/Home";
import ExamPlanning from "./admin/planning/pages/ExamPlanning";


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
                <Route path="/listeEtudiants" element={<PrivateRoute element={<ListeEtudiants />} />} />
                <Route path="/gestionEvenements" element={<GestionEvenements />} />
                <Route path="/modules" element={<Modules />} />
                <Route path="/consult" element={<ExamPlanning />} />
            </Routes>
        </Router>
    );
}

export default App;
