import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import "../admin_css_files/LoginPage.css";

const Login = () => {
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8081/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("matricule", data.user.Matricule);

        if (data.user.role === "admin") navigate("/admin");
        else if (data.user.role === "enseignant") navigate("/enseignant");
        else if (data.user.role === "etudiant") navigate("/etudiant");
        else {
          console.error("Erreur : Votre rôle n'est pas reconnu.");
        }
      } else {
        console.error(data.error || "Erreur : Matricule ou mot de passe incorrect.");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div id="logins">
      <div className="LOG-l-container">
        {/* Image de fond avec overlay */}
        <div className="LOG-background-section">
          <div className="LOG-overlay"></div>
        </div>

        {/* SVG pour la découpe en S avec dégradé (inversé) */}
        <svg className="LOG-wave-divider" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#5483b3", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path fill="url(#gradient)" d="M0,0 L50,0 C40,20 60,40 50,60 C40,80 60,100 50,100 L0,100 Z" />
        </svg>

        {/* Section du formulaire (déplacée à gauche) */}
        <div className="LOG-form-section">
          <div className="LOG-login-container">
            <img src="/usthb-logo.png" alt="USTHB Logo" className="LOG-logo" />
            <h2>USTHB</h2>
            <p>Votre Portail Universitaire</p>
            <form onSubmit={handleSubmit}>
              <div className="LOG-input-group">
                <FaUser className="LOG-input-icon" />
                <input
                  type="text"
                  className="LOG-login-input"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  required
                  placeholder="Entrez votre matricule"
                />
              </div>
              <div className="LOG-input-group">
                <FaLock className="LOG-input-icon" />
                <input
                  type="password"
                  className="LOG-login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Entrez votre mot de passe"
                />
              </div>
              <button type="submit" className="LOG-login-btn">
                Connexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;