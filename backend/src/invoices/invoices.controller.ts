import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested,
  IsIn, Min, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { AuditService } from '../audit/audit.service';

class InvoiceItemDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0.001) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountPercent?: number;
  @ApiPropertyOptional({ default: 16 }) @IsOptional() @IsNumber() vatRate?: number;
}

class CreateInvoiceDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountPercent?: number;
  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}

class MarkPaidDto {
  @ApiProperty({ enum: ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'] })
  @IsIn(['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'])
  paymentMethod: string;
}

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
    private auditService: AuditService,
  ) {}

  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.invoicesService.getStats(tenantId);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.invoicesService.findAll(tenantId, { status, customerId, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download ZRA-ready invoice as PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOne(id, tenantId);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);

    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'EXPORT',
      resource: 'invoices',
      resourceId: id,
      metadata: { format: 'pdf', invoiceNumber: invoice.invoiceNumber },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Post()
  @Roles('admin', 'staff', 'accountant')
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateInvoiceDto,
  ) {
    const invoice = await this.invoicesService.create(tenantId, dto, user.id);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'CREATE',
      resource: 'invoices',
      resourceId: invoice.id,
      newValues: { invoiceNumber: invoice.invoiceNumber, total: invoice.total },
    });
    return invoice;
  }

  @Put(':id')
  @Roles('admin', 'staff', 'accountant')
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateInvoiceDto>,
  ) {
    const before = await this.invoicesService.findOne(id, tenantId);
    const invoice = await this.invoicesService.update(id, tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'UPDATE',
      resource: 'invoices',
      resourceId: id,
      oldValues: { status: before.status, total: before.total },
      newValues: { total: invoice.total },
    });
    return invoice;
  }

  @Post(':id/send')
  @Roles('admin', 'staff', 'accountant')
  async send(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.invoicesService.markAsSent(id, tenantId);
    await this.auditService.log({
      tenantId, userId: user.id, action: 'UPDATE',
      resource: 'invoices', resourceId: id,
      newValues: { status: 'sent' },
    });
    return result;
  }

  @Post(':id/pay')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Mark invoice as paid — auto-updates inventory' })
  async markPaid(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: MarkPaidDto,
  ) {
    const invoice = await this.invoicesService.markAsPaid(id, tenantId, dto.paymentMethod, user.id);
    await this.auditService.log({
      tenantId, userId: user.id, action: 'UPDATE',
      resource: 'invoices', resourceId: id,
      newValues: { status: 'paid', paymentMethod: dto.paymentMethod },
    });
    return invoice;
  }

  @Post(':id/void')
  @Roles('admin')
  async void(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.invoicesService.voidInvoice(id, tenantId, user.id);
    await this.auditService.log({
      tenantId, userId: user.id, action: 'UPDATE',
      resource: 'invoices', resourceId: id,
      newValues: { status: 'void' },
    });
    return result;
  }
}
