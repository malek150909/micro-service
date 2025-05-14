import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaLock, FaUser } from "react-icons/fa";
import "../main_css_files/edit_profil.css";

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
        annee_inscription: "",
        nom_faculte: "",
        Nom_departement: "",
        niveau: "",
        nom_specialite: "",
        etat: "",
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
            navigate("/");
        } else {
            setUser(storedUser);
            setFormData({
                nom: storedUser.nom || "",
                prenom: storedUser.prenom || "",
                email: storedUser.email || "",
                Matricule: storedUser.Matricule || "",
                poste: storedUser.role === "admin" ? storedUser.poste || "" : "",
                annee_inscription: storedUser.role === "enseignant" || storedUser.role === "etudiant"
                    ? storedUser.annee_inscription
                        ? new Date(storedUser.annee_inscription).toLocaleDateString("fr-FR")
                        : ""
                    : "",
                nom_faculte: storedUser.role === "enseignant" ? storedUser.nom_faculte || "" : "",
                Nom_departement: storedUser.role === "enseignant" ? storedUser.Nom_departement || "" : "",
                niveau: storedUser.role === "etudiant" ? storedUser.niveau || "" : "",
                nom_specialite: storedUser.role === "etudiant" ? storedUser.nom_specialite || "" : "",
                etat: storedUser.role === "etudiant" ? storedUser.etat || "" : "",
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
            setModalMessage("Les mots de passe ne correspondent pas.");
            setIsError(true);
            setShowSuccessModal(true);
            return;
        }

        const token = localStorage.getItem("token");
        const payload = {
            matricule: user.Matricule,
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
        };
        console.log("Données envoyées au backend :", payload);

        try {
            const response = await fetch("http://users.localhost/update-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("Réponse du backend :", data);

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la mise à jour du mot de passe");
            }

            setModalMessage("Mot de passe mis à jour avec succès !");
            setIsError(false);
            setShowSuccessModal(true);
            setIsEditingPassword(false);
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            setModalMessage(error.message);
            setIsError(true);
            setShowSuccessModal(true);
        }
    };

    const toggleEditPassword = () => {
        setIsEditingPassword(!isEditingPassword);
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setModalMessage("");
        setIsError(false);
    };

    const handleBack = () => {
        navigate(
            user.role === "admin" ? "/Admin" :
            user.role === "enseignant" ? "/enseignant" :
            "/etudiant"
        );
    };

    if (!user) return null;

    return (
        <div id="edit-profil">
            <aside className="sidebar">
                <div className="logo">
                    <h2><FaUser/> Profil</h2>
                </div>
                <button className="sidebar-button" onClick={handleBack}>
                    <FaHome /> Retour à l'accueil
                </button>
                <button className="sidebar-button" onClick={toggleEditPassword}>
                    <FaLock /> Modifier mot de passe
                </button>
            </aside>

            <main className="main-content">
                <div className="edit-profil-container">
                    <h1>Votre Profil</h1>
                    <form className="profile-form">
                        <div className="form-field">
                            <label>Nom</label>
                            <input type="text" name="nom" value={formData.nom} readOnly />
                        </div>
                        <div className="form-field">
                            <label>Prénom</label>
                            <input type="text" name="prenom" value={formData.prenom} readOnly />
                        </div>
                        <div className="form-field">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} readOnly />
                        </div>
                        <div className="form-field">
                            <label>Matricule</label>
                            <input type="text" name="Matricule" value={formData.Matricule} readOnly />
                        </div>
                        {user.role === "admin" && (
                            <div className="form-field">
                                <label>Poste</label>
                                <input type="text" name="poste" value={formData.poste} readOnly />
                            </div>
                        )}
                        {(user.role === "enseignant" || user.role === "etudiant") && (
                            <div className="form-field">
                                <label>Année d'inscription</label>
                                <input type="text" name="annee_inscription" value={formData.annee_inscription} readOnly />
                            </div>
                        )}
                        {user.role === "enseignant" && (
                            <>
                                <div className="form-field">
                                    <label>Faculté</label>
                                    <input type="text" name="nom_faculte" value={formData.nom_faculte} readOnly />
                                </div>
                                <div className="form-field">
                                    <label>Département</label>
                                    <input type="text" name="Nom_departement" value={formData.Nom_departement} readOnly />
                                </div>
                            </>
                        )}
                        {user.role === "etudiant" && (
                            <>
                                <div className="form-field">
                                    <label>Niveau</label>
                                    <input type="text" name="niveau" value={formData.niveau} readOnly />
                                </div>
                                <div className="form-field">
                                    <label>Spécialité</label>
                                    <input type="text" name="nom_specialite" value={formData.nom_specialite} readOnly />
                                </div>
                                <div className="form-field">
                                    <label>État</label>
                                    <input type="text" name="etat" value={formData.etat} readOnly />
                                </div>
                            </>
                        )}
                        <div className="form-field">
                            <label>Mot de passe</label>
                            <input type="password" value="********" disabled />
                        </div>
                    </form>
                </div>
            </main>

            {isEditingPassword && (
                <div className="password-modal">
                    <form onSubmit={handlePasswordSubmit} className="password-form" autoComplete="off">
                        <h3>Modifier le mot de passe</h3>
                        <div className="form-field">
                            <label>Ancien mot de passe</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={passwordData.oldPassword}
                                onChange={handlePasswordChange}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                autoComplete="new-password"
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
                                autoComplete="new-password"
                                required
                            />
                        </div>
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

            {showSuccessModal && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <h3>{isError ? "Erreur" : "Succès"}</h3>
                        <p>{modalMessage}</p>
                        <button onClick={handleCloseModal} className={isError ? "error-close-button" : "success-close-button"}>
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProfile;