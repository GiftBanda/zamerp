# ZamERP - Mini ERP System

## Structure
zambia-erp/
├── backend/          # NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── accounting/
│   │   ├── reports/
│   │   ├── audit/
│   │   └── database/
│   └── ...
└── frontend/         # Next.js App Router + TypeScript
    ├── app/
    │   ├── (auth)/
    │   ├── (dashboard)/
    │   │   ├── customers/
    │   │   ├── inventory/
    │   │   ├── invoices/
    │   │   ├── accounting/
    │   │   └── reports/
    └── ...
