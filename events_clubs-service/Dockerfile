# Utiliser une image Node.js officielle comme base
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source du service
COPY . .

# Copier le fichier .env
COPY .env .

# Exposer le port utilisé par le service
EXPOSE 8084  

# Commande pour démarrer l'application
CMD ["node", "server.js"]
