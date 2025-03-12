import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const niveaux = [
  { title: "L1", route: "" },
  { title: "L2", route: "" },
  { title: "L3", route: "" },
  { title: "M1", route: "" },
  { title: "M2", route: "" },
  { title: "DOCTORANT", route: "" },
];

function ListeEtudiants() {
    const navigate = useNavigate();
  
    return (
      <main className="container animate-on-load">
        {/* Bouton Retour */}
        <motion.button
          onClick={() => navigate("/admin")} 
          className="close-button"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          ← Retour à l&apos;accueil
        </motion.button>
  
        {/* Titre */}
        <motion.h1 
          className="container-title"
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Liste des Étudiants
        </motion.h1>
  
        {/* Grille des niveaux */}
        <motion.div 
          className="grid-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {niveaux.map((niveau, index) => (
            <motion.div
              key={index}
              onClick={() => navigate(niveau.route)}
              className="event-square"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3>{niveau.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </main>
    );
  }
  
export default ListeEtudiants;
