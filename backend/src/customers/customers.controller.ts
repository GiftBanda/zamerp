import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsEmail, IsOptional, MaxLength, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { AuditService } from '../audit/audit.service';

class CreateCustomerDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ description: 'Taxpayer Identification Number' })
  @IsOptional() @IsString() tpin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPerson?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

class UpdateCustomerDto extends CreateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private customersService: CustomersService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(tenantId, search);
  }

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.customersService.getStats(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.customersService.findOne(id, tenantId);
  }

  @Post()
  @Roles('admin', 'staff')
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCustomerDto,
  ) {
    const customer = await this.customersService.create(tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'CREATE',
      resource: 'customers',
      resourceId: customer.id,
      newValues: dto,
    });
    return customer;
  }

  @Put(':id')
  @Roles('admin', 'staff')
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCustomerDto,
  ) {
    const before = await this.customersService.findOne(id, tenantId);
    const customer = await this.customersService.update(id, tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'UPDATE',
      resource: 'customers',
      resourceId: id,
      oldValues: before,
      newValues: dto,
    });
    return customer;
  }

  @Delete(':id')
  @Roles('admin')
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.customersService.remove(id, tenantId);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'DELETE',
      resource: 'customers',
      resourceId: id,
    });
    return result;
  }
}
