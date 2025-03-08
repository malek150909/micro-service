import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Etudiant from "./etudiant";
import Enseignant from "./enseignant";
import Admin from "./admin/admin";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Feed from "./Feed";
import Annonces from "./admin/annonces";
import ListeEtudiants from "./admin/listeEtudiants";
import Evenements from "./admin/evenements";
import Plannings from "./admin/plannings";
import ConsultPage from './pages/ConsultPage';
import CreatePage from './pages/CreatePage';
import './css_files/style.css';
import GestionEvenements from "./GestionEvenements";


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
                <Route path="/feed" element={<PrivateRoute element={<Feed />} />} />
                <Route path="/annonces" element={<PrivateRoute element={<Annonces />} />} />
                <Route path="/evenements" element={<PrivateRoute element={<Evenements />} />} />
                <Route path="/listeEtudiants" element={<PrivateRoute element={<ListeEtudiants />} />} />
                <Route path="/plannings" element={<PrivateRoute element={<Plannings />} />} />
                <Route path="/consult" element={<ConsultPage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/gestionEvenements" element={<GestionEvenements />} />
            </Routes>
        </Router>
    );
}

export default App;
