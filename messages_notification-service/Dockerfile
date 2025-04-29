# Utiliser une image Node.js officielle comme base
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

#créer le dossier Uploads pour stocker les fichiers et images téléchargés
RUN mkdir -p Uploads

# Copier tout le code source du service
COPY . .

# Exposer le port utilisé par le service (8084 pour events)
EXPOSE 8082

# Commande pour démarrer l'application
CMD ["node", "server.js"]