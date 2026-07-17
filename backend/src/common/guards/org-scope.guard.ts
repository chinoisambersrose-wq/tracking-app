import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Garantit qu'un Admin ou Agent ne peut agir que dans le périmètre de sa
 * propre organisation. Le Super Admin n'a pas d'organisation et ne gère pas
 * de données de tracking directement.
 *
 * Ce guard vérifie la présence d'un organizationId sur l'utilisateur ;
 * le filtrage effectif des requêtes (WHERE organizationId = ...) doit être
 * appliqué dans chaque service, ce guard sert de filet de sécurité.
 */
@Injectable()
export class OrgScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Utilisateur non authentifié.');

    if (user.role === UserRole.SUPER_ADMIN) return true;

    if (!user.organizationId) {
      throw new ForbiddenException("Aucune organisation associée à ce compte.");
    }
    return true;
  }
}
