import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsIn, IsUUID, IsDateString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { AccountingService } from './accounting.service';
import { AuditService } from '../audit/audit.service';

class CreateTransactionDto {
  @ApiProperty({ enum: ['income', 'expense', 'transfer'] })
  @IsIn(['income', 'expense', 'transfer']) type: 'income' | 'expense' | 'transfer';
  @ApiPropertyOptional() @IsOptional() @IsUUID() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() invoiceId?: string;
  @ApiPropertyOptional({ enum: ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'] })
  @IsOptional()
  @IsIn(['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'])
  paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private accountingService: AccountingService,
    private auditService: AuditService,
  ) {}

  // ── Summary ────────────────────────────────────
  @Get('summary')
  @ApiOperation({ summary: 'Get P&L summary for a date range' })
  getSummary(
    @TenantId() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountingService.getSummary(tenantId, from, to);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly income/expense breakdown by year' })
  getMonthly(
    @TenantId() tenantId: string,
    @Query('year') year?: number,
  ) {
    return this.accountingService.getMonthlyBreakdown(
      tenantId,
      year ? Number(year) : new Date().getFullYear(),
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get breakdown by category' })
  getCategories(
    @TenantId() tenantId: string,
    @Query('type') type: string = 'expense',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountingService.getCategoryBreakdown(tenantId, type, from, to);
  }

  // ── Accounts (Chart of Accounts) ───────────────
  @Get('accounts')
  getAccounts(@TenantId() tenantId: string) {
    return this.accountingService.getAccounts(tenantId);
  }

  @Post('accounts')
  @Roles('admin', 'accountant')
  createAccount(
    @TenantId() tenantId: string,
    @Body() dto: { code: string; name: string; type: string; parentId?: string },
  ) {
    return this.accountingService.createAccount(tenantId, dto);
  }

  // ── Transactions ───────────────────────────────
  @Get('transactions')
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @TenantId() tenantId: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('accountId') accountId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.accountingService.findAll(tenantId, {
      type, from, to, accountId,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('transactions/:id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.accountingService.findOne(id, tenantId);
  }

  @Post('transactions')
  @Roles('admin', 'staff', 'accountant')
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTransactionDto,
  ) {
    const txn = await this.accountingService.create(tenantId, dto, user.id);
    await this.auditService.log({
      tenantId, userId: user.id,
      action: 'CREATE', resource: 'transactions',
      resourceId: txn.id,
      newValues: { type: txn.type, amount: txn.amount, description: txn.description },
    });
    return txn;
  }

  @Put('transactions/:id')
  @Roles('admin', 'accountant')
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateTransactionDto>,
  ) {
    const before = await this.accountingService.findOne(id, tenantId);
    const txn = await this.accountingService.update(id, tenantId, dto);
    await this.auditService.log({
      tenantId, userId: user.id,
      action: 'UPDATE', resource: 'transactions',
      resourceId: id, oldValues: before, newValues: dto,
    });
    return txn;
  }

  @Delete('transactions/:id')
  @Roles('admin', 'accountant')
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.accountingService.remove(id, tenantId);
    await this.auditService.log({
      tenantId, userId: user.id,
      action: 'DELETE', resource: 'transactions', resourceId: id,
    });
    return result;
  }
}
