import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class MarkPaidDto {
  @ApiProperty({ enum: ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'] })
  @IsIn(['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'])
  paymentMethod: string;
}
