import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe with transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS for Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('ZamERP API')
    .setDescription('Mini ERP System for Zambian SMEs - ZRA-Ready')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('tenants', 'Multi-tenant management')
    .addTag('users', 'User management')
    .addTag('customers', 'Customer management')
    .addTag('inventory', 'Inventory management')
    .addTag('invoices', 'Invoice management (ZRA-ready)')
    .addTag('accounting', 'Basic accounting')
    .addTag('reports', 'Reports & analytics')
    .addTag('audit', 'Audit logs')
    .addTag('zra', 'ZRA Smart Invoice VSDC integration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 ZamERP Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
