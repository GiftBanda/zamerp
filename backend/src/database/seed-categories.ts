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

async function seedCategories() {
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
    const tenants = await db.select().from(schema.tenants);

    if (tenants.length === 0) {
      console.log('No tenants found. Seed aborted.');
      return;
    }

    let insertedCount = 0;

    for (const tenant of tenants) {
      for (const category of DEFAULT_CATEGORIES) {
        const existing = await db
          .select({ id: schema.inventoryCategories.id })
          .from(schema.inventoryCategories)
          .where(
            and(
              eq(schema.inventoryCategories.tenantId, tenant.id),
              eq(schema.inventoryCategories.name, category.name),
            ),
          );

        const existsForTenant = existing.length > 0;

        if (existsForTenant) {
          continue;
        }

        await db.insert(schema.inventoryCategories).values({
          tenantId: tenant.id,
          name: category.name,
          description: category.description,
        });

        insertedCount += 1;
      }
    }

    console.log(`Category seed complete. Inserted ${insertedCount} categories.`);
  } finally {
    await pool.end();
  }
}

seedCategories()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Category seed failed:', error);
    process.exit(1);
  });
