import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(tenantId: string, search?: string) {
    const conditions = [eq(schema.customers.tenantId, tenantId)];
    if (search) {
      conditions.push(ilike(schema.customers.name, `%${search}%`));
    }

    return this.db
      .select()
      .from(schema.customers)
      .where(and(...conditions))
      .orderBy(desc(schema.customers.createdAt));
  }

  async findOne(id: string, tenantId: string) {
    const [customer] = await this.db
      .select()
      .from(schema.customers)
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)))
      .limit(1);

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(tenantId: string, data: Omit<typeof schema.customers.$inferInsert, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) {
    const [customer] = await this.db
      .insert(schema.customers)
      .values({ ...data, tenantId })
      .returning();
    return customer;
  }

  async update(id: string, tenantId: string, data: Partial<typeof schema.customers.$inferInsert>) {
    const [customer] = await this.db
      .update(schema.customers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)))
      .returning();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async remove(id: string, tenantId: string) {
    const [customer] = await this.db
      .update(schema.customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenantId)))
      .returning();
    if (!customer) throw new NotFoundException('Customer not found');
    return { success: true };
  }

  async getStats(tenantId: string) {
    const [stats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${schema.customers.isActive} = true)`,
      })
      .from(schema.customers)
      .where(eq(schema.customers.tenantId, tenantId));
    return stats;
  }
}
