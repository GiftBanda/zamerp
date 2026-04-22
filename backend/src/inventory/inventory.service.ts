import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, ilike, lte, desc, sql } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Products ─────────────────────────────────
  async findAllProducts(tenantId: string, search?: string, categoryId?: string) {
    const conditions = [eq(schema.products.tenantId, tenantId)];
    if (search) conditions.push(ilike(schema.products.name, `%${search}%`));
    if (categoryId) conditions.push(eq(schema.products.categoryId, categoryId));

    return this.db
      .select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
        description: schema.products.description,
        unit: schema.products.unit,
        costPrice: schema.products.costPrice,
        sellingPrice: schema.products.sellingPrice,
        vatExempt: schema.products.vatExempt,
        quantityOnHand: schema.products.quantityOnHand,
        reorderLevel: schema.products.reorderLevel,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        category: {
          id: schema.inventoryCategories.id,
          name: schema.inventoryCategories.name,
        },
      })
      .from(schema.products)
      .leftJoin(
        schema.inventoryCategories,
        eq(schema.products.categoryId, schema.inventoryCategories.id),
      )
      .where(and(...conditions))
      .orderBy(desc(schema.products.createdAt));
  }

  async findOneProduct(id: string, tenantId: string) {
    const [product] = await this.db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(tenantId: string, data: any) {
    const [product] = await this.db
      .insert(schema.products)
      .values({ ...data, tenantId })
      .returning();
    return product;
  }

  async updateProduct(id: string, tenantId: string, data: any) {
    const [product] = await this.db
      .update(schema.products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getLowStockProducts(tenantId: string) {
    return this.db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.tenantId, tenantId),
          eq(schema.products.isActive, true),
          lte(schema.products.quantityOnHand, schema.products.reorderLevel),
        ),
      );
  }

  // ── Stock Adjustments ─────────────────────────
  async adjustStock(
    tenantId: string,
    productId: string,
    quantity: number,
    type: 'in' | 'out' | 'adjustment',
    reference?: string,
    referenceId?: string,
    notes?: string,
    userId?: string,
  ) {
    const product = await this.findOneProduct(productId, tenantId);
    const balanceBefore = Number(product.quantityOnHand);
    const balanceAfter = type === 'out'
      ? balanceBefore - quantity
      : type === 'in'
        ? balanceBefore + quantity
        : quantity; // adjustment sets absolute value

    // Update product quantity
    await this.db
      .update(schema.products)
      .set({ quantityOnHand: balanceAfter.toString(), updatedAt: new Date() })
      .where(eq(schema.products.id, productId));

    // Record movement
    const [movement] = await this.db
      .insert(schema.stockMovements)
      .values({
        tenantId,
        productId,
        type,
        quantity: Math.abs(quantity).toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        reference,
        referenceId,
        notes,
        createdBy: userId,
      })
      .returning();

    return movement;
  }

  async getStockMovements(tenantId: string, productId?: string) {
    const conditions = [eq(schema.stockMovements.tenantId, tenantId)];
    if (productId) conditions.push(eq(schema.stockMovements.productId, productId));

    return this.db
      .select({
        id: schema.stockMovements.id,
        type: schema.stockMovements.type,
        quantity: schema.stockMovements.quantity,
        balanceBefore: schema.stockMovements.balanceBefore,
        balanceAfter: schema.stockMovements.balanceAfter,
        reference: schema.stockMovements.reference,
        notes: schema.stockMovements.notes,
        createdAt: schema.stockMovements.createdAt,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
        },
      })
      .from(schema.stockMovements)
      .leftJoin(schema.products, eq(schema.stockMovements.productId, schema.products.id))
      .where(and(...conditions))
      .orderBy(desc(schema.stockMovements.createdAt))
      .limit(100);
  }

  // ── Categories ─────────────────────────────────
  async findAllCategories(tenantId: string) {
    return this.db
      .select()
      .from(schema.inventoryCategories)
      .where(eq(schema.inventoryCategories.tenantId, tenantId));
  }

  async createCategory(tenantId: string, data: { name: string; description?: string }) {
    const [cat] = await this.db
      .insert(schema.inventoryCategories)
      .values({ ...data, tenantId })
      .returning();
    return cat;
  }

  async getInventoryStats(tenantId: string) {
    const [stats] = await this.db
      .select({
        totalProducts: sql<number>`count(*)`,
        totalValue: sql<number>`sum(${schema.products.quantityOnHand}::numeric * ${schema.products.costPrice}::numeric)`,
        lowStockCount: sql<number>`count(*) filter (where ${schema.products.quantityOnHand}::numeric <= ${schema.products.reorderLevel}::numeric and ${schema.products.isActive} = true)`,
        activeProducts: sql<number>`count(*) filter (where ${schema.products.isActive} = true)`,
      })
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenantId));
    return stats;
  }
}
