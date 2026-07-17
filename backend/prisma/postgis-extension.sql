-- À exécuter manuellement APRÈS `npm run prisma:migrate` (une seule fois),
-- pour activer PostGIS et ajouter la colonne géographique dérivée sur "positions".
-- Ce fichier est volontairement en dehors de prisma/migrations pour ne pas être
-- interprété par Prisma comme une migration à part entière.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "positions"
  ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_MakePoint("longitude", "latitude")::geography) STORED;

CREATE INDEX IF NOT EXISTS "positions_geog_idx" ON "positions" USING GIST ("geog");
