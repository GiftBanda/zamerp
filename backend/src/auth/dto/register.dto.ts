import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  // Tenant info
  @ApiProperty({ example: 'Acme Corporation Ltd' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'acme-corp', description: 'Unique URL-safe identifier' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  tenantSlug: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Zambia TPIN number' })
  @IsOptional()
  @IsString()
  tpin?: string;

  @ApiPropertyOptional({ example: '987654321', description: 'VAT Registration Number' })
  @IsOptional()
  @IsString()
  vrn?: string;

  // Admin user info
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
