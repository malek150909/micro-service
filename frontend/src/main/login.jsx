import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaUser, FaLock } from "react-icons/fa"
import styles from "../main_css_files/LoginPage.module.css"

const Login = () => {
  const [matricule, setMatricule] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({ matricule: "", password: "", general: "" })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    let hasError = false
    const newErrors = { matricule: "", password: "", general: "" }

    if (!matricule) {
      newErrors.matricule = "Veuillez entrer votre matricule"
      hasError = true
    }
    if (!password) {
      newErrors.password = "Veuillez entrer votre mot de passe"
      hasError = true
    }

    setErrors(newErrors)

    if (hasError) return

    setIsTransitioning(true)

    try {
      const response = await fetch("http://localhost:8081/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
        localStorage.setItem("matricule", data.user.Matricule)

        setTimeout(() => {
          if (data.user.role === "admin") navigate("/admin")
          else if (data.user.role === "enseignant") navigate("/enseignant")
          else if (data.user.role === "etudiant") navigate("/etudiant")
          else {
            console.error("Erreur : Votre rôle n'est pas reconnu.")
            setIsTransitioning(false)
            setErrors({ ...newErrors, general: "Rôle non reconnu" })
          }
        }, 300)
      } else {
        setIsTransitioning(false)
        if (data.error.includes("matricule")) {
          setErrors({ ...newErrors, matricule: "Matricule non trouvé" })
        } else if (data.error.includes("mot de passe")) {
          setErrors({ ...newErrors, password: "Mot de passe incorrect" })
        } else {
          setErrors({ ...newErrors, general: "Erreur de connexion. Vérifiez vos identifiants." })
        }
      }
    } catch (error) {
      console.error("Erreur:", error)
      setIsTransitioning(false)
      setErrors({ ...newErrors, general: "Erreur serveur. Veuillez réessayer." })
    }
  }

  return (
    <div className={`${styles['LOG-login-page']} ${isTransitioning ? styles['LOG-fade-out'] : ""}`}>
      <div className={styles['LOG-login-background']}></div>
      <div className={styles['LOG-login-card']}>
        <div className={styles['LOG-login-logo-section']}>
          <img src="/logo-fac.png" alt="University Logo" className={styles['LOG-login-logo']} />
        </div>
        <div className={styles['LOG-login-form-section']}>
          <h1 className={styles['LOG-login-title']}>Votre Portail Universitaire</h1>
          <h2 className={styles['LOG-login-subtitle']}></h2>
          {errors.general && <span className={`${styles['LOG-error-message']} ${styles['LOG-general-error']}`}>{errors.general}</span>}
          <form onSubmit={handleSubmit} className={styles['LOG-login-form']}>
            <div className={styles['LOG-login-input-group']}>
              <div className={styles['LOG-input-with-icon']}>
                <FaUser className={styles['LOG-login-input-icon']} />
                <input
                  type="text"
                  className={styles['LOG-login-input']}
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="Matricule"
                />
              </div>
              {errors.matricule && <span className={styles['LOG-error-message']}>{errors.matricule}</span>}
            </div>
            <div className={styles['LOG-login-input-group']}>
              <div className={styles['LOG-input-with-icon']}>
                <FaLock className={styles['LOG-login-input-icon']} />
                <input
                  type="password"
                  className={styles['LOG-login-input']}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
              </div>
              {errors.password && <span className={styles['LOG-error-message']}>{errors.password}</span>}
            </div>
            <div className={styles['LOG-login-actions']}>
              <button type="submit" className={styles['LOG-login-button']} disabled={isTransitioning}>
                Connecter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login