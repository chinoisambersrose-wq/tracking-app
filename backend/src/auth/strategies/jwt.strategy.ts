import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    });
  }

  async validate(payload: { sub: string }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable.');

    if (user.status === UserStatus.EXPIRED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        user.status === UserStatus.EXPIRED
          ? "Période d'essai expirée. Contactez le Super Admin."
          : 'Compte suspendu.',
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
    };
  }
}
