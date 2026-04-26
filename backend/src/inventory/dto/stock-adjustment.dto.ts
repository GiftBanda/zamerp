import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StockAdjustmentDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ enum: ['in', 'out', 'adjustment'] })
  @IsIn(['in', 'out', 'adjustment'])
  type: 'in' | 'out' | 'adjustment';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
