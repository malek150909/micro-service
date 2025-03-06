import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
        { title: "Événements", description: "Gérez les événements", route: "/evenements" },
        { title: "Planning", description: "Consultez les plannings et les emplois", route: "/plannings" },
        { title: "Utilisateurs", description: "Gérez les utilisateurs", route: "/Demandes" },
        { title: "annonces", description: "Consultez les annonces", route: "/annonces" },
    ];

    return (
        <div className="h-screen flex flex-col">
            <header className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-md">
                <h1 className="text-lg font-bold">{user ? `${user.nom} ${user.prenom}` : "Admin"}</h1>
                <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">&#9776;</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                            <button className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                                Consulter le profil
                            </button>
                            <button onClick={handleLogout} className="block px-4 py-2 text-red-600 hover:bg-gray-100 w-full text-left">
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center p-6 bg-gray-100">
                <h2 className="text-2xl font-bold mb-4">Tableau de bord</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-4xl">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(item.route)}
                            className="cursor-pointer bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300"
                        >
                            <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                            <p className="text-gray-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Admin;
