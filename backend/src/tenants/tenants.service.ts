import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string) {
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, id))
      .limit(1);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, data: Partial<{
    name: string;
    tpin: string;
    vrn: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    currency: string;
    vatRate: number;
  }>) {
    const [tenant] = await this.db
      .update(schema.tenants)
      .set({ ...data as any, updatedAt: new Date() })
      .where(eq(schema.tenants.id, id))
      .returning();
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
