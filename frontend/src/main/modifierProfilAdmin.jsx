import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../admin_css_files/edit_profil.css';

const EditProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        Matricule: "",
        poste: "",
    });
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            navigate("/");
        } else {
            setUser(storedUser);
            setFormData({
                nom: storedUser.nom || "",
                prenom: storedUser.prenom || "",
                email: storedUser.email || "",
                Matricule: storedUser.Matricule || "",
                poste: storedUser.poste || "",
            });
            console.log("Utilisateur chargé dans EditProfile :", storedUser);
        }
    }, [navigate]);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        const payload = {
            matricule: user.Matricule,
            newPassword: passwordData.newPassword,
        };
        console.log("Données envoyées au backend :", payload);

        try {
            const response = await fetch('http://localhost:8081/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Réponse du backend :", data);

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la mise à jour du mot de passe");
            }

            setError("");
            alert("Mot de passe mis à jour avec succès !");
            setIsEditingPassword(false);
            setPasswordData({ newPassword: "", confirmPassword: "" });
        } catch (error) {
            setError(error.message);
        }
    };

    const toggleEditPassword = () => {
        setIsEditingPassword(!isEditingPassword);
        setError("");
    };

    const handleBackToAdmin = () => {
        navigate("/Admin");
    };

    if (!user) return null;

    return (
        <div id="edit-profil">
            <div className="edit-profil-container">
                <div className="flex justify-end p-4">
                    <button
                        onClick={handleBackToAdmin}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700"
                    >
                        Retour à l&apos;accueil
                    </button>
                </div>
                <form className="profile-form">
                    <div className="form-field">
                        <label>Nom</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            readOnly // Ajout de l'attribut readOnly
                        />
                    </div>
                    <div className="form-field">
                        <label>Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            readOnly
                        />
                    </div>
                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            readOnly
                        />
                    </div>
                    <div className="form-field">
                        <label>Matricule</label>
                        <input
                            type="text"
                            name="Matricule"
                            value={formData.Matricule}
                            readOnly
                        />
                    </div>
                    <div className="form-field">
                        <label>Poste</label>
                        <input
                            type="text"
                            name="poste"
                            value={formData.poste}
                            readOnly
                        />
                    </div>
                    <div className="form-field">
                        <label>Mot de passe</label>
                        <input type="password" value="********" disabled />
                        <button
                            type="button"
                            onClick={toggleEditPassword}
                            className="edit-password-button"
                        >
                            Modifier mot de passe
                        </button>
                    </div>
                    {/* Bouton Enregistrer masqué car le formulaire est read-only */}
                    {/* <button type="submit" className="submit-button">
                        Enregistrer
                    </button> */}
                </form>

                {isEditingPassword && (
                    <div className="password-modal">
                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <div className="form-field">
                                <label>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Confirmer nouveau mot de passe</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <div className="modal-actions">
                                <button type="submit" className="submit-button">
                                    Valider
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleEditPassword}
                                    className="cancel-button"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditProfile;