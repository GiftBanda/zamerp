import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

@Module({
  imports: [AuditModule],
  providers: [AccountingService],
  controllers: [AccountingController],
  exports: [AccountingService],
})
export class AccountingModule {}
