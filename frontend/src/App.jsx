import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Feed from "./feed";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/feed" element={<Feed />} />
            </Routes>
        </Router>
    );
}

export default App;
