# ZamERP — Mini ERP for Zambian SMEs

A production-ready, ZRA-compliant ERP system built for small and medium businesses in Zambia.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | JWT (Bearer token) |
| API Docs | Swagger / OpenAPI |
| PDF Export | PDFKit |
| Charts | Recharts |

---

## ✅ Features

### Core Modules
- **Invoicing** — Create, send, pay, void invoices with full lifecycle management
- **Inventory** — Product catalog, stock tracking, automatic deduction on invoice payment
- **Accounting** — Income/expense ledger, chart of accounts, P&L summary
- **Customers** — Full CRM with TPIN support for ZRA compliance
- **Reports** — Dashboard KPIs, Profit & Loss, AR Aging report, charts

### Compliance & Security
- **Multi-tenant** — Complete data isolation per business (schema-level)
- **Role-based access** — admin | staff | accountant | viewer
- **Audit logs** — Every CREATE/UPDATE/DELETE/LOGIN/EXPORT is logged with user, IP, old/new values
- **Data validation** — `class-validator` on all DTOs, Zod on all frontend forms

### ZRA-Ready Invoice Structure
- Supplier TPIN & VRN on invoice header
- Customer TPIN field
- ZRA Fiscal Invoice Number from VSDC response (`rcptNo` fallback `totRcptNo`)
- ZRA Verification Code
- VAT breakdown per line item (16% default, configurable, per-item exemptions)
- PDF export with ZRA compliance badge

### Bonus Features
- ⚡ **Auto inventory deduction** — Paying an invoice auto-deducts all product quantities
- ↩️ **Void reversal** — Voiding a paid invoice reverses inventory
- 📄 **PDF export** — Beautiful ZRA-ready PDF with QR-ready structure
- 📊 **Real-time dashboard** — Revenue charts, top customers, invoice status ring

---

## 🏃 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Clone & setup backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

npm install
npm run db:push        # Push schema to PostgreSQL
npm run start:dev      # Start on :3001
```

### 2. Setup frontend

```bash
cd frontend
npm install
npm run dev            # Start on :3000
```

### 3. Docker (full stack)

```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

---

## 📖 API Documentation

Full Swagger/OpenAPI docs available at:
```
http://localhost:3001/api/docs
```

### Authentication Flow
```
POST /api/v1/auth/register  → Create company + admin user
POST /api/v1/auth/login     → { email, password, tenantSlug } → JWT token
GET  /api/v1/auth/me        → Current user info
```

### Key Endpoints
```
# Invoices
GET    /api/v1/invoices           → List with filters (status, date range)
POST   /api/v1/invoices           → Create invoice
POST   /api/v1/invoices/:id/pay   → Mark paid (auto-deducts inventory)
GET    /api/v1/invoices/:id/pdf   → Download ZRA-ready PDF

# Inventory
GET    /api/v1/inventory/products           → Product list
POST   /api/v1/inventory/products/:id/adjust → Stock adjustment

# Reports
GET    /api/v1/reports/dashboard    → KPI summary
GET    /api/v1/reports/profit-loss  → P&L for date range
GET    /api/v1/reports/aging        → AR aging buckets

# Audit
GET    /api/v1/audit               → Full audit trail
```

---

## 🏗️ Architecture

```
zambia-erp/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/               # JWT auth, guards, strategies
│   │   ├── tenants/            # Multi-tenant management
│   │   ├── users/              # User CRUD + seeding default accounts
│   │   ├── customers/          # Customer management
│   │   ├── inventory/          # Products, categories, stock movements
│   │   ├── invoices/           # Invoice lifecycle + PDF generation
│   │   │   └── pdf.service.ts  # ZRA-ready PDF with PDFKit
│   │   ├── accounting/         # Transactions, chart of accounts
│   │   ├── reports/            # Dashboard, P&L, aging
│   │   ├── audit/              # Immutable audit log
│   │   ├── database/           # Drizzle ORM schema + connection
│   │   └── common/             # Guards, decorators
│   └── drizzle.config.ts
│
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── auth/login          # Login page (3-field: company + email + pass)
│   │   ├── auth/register       # 3-step registration wizard
│   │   └── (dashboard)/        # Protected layout with sidebar
│   │       ├── dashboard/      # KPI dashboard + charts
│   │       ├── invoices/       # List + New Invoice builder + Detail
│   │       ├── customers/      # CRUD with TPIN field
│   │       ├── inventory/      # Products + stock adjustments + movements
│   │       ├── accounting/     # Transactions + P&L + Chart of Accounts
│   │       ├── reports/        # P&L report + AR Aging + Charts
│   │       ├── audit-logs/     # Full audit trail view
│   │       └── settings/       # Company profile + user management
│   └── lib/
│       ├── api.ts              # Typed API client (all endpoints)
│       ├── auth.tsx            # Auth context + hooks
│       └── utils.ts            # Formatters, constants
│
└── docker-compose.yml
```

