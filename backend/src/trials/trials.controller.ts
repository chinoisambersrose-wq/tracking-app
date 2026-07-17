import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TrialsService } from './trials.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { extendTrialSchema, ExtendTrialDto } from './dto/extend-trial.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('trials')
export class TrialsController {
  constructor(private trialsService: TrialsService) {}

  @Get()
  listAll() {
    return this.trialsService.listAllWithStatus();
  }

  @Patch(':userId/extend')
  extend(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(extendTrialSchema)) dto: ExtendTrialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.trialsService.extendTrial(userId, dto.additionalDays, actor.id);
  }
}
