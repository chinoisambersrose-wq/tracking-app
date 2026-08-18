import 'reflect-metadata';
import { writeSync } from 'fs';
writeSync(1, '>>> [boot] main.js chargé\n');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  writeSync(1, '>>> [boot] bootstrap() début\n');
  const app = await NestFactory.create(AppModule);
  writeSync(1, '>>> [boot] Nest app créée\n');

  app.use(cookieParser());

  // FRONTEND_URL peut contenir plusieurs origines séparées par des virgules
  // (ex: l'URL Vercel par défaut + le domaine personnalisé), utile pendant
  // une transition de domaine ou tant que le DNS custom n'est pas propagé.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Pas d'origine (ex: appel serveur à serveur, curl) : on autorise.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non autorisée par CORS : ${origin}`), false);
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  writeSync(1, `>>> [boot] Backend démarré sur le port ${port}\n`);
}

bootstrap().catch((err) => {
  writeSync(2, '>>> [boot] ERREUR: ' + (err && err.stack ? err.stack : String(err)) + '\n');
  process.exit(1);
});
