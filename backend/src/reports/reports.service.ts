import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getDashboardSummary(tenantId: string) {
    // Revenue this month vs last month
    const now = new Date();
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonth] = await this.db
      .select({
        revenue: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'income'), 0)`,
        expenses: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'expense'), 0)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, tenantId),
          gte(schema.transactions.date, firstThisMonth),
        ),
      );

    const [lastMonth] = await this.db
      .select({
        revenue: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'income'), 0)`,
        expenses: sql<number>`coalesce(sum(${schema.transactions.amount}::numeric) filter (where ${schema.transactions.type} = 'expense'), 0)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, tenantId),
          gte(schema.transactions.date, firstLastMonth),
          lte(schema.transactions.date, lastLastMonth),
        ),
      );

    // Invoice stats
    const [invoiceStats] = await this.db
      .select({
        totalInvoices: sql<number>`count(*)`,
        paidInvoices: sql<number>`count(*) filter (where ${schema.invoices.status} = 'paid')`,
        overdueInvoices: sql<number>`count(*) filter (where ${schema.invoices.status} = 'overdue')`,
        outstandingAmount: sql<number>`coalesce(sum(${schema.invoices.total}::numeric) filter (where ${schema.invoices.status} in ('sent','overdue')), 0)`,
        paidAmount: sql<number>`coalesce(sum(${schema.invoices.total}::numeric) filter (where ${schema.invoices.status} = 'paid'), 0)`,
      })
      .from(schema.invoices)
      .where(eq(schema.invoices.tenantId, tenantId));

    // Customer count
    const [customerStats] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.customers)
      .where(and(eq(schema.customers.tenantId, tenantId), eq(schema.customers.isActive, true)));

    // Inventory stats
    const [inventoryStats] = await this.db
      .select({
        totalProducts: sql<number>`count(*)`,
        lowStock: sql<number>`count(*) filter (where ${schema.products.quantityOnHand}::numeric <= ${schema.products.reorderLevel}::numeric)`,
        totalValue: sql<number>`coalesce(sum(${schema.products.quantityOnHand}::numeric * ${schema.products.costPrice}::numeric), 0)`,
      })
      .from(schema.products)
      .where(and(eq(schema.products.tenantId, tenantId), eq(schema.products.isActive, true)));

    // Top 5 customers by invoice amount
    const topCustomers = await this.db
      .select({
        customerId: schema.invoices.customerId,
        customerName: schema.customers.name,
        totalBilled: sql<number>`sum(${schema.invoices.total}::numeric)`,
        invoiceCount: sql<number>`count(*)`,
      })
      .from(schema.invoices)
      .leftJoin(schema.customers, eq(schema.invoices.customerId, schema.customers.id))
      .where(
        and(eq(schema.invoices.tenantId, tenantId), eq(schema.invoices.status, 'paid')),
      )
      .groupBy(schema.invoices.customerId, schema.customers.name)
      .orderBy(sql`sum(${schema.invoices.total}::numeric) desc`)
      .limit(5);

    // Monthly revenue chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenue = await this.db
      .select({
        month: sql<string>`to_char(${schema.invoices.issueDate}, 'Mon YYYY')`,
        monthNum: sql<number>`extract(month from ${schema.invoices.issueDate})`,
        year: sql<number>`extract(year from ${schema.invoices.issueDate})`,
        revenue: sql<number>`coalesce(sum(${schema.invoices.total}::numeric) filter (where ${schema.invoices.status} = 'paid'), 0)`,
        invoices: sql<number>`count(*)`,
      })
      .from(schema.invoices)
      .where(
        and(
          eq(schema.invoices.tenantId, tenantId),
          gte(schema.invoices.issueDate, sixMonthsAgo),
        ),
      )
      .groupBy(
        sql`to_char(${schema.invoices.issueDate}, 'Mon YYYY')`,
        sql`extract(month from ${schema.invoices.issueDate})`,
        sql`extract(year from ${schema.invoices.issueDate})`,
      )
      .orderBy(
        sql`extract(year from ${schema.invoices.issueDate})`,
        sql`extract(month from ${schema.invoices.issueDate})`,
      );

    return {
      revenue: {
        thisMonth: Number(thisMonth.revenue),
        lastMonth: Number(lastMonth.revenue),
        change: lastMonth.revenue > 0
          ? ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100
          : 0,
      },
      expenses: {
        thisMonth: Number(thisMonth.expenses),
        lastMonth: Number(lastMonth.expenses),
      },
      netProfit: {
        thisMonth: Number(thisMonth.revenue) - Number(thisMonth.expenses),
      },
      invoices: invoiceStats,
      customers: customerStats,
      inventory: inventoryStats,
      topCustomers,
      monthlyRevenue,
    };
  }

  async getProfitLoss(tenantId: string, from: string, to: string) {
    const incomeByCategory = await this.db
      .select({
        category: schema.transactions.category,
        total: sql<number>`sum(${schema.transactions.amount}::numeric)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, tenantId),
          eq(schema.transactions.type, 'income'),
          gte(schema.transactions.date, new Date(from)),
          lte(schema.transactions.date, new Date(to)),
        ),
      )
      .groupBy(schema.transactions.category);

    const expenseByCategory = await this.db
      .select({
        category: schema.transactions.category,
        total: sql<number>`sum(${schema.transactions.amount}::numeric)`,
      })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.tenantId, tenantId),
          eq(schema.transactions.type, 'expense'),
          gte(schema.transactions.date, new Date(from)),
          lte(schema.transactions.date, new Date(to)),
        ),
      )
      .groupBy(schema.transactions.category);

    const totalIncome = incomeByCategory.reduce((s, r) => s + Number(r.total), 0);
    const totalExpenses = expenseByCategory.reduce((s, r) => s + Number(r.total), 0);

    return {
      period: { from, to },
      income: { items: incomeByCategory, total: totalIncome },
      expenses: { items: expenseByCategory, total: totalExpenses },
      grossProfit: totalIncome,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    };
  }

  async getAgingReport(tenantId: string) {
    const now = new Date();
    const invoices = await this.db
      .select({
        id: schema.invoices.id,
        invoiceNumber: schema.invoices.invoiceNumber,
        dueDate: schema.invoices.dueDate,
        total: schema.invoices.total,
        amountPaid: schema.invoices.amountPaid,
        status: schema.invoices.status,
        customerName: schema.customers.name,
      })
      .from(schema.invoices)
      .leftJoin(schema.customers, eq(schema.invoices.customerId, schema.customers.id))
      .where(
        and(
          eq(schema.invoices.tenantId, tenantId),
          sql`${schema.invoices.status} in ('sent', 'overdue')`,
        ),
      );

    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const items = invoices.map(inv => {
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      const outstanding = Number(inv.total) - Number(inv.amountPaid);
      let ageDays = 0;
      if (due) ageDays = Math.floor((now.getTime() - due.getTime()) / 86400000);

      const bucket = !due || ageDays <= 0 ? 'current'
        : ageDays <= 30 ? '1-30'
        : ageDays <= 60 ? '31-60'
        : ageDays <= 90 ? '61-90' : '90+';

      buckets[bucket] += outstanding;
      return { ...inv, outstanding, ageDays, bucket };
    });

    return { items, buckets, total: Object.values(buckets).reduce((s, v) => s + v, 0) };
  }
}
