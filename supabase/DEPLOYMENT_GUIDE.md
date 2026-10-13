# TransLogix Production Deployment & Supabase Setup Guide

This guide provides exact, step-by-step instructions to configure your live **Supabase PostgreSQL**, **Storage**, **Row Level Security (RLS)**, **Authentication**, and connect this **TransLogix ERP** frontend.

---

## 1. Creating a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and log in or sign up.
2. Click **"New Project"**.
3. Choose your organization, enter a project name (e.g. `translogix-logistics-erp`).
4. Set a strong database password (keep this safe; it is never shared in frontend code).
5. Select the cloud region closest to your primary operations (e.g., `Singapore (ap-southeast-1)` or `Frankfurt (eu-central-1)`).
6. Click **"Create new project"** and wait ~2 minutes for PostgreSQL provisioning.

---

## 2. Creating the PostgreSQL Database & Running Migrations

TransLogix includes 3 organized SQL migration files in `/supabase/migrations/`:

### Option A: Using the Supabase Web Dashboard (Fastest & Easiest)
1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Click **"New query"**.
3. Copy the contents of `/supabase/migrations/001_initial_schema.sql` and click **"Run"**.
   - This creates all 16 relational tables (`profiles`, `companies`, `countries`, `ports`, `airports`, `shipments`, `shipment_items`, `products`, `containers`, `tracking_events`, `documents`, `invoices`, `customs`, `notifications`, `audit_logs`, `exchange_rates`), custom ENUM types, sequences, and the atomic tracking number generator function (`generate_tracking_number`).
4. Click **"New query"**, paste `/supabase/migrations/002_row_level_security.sql`, and click **"Run"**.
   - This enables RLS on all 16 tables, creates security helper functions (`is_admin()`, `get_user_company_id()`), and applies role-based access rules.
5. Click **"New query"**, paste `/supabase/migrations/003_storage_setup.sql`, and click **"Run"**.
   - This configures storage buckets (`shipment-documents` and `company-assets`) with strict access policies.
6. (Optional for testing) Click **"New query"**, paste `/supabase/seed.sql`, and click **"Run"** to populate realistic countries, ports, companies, sample shipments, items, containers, and tracking events.

### Option B: Using the Supabase CLI
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link your remote project (replace [PROJECT_REF])
supabase link --project-ref [YOUR_PROJECT_REF]

# Push all migrations
supabase db push
```

---

## 3. Creating Storage Buckets

If you ran `003_storage_setup.sql`, the buckets are created automatically. To verify in the Supabase Dashboard:
1. Navigate to **Storage** in the left sidebar.
2. Verify two buckets exist:
   - `shipment-documents` (Private, 50MB max file size)
   - `company-assets` (Public, 5MB max file size)
3. Check the **Policies** tab under Storage to ensure the RLS policies for `storage.objects` are active.

---

## 4. Configuring Authentication

1. In Supabase Dashboard, navigate to **Authentication** > **Providers**.
2. Ensure **Email** provider is enabled.
3. (For production) In **Authentication** > **URL Configuration**, set:
   - **Site URL**: `https://your-production-domain.com` (or your Cloud Run / Vercel URL)
   - **Redirect URLs**: Add your domain callback URL.
4. (Optional) Disable email confirmation for local dev or rapid testing under **Authentication** > **Providers** > **Email** > uncheck "Confirm email".

---

## 5. Configuring Row Level Security (RLS)

1. Navigate to **Database** > **Tables**.
2. Verify every table shows the green **"RLS Enabled"** badge.
3. Test policies:
   - Normal users (`role = 'user'`) can only query shipments where their `company_id` matches `exporter_id` or `importer_id`.
   - Admin users (`role = 'admin'`) have full read/write/delete privileges across all tables.

---

## 6. Creating Environment Variables

1. In Supabase Dashboard, click **Project Settings** (gear icon) > **API**.
2. Find:
   - **Project URL**: e.g., `https://xyzabcdef.supabase.co`
   - **anon public key**: e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. In your local or deployment environment, create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL="https://xyzabcdef.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
> **Security Reminder:** NEVER expose or commit the `service_role` key in frontend code or Git! The application uses the `anon` key combined with Supabase RLS.

---

## 7. Connecting the Application to Supabase

The TransLogix application automatically detects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
You can also connect interactively inside the web app via the **"Database Console"** tab to test your live connection and run queries directly.

---

## 8. GitHub Repository Setup & Source Control

1. Create a new GitHub repository:
   - Go to [https://github.com/new](https://github.com/new)
   - Name: `translogix-logistics-erp`
   - Visibility: Private or Public
2. Push your project:
```bash
git init
git add .
git commit -m "feat: complete import/export logistics ERP with Supabase backend"
git branch -M main
git remote add origin https://github.com/YOUR_USER/translogix-logistics-erp.git
git push -u origin main
```
> Verify that `.env` is listed in `.gitignore` so no live secrets are ever pushed.

---

## 9. Deploying the Frontend

### Deploying to Vercel / Netlify / Cloud Run
1. Connect your GitHub repository.
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add Environment Variables in the hosting dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## 10. Testing the Production Application

1. **Authentication Test**: Register a new user account in the app. Verify that a record is created in `auth.users` and a corresponding profile in `public.profiles`.
2. **RLS Verification**: Sign in as a regular customer user; verify that only shipments for that company are returned.
3. **Tracking Number Generation**: Create a new shipment (Export or Import). Verify that the database sequence automatically generates numbers such as `PK-EXP-2026-001004` or `PK-IMP-2026-001005`.
4. **Realtime Updates**: Open the shipment in two browser tabs. Update the status in the Admin tab to "Arrived at Destination" and verify that the customer tab updates instantly via Supabase Realtime!
5. **Document Upload**: Upload a Bill of Lading PDF and verify it is uploaded to the `shipment-documents` bucket and referenced in the `public.documents` table.
