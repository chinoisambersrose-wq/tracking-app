FROM node:20-alpine AS base
# openssl est requis par les binaires moteur de Prisma (schema-engine/query-engine),
# absent par défaut de l'image alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
# Augmentez la limite de mémoire Node.js pour la compilation NestJS
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package*.json ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]

