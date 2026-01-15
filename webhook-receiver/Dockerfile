# ---- build stage ----
FROM node:24.6.0-alpine3.22 AS build
WORKDIR /app
COPY server.js .
RUN npm init -y && npm i express
EXPOSE 9000
CMD ["node", "server.js"]
