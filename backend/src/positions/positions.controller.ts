import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrgScopeGuard } from '../common/guards/org-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { recordPositionSchema, RecordPositionDto } from './dto/record-position.schema';

@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
@Controller('positions')
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  record(
    @Body(new ZodValidationPipe(recordPositionSchema)) dto: RecordPositionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.positionsService.record(dto, actor.organizationId!, actor.id, actor.role);
  }

  @Get(':trackingItemId/history')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  history(@Param('trackingItemId') trackingItemId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.positionsService.history(trackingItemId, actor.organizationId!);
  }
}
