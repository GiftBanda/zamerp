import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

type SeedCategory = {
  name: string;
  description: string;
};

type SeedProduct = {
  sku: string;
  name: string;
  description: string;
  categoryName: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  quantityOnHand: string;
  reorderLevel: string;
  vatExempt: boolean;
};

const DEFAULT_CATEGORIES: SeedCategory[] = [
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

const SAMPLE_PRODUCTS: SeedProduct[] = [
  {
    sku: 'OS-A4-001',
    name: 'A4 Copier Paper (500 sheets)',
    description: 'Standard 80gsm A4 printer and copier paper.',
    categoryName: 'Office Supplies',
    unit: 'ream',
    costPrice: '75',
    sellingPrice: '95',
    quantityOnHand: '120',
    reorderLevel: '20',
    vatExempt: false,
  },
  {
    sku: 'OS-PEN-002',
    name: 'Ballpoint Pens (Pack of 10)',
    description: 'Blue ballpoint pens for everyday office use.',
    categoryName: 'Office Supplies',
    unit: 'pack',
    costPrice: '28',
    sellingPrice: '40',
    quantityOnHand: '80',
    reorderLevel: '15',
    vatExempt: false,
  },
  {
    sku: 'EL-LAP-101',
    name: 'Business Laptop 15-inch',
    description: 'Mid-range laptop for office productivity tasks.',
    categoryName: 'Electronics',
    unit: 'unit',
    costPrice: '12500',
    sellingPrice: '14999',
    quantityOnHand: '12',
    reorderLevel: '3',
    vatExempt: false,
  },
  {
    sku: 'EL-ROUT-102',
    name: 'Dual-Band Wi-Fi Router',
    description: 'Office-grade wireless router with dual-band support.',
    categoryName: 'Electronics',
    unit: 'unit',
    costPrice: '850',
    sellingPrice: '1099',
    quantityOnHand: '18',
    reorderLevel: '5',
    vatExempt: false,
  },
  {
    sku: 'FUR-DSK-201',
    name: 'Office Desk 1200mm',
    description: 'Durable wooden office desk with cable grommet.',
    categoryName: 'Furniture',
    unit: 'unit',
    costPrice: '1800',
    sellingPrice: '2450',
    quantityOnHand: '10',
    reorderLevel: '2',
    vatExempt: false,
  },
  {
    sku: 'FUR-CHR-202',
    name: 'Ergonomic Office Chair',
    description: 'Adjustable office chair with lumbar support.',
    categoryName: 'Furniture',
    unit: 'unit',
    costPrice: '1400',
    sellingPrice: '1890',
    quantityOnHand: '14',
    reorderLevel: '4',
    vatExempt: false,
  },
  {
    sku: 'RM-SUG-301',
    name: 'Refined Sugar 50kg',
    description: 'Bulk refined sugar bag for food processing.',
    categoryName: 'Raw Materials',
    unit: 'bag',
    costPrice: '1180',
    sellingPrice: '1350',
    quantityOnHand: '25',
    reorderLevel: '8',
    vatExempt: false,
  },
  {
    sku: 'FG-JAM-401',
    name: 'Strawberry Jam 500g',
    description: 'Finished packaged product ready for retail.',
    categoryName: 'Finished Goods',
    unit: 'jar',
    costPrice: '36',
    sellingPrice: '55',
    quantityOnHand: '200',
    reorderLevel: '40',
    vatExempt: false,
  },
  {
    sku: 'SRV-INST-501',
    name: 'On-site Installation Service',
    description: 'Professional installation service charged per job.',
    categoryName: 'Services',
    unit: 'service',
    costPrice: '0',
    sellingPrice: '350',
    quantityOnHand: '0',
    reorderLevel: '0',
    vatExempt: false,
  },
  {
    sku: 'MNT-CLEAN-601',
    name: 'Industrial Cleaner 5L',
    description: 'Heavy-duty cleaning liquid for maintenance teams.',
    categoryName: 'Maintenance',
    unit: 'can',
    costPrice: '120',
    sellingPrice: '180',
    quantityOnHand: '40',
    reorderLevel: '10',
    vatExempt: false,
  },
  {
    sku: 'UTL-BULB-701',
    name: 'LED Bulb 12W',
    description: 'Energy efficient LED bulb for office lighting.',
    categoryName: 'Utilities',
    unit: 'piece',
    costPrice: '35',
    sellingPrice: '60',
    quantityOnHand: '90',
    reorderLevel: '20',
    vatExempt: false,
  },
  {
    sku: 'TRN-DSEL-801',
    name: 'Diesel Fuel (per litre)',
    description: 'Operational diesel fuel supply entry.',
    categoryName: 'Fuel & Transport',
    unit: 'litre',
    costPrice: '28',
    sellingPrice: '33',
    quantityOnHand: '1500',
    reorderLevel: '300',
    vatExempt: false,
  },
];

async function getOrCreateCategoryId(
  db: ReturnType<typeof drizzle>,
  tenantId: string,
  category: SeedCategory,
): Promise<string> {
  const existing = await db
    .select({ id: schema.inventoryCategories.id })
    .from(schema.inventoryCategories)
    .where(
      and(
        eq(schema.inventoryCategories.tenantId, tenantId),
        eq(schema.inventoryCategories.name, category.name),
      ),
    );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const inserted = await db
    .insert(schema.inventoryCategories)
    .values({
      tenantId,
      name: category.name,
      description: category.description,
    })
    .returning({ id: schema.inventoryCategories.id });

  return inserted[0].id;
}

async function seedAll() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'zamerp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 5,
  });

  const db = drizzle(pool, { schema });

  try {
    const tenants = await db.select({ id: schema.tenants.id, name: schema.tenants.name }).from(schema.tenants);

    if (tenants.length === 0) {
      console.log('No tenants found. Seed aborted.');
      return;
    }

    let categoriesInserted = 0;
    let productsInserted = 0;

    for (const tenant of tenants) {
      const categoryIdByName = new Map<string, string>();

      for (const category of DEFAULT_CATEGORIES) {
        const before = await db
          .select({ id: schema.inventoryCategories.id })
          .from(schema.inventoryCategories)
          .where(
            and(
              eq(schema.inventoryCategories.tenantId, tenant.id),
              eq(schema.inventoryCategories.name, category.name),
            ),
          );

        const categoryId = await getOrCreateCategoryId(db, tenant.id, category);
        categoryIdByName.set(category.name, categoryId);

        if (before.length === 0) {
          categoriesInserted += 1;
        }
      }

      for (const product of SAMPLE_PRODUCTS) {
        const categoryId = categoryIdByName.get(product.categoryName);

        if (!categoryId) {
          continue;
        }

        const existingProduct = await db
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(
            and(
              eq(schema.products.tenantId, tenant.id),
              eq(schema.products.sku, product.sku),
            ),
          );

        if (existingProduct.length > 0) {
          continue;
        }

        await db.insert(schema.products).values({
          tenantId: tenant.id,
          categoryId,
          sku: product.sku,
          name: product.name,
          description: product.description,
          unit: product.unit,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          quantityOnHand: product.quantityOnHand,
          reorderLevel: product.reorderLevel,
          vatExempt: product.vatExempt,
        });

        productsInserted += 1;
      }

      console.log(`Seeded tenant ${tenant.name} (${tenant.id})`);
    }

    console.log(
      `Seed complete. Inserted ${categoriesInserted} categories and ${productsInserted} products.`,
    );
  } finally {
    await pool.end();
  }
}

seedAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
