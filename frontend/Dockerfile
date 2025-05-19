# Étape 1 : Construire l'application React
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_REACT_APP_WS_HOST
ENV VITE_REACT_APP_WS_HOST=$VITE_REACT_APP_WS_HOST
RUN npm run build

# Étape 2 : Servir l'application avec Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copier la configuration Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
