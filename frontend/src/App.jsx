import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Etudiant from "./etudiant";
import Enseignant from "./enseignant";
import Admin from "./admin";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import Feed from "./Feed";


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
            </Routes>
        </Router>
    );
}

export default App;
