import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import "../admin_css_files/admin.css";

const Etudiant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "etudiant") {
            navigate("/");
        } else {
            setUser(storedUser);
            console.log("Utilisateur chargé dans Enseignant :", storedUser); // Log pour vérifier
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleEditProfile = () => {
        navigate("/modifierProfilEtudiant");
    };

    const handleMessages = () => {
        navigate("/messagesEtudiant");
    };

    const items = [
        { title: "📁 Documents Administratif", description: "Consulter et créer des documents", route: "/docsEtudiant" },
        { title: "📢 Annonces", description: "Consulter les Annonces", route: "/AnnoncesETD" },
        { title: "👥 Clubs", description: "Consulter les Clubs", route: "/clubsETD" },
        { title: " Emploi du Temps", description: "Consulter l'emploi du temp", route: "/ETDemploi" }
    ];

    return (
        <div className="h-screen flex flex-col">
            <header className="header-container">
                <div className="user-info">
                    {user && (
                        <div className="user-details">
                            <span className="info-box">
                                <span className="info-label">Matricule</span>
                                <span className="info-value">{user.Matricule || "N/A"}</span>
                            </span>
                        </div>
                    )}
                </div>
                <div className="dropdown-container">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="user-button">
                        <div className="user-avatar">
                            {user?.nom ? user.nom.charAt(0).toUpperCase() : "A"}
                        </div>
                        <span>{user ? `${user.nom} ${user.prenom}` : "Admin"}</span>
                        <FaChevronDown className="dropdown-icon" />
                    </button>
                    {menuOpen && (
                        <div className="dropdown-menu">
                            <button onClick={handleEditProfile}>Compte</button>
                            <button onClick={handleMessages}>Messages</button>
                            <button onClick={handleLogout} className="logout-button">Déconnexion</button>
                        </div>
                    )}
                </div>
            </header>

            <main className="main-container">
                <div className="cards-grid">
                    {items.map((item, index) => (
                        <div key={index} onClick={() => navigate(item.route)} className="card">
                            <h3 className="card-title">{item.title}</h3>
                            <p className="card-description">{item.description}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Etudiant;