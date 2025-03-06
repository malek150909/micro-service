import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Etudiant from "./etudiant";
import Enseignant from "./enseignant";
import Admin from "./admin";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Feed from "./Feed";
import Annonces from "./annonces";
import Demades from "./demandes";
import Evenements from "./evenements";
import Plannings from "./plannings";


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
                <Route path="/demandes" element={<PrivateRoute element={<Demades />} />} />
                <Route path="/evenements" element={<PrivateRoute element={<Evenements />} />} />
                <Route path="/plannings" element={<PrivateRoute element={<Plannings />} />} />
            </Routes>
        </Router>
    );
}

export default App;
