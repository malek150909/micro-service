import { useState } from "react";

const Login = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            const response = await fetch("http://localhost:8081/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ matricule, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur inconnue");
            }

            alert("Connexion réussie !");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">LOGIN</h1>
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
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                    Se connecter
                </button>
            </form>
        </div>
    );
};

export default Login;
