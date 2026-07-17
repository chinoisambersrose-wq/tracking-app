import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TrackingItemsService } from './tracking-items.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrgScopeGuard } from '../common/guards/org-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createTrackingItemSchema, CreateTrackingItemDto } from './dto/create-tracking-item.schema';
import { updateStatusSchema, UpdateStatusDto } from './dto/update-status.schema';
import { updateMetadataSchema, UpdateMetadataDto } from './dto/update-metadata.schema';

@UseGuards(JwtAuthGuard, RolesGuard, OrgScopeGuard)
@Controller('tracking-items')
export class TrackingItemsController {
  constructor(private trackingItemsService: TrackingItemsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body(new ZodValidationPipe(createTrackingItemSchema)) dto: CreateTrackingItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.trackingItemsService.create(dto, actor.organizationId!, actor.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.trackingItemsService.findAllForOrg(actor.organizationId!);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.trackingItemsService.findOneForOrg(id, actor.organizationId!);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStatusSchema)) dto: UpdateStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.trackingItemsService.updateStatus(id, actor.organizationId!, dto, actor.id);
  }

  @Patch(':id/metadata')
  @Roles(UserRole.ADMIN)
  updateMetadata(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMetadataSchema)) dto: UpdateMetadataDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.trackingItemsService.updateMetadata(id, actor.organizationId!, dto, actor.id);
  }

  @Patch(':id/assign/:agentId')
  @Roles(UserRole.ADMIN)
  assign(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.trackingItemsService.assignAgent(id, actor.organizationId!, agentId, actor.id);
  }
}
