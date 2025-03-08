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
      <main className="flex-grow flex flex-col items-center justify-center p-6 bg-gray-100 min-h-screen">
        
        {/* Bouton Retour */}
        <motion.button
          onClick={() => navigate("/admin")} 
          className="absolute top-6 left-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-300 hover:bg-blue-700 hover:scale-105"
          initial={{ opacity: 0, x: -50 }} // Apparition en glissant
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          ← Retour à l&apos;accueil
        </motion.button>
  
        {/* Titre */}
        <motion.h1 
          className="text-3xl font-bold mb-8 text-gray-800"
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Liste des Étudiants
        </motion.h1>
  
        {/* Grille des niveaux */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 w-full max-w-5xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {niveaux.map((niveau, index) => (
            <motion.div
              key={index}
              onClick={() => navigate(niveau.route)}
              className="cursor-pointer bg-white px-12 py-6 rounded-2xl shadow-md transform transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center justify-center text-center"
              style={{ minWidth: "max-content" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-2xl font-bold text-gray-800 whitespace-nowrap">{niveau.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </main>
    );
  }
  
  export default ListeEtudiants;