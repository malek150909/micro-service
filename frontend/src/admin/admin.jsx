import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

const Admin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            navigate("/login");
        } else {
            setUser(storedUser);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/");
    };

    const items = [
        { title: "📍​Événements", description: "Consulter les événements", route: "/gestionEvenements" },
        { title: "📅​Emploi du Temps", description: "Consultez les plannings et les emplois", route: "/consult" },
        { title: "🧑‍🎓Etudiants", description: "Consulter la liste des etudiants", route: "/listeEtudiants" },
        { title: "📢​Annonces", description: "Consultez les annonces", route: "/annonces" },
    ];

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
                <h1 className="text-lg font-bold">{user ? `${user.poste}` : "Admin"}</h1>

                {/* Bouton utilisateur */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center bg-white text-blue-600 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100"
                    >
                        <span className="mr-2">{user ? `${user.nom} ${user.prenom}` : "Admin"}</span>
                        <FaChevronDown />
                    </button>

                    {/* Menu déroulant */}
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden">
                            <button className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                                Modifier Profil
                            </button>
                            <button className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                                Messages
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

            {/* Contenu principal */}
            <main className="flex-grow flex flex-col items-center justify-center p-6 bg-gray-100 min-h-screen">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-5xl">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(item.route)}
                            className="cursor-pointer bg-white p-8 rounded-2xl shadow-md transform transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                            <p className="text-gray-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </main>

        </div>
    );
};

export default Admin;
