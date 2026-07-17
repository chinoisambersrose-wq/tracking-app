import { PrismaClient, UserRole, UserStatus, TrackingMode } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'superadmin@tracking-app.local';
  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (existing) {
    console.log('Super Admin déjà présent, seed ignoré.');
    return;
  }

  const passwordHash = await argon2.hash('ChangeMe123!');

  await prisma.user.create({
    data: {
      email: superAdminEmail,
      passwordHash,
      fullName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Super Admin créé : ${superAdminEmail} / ChangeMe123! (à changer immédiatement)`);

  // Exemple d'organisation de démonstration (facultatif)
  const demoOrg = await prisma.organization.create({
    data: { name: 'Organisation Démo', trackingMode: TrackingMode.BOTH },
  });
  console.log(`Organisation démo créée : ${demoOrg.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
