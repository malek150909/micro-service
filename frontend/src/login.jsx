import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css_files/loginPage.css";

const Login = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setMessage("");
    
        try {
            const response = await fetch("http://localhost:8081/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matricule, password })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Connexion réussie !");

                // ✅ Stocker toutes les infos de l'utilisateur
                localStorage.setItem("user", JSON.stringify(data.user));

                // ✅ Rediriger selon le rôle
                setTimeout(() => {
                    if (data.user.role === "admin") navigate("/admin");
                    else if (data.user.role === "enseignant") navigate("/enseignant");
                    else if (data.user.role === "etudiant") navigate("/etudiant");
                    else setMessage("Votre rôle n'a pas été identifié."); // Cas d'erreur
                }, 1000);
            } else {
                setMessage(data.error || "Matricule ou mot de passe incorrect.");
            }
        } catch (error) {
            setMessage("Erreur de connexion au serveur.");
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full flex items-center justify-end pr-20">
            <div className="animated-background"></div>
            <div className="relative bg-white p-10 rounded-[50px] shadow-2xl w-96 border border-gray-300 backdrop-blur-md login-container">
                <div className="flex flex-col items-center mb-6">
                    <img src="/usthb-logo.png" alt="USTHB Logo" className="w-24 h-24 mb-2" />
                    <h2 className="text-2xl font-bold text-gray-800 text-center leading-tight">
                        🌍 Bienvenue dans votre ESpace Universitaire
                    </h2>
                </div>

                <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleSubmit}>
                    {message && <p className="text-red-500 mb-2">{message}</p>}

                    <div className="mb-4">
                        <label className="block text-gray-700">Matricule</label>
                        <input 
                            type="text"
                            className="w-full px-3 py-2 border rounded"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            autoComplete="on"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700">Mot de passe</label>
                        <input 
                            type="password"
                            className="w-full px-3 py-2 border rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="on"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 flex justify-center items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-circles">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        ) : "Se connecter"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
