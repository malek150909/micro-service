import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../admin_css_files/LoginPage.css';

const Login = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // Ajout d'un état pour le type de message
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch("http://localhost:8081/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matricule, password })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Connexion réussie ! ");
                setMessageType("success");
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);
                localStorage.setItem("matricule", data.user.Matricule);

                setTimeout(() => {
                    if (data.user.role === "admin") navigate("/admin");
                    else if (data.user.role === "enseignant") navigate("/enseignant");
                    else if (data.user.role === "etudiant") navigate("/etudiant");
                    else {
                        setMessage("Erreur : Votre rôle n'est pas reconnu.");
                        setMessageType("error");
                    }
                }, 1000);
            } else {
                setMessage(data.error || "Erreur : Matricule ou mot de passe incorrect.");
                setMessageType("error");
            }
        } catch (error) {
            setMessage("Erreur : Impossible de se connecter au serveur.");
            setMessageType("error");
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="logins">
        <div className="l-container">
            <div className="animated-background"></div>
            <div className="login-container">
                <img src="/usthb-logo.png" alt="USTHB Logo" className="w-20 h-20 mb-6 mx-auto" />
                <h2>Bienvenue</h2>
                <p>Votre portail universitaire simplifié.</p>
                <form onSubmit={handleSubmit}>
                    {message && (
                        <div className={`message ${messageType}`}>
                            {messageType === "success" ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            <span>{message}</span>
                        </div>
                    )}
                    <div className="mb-4">
                        <label>Matricule</label>
                        <input
                            type="text"
                            className="login-input"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            required
                            placeholder="Votre matricule"
                        />
                    </div>
                    <div className="mb-6">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Votre mot de passe"
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        {loading ? (
                            <div className="loading-circles">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : (
                            "Se connecter"
                        )}
                    </button>
                </form>
            </div>
        </div>
        </div>
    );
};

export default Login;