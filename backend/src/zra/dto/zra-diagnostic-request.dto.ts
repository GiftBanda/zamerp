import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ZraDiagnosticInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @IsNumber()
  total: number;
}

export class ZraDiagnosticInvoiceSourceDto {
  @IsString()
  invoiceNumber: string;

  @IsDateString()
  issueDate: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  vatAmount: number;

  @IsNumber()
  total: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZraDiagnosticInvoiceItemDto)
  items: ZraDiagnosticInvoiceItemDto[];
}

export class ZraDiagnosticRequestDto {
  @ValidateNested()
  @Type(() => ZraDiagnosticInvoiceSourceDto)
  source: ZraDiagnosticInvoiceSourceDto;
}
