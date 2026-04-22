import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

@Injectable()
export class AccountingService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Accounts (Chart of Accounts) ───────────────
  async getAccounts(tenantId: string) {
    return this.db
      .select()
      .from(schema.accounts)
      .where(and(eq(schema.accounts.tenantId, tenantId), eq(schema.accounts.isActive, true)))
      .orderBy(schema.accounts.code);
  }

  async createAccount(tenantId: string, data: {
    code: string;
    name: string;
    type: string;
    parentId?: string;
  }) {
    const [account] = await this.db
      .insert(schema.accounts)
      .values({ ...data, tenantId })
      .returning();
    return account;
  }

  // ── Transactions ───────────────────────────────
  async findAll(tenantId: string, filters?: {
    type?: string;
    from?: string;
    to?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(schema.transactions.tenantId, tenantId)];
    if (filters?.type) conditions.push(eq(schema.transactions.type, filters.type as any));
    if (filters?.accountId) conditions.push(eq(schema.transactions.accountId, filters.accountId));
    if (filters?.from) conditions.push(gte(schema.transactions.date, new Date(filters.from)));
    if (filters?.to) conditions.push(lte(schema.transactions.date, new Date(filters.to)));

    return this.db
      .select({
        id: schema.transactions.id,
        type: schema.transactions.type,
        category: schema.transactions.category,
        description: schema.transactions.description,
        amount: schema.transactions.amount,
        date: schema.transactions.date,
        reference: schema.transactions.reference,
        paymentMethod: schema.transactions.paymentMethod,
        notes: schema.transactions.notes,
        createdAt: schema.transactions.createdAt,
        account: {
          id: schema.accounts.id,
          name: schema.accounts.name,
          code: schema.accounts.code,
        },
      })
      .from(schema.transactions)
      .leftJoin(schema.accounts, eq(schema.transactions.accountId, schema.accounts.id))
      .where(and(...conditions))
      .orderBy(desc(schema.transactions.date))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
  }

  async findOne(id: string, tenantId: string) {
    const [txn] = await this.db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenantId)))
      .limit(1);
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }

  async create(tenantId: string, data: {
    type: 'income' | 'expense' | 'transfer';
    accountId?: string;
    category?: string;
    description: string;
    amount: number;
    date: string;
    reference?: string;
    invoiceId?: string;
    paymentMethod?: string;
    notes?: string;
  }, userId?: string) {
    const [txn] = await this.db
      .insert(schema.transactions)
      .values({
        ...data,
        tenantId,
        amount: data.amount.toFixed(2),
        date: new Date(data.date),
        type: data.type as any,
        paymentMethod: data.paymentMethod as any,
        createdBy: userId,
      })
      .returning();
    return txn;
  }

  async update(id: string, tenantId: string, data: any) {
    const [txn] = await this.db
      .update(schema.transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenantId)))
      .returning();
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }

  async remove(id: string, tenantId: string) {
    const [txn] = await this.db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenantId)))
      .returning();
    if (!txn) throw new NotFoundException('Transaction not found');
    return { success: true };
  }

  // ── Summary / P&L ─────────────────────────────
  async getSummary(tenantId: string, from?: string, to?: string) {
    const conditions = [eq(schema.transactions.tenantId, tenantId)];
    if (from) conditions.push(gte(schema.transactions.date, new Date(from)));
    if (to) conditions.push(lte(schema.transactions.date, new Date(to)));

    const [summary] = await this.db
      .select({
        totalIncome: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'income'), 0)`,
        totalExpenses: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'expense'), 0)`,
        netProfit: sql<number>`
          coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'income'), 0) -
          coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'expense'), 0)
        `,
      })
      .from(schema.transactions)
      .where(and(...conditions));

    return summary;
  }

  // ── Monthly breakdown ─────────────────────────
  async getMonthlyBreakdown(tenantId: string, year: number) {
    return this.db
      .select({
        month: sql<number>`extract(month from ${schema.transactions.date})`,
        type: schema.transactions.type,
        total: sql<number>`sum(${schema.transactions.amount}::numeric)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, tenantId),
          sql`extract(year from ${schema.transactions.date}) = ${year}`,
        ),
      )
      .groupBy(
        sql`extract(month from ${schema.transactions.date})`,
        schema.transactions.type,
      )
      .orderBy(sql`extract(month from ${schema.transactions.date})`);
  }

  // ── Category breakdown ────────────────────────
  async getCategoryBreakdown(tenantId: string, type: string, from?: string, to?: string) {
    const conditions = [
      eq(schema.transactions.tenantId, tenantId),
      eq(schema.transactions.type, type as any),
    ];
    if (from) conditions.push(gte(schema.transactions.date, new Date(from)));
    if (to) conditions.push(lte(schema.transactions.date, new Date(to)));

    return this.db
      .select({
        category: schema.transactions.category,
        total: sql<number>`sum(${schema.transactions.amount}::numeric)`,
        count: sql<number>`count(*)`,
      })
      .from(schema.transactions)
      .where(and(...conditions))
      .groupBy(schema.transactions.category)
      .orderBy(sql`sum(${schema.transactions.amount}::numeric) desc`);
  }
}
