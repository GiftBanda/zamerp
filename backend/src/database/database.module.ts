import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DATABASE_TOKEN = 'DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          database: configService.get('DB_NAME', 'zamerp'),
          user: configService.get('DB_USER', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
