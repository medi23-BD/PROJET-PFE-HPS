#  Image officielle Node.js
FROM node:20-slim

#  Dossier de travail dans le conteneur
WORKDIR /app

#  Copier package.json & lock
COPY package*.json ./

#  Installer les dépendances
RUN npm install

#  Copier tout le reste
COPY . .

#  Port exposé
EXPOSE 3000

#  Commande de démarrage
CMD ["npm", "run", "start"]
