FROM node:20-alpine AS base
# openssl est requis par les binaires moteur de Prisma (schema-engine/query-engine),
# absent par défaut de l'image alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
# Diagnostic : fait échouer le build explicitement (avec un message clair)
# si la compilation n'a pas produit dist/main.js, au lieu de laisser une
# image cassée passer silencieusement.
RUN ls -la dist && test -f dist/main.js || (echo "ERREUR: dist/main.js absent après npm run build" && exit 1)

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
