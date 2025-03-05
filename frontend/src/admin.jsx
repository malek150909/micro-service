import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Admin= () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // Récupérer les infos de l'admin depuis localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            navigate("/login"); // Redirige si pas admin
        } else {
            setUser(storedUser);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="h-screen flex flex-col">
            {/* ✅ Header */}
            <header className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
                <h1 className="text-lg font-bold">{user ? `${user.nom} ${user.prenom}` : "Admin"}</h1>

                {/* ✅ Menu burger */}
                <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">&#9776;</button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                            <button className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                                Consulter le profil
                            </button>
                            <button 
                                onClick={handleLogout} 
                                className="block px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ✅ Contenu principal */}
            <main className="flex-grow flex justify-center items-center">
                <h2 className="text-3xl font-semibold">
                    Bonjour Monsieur {user?.poste || "Admin"}
                </h2>
            </main>
        </div>
    );
};

export default Admin;
