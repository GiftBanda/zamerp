import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsIn, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, TenantId, CurrentUser } from '../common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { AuditService } from '../audit/audit.service';

class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiProperty() @IsNumber() costPrice: number;
  @ApiProperty() @IsNumber() sellingPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() vatExempt?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() reorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
}

class StockAdjustmentDto {
  @ApiProperty() @IsNumber() @Min(0.001) quantity: number;
  @ApiProperty({ enum: ['in', 'out', 'adjustment'] })
  @IsIn(['in', 'out', 'adjustment']) type: 'in' | 'out' | 'adjustment';
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private auditService: AuditService,
  ) {}

  // Stats
  @Get('stats')
  getStats(@TenantId() tenantId: string) {
    return this.inventoryService.getInventoryStats(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products at or below reorder level' })
  getLowStock(@TenantId() tenantId: string) {
    return this.inventoryService.getLowStockProducts(tenantId);
  }

  // Products
  @Get('products')
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.inventoryService.findAllProducts(tenantId, search, categoryId);
  }

  @Get('products/:id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.inventoryService.findOneProduct(id, tenantId);
  }

  @Post('products')
  @Roles('admin', 'staff')
  async createProduct(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.inventoryService.createProduct(tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'CREATE',
      resource: 'products',
      resourceId: product.id,
      newValues: dto,
    });
    return product;
  }

  @Put('products/:id')
  @Roles('admin', 'staff')
  async updateProduct(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateProductDto>,
  ) {
    const before = await this.inventoryService.findOneProduct(id, tenantId);
    const product = await this.inventoryService.updateProduct(id, tenantId, dto);
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'UPDATE',
      resource: 'products',
      resourceId: id,
      oldValues: before,
      newValues: dto,
    });
    return product;
  }

  // Stock movements
  @Post('products/:id/adjust')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Adjust stock level for a product' })
  async adjustStock(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: StockAdjustmentDto,
  ) {
    const movement = await this.inventoryService.adjustStock(
      tenantId, id, dto.quantity, dto.type, dto.reference, undefined, dto.notes, user.id,
    );
    await this.auditService.log({
      tenantId,
      userId: user.id,
      action: 'UPDATE',
      resource: 'inventory',
      resourceId: id,
      newValues: dto,
    });
    return movement;
  }

  @Get('movements')
  getMovements(
    @TenantId() tenantId: string,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.getStockMovements(tenantId, productId);
  }

  // Categories
  @Get('categories')
  findCategories(@TenantId() tenantId: string) {
    return this.inventoryService.findAllCategories(tenantId);
  }

  @Post('categories')
  @Roles('admin')
  createCategory(
    @TenantId() tenantId: string,
    @Body() dto: { name: string; description?: string },
  ) {
    return this.inventoryService.createCategory(tenantId, dto);
  }
}
