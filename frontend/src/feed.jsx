import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Feed = () => {
    const navigate = useNavigate();
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // ✅ Récupérer les infos de l'utilisateur depuis localStorage
        const storedNom = localStorage.getItem("nom");
        const storedPrenom = localStorage.getItem("prenom");

        if (!storedNom || !storedPrenom) {
            navigate("/"); // Redirige vers login si pas connecté
        } else {
            setNom(storedNom);
            setPrenom(storedPrenom);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear(); // Supprime les infos de l'utilisateur
        navigate("/"); // Redirige vers la page de connexion
    };

    return (
        <div className="h-screen bg-gray-100">
            {/* Barre supérieure */}
            <div className="flex justify-between items-center p-4 bg-blue-500 text-white shadow-md">
                <h2 className="text-lg font-bold">
                    {nom} {prenom}
                </h2>
                
                {/* Bouton Menu Burger */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">
                    ☰
                </button>
            </div>

            {/* Menu déroulant */}
            {menuOpen && (
                <div className="absolute right-4 top-16 bg-white shadow-md rounded-lg w-40">
                    <button 
                        onClick={handleLogout} 
                        className="w-full px-4 py-2 text-left hover:bg-gray-200"
                    >
                        Déconnexion
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-200">
                        Mon Profil
                    </button>
                </div>
            )}

            {/* Contenu principal */}
            <div className="flex justify-center items-center h-full">
                <h1 className="text-3xl font-semibold">Bienvenue, {prenom} !</h1>
            </div>
        </div>
    );
};

export default Feed;
