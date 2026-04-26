import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users in tenant' })
  findAll(@TenantId() tenantId: string) {
    return this.usersService.findAllByTenant(tenantId);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user (admin only)' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.usersService.create(tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: currentUser.id,
      action: 'CREATE',
      resource: 'users',
      resourceId: user.id,
      newValues: { email: user.email, role: user.role },
    });
    return user;
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() currentUser: any,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: currentUser.id,
      action: 'UPDATE',
      resource: 'users',
      resourceId: id,
      newValues: dto,
    });
    return user;
  }
}
