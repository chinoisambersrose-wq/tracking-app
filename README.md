# Tracking App

Application web de tracking générique et configurable : suivi de colis (statuts) et suivi GPS temps réel, multi-tenant, avec gestion Super Admin / Administrateur / Agent et période d'essai.

Voir `ARCHITECTURE.md` pour le détail de l'architecture et `backend/prisma/schema.prisma` pour le schéma de données.

## Prérequis

- Node.js 20+
- PostgreSQL 15+ avec l'extension PostGIS (ou Docker)
- npm

## Lancer en local sans Docker

### 1. Base de données

```bash
# Si vous avez PostgreSQL en local, créez la base et activez PostGIS :
createdb tracking_app
psql tracking_app -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # ajustez DATABASE_URL et les secrets JWT
npm install
npm run prisma:migrate      # crée les tables
psql tracking_app -f prisma/postgis-extension.sql   # active PostGIS + colonne géographique
npm run seed                 # crée le Super Admin (superadmin@tracking-app.local / ChangeMe123!)
npm run start:dev            # démarre sur http://localhost:3000/api
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # démarre sur http://localhost:5173
```

### 4. Connexion

- Page de connexion : http://localhost:5173/login
- Compte initial (Super Admin) : `superadmin@tracking-app.local` / `ChangeMe123!` — **à changer immédiatement**.
- Page de suivi public (sans connexion) : http://localhost:5173/track

## Lancer avec Docker

```bash
cp backend/.env.example backend/.env   # ajustez les secrets
docker compose up --build
```

- Backend : http://localhost:3000/api
- Frontend : http://localhost:5173
- PostgreSQL/PostGIS : localhost:5432

Après le premier démarrage, exécutez les migrations et le seed dans le conteneur backend :

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec postgres psql -U tracking -d tracking_app -f /dev/stdin < backend/prisma/postgis-extension.sql
docker compose exec backend npm run seed
```

## Tests

```bash
cd backend
npm test          # inclut les tests de la logique d'expiration des essais
```

## Structure

Voir `ARCHITECTURE.md` pour le détail des modules backend et de l'organisation frontend.

## Points restant à finaliser avant la production

- Renseigner de vraies clés SMTP/Twilio dans `.env` (sinon les envois email/SMS/WhatsApp sont simplement journalisés/ignorés).
- Ajuster la position centrale par défaut de la carte (`frontend/src/components/MapView.tsx`).
- Ajouter le clustering des marqueurs (`react-leaflet-cluster` ou `leaflet.markercluster`) si le volume de points devient important.
- Configurer HTTPS et des secrets JWT robustes avant tout déploiement public.
