import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Permet la redirection

import "./LoginPage.css";

const Login = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // ✅ Hook pour la navigation

    const handleSubmit = async (e) => {
        e.preventDefault();// empêche le rechargement de la page , La requête fetch() est envoyée normalement au backend.
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8081/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matricule, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur inconnue");
            }

             // ✅ Stocker nom et prénom dans localStorage pour les récupérer dans Feed
             localStorage.setItem("nom", data.nom);
             localStorage.setItem("prenom", data.prenom);
 
             // ✅ Redirection vers la page Feed après connexion
             navigate("/feed");
             
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-screen w-full flex items-center justify-end pr-20 bg-gradient-to-br from-blue-500 to-indigo-700">
            <div className="animated-background"></div>
            <div className="relative bg-white p-10 rounded-[50px] shadow-2xl w-96 border border-gray-300 backdrop-blur-md login-container">
                <div className="flex flex-col items-center mb-6">
                    <img src="/usthb-logo.png" alt="USTHB Logo" className="w-24 h-24 mb-2" />
                    <h2 className="text-2xl font-bold text-gray-800 text-center leading-tight">
                        🌍 Bienvenue dans votre ESpace Universitaire 
                    </h2>
                </div>

                <form className="bg-white p-6 rounded shadow-md w-80" onSubmit={handleSubmit}>
                    {error && <p className="text-red-500 mb-2">{error}</p>}
                    
                    <div className="mb-4">
                        <label className="block text-gray-700">Matricule</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded" 
                            value={matricule} 
                            onChange={(e) => setMatricule(e.target.value)} 
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
