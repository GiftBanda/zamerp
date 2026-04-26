import {
  Injectable, Inject, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, gte, lte, sql, inArray } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import { InventoryService } from '../inventory/inventory.service';
import { ZraVsdcService } from '../zra/zra-vsdc.service';
import * as schema from '../database/schema';

export interface CreateInvoiceDto {
  customerId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  discountPercent?: number;
  paymentMethod?: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    vatRate?: number;
  }[];
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
    private inventoryService: InventoryService,
    private readonly zraVsdcService: ZraVsdcService,
    private readonly configService: ConfigService,
  ) {}

  // ── Number generation ───────────────────────────
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.invoices)
      .where(eq(schema.invoices.tenantId, tenantId));

    const seq = (Number(result.count) + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `INV-${year}-${seq}`;
  }

  private generateFallbackZraInvoiceNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    return `ZRA-${ts}`;
  }

  private generateFallbackZraVerificationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // ── Totals calculation ──────────────────────────
  private calculateTotals(items: CreateInvoiceDto['items'], discountPercent = 0) {
    let subtotal = 0;
    let vatAmount = 0;

    const calculatedItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineDiscount = lineTotal * ((item.discountPercent || 0) / 100);
      const lineAfterDiscount = lineTotal - lineDiscount;
      const vatRate = item.vatRate ?? 16;
      const lineVat = lineAfterDiscount * (vatRate / 100);
      const lineWithVat = lineAfterDiscount + lineVat;

      subtotal += lineAfterDiscount;
      vatAmount += lineVat;

      return {
        ...item,
        vatRate,
        vatAmount: lineVat,
        total: lineWithVat,
      };
    });

    const discountAmount = subtotal * (discountPercent / 100);
    const adjustedSubtotal = subtotal - discountAmount;
    const total = adjustedSubtotal + vatAmount;

    return { calculatedItems, subtotal, vatAmount, discountAmount, total };
  }

  async findAll(tenantId: string, filters?: {
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }) {
    const conditions = [eq(schema.invoices.tenantId, tenantId)];
    if (filters?.status) conditions.push(eq(schema.invoices.status, filters.status as any));
    if (filters?.customerId) conditions.push(eq(schema.invoices.customerId, filters.customerId));
    if (filters?.from) conditions.push(gte(schema.invoices.issueDate, new Date(filters.from)));
    if (filters?.to) conditions.push(lte(schema.invoices.issueDate, new Date(filters.to)));

    return this.db
      .select({
        id: schema.invoices.id,
        invoiceNumber: schema.invoices.invoiceNumber,
        zraInvoiceNumber: schema.invoices.zraInvoiceNumber,
        status: schema.invoices.status,
        issueDate: schema.invoices.issueDate,
        dueDate: schema.invoices.dueDate,
        subtotal: schema.invoices.subtotal,
        vatAmount: schema.invoices.vatAmount,
        discountAmount: schema.invoices.discountAmount,
        total: schema.invoices.total,
        amountPaid: schema.invoices.amountPaid,
        createdAt: schema.invoices.createdAt,
        customer: {
          id: schema.customers.id,
          name: schema.customers.name,
          email: schema.customers.email,
          tpin: schema.customers.tpin,
        },
      })
      .from(schema.invoices)
      .leftJoin(schema.customers, eq(schema.invoices.customerId, schema.customers.id))
      .where(and(...conditions))
      .orderBy(desc(schema.invoices.createdAt));
  }

  async findOne(id: string, tenantId: string) {
    const [invoice] = await this.db
      .select()
      .from(schema.invoices)
      .leftJoin(schema.customers, eq(schema.invoices.customerId, schema.customers.id))
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.tenantId, tenantId)))
      .limit(1);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const items = await this.db
      .select({
        id: schema.invoiceItems.id,
        description: schema.invoiceItems.description,
        quantity: schema.invoiceItems.quantity,
        unitPrice: schema.invoiceItems.unitPrice,
        discountPercent: schema.invoiceItems.discountPercent,
        vatRate: schema.invoiceItems.vatRate,
        vatAmount: schema.invoiceItems.vatAmount,
        total: schema.invoiceItems.total,
        sortOrder: schema.invoiceItems.sortOrder,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
        },
      })
      .from(schema.invoiceItems)
      .leftJoin(schema.products, eq(schema.invoiceItems.productId, schema.products.id))
      .where(eq(schema.invoiceItems.invoiceId, id))
      .orderBy(schema.invoiceItems.sortOrder);

    // Also get tenant for ZRA header
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId))
      .limit(1);

    return { ...invoice.invoices, customer: invoice.customers, items, tenant };
  }

  async create(tenantId: string, dto: CreateInvoiceDto, userId?: string) {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const { calculatedItems, subtotal, vatAmount, discountAmount, total } =
      this.calculateTotals(dto.items, dto.discountPercent || 0);

    const useFallbackZraValues =
      this.configService.get<string>('ZRA_VSDC_USE_FALLBACK_VALUES', 'true') === 'true';

    const [invoice] = await this.db
      .insert(schema.invoices)
      .values({
        tenantId,
        customerId: dto.customerId,
        invoiceNumber,
        zraInvoiceNumber: useFallbackZraValues ? this.generateFallbackZraInvoiceNumber() : null,
        zraVerificationCode: useFallbackZraValues ? this.generateFallbackZraVerificationCode() : null,
        status: 'draft',
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal: subtotal.toFixed(2),
        discountPercent: (dto.discountPercent || 0).toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        total: total.toFixed(2),
        notes: dto.notes,
        terms: dto.terms,
        createdBy: userId,
      })
      .returning();

    // Insert line items
    if (calculatedItems.length) {
      await this.db.insert(schema.invoiceItems).values(
        calculatedItems.map((item, i) => ({
          invoiceId: invoice.id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toFixed(2),
          discountPercent: (item.discountPercent || 0).toFixed(2),
          vatRate: item.vatRate.toFixed(2),
          vatAmount: item.vatAmount.toFixed(2),
          total: item.total.toFixed(2),
          sortOrder: i,
        })),
      );
    }

    const createdInvoice = await this.findOne(invoice.id, tenantId);
    const zraResult = await this.zraVsdcService.submitSaleInvoice(createdInvoice as any, tenantId, userId);

    if (zraResult.success) {
      await this.db
        .update(schema.invoices)
        .set({
          zraInvoiceNumber: zraResult.zraInvoiceNumber || createdInvoice.zraInvoiceNumber,
          zraVerificationCode: zraResult.zraVerificationCode || createdInvoice.zraVerificationCode,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.invoices.id, invoice.id), eq(schema.invoices.tenantId, tenantId)));

      return this.findOne(invoice.id, tenantId);
    }

    // In strict mode, rollback invoice creation if VSDC submission fails.
    if (this.zraVsdcService.isEnabled() && this.zraVsdcService.isStrictMode()) {
      await this.db
        .delete(schema.invoices)
        .where(and(eq(schema.invoices.id, invoice.id), eq(schema.invoices.tenantId, tenantId)));

      throw new BadRequestException(
        `Failed to submit invoice to ZRA Smart Invoice: ${zraResult.resultMessage || 'unknown error'}`,
      );
    }

    return createdInvoice;
  }

  async update(id: string, tenantId: string, dto: Partial<CreateInvoiceDto>) {
    const existing = await this.findOne(id, tenantId);
    if (['paid', 'void'].includes(existing.status)) {
      throw new BadRequestException('Cannot edit a paid or voided invoice');
    }

    const updateData: any = {};
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.terms !== undefined) updateData.terms = dto.terms;

    if (dto.items) {
      const { calculatedItems, subtotal, vatAmount, discountAmount, total } =
        this.calculateTotals(dto.items, dto.discountPercent || 0);

      updateData.subtotal = subtotal.toFixed(2);
      updateData.vatAmount = vatAmount.toFixed(2);
      updateData.discountAmount = discountAmount.toFixed(2);
      updateData.total = total.toFixed(2);

      // Replace items
      await this.db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id));
      await this.db.insert(schema.invoiceItems).values(
        calculatedItems.map((item, i) => ({
          invoiceId: id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toFixed(2),
          discountPercent: (item.discountPercent || 0).toFixed(2),
          vatRate: item.vatRate.toFixed(2),
          vatAmount: item.vatAmount.toFixed(2),
          total: item.total.toFixed(2),
          sortOrder: i,
        })),
      );
    }

    updateData.updatedAt = new Date();
    await this.db
      .update(schema.invoices)
      .set(updateData)
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.tenantId, tenantId)));

    return this.findOne(id, tenantId);
  }

  // ── Status transitions ──────────────────────────
  async markAsSent(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be sent');
    }
    await this.db
      .update(schema.invoices)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(schema.invoices.id, id));
    return { success: true };
  }

  async markAsPaid(id: string, tenantId: string, paymentMethod: string, userId?: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.status === 'paid') throw new BadRequestException('Invoice already paid');
    if (invoice.status === 'void') throw new BadRequestException('Cannot pay a voided invoice');

    await this.db
      .update(schema.invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
        amountPaid: invoice.total,
        paymentMethod: paymentMethod as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.invoices.id, id));

    // ⚡ Auto-deduct inventory for all product items
    for (const item of invoice.items) {
      if (item.product?.id) {
        await this.inventoryService.adjustStock(
          tenantId,
          item.product.id,
          Number(item.quantity),
          'out',
          invoice.invoiceNumber,
          invoice.id,
          `Auto-deducted on invoice payment: ${invoice.invoiceNumber}`,
          userId,
        );
      }
    }

    return this.findOne(id, tenantId);
  }

  async voidInvoice(id: string, tenantId: string, userId?: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.status === 'void') throw new BadRequestException('Already voided');

    // If was paid, reverse inventory
    if (invoice.status === 'paid') {
      for (const item of invoice.items) {
        if (item.product?.id) {
          await this.inventoryService.adjustStock(
            tenantId,
            item.product.id,
            Number(item.quantity),
            'in',
            invoice.invoiceNumber,
            invoice.id,
            `Inventory reversed: voided invoice ${invoice.invoiceNumber}`,
            userId,
          );
        }
      }
    }

    await this.db
      .update(schema.invoices)
      .set({ status: 'void', updatedAt: new Date() })
      .where(eq(schema.invoices.id, id));

    return { success: true };
  }

  async getStats(tenantId: string) {
    const [stats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        draft: sql<number>`count(*) filter (where ${schema.invoices.status} = 'draft')`,
        sent: sql<number>`count(*) filter (where ${schema.invoices.status} = 'sent')`,
        paid: sql<number>`count(*) filter (where ${schema.invoices.status} = 'paid')`,
        overdue: sql<number>`count(*) filter (where ${schema.invoices.status} = 'overdue')`,
        totalRevenue: sql<number>`coalesce(sum(${schema.invoices.total}::numeric) filter (where ${schema.invoices.status} = 'paid'), 0)`,
        outstanding: sql<number>`coalesce(sum(${schema.invoices.total}::numeric) filter (where ${schema.invoices.status} in ('sent', 'overdue')), 0)`,
      })
      .from(schema.invoices)
      .where(eq(schema.invoices.tenantId, tenantId));
    return stats;
  }
}
