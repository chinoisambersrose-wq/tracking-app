import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createAdminSchema, CreateAdminDto } from './dto/create-admin.schema';
import { createAgentSchema, CreateAgentDto } from './dto/create-agent.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  // --- Super Admin ---

  @Post('admins')
  @Roles(UserRole.SUPER_ADMIN)
  createAdmin(
    @Body(new ZodValidationPipe(createAdminSchema)) dto: CreateAdminDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.createAdmin(dto, actor.id);
  }

  @Get('admins')
  @Roles(UserRole.SUPER_ADMIN)
  listAdmins() {
    return this.usersService.listAdmins();
  }

  @Patch('admins/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  suspendAdmin(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.suspendAdmin(id, actor.id);
  }

  @Patch('admins/:id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  reactivateAdmin(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.reactivateAdmin(id, actor.id);
  }

  @Delete('admins/:id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteAdmin(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.deleteAdmin(id, actor.id);
  }

  // --- Admin : agents ---

  @Post('agents')
  @Roles(UserRole.ADMIN)
  createAgent(
    @Body(new ZodValidationPipe(createAgentSchema)) dto: CreateAgentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.createAgent(dto, actor.organizationId!, actor.id);
  }

  @Get('agents')
  @Roles(UserRole.ADMIN)
  listAgents(@CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.listAgents(actor.organizationId!);
  }

  @Delete('agents/:id')
  @Roles(UserRole.ADMIN)
  removeAgent(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.removeAgent(id, actor.organizationId!, actor.id);
  }
}
