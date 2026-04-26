import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import { AuditService } from '../audit/audit.service';
import { UpdateTenantDto } from './dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(
    private tenantsService: TenantsService,
    private auditService: AuditService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant settings' })
  getMe(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Put('me')
  @Roles('admin')
  @ApiOperation({ summary: 'Update tenant settings (admin only)' })
  async updateMe(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTenantDto,
  ) {
    const tenant = await this.tenantsService.update(tenantId, dto);
    await this.auditService.log({
      tenantId, userId: user.id,
      action: 'UPDATE', resource: 'tenants',
      resourceId: tenantId, newValues: dto,
    });
    return tenant;
  }
}
