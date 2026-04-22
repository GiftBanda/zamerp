import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get full dashboard summary with KPIs' })
  getDashboard(@TenantId() tenantId: string) {
    return this.reportsService.getDashboardSummary(tenantId);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss statement for a period' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getProfitLoss(
    @TenantId() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reportsService.getProfitLoss(tenantId, from, to);
  }

  @Get('aging')
  @ApiOperation({ summary: 'Accounts receivable aging report' })
  getAging(@TenantId() tenantId: string) {
    return this.reportsService.getAgingReport(tenantId);
  }
}
