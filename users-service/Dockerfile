# Utiliser une image Node.js officielle comme base
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les outils nécessaires pour compiler bcrypt et les dépendances
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm install --build-from-source bcrypt \
    && apt-get remove -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Installer les autres dépendances
RUN npm install

# Créer le dossier Uploads pour stocker les fichiers et images téléchargés
RUN mkdir -p Uploads

# Copier tout le code source du service
COPY . .

# Exposer le port utilisé par le service
EXPOSE 8081

# Commande pour démarrer l'application
CMD ["node", "server.js"]