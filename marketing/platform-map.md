# ShelfSpace Platform Feature Map
# Generated: 2026-03-25
# Source: /Users/chrismitchem/shelfspace-platform

## Tech Stack
- Next.js 16 (App Router), Supabase (PostgreSQL + RLS), React 19, Tailwind CSS 4
- Payments: Check 21 (RCC), ACH planned
- AI: Anthropic Claude (ShelfiQ)
- Integrations: QuickBooks, any cannabis POS, METRC
- Email: Resend
- Deployment: Vercel

## Portals
- Retailer Portal: /app/(retailer)/ — 12 pages, roles: retailer_admin, retailer_viewer, retailer_inventory
- Vendor Portal: /app/(vendor)/ — 10 pages, roles: vendor_admin, vendor_viewer
- Admin Portal: /app/(admin)/ — 26 pages, roles: shelfspace_admin, shelfspace_viewer
- Rep Portal: /app/(rep)/ — 7 pages, roles: rep_admin, rep_viewer

## Core Modules

### Settlement Engine
- Weekly calculation: sales × category splits - aging discounts - return credits - platform fees = net payout
- Key files: /lib/settlement/calculations.ts, /app/api/settlements/
- Tables: settlements, settlement_items, sales, returns

### Consignment
- Vendor-owned inventory on retailer shelves, aging discounts, weekly settlements
- Key files: /lib/settlement/calculations.ts (getAgingPercent), current_inventory table
- Tables: current_inventory, partnerships (module=Consignment), aging_discount_tiers

### Wholesale / AP
- Purchase orders, invoice verification, payment processing
- Key files: /app/api/purchase-orders/, /app/api/payments/
- Tables: purchase_orders, payments, invoices

### Credit Memos / Recovery
- Returns, co-marketing, conversion credits with vendor dispute workflow
- Key files: /app/api/credit-memos/, /lib/credit-memo-notifications.ts
- Tables: credit_memos, credit_memo_line_items, credit_memo_responses, disputes
- Statuses: Draft → Pending_Vendor_Response → Disputed → Applied → Voided

### Delivery Dashboard (NEW)
- Track incoming shipments, receive inventory, reconcile to POs
- Key files: /app/(retailer)/retailer/deliveries/, /app/api/deliveries/
- Tables: deliveries, delivery_items, delivery_documents, delivery_activity_log
- Statuses: Ordered → Received → Reviewed → Ready_for_Payment → Paid → Complete

### Invoicing
- Platform bills to retailers/vendors for ShelfSpace fees
- Key files: /app/api/invoices/, /lib/pdf/settlement-id.ts
- Tables: invoices (recipient_type: Retailer|Vendor)

### Payments (Check 21 + ACH)
- Check generation, delivery, clearing workflow
- Key files: /app/api/payments/
- Tables: payments, bank_accounts, check_images
- Statuses: Pending → Processed → Delivered → Cleared → Failed

### QuickBooks Integration
- OAuth, vendor mapping, GL account mapping, settlement sync
- Key files: /app/api/quickbooks/, /lib/quickbooks/
- Tables: quickbooks_integrations, quickbooks_vendor_mappings, quickbooks_account_mappings

### ShelfiQ (AI)
- Invoice parsing, vendor matching, AP automation, chat assistant
- Key files: /lib/shelfiq/ (system-prompt.ts, orchestrate.ts, tools.ts, tool-handlers.ts)
- 20+ tools, multi-turn conversations, email ingestion

### Promotions (Co-marketing)
- Retailer proposes co-op promos, vendor accepts/declines, credits generated
- Key files: /app/api/promotions/, promotions table
- Links to credit_memos (reason_category=Comarketing)

### Insights & Analytics
- Sales velocity, dead money heatmap, cash liberation, vendor scorecards
- Key files: /app/(retailer)/retailer/insights/, recharts
- Both retailer and vendor insights dashboards

### User Management & Auth
- MFA (SMS/TOTP), role-based access, email invites
- Key files: /lib/auth/, /app/api/mfa/, /app/api/users/
- Tables: user_profiles, auth.users

### Bulk Onboarding
- CSV import for retailers, vendors, inventory
- Key files: /app/api/uploads/, /lib/csv/

### Dispute Resolution
- Unified disputes linked to credit_memos, payments, or shipments
- Key files: /app/api/disputes/, /app/(admin)/admin/escalations/
- Tables: disputes, dispute_responses, escalation_queue

### Notifications
- Transactional emails via Resend (27+ templates)
- Key files: /lib/email/, /lib/payment-notifications.ts, /lib/credit-memo-notifications.ts

## Database: ~37 tables with RLS, UUID PKs, soft deletes, audit logging
## API: ~206 route.ts files (~50+ logical endpoints)
