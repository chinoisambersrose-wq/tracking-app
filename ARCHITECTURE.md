# Architecture proposée — Tracking App

Document de travail à valider avant écriture du code. Couvre la structure technique, le modèle de données, les rôles et le temps réel.

## 1. Principes directeurs

- **Multi-tenant strict** : chaque Administrateur possède une Organisation isolée. Aucune requête ne doit pouvoir traverser les frontières d'organisation (filtrage systématique par `organizationId` au niveau service, pas seulement au niveau contrôleur).
- **Modulaire** : le mode de tracking (colis, GPS, ou les deux) est un paramètre par organisation (`trackingMode`), pas un choix figé au niveau du code. Les deux domaines (colis / GPS) partagent un modèle générique `TrackingItem`.
- **Essai encadré par un cron** : l'expiration n'est jamais calculée à la volée dans l'UI ; un job planifié fait autorité et met à jour le statut réel en base, avec notification avant échéance.

## 2. Stack retenue

| Couche | Choix | Justification |
|---|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS | Rapide à itérer, écosystème mûr pour cartes et temps réel |
| Carte | Leaflet.js + OpenStreetMap | Gratuit, pas de clé API ; clustering via `react-leaflet-cluster` |
| Backend | **NestJS** (TypeScript) | Architecture en couches imposée par le framework (modules/contrôleurs/services), RBAC et validation par décorateurs, DI native — mieux adapté qu'Express nu vu la complexité (multi-tenant, cron, websockets, RBAC) |
| ORM / DB | Prisma + PostgreSQL + PostGIS | Migrations sûres, requêtes géospatiales via extension PostGIS |
| Temps réel | Socket.IO (intégré à NestJS via `@nestjs/websockets`) | Rooms par organisation pour isoler les flux |
| Auth | JWT (access court + refresh token rotatif), argon2 pour le hash | Refresh tokens stockés hashés en base, révocables |
| Validation | Zod (via `nestjs-zod`) | Cohérent front/back, schémas partageables |
| Planification | `@nestjs/schedule` (node-cron sous le capot) | Job quotidien d'expiration des essais |
| Notifications | Nodemailer (email), Twilio (SMS/WhatsApp) | Interfaces abstraites pour permuter facilement de provider |
| Conteneurisation | Docker + docker-compose (postgres+postgis, backend, frontend) | Déploiement VPS ou Render/Railway |

## 3. Arborescence (monorepo)

```
tracking-app/
├── backend/
│   ├── src/
│   │   ├── auth/              # JWT, guards, stratégies, refresh tokens
│   │   ├── users/              # CRUD utilisateurs, gestion rôles
│   │   ├── organizations/      # tenants, trackingMode
│   │   ├── trials/             # période d'essai + cron d'expiration
│   │   ├── tracking-items/     # colis / véhicules (générique)
│   │   ├── positions/          # historique GPS, requêtes géospatiales
│   │   ├── notifications/      # email/SMS/WhatsApp + in-app
│   │   ├── audit-log/          # journalisation des actions sensibles
│   │   ├── public-tracking/    # endpoints publics sans auth
│   │   ├── realtime/           # gateway Socket.IO
│   │   ├── common/             # guards RBAC, décorateurs, filtres, pipes zod
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── test/                   # tests unitaires (logique d'essai en priorité)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── super-admin/    # dashboard admins, essais, audit
│   │   │   ├── admin/          # dashboard tracking, carte, agents
│   │   │   ├── agent/          # interface simplifiée mobile-first
│   │   │   └── public/         # page de suivi sans connexion
│   │   ├── components/
│   │   ├── hooks/               # useSocket, useAuth, useTrackingItems
│   │   └── lib/
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## 4. Rôles et permissions

| Action | Super Admin | Admin | Agent |
|---|---|---|---|
| Créer/suspendre/supprimer un Admin | ✅ | ❌ | ❌ |
| Définir/prolonger la période d'essai | ✅ | ❌ | ❌ |
| Voir tous les admins et leur statut | ✅ | ❌ | ❌ |
| Gérer ses agents et ses tracking items | ❌ (pas de données propres) | ✅ (scope organisation) | ❌ |
| Mettre à jour statut colis / position GPS | ❌ | ✅ | ✅ (scope assigné) |
| Consulter page de tracking public | Accès libre, sans authentification | | |

RBAC implémenté via un `RolesGuard` NestJS + un `OrganizationScopeGuard` qui injecte automatiquement le filtre `organizationId` dans chaque requête Admin/Agent.

## 5. Modèle de données (résumé — détail dans `schema.prisma` joint)

- `Organization` — un tenant par Admin, porte `trackingMode` (PARCEL / GPS / BOTH).
- `User` — rôle, statut (ACTIVE/TRIAL/EXPIRED/SUSPENDED), rattachement organisation (null pour Super Admin).
- `TrialPeriod` — durée, dates début/fin, historique de prolongation.
- `TrackingItem` — générique (type PARCEL ou VEHICLE), code public unique pour la page de suivi.
- `TrackingStatusHistory` — horodatage des changements de statut colis.
- `Position` — historique GPS (lat/lng + colonne géographique PostGIS pour les requêtes de proximité).
- `Notification` — email/SMS/WhatsApp/in-app avec statut de lecture.
- `AuditLog` — traçabilité de toute action sensible (qui, quoi, quand).
- `RefreshToken` — tokens hashés, révocables.

## 6. Temps réel

- Un socket par utilisateur connecté, rejoint automatiquement la room `org:{organizationId}`.
- Émission d'un événement `position:update` ou `status:update` à chaque écriture en base (déclenché depuis les services, pas depuis le contrôleur, pour rester cohérent même via API/cron).
- Le frontend admin s'abonne à sa room ; la page publique de tracking s'abonne à une room dédiée par `trackingItem.publicCode` (accès restreint à cet item uniquement).

## 7. Cycle de vie de l'essai

1. Super Admin crée un Admin avec `durationDays` → `TrialPeriod` créé, `User.status = TRIAL`.
2. Cron quotidien (`@nestjs/schedule`, ex. 02h00) :
   - identifie les essais à J-3 (configurable) → notification in-app + email ;
   - identifie les essais expirés (`endDate < now`) → `User.status = EXPIRED`, connexion bloquée par un guard dédié, entrée `AuditLog`.
3. Prolongation manuelle par Super Admin → nouvelle `endDate`, `User.status = TRIAL` ou `ACTIVE`, entrée `AuditLog`.

## 8. Sécurité (application concrète des points du prompt)

- Zod à l'entrée de chaque endpoint (pipe global NestJS).
- Prisma = requêtes paramétrées par défaut (pas de SQL brut hors migrations PostGIS).
- `@nestjs/throttler` sur `/auth/login` et `/users` (création de comptes).
- Cookies `httpOnly` + `secure` pour le refresh token ; access token en mémoire côté frontend.
- `.env` + `.env.example` versionné (sans secrets).
- Tests unitaires prioritaires sur `trials.service.ts` (calcul d'expiration, prolongation, cas limites de fuseau horaire).

## 9. Prochaine étape

Si cette structure te convient, je scaffold le monorepo (backend NestJS + frontend Vite), le `docker-compose.yml`, et j'applique la première migration Prisma. Dis-moi aussi si tu veux que j'ajuste un point (ex: Express au lieu de NestJS, SMS/WhatsApp optionnel en V1, etc.) avant que je commence.
