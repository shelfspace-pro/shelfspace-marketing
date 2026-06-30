# ShelfSpace Platform Feature Map
# Generated: 2026-03-25 (audited against live codebase)
# Source: /Users/chrismitchem/shelfspace-platform

## Tech Stack
- Next.js 16 (App Router), Supabase (PostgreSQL + RLS), React 19, Tailwind CSS 4
- Payments: Check 21 (RCC), ACH planned
- AI: Anthropic Claude (ShelfiQ)
- Integrations: QuickBooks Online, any cannabis POS, METRC
- Email: Resend
- Deployment: Vercel

## Portals
- Retailer Portal: /app/(retailer)/ — 19 pages, roles: retailer_admin, retailer_viewer, retailer_inventory
- Vendor Portal: /app/(vendor)/ — 16 pages, roles: vendor_admin, vendor_viewer
- Admin Portal: /app/(admin)/ — 26 pages, roles: shelfspace_admin, shelfspace_viewer
- Rep Portal: /app/(rep)/ — 8 pages, roles: rep_admin, rep_viewer
- Auth Portal: /app/(auth)/ — 9 pages (login, signup, MFA, password reset, vendor setup)
- Public Pages: /app/payment/view, /app/settlement/view, /app/shelfiq/verified, /app/workflow/confirm

## Core Modules

### Settlement Engine
- Weekly calculation: sales x category splits - aging discounts - return credits - platform fees = net payout
- Key files: /lib/settlement/calculations.ts, /app/api/settlements/
- Tables: settlements, sales, returns, invoice_settlements

### Consignment
- Vendor-owned inventory on retailer shelves, aging discounts, weekly settlements
- Key files: /lib/settlement/calculations.ts (getAgingPercent), current_inventory table
- Tables: current_inventory, inventory_received, partnerships (module=Consignment), aging_discount_tiers, split_tiers

### Wholesale / AP
- Purchase orders, invoice verification, payment processing via purchase_orders table
- Key files: /app/api/purchase-orders/, /app/api/payments/
- Tables: purchase_orders, vendor_invoices, invoices, recurring_payments

### Credit Memos / Recovery
- Returns, co-marketing, conversion credits with vendor dispute workflow
- Key files: /app/api/credit-memos/, /lib/credit-memo-notifications.ts
- Tables: credit_memos, credit_memo_line_items, credit_memo_documents, credit_memo_events, disputes, payment_credit_applications
- Statuses: Draft -> Pending_Vendor_Response -> Disputed -> Applied -> Voided

### Delivery Dashboard
- Track incoming shipments, receive inventory, reconcile to POs, invoice parsing
- Key files: /app/(retailer)/retailer/deliveries/, /app/api/deliveries/
- Tables: deliveries, delivery_items, delivery_documents, delivery_activity_log
- Statuses: Ordered -> Received -> Reviewed -> Ready_for_Payment -> Paid -> Complete

### Invoicing
- Platform bills to retailers/vendors for ShelfSpace fees
- Key files: /app/api/invoices/, /lib/pdf/settlement-id.ts, /lib/pdf/generate.ts
- Tables: invoices (recipient_type: Retailer|Vendor), invoice_number_sequences

### Payments (Check 21)
- Check generation, PDF rendering, clearing workflow
- Key files: /app/api/payments/, /lib/pdf/
- Tables: purchase_orders (payment fields), bank_accounts, payment_access_tokens, documents
- Statuses: Pending -> Processed -> Delivered -> Cleared -> Failed

### QuickBooks Online Integration
- OAuth, vendor mapping, GL account mapping, settlement/bill sync, PDF attachments
- Key files: /app/api/quickbooks/, /lib/quickbooks/ (client.ts, sync.ts, vendor-match.ts)
- Tables: qbo_connections, qbo_sync_log, qbo_vendor_mappings, qb_exports

### ShelfiQ (AI)
- Invoice parsing, vendor matching, AP automation, chat assistant, email ingestion
- Vendor-facing: 35 tools (payments, settlements, inventory, disputes, promotions, terms, brands, data export, verification)
- Retailer AP mode: 17 tools (vendor payment queries, statement reconciliation, contact management)
- Key files: /lib/shelfiq/ (system-prompt.ts, orchestrate.ts, tools.ts, tool-handlers.ts, retailer-ap-tools.ts, retailer-ap-tool-handlers.ts, workflow-engine.ts, thread.ts, ingest-email-invoice.ts, parse-invoice.ts, match-invoice.ts, identify-sender.ts, classify-document.ts, escalate.ts)
- Tables: shelfiq_config, shelfiq_usage, shelfiq_errors, email_conversations, email_messages, email_sender_verifications, email_workflows, email_workflow_events, ai_chat_usage, ai_credit_purchases

### Retailer AP Email Bot
- Inbound email processing (Resend webhook), auto-replies to vendor inquiries, human takeover detection
- Handles forwarded invoices, attachment ingestion, marketing/spam filtering
- Key files: /app/api/inbound-email/, /lib/shelfiq/retailer-ap-tool-handlers.ts, /lib/shelfiq/identify-sender.ts
- Tables: retailer_ap_configs, email_conversations, email_messages

### Conversion Credits
- Wholesale-to-consignment conversion with credit tracking and deductions
- Key files: /app/api/conversion-credits/
- Tables: conversion_credits, conversion_credit_deductions

