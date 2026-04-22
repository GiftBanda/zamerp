import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'accountant', 'viewer']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense', 'transfer']);
export const auditActionEnum = pgEnum('audit_action', ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW']);

// ─────────────────────────────────────────────
// TENANTS (Multi-tenant core)
// ─────────────────────────────────────────────
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  // ZRA-specific fields
  tpin: varchar('tpin', { length: 20 }),            // Taxpayer Identification Number
  vrn: varchar('vrn', { length: 20 }),              // VAT Registration Number
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Zambia'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  logo: text('logo'),
  currency: varchar('currency', { length: 10 }).default('ZMW'),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }).default('16'),
  fiscalYear: varchar('fiscal_year', { length: 10 }).default('calendar'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('staff').notNull(),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailTenantIdx: index('users_email_tenant_idx').on(table.email, table.tenantId),
}));

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  tpin: varchar('tpin', { length: 20 }),           // Customer's TPIN for ZRA compliance
  contactPerson: varchar('contact_person', { length: 255 }),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('customers_tenant_idx').on(table.tenantId),
}));

// ─────────────────────────────────────────────
// INVENTORY - CATEGORIES
// ─────────────────────────────────────────────
export const inventoryCategories = pgTable('inventory_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────
// INVENTORY - PRODUCTS
// ─────────────────────────────────────────────
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => inventoryCategories.id),
  sku: varchar('sku', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  unit: varchar('unit', { length: 50 }).default('item'),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull().default('0'),
  sellingPrice: decimal('selling_price', { precision: 15, scale: 2 }).notNull().default('0'),
  vatExempt: boolean('vat_exempt').default(false),
  quantityOnHand: decimal('quantity_on_hand', { precision: 15, scale: 3 }).default('0'),
  reorderLevel: decimal('reorder_level', { precision: 15, scale: 3 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('products_tenant_idx').on(table.tenantId),
  skuIdx: index('products_sku_idx').on(table.sku, table.tenantId),
}));

// ─────────────────────────────────────────────
// STOCK MOVEMENTS
// ─────────────────────────────────────────────
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'in', 'out', 'adjustment'
  quantity: decimal('quantity', { precision: 15, scale: 3 }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 15, scale: 3 }),
  balanceAfter: decimal('balance_after', { precision: 15, scale: 3 }),
  reference: varchar('reference', { length: 100 }),  // invoice number, PO number
  referenceId: uuid('reference_id'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  // ZRA-specific fields
  zraInvoiceNumber: varchar('zra_invoice_number', { length: 50 }),  // ZRA fiscal invoice number
  zraVerificationCode: varchar('zra_verification_code', { length: 100 }),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  paymentMethod: paymentMethodEnum('payment_method'),
  paidAt: timestamp('paid_at'),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).default('0'),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }).default('0'),
  total: decimal('total', { precision: 15, scale: 2 }).notNull().default('0'),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).default('0'),
  notes: text('notes'),
  terms: text('terms'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('invoices_tenant_idx').on(table.tenantId),
  numberIdx: index('invoices_number_idx').on(table.invoiceNumber, table.tenantId),
  statusIdx: index('invoices_status_idx').on(table.status),
}));

// ─────────────────────────────────────────────
// INVOICE LINE ITEMS
// ─────────────────────────────────────────────
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }).default('16'),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }).default('0'),
  total: decimal('total', { precision: 15, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').default(0),
});

// ─────────────────────────────────────────────
// ACCOUNTING - ACCOUNTS (Chart of Accounts)
// ─────────────────────────────────────────────
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // asset, liability, equity, income, expense
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─────────────────────────────────────────────
// ACCOUNTING - TRANSACTIONS
// ─────────────────────────────────────────────
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  accountId: uuid('account_id').references(() => accounts.id),
  category: varchar('category', { length: 100 }),
  description: varchar('description', { length: 500 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  reference: varchar('reference', { length: 100 }),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  paymentMethod: paymentMethodEnum('payment_method'),
  receipt: text('receipt'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('transactions_tenant_idx').on(table.tenantId),
  dateIdx: index('transactions_date_idx').on(table.date),
  typeIdx: index('transactions_type_idx').on(table.type),
}));

// ─────────────────────────────────────────────
// AUDIT LOGS (Compliance signal)
// ─────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: auditActionEnum('action').notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),    // table/module name
  resourceId: varchar('resource_id', { length: 100 }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('audit_tenant_idx').on(table.tenantId),
  resourceIdx: index('audit_resource_idx').on(table.resource, table.resourceId),
  userIdx: index('audit_user_idx').on(table.userId),
  dateIdx: index('audit_date_idx').on(table.createdAt),
}));

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
  transactions: many(transactions),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  category: one(inventoryCategories, { fields: [products.categoryId], references: [inventoryCategories.id] }),
  invoiceItems: many(invoiceItems),
  stockMovements: many(stockMovements),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [invoices.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  items: many(invoiceItems),
  transactions: many(transactions),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  product: one(products, { fields: [invoiceItems.productId], references: [products.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  tenant: one(tenants, { fields: [transactions.tenantId], references: [tenants.id] }),
  invoice: one(invoices, { fields: [transactions.invoiceId], references: [invoices.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
