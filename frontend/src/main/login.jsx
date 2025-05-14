import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaSpinner } from "react-icons/fa";
import styles from "../main_css_files/LoginPage.module.css";

const Login = () => {
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ matricule: "", password: "", general: "" });
  const [isLoading, setIsLoading] = useState(false); // Renommé pour plus de clarté
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    const newErrors = { matricule: "", password: "", general: "" };

    if (!matricule) {
      newErrors.matricule = "Veuillez entrer votre matricule";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Veuillez entrer votre mot de passe";
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    setIsLoading(true);

    try {
      const response = await fetch("http://users.localhost/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        localStorage.setItem("matricule", data.user.Matricule);

        // Attendre un court délai pour que le spinner soit visible, puis rediriger
        setTimeout(() => {
          setIsLoading(false);
          if (data.user.role === "admin") navigate("/admin");
          else if (data.user.role === "enseignant") navigate("/enseignant");
          else if (data.user.role === "etudiant") navigate("/etudiant");
          else {
            setErrors({ ...newErrors, general: "Rôle non reconnu" });
          }
        }, 1000); // Délai de 1 seconde pour montrer le spinner
      } else {
        setIsLoading(false);
        if (data.error.includes("Utilisateur non trouvé")) {
          setErrors({ ...newErrors, matricule: "Matricule incorrect" });
        } else if (data.error.includes("Mot de passe incorrect")) {
          setErrors({ ...newErrors, password: "Mot de passe incorrect" });
        } else {
          setErrors({ ...newErrors, general: data.error || "Erreur de connexion. Vérifiez vos identifiants." });
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      setIsLoading(false);
      setErrors({ ...newErrors, general: "Erreur serveur. Veuillez réessayer." });
    }
  };

  return (
    <div className={`${styles["LOG-login-page"]} ${isLoading ? styles["LOG-fade-out"] : ""}`}>
      <div className={styles["LOG-login-background"]}></div>
      <div className={styles["LOG-login-card"]}>
        <div className={styles["LOG-login-logo-section"]}>
          <img src="/usthb-logo.png" alt="USTHB Logo" className={styles["LOG-login-logo"]} />
        </div>
        <div className={styles["LOG-login-form-section"]}>
          <h1 className={styles["LOG-login-title"]}>Votre Portail Universitaire</h1>
          {errors.general && <span className={`${styles["LOG-error-message"]} ${styles["LOG-general-error"]}`}>{errors.general}</span>}
          <form onSubmit={handleSubmit} className={styles["LOG-login-form"]}>
            <div className={styles["LOG-login-input-group"]}>
              <div className={styles["LOG-input-with-icon"]}>
                <FaUser className={styles["LOG-login-input-icon"]} />
                <input
                  type="text"
                  className={styles["LOG-login-input"]}
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="Matricule"
                />
              </div>
              {errors.matricule && <span className={styles["LOG-error-message"]}>{errors.matricule}</span>}
            </div>
            <div className={styles["LOG-login-input-group"]}>
              <div className={styles["LOG-input-with-icon"]}>
                <FaLock className={styles["LOG-login-input-icon"]} />
                <input
                  type="password"
                  className={styles["LOG-login-input"]}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
              </div>
              {errors.password && <span className={styles["LOG-error-message"]}>{errors.password}</span>}
            </div>
            <div className={styles["LOG-login-actions"]}>
              <button type="submit" className={styles["LOG-login-button"]} disabled={isLoading}>
                {isLoading ? <FaSpinner className={styles["LOG-spinner"]} /> : "Connecter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;