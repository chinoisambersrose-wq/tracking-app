import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides.');

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) throw new UnauthorizedException('Identifiants invalides.');

    if (user.status === UserStatus.EXPIRED) {
      throw new UnauthorizedException("Votre période d'essai a expiré. Contactez le Super Admin.");
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Votre compte est suspendu.');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateCredentials(email, password);

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' },
    );

    const refreshTokenValue = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refreshTokenHash, expiresAt },
    });

    await this.auditLog.log(user.id, 'USER_LOGIN', 'User', user.id);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        whatsappPhone: user.whatsappPhone,
      },
    };
  }

  async refresh(refreshTokenValue: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status === UserStatus.EXPIRED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Compte inaccessible.');
    }

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' },
    );

    return { accessToken };
  }

  async logout(refreshTokenValue: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }
}
