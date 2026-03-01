# POSBUDDY - Software Development Lifecycle Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant SaaS platform for POS terminal field operations management serving UDS and 6+ customers.

**Architecture:** Next.js 15 (App Router) + Supabase (PostgreSQL, Auth, Storage, Edge Functions) + Vercel. PWA for FSE mobile. REST API for client integration.

**Tech Stack:** TypeScript, React 19, Next.js 15, Supabase, Tailwind CSS v4, shadcn/ui, Vercel, SheetJS, Recharts

---

## Phase 1: Project Scaffolding + Database (Week 1-2)

### Task 1.1: Initialize Next.js Project
**Files:** Create entire project root
- `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Install: `shadcn/ui`, `@supabase/supabase-js`, `@supabase/ssr`
- Configure Tailwind v4, custom UDS color palette

### Task 1.2: Supabase Client Setup
**Files:** Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- Browser client, Server Component client, Admin (service_role) client
- Existing .env.local has staging credentials

### Task 1.3: Database Migration - All 12 Tables
**Files:** Create `supabase/migrations/001_initial_schema.sql`
- Tables: customers, acquiring_banks, call_types, device_models, pos_staff, column_mapping_versions, customer_column_mappings, calls, closing_requirement_templates, call_closures, closure_field_values, call_status_log
- All indexes and constraints per schema v3.2

### Task 1.4: Seed Master Data
**Files:** Create `supabase/seed.sql`
- 6 customers (Hitachi, PhonePE, Fiserv, Mosambee, BonusHub, IServeU)
- 10 acquiring banks, 5 call types, 6 device models

### Task 1.5: Row Level Security Policies
**Files:** Create `supabase/migrations/002_rls_policies.sql`
- FSE: SELECT/UPDATE on calls WHERE assigned_to_id = auth.uid() mapped via pos_staff
- Back Office: full access with optional downline filter
- System: INSERT on call_status_log, call_closures

### Task 1.6: Auth Configuration
- Supabase Auth: enable Phone OTP provider (for FSE)
- Email/Password provider (for Back Office)
- Configure in Supabase dashboard

### Task 1.7: Base Layout Shell
**Files:** Create `app/layout.tsx`, `components/ui/sidebar.tsx`, `components/ui/header.tsx`
- UDS-branded sidebar, responsive, mobile-first
- User context in header, role-based nav items

### Task 1.8: Git Staging Branch
- Create `staging` branch from main
- Set branch protection rules
- All development merges to staging first

### Task 1.9: Vercel Deployment
- Connect repo to Vercel
- staging branch = preview URL
- main branch = production (later)

### Task 1.10: Storage Buckets
- Create buckets: call-photos, signatures, imports, reports
- Set access policies: authenticated upload, public read with signed URLs

---

## Phase 2: Core Data Engine (Week 3-4)

### Task 2.1-2.5: Column Mapping Engine
- CRUD for column_mapping_versions (per customer, versioned)
- Editor for customer_column_mappings (source header → unified field + transform rule)
- Excel import engine: upload → read headers → apply mapping → validate → insert calls
- All 7 transform rules: direct copy, auto_generate, concatenate, date, datetime, default, lookup
- Import batch tracking with error row logging

### Task 2.6-2.7: Master Data CRUD
- Customers, acquiring_banks, call_types, device_models management pages

### Task 2.8: Pre-configure 6 Customer Mappings
- Configure column mappings for all existing customers
- Test with sample Excel files

---

## Phase 3: Call Management + Assignment (Week 5-6)

### Task 3.1: Calls List with Filters
- Filterable by: state, district, city, pincode, customer, call_type, status, FSE, date range
- Pagination, sort, search

### Task 3.2: pos_staff Sync from UDSHR
- Edge Function: sync hr_profiles WHERE project_id='UDS-POS'
- Resolve reports_to_id via hr_user_id lookup
- Scheduled cron trigger

### Task 3.3-3.4: Assignment + Reassignment
- Assign calls to FSE (department='FSE' only)
- Bulk assign, reassign with reason logging

### Task 3.5: Call Detail View
- Full call info, assignment history, status timeline

### Task 3.6: Hierarchy-Based Filtering
- Recursive CTE on reports_to_id for downline visibility

### Task 3.7: Audit Trail
- Auto-log every status change to call_status_log

### Task 3.8: Dashboard
- Call counts by status/customer/region, daily/weekly trends (Recharts)

---

## Phase 4: FSE Mobile App - PWA (Week 7-8)

### Task 4.1-4.2: PWA Shell + Auth
- manifest.json, service worker, install prompt
- Phone OTP login for FSE

### Task 4.3: FSE Call List
- Assigned calls only (RLS enforced), pull-to-refresh

### Task 4.4: Dynamic Closure Form
- Load closing_requirement_templates by customer_id
- Render: text, textarea, select, photo, signature, number, date fields

### Task 4.5-4.6: Photo + Signature Capture
- Camera API, compress to 1MB, preview
- Canvas signature pad, save as PNG

### Task 4.7: GPS Capture
- Auto lat/long on visit-in/out, map display

### Task 4.8: Closure Submission
- Validate required fields, upload to Supabase Storage
- Create call_closures + closure_field_values, auto-close call

### Task 4.9: Offline Queue
- IndexedDB storage when offline, sync on reconnect

### Task 4.10: Visit Timer
- Track visit_in_time / visit_out_time, persist across restarts

---

## Phase 5: Reporting + Downloads (Week 9-10)

- Excel export (filtered call lists)
- Closure report PDF (merchant details + photos + GPS + signatures)
- Bulk download as ZIP
- MIS report (monthly by customer/region/type)
- Customer-specific reverse-mapped exports
- Report scheduling (daily/weekly MIS via Edge Function cron)

---

## Phase 6: API Layer for Client Integration (Week 11-12)

- OpenAPI 3.0 specification
- API key auth per customer, rate limiting
- POST /api/v1/calls (call creation)
- GET /api/v1/calls/{id}/closure (closure retrieval with signed URLs)
- Webhook system (status change notifications)
- API documentation portal (Swagger/Redoc)

---

## Phase 7: Testing + Staging Validation (Week 13)

- Unit tests (transform rules, RLS, hierarchy queries)
- E2E tests (Playwright: import → assign → close → report)
- Load tests (50 concurrent FSEs)
- Security audit (RLS verification, input sanitization)
- UAT with real customer data on staging

---

## Phase 8: Production Deployment (Week 14)

- New production Supabase project
- Run migrations + seed on production
- Configure Vercel production environment
- Deploy main branch, configure custom domain
- Set up monitoring (Vercel Analytics, Sentry)
