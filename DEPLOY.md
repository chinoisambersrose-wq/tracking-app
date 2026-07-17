# Déploiement — GitHub + Railway + Vercel

Ce guide déploie : le code sur GitHub, la base PostgreSQL/PostGIS + le backend NestJS sur Railway, et le frontend React sur Vercel.

## 1. Pousser le code sur GitHub

Depuis `~/projets/tracking-app` :

```bash
git init
git add .
git commit -m "Initial commit"
```

Créez un nouveau dépôt vide sur [github.com/new](https://github.com/new) (sans README/gitignore), puis :

```bash
git remote add origin https://github.com/VOTRE_USER/tracking-app.git
git branch -M main
git push -u origin main
```

## 2. Base de données PostgreSQL + PostGIS sur Railway

Railway n'installe pas PostGIS sur son Postgres par défaut — il faut déployer le template dédié.

1. Sur [railway.com](https://railway.com), créez un nouveau projet.
2. Utilisez le template **PostGIS** (recherchez "PostGIS" dans les templates, ou allez sur [railway.com/deploy/postgis](https://railway.com/deploy/postgis)) — il déploie un conteneur PostgreSQL avec PostGIS déjà installé.
3. Une fois déployé, ouvrez ce service → onglet **Variables** → copiez la valeur de `DATABASE_URL` (vous en aurez besoin pour le backend).
4. Ouvrez l'onglet **Data** (ou connectez-vous avec `psql` en utilisant la `DATABASE_URL` copiée) et exécutez :
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
   (probablement déjà actif selon le template, mais `IF NOT EXISTS` ne fait pas de mal).

## 3. Backend NestJS sur Railway

1. Dans le même projet Railway, cliquez **+ New** → **GitHub Repo** → sélectionnez votre dépôt `tracking-app`.
2. Dans les **Settings** de ce nouveau service :
   - **Root Directory** : `backend`
   - **Start Command** : laissez Railway utiliser `npm run start:prod` (détecté automatiquement depuis `package.json` — ce script applique les migrations Prisma puis lance le serveur).
3. Dans l'onglet **Variables**, ajoutez :
   ```
   DATABASE_URL=<référence ou copie de la DATABASE_URL du service PostGIS>
   NODE_ENV=production
   JWT_ACCESS_SECRET=<générez avec: openssl rand -hex 32>
   JWT_REFRESH_SECRET=<générez avec: openssl rand -hex 32>
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=30d
   TRIAL_DEFAULT_DURATION_DAYS=14
   TRIAL_EXPIRING_SOON_DAYS=3
   FRONTEND_URL=<à remplir après l'étape Vercel>
   ```
   Pour `DATABASE_URL`, Railway permet de référencer directement la variable d'un autre service avec la syntaxe `${{Postgres.DATABASE_URL}}` (le nom exact dépend de celui donné à votre service PostGIS) — sinon, collez simplement la valeur copiée à l'étape 2.
4. Déployez. Une fois le déploiement terminé, Railway génère un domaine public (**Settings → Networking → Generate Domain**), du type `tracking-app-backend-production.up.railway.app`. Notez-le.
5. Créez le Super Admin en exécutant le seed une fois, via le CLI Railway :
   ```bash
   npm install -g @railway/cli
   railway login
   railway link          # sélectionnez le projet/service backend
   railway run npm run seed
   ```

## 4. Frontend React sur Vercel

1. Sur [vercel.com/new](https://vercel.com/new), importez le même dépôt GitHub.
2. **Root Directory** : `frontend` (Vercel détecte automatiquement Vite).
3. Variables d'environnement :
   ```
   VITE_API_URL=https://VOTRE-DOMAINE-RAILWAY.up.railway.app/api
   VITE_SOCKET_URL=https://VOTRE-DOMAINE-RAILWAY.up.railway.app
   ```
4. Déployez. Vercel vous donne un domaine du type `tracking-app.vercel.app`.

## 5. Reconnecter CORS backend ↔ frontend

Retournez dans les variables du service **backend** sur Railway et mettez à jour :

```
FRONTEND_URL=https://tracking-app.vercel.app
```

Redéployez le backend (Railway le fait automatiquement au changement de variable, sinon forcez un redeploy). Sans cette étape, le navigateur bloquera les requêtes du frontend vers le backend (CORS) et le cookie de session ne passera pas.

## 6. Vérification

- Ouvrez `https://tracking-app.vercel.app/login`, connectez-vous avec le compte créé par `npm run seed`.
- Si la connexion échoue avec une erreur réseau : vérifiez `FRONTEND_URL` côté Railway et `VITE_API_URL`/`VITE_SOCKET_URL` côté Vercel (les changements de variables Vercel nécessitent un redeploy pour être pris en compte, car elles sont injectées au build).
- Testez la page publique `/track` avec un code de suivi.

## Notes

- Chaque `git push` sur `main` redéploie automatiquement le backend (Railway) et le frontend (Vercel).
- Le cron d'expiration des essais tourne à l'intérieur du process backend (`@nestjs/schedule`) : tant que le service Railway est actif, il s'exécute normalement. Si vous passez sur un plan Railway qui met le service en veille, le cron ne se déclenchera pas pendant cette période.
- Pensez à configurer de vraies clés SMTP/Twilio dans les variables Railway si vous voulez des notifications email/SMS/WhatsApp réelles.
