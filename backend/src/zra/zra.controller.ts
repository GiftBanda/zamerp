import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles, TenantId } from '../common/decorators/current-user.decorator';
import { ZraInvoicePayloadSource, ZraVsdcService } from './zra-vsdc.service';
import { ZraDiagnosticRequestDto } from './dto';

@ApiTags('zra')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zra')
export class ZraController {
  constructor(private readonly zraVsdcService: ZraVsdcService) {}

  @Post('diagnostics/preview-sale')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Preview ZRA sale payload with resolved VSDC codes' })
  previewSale(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: ZraDiagnosticRequestDto,
  ) {
    return this.zraVsdcService.previewSaleSubmission(dto.source as unknown as ZraInvoicePayloadSource, tenantId, user.id);
  }

  @Post('diagnostics/test-sale')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Submit test sale to VSDC and return request/response details' })
  testSale(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: ZraDiagnosticRequestDto,
  ) {
    return this.zraVsdcService.submitSaleInvoice(dto.source as unknown as ZraInvoicePayloadSource, tenantId, user.id);
  }

  @Post('code-tables/sync')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Sync VSDC code tables and refresh active payload code cache' })
  syncCodeTables(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.zraVsdcService.syncCodeTables(tenantId, user.id);
  }

  @Get('code-tables/current')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Get current in-memory VSDC code cache and active payload codes' })
  getCurrentCodes() {
    return this.zraVsdcService.getCurrentCodeCache();
  }
}
