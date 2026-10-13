# Release Notes — v1.0.0

## TransLogix Enterprise Logistics ERP v1.0.0

### Highlights
- **Relational Logistics Schema**: 16 normalized tables covering consignments, products, containers, milestones, documents, invoices, customs declarations, and exchange rates.
- **Atomic Tracking Generator**: Sequence-based tracking number creation (`PK-EXP-YYYY-XXXXXX` and `PK-IMP-YYYY-XXXXXX`).
- **Decoupled Document Storage**: Bucket configuration for bills of lading, commercial invoices, and packing lists.
- **Row Level Security (RLS)**: Enforced segregation between Operations Admin and Customer Company roles.
- **Customs & Compliance**: Full Goods Declaration (GD) assessment with duty/tax calculations.
- **Realtime Milestone Stepper**: Chronological event logs with port hubs and geocoordinates.

### Included Artifacts
- Production React 19 + Tailwind CSS frontend
- SQL migration scripts in `/supabase/migrations/`
- Seed database script in `/supabase/seed.sql`
- GitHub Actions CI/CD release workflow in `/.github/workflows/release.yml`
