-- Active PostGIS et ajoute la colonne géographique dérivée sur "positions".
-- Reprend le contenu de prisma/postgis-extension.sql (jusque-là appliqué à la main)
-- pour que `prisma migrate deploy` s'en charge automatiquement, sans dépendre
-- d'une connexion manuelle poste par poste à chaque nouvelle base.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "positions"
  ADD COLUMN IF NOT EXISTS "geog" geography(Point, 4326)
  GENERATED ALWAYS AS (ST_MakePoint("longitude", "latitude")::geography) STORED;

CREATE INDEX IF NOT EXISTS "positions_geog_idx" ON "positions" USING GIST ("geog");