### Promotions (Co-marketing)
- Retailer proposes co-op promos, vendor accepts/declines, credits generated
- Key files: /app/api/promotions/, promotions table
- Tables: promotions, promotion_retailers, retailer_promotions
- Links to credit_memos (reason_category=Comarketing)

### Insights & Analytics
- Sales velocity, dead money heatmap, cash liberation, vendor scorecards
- Key files: /app/(retailer)/retailer/insights/, /app/(vendor)/vendor/insights/
- Both retailer and vendor insights dashboards (recharts)

### Reps Portal
- Sales rep management, account tracking, commission calculations, invites
- Key files: /app/(rep)/, /app/api/rep/, /app/(admin)/admin/reps/
- Tables: reps, rep_invites, rep_commissions

### User Management & Auth
- MFA (SMS/TOTP/email), role-based access, email invites, location-scoped access
- Key files: /lib/auth/, /app/api/mfa/, /app/api/users/, /app/api/invite-partner/
- Tables: user_profiles, user_join_requests, user_retailer_locations, user_vendor_locations, email_mfa_codes

### Partnerships & Onboarding
- Connection requests, vendor invites, partnership terms, split tiers, negotiation
- Key files: /app/api/partnerships/, /lib/partnerships/propagate-to-group.ts
- Tables: partnerships, partnership_splits, partnership_split_history, split_tiers, connection_requests, vendor_invites, negotiation_log

### Bulk Onboarding
- CSV/XLSX import for retailers, vendors, inventory with smart header detection
- Key files: /app/api/uploads/, /lib/csv/
- Tables: ingestion_jobs

### Tax Documents (W-9 / Resale Certificates)
- Vendor submits W-9 (EIN + federal tax classification) inside the vendor-intake wizard; retailer e-signs own IRS W-9 + state resale certificate (e.g. MA ST-4) auto-filled from business profile, typed-name signature per 28 U.S.C. § 1746, sign-once-across-group-locations; reveal-and-share with access logging + notification to the other party; EIN encrypted (AES-256-GCM) + masked. NOT a tax-filing service — no 1099 generation, no IRS TIN matching; vendor ST-4 upload deprecated (W-9 only). Shipped ~2026-06-27/29, verified live 2026-06-30.
- Key files: /app/api/vendor-intake/, /lib/vendor-intake/, /app/api/retailer/tax-forms/, /app/api/retailer/vendor-docs/reveal/, /app/api/vendor/retailer-docs/reveal/, /lib/pdf/tax-forms/, /app/(retailer)/retailer/settings/tax-forms-section.tsx, /components/{vendor,retailer}-tax-docs-card.tsx
- Tables: documents (document_type w9/st4/resale_cert), tax_form_attestations, sensitive_document_access_log; vendors.w9_status/ein_encrypted/ein_last4, retailers.resale_cert_status/sales_tax_registration

### Dispute Resolution
- Unified disputes linked to settlements, credit_memos, payments, or shipments
- Key files: /app/api/disputes/, /app/api/escalations/, /app/(admin)/admin/escalations/
- Tables: disputes

### Notifications & Email
- Transactional emails via Resend (20+ sender functions), retailer email branding
- Key files: /lib/email/ (20 send/notify files), /lib/payment-notifications.ts, /lib/credit-memo-notifications.ts, /lib/partnership-notifications.ts, /lib/notification-preferences.ts
- Tables: notifications

### Contacts & Key Contacts
- Contact management across portals, vendor AR/AP contacts, operations contacts
- Key files: /lib/contacts/create-contact-only.ts, /app/api/key-contacts/, /lib/vendor-matching.ts
- Tables: contacts, key_contacts, vendor_aliases, vendor_groups

### Accounting & Exports
- QBO export builder, data export requests
- Key files: /lib/accounting/qb-export-builder.ts, /app/api/accounting/
- Tables: qb_exports, data_export_requests

### Cron Jobs
- Scheduled tasks: monthly statement reminder cron (every 3 business days), stale credit memo escalation (90-day backstop, one-shot per statement), proposal auto-approval, data cleanup, demo followup, ShelfiQ digest, dev digest
- Note: monthly_statement_auto_approve_enabled flag defaults to false (auto-approval cron returns early; statements stay Pending Review until vendor responds). invoice_payment_hold_on_open_statement_enabled flag also defaults to false.
- Key files: /app/api/cron/ (6 endpoints)

### Platform Administration
- Feature flags, platform settings, bug reports, demo leads, fee management
- Key files: /app/(admin)/admin/feature-flags/, /app/(admin)/admin/bug-reports/, /app/(admin)/admin/demo-leads/, /app/(admin)/admin/shelfspace-fees/
- Tables: feature_flags, platform_settings, platform_fee_ledger, fee_waiver_entities, bug_reports, demo_leads, demo_verification_codes, account_notes, regulatory_reports

### Milestones & Gamification
- Achievement tracking, confetti animations
- Key files: /lib/milestones/compute-milestones.ts, /lib/milestones/fire-confetti.ts, /lib/confetti.ts

## Database: ~88 tables with RLS, UUID PKs, soft deletes, audit logging
## API: ~206 route.ts files across ~50 API directories
