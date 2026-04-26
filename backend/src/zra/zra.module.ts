import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ZraController } from './zra.controller';
import { ZraVsdcService } from './zra-vsdc.service';

@Module({
  imports: [AuditModule],
  providers: [ZraVsdcService],
  controllers: [ZraController],
  exports: [ZraVsdcService],
})
export class ZraModule {}
