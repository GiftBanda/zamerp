import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

const DEFAULT_CATEGORY_SEED = [
  { name: 'Office Supplies', description: 'General office and stationery items.' },
  { name: 'Electronics', description: 'Computers, accessories, and electronic equipment.' },
  { name: 'Furniture', description: 'Office and business furniture.' },
  { name: 'Raw Materials', description: 'Input materials used in production.' },
  { name: 'Finished Goods', description: 'Products ready for sale.' },
  { name: 'Services', description: 'Non-stock service offerings.' },
  { name: 'Maintenance', description: 'Repair and maintenance items.' },
  { name: 'Utilities', description: 'Power, water, and utility-related items.' },
  { name: 'Fuel & Transport', description: 'Fuel and transportation-related items.' },
  { name: 'Miscellaneous', description: 'Items that do not fit other categories.' },
];

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findByEmailAndTenant(email: string, tenantSlug: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .innerJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id))
      .where(
        and(
          eq(schema.users.email, email),
          eq(schema.tenants.slug, tenantSlug),
        ),
      )
      .limit(1);

    if (!result.length) return null;
    return { ...result[0].users, tenantSlug };
  }

  async findById(id: string) {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        tenantId: schema.users.tenantId,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user || null;
  }

  async findAllByTenant(tenantId: string) {
    return this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.tenantId, tenantId));
  }

  async createWithTenant(data: {
    companyName: string;
    tenantSlug: string;
    tpin?: string;
    vrn?: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    // Check tenant slug uniqueness
    const existing = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, data.tenantSlug))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('Tenant slug already taken');
    }

    // Create tenant
    const [tenant] = await this.db
      .insert(schema.tenants)
      .values({
        name: data.companyName,
        slug: data.tenantSlug,
        tpin: data.tpin,
        vrn: data.vrn,
      })
      .returning();

    // Create admin user
    const [user] = await this.db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: 'admin',
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
      });

    // Seed default accounts chart
    await this.seedDefaultAccounts(tenant.id);
    await this.seedDefaultCategories(tenant.id);

    return { tenant, user };
  }

  async create(tenantId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }) {
    const existing = await this.db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, data.email), eq(schema.users.tenantId, tenantId)))
      .limit(1);

    if (existing.length) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const [user] = await this.db
      .insert(schema.users)
      .values({ tenantId, ...data, passwordHash, role: data.role as any })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        isActive: schema.users.isActive,
      });
    return user;
  }

  async update(id: string, tenantId: string, data: Partial<{
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }>) {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...data as any, updatedAt: new Date() })
      .where(and(eq(schema.users.id, id), eq(schema.users.tenantId, tenantId)))
      .returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateLastLogin(id: string) {
    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, id));
  }

  private async seedDefaultAccounts(tenantId: string) {
    const defaults = [
      { code: '1000', name: 'Cash', type: 'asset' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset' },
      { code: '1200', name: 'Inventory', type: 'asset' },
      { code: '2000', name: 'Accounts Payable', type: 'liability' },
      { code: '2100', name: 'VAT Payable', type: 'liability' },
      { code: '3000', name: 'Owner Equity', type: 'equity' },
      { code: '4000', name: 'Sales Revenue', type: 'income' },
      { code: '4100', name: 'Service Revenue', type: 'income' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
      { code: '5100', name: 'Salaries & Wages', type: 'expense' },
      { code: '5200', name: 'Rent & Utilities', type: 'expense' },
      { code: '5300', name: 'Marketing & Advertising', type: 'expense' },
      { code: '5400', name: 'Other Operating Expenses', type: 'expense' },
    ];

    await this.db.insert(schema.accounts).values(
      defaults.map(a => ({ ...a, tenantId })),
    );
  }

  private async seedDefaultCategories(tenantId: string) {
    await this.db.insert(schema.inventoryCategories).values(
      DEFAULT_CATEGORY_SEED.map(category => ({ ...category, tenantId })),
    );
  }
}
