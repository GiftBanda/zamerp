import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PdfService } from './pdf.service';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule, AuditModule],
  providers: [InvoicesService, PdfService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