---

## 🔐 Role Permissions

| Permission | Admin | Staff | Accountant | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create/Edit Invoices | ✓ | ✓ | ✓ | — |
| Create/Edit Customers | ✓ | ✓ | — | — |
| Manage Inventory | ✓ | ✓ | — | — |
| Record Transactions | ✓ | ✓ | ✓ | — |
| View Reports | ✓ | ✓ | ✓ | ✓ |
| Mark Invoices Paid | ✓ | — | ✓ | — |
| Manage Users | ✓ | — | — | — |
| View Audit Logs | ✓ | — | ✓ | — |
| Company Settings | ✓ | — | — | — |

---

## 🧾 ZRA Invoice Structure

Each generated invoice includes:

| Field | Description |
|-------|-------------|
| `invoiceNumber` | Sequential: `INV-2024-00001` |
| `zraInvoiceNumber` | VSDC receipt number from `/trnsSales/saveSales` |
| `zraVerificationCode` | VSDC signature/verification value (`rcptSign`/`intrlData`) |
| Supplier `TPIN` | From company settings |
| Supplier `VRN` | VAT Registration Number |
| Customer `TPIN` | From customer record |
| VAT per line | Rate × net amount, per line item |
| Total VAT | Sum of all line item VAT |

### VSDC Integration Notes

- Endpoint used from ZRA docs: `POST /trnsSales/saveSales`
- Request base URL: `ZRA_VSDC_BASE_URL`
- Mandatory request identity fields: `tpin`, `bhfId`
- Success criteria: HTTP success and `resultCd === "000"`
- Strict mode behavior (`ZRA_VSDC_STRICT_MODE=true`): failed VSDC submission aborts invoice creation

### Required Backend Env Variables

- `ZRA_VSDC_ENABLED`
- `ZRA_VSDC_BASE_URL`
- `ZRA_VSDC_TPIN`
- `ZRA_VSDC_BHF_ID`
- `ZRA_VSDC_CMC_KEY` (if enabled by your VSDC deployment)

Optional controls:
- `ZRA_VSDC_STRICT_MODE`
- `ZRA_VSDC_USE_FALLBACK_VALUES`
- `ZRA_VSDC_SALES_ENDPOINT`
- `ZRA_VSDC_SALES_TYPE_CODE`
- `ZRA_VSDC_RECEIPT_TYPE_CODE`
- `ZRA_VSDC_PAYMENT_TYPE_CODE`
- `ZRA_VSDC_TRANSACTION_PROGRESS_CODE`
- `ZRA_VSDC_PACKAGE_UNIT_CODE`
- `ZRA_VSDC_QUANTITY_UNIT_CODE`
- `ZRA_VSDC_TAX_TYPE_CODE`

---

## 📊 Database Schema

10 tables:
- `tenants` — Multi-tenant root (TPIN, VRN, currency, VAT rate)
- `users` — Users with roles, per-tenant
- `customers` — Customers with TPIN
- `inventory_categories` — Product categories
- `products` — Inventory with stock level
- `stock_movements` — Immutable stock history
- `invoices` — Tax invoices with ZRA fields
- `invoice_items` — Line items with VAT per line
- `transactions` — Income/expense ledger
- `accounts` — Chart of accounts (seeded on registration)
- `audit_logs` — Immutable audit trail

---

## 🔜 Production Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `DB_PASSWORD`
- [ ] Add HTTPS/TLS termination (nginx/Caddy)
- [ ] Validate VSDC code mappings against your approved branch setup (tax type, payment type, units)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Add email notifications (invoice sending)
- [ ] Set up monitoring (Sentry, etc.)

---

Built with ❤️ for Zambian businesses.
