# ShelfSpace Documentation Plan
# Generated: 2026-03-25
# Updated: 2026-03-25 (audit fixes)

## Doc Pages (40 total)

### Getting Started (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs | What is ShelfSpace? | shelfspace cannabis | Platform overview | /consignment, /accounts-payable, /credit-recovery, /shelfiq |
| /docs/getting-started | Getting Started with ShelfSpace | shelfspace setup dispensary | Onboarding flow | /contact, /docs |

### Consignment (6 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/consignment/overview | How Consignment Works on ShelfSpace | cannabis consignment platform | /lib/settlement/calculations.ts, partnerships table, current_inventory table | /consignment, /docs/consignment/settlements, /docs/consignment/aging-discounts, /docs/consignment/profit-splits |
| /docs/consignment/contracts | Consignment Contracts and Terms | cannabis consignment agreement | partnerships_settings, category_splits | /docs/consignment/overview |
| /docs/consignment/settlements | Weekly Consignment Settlements | consignment settlement cannabis | /lib/settlement/calculations.ts, /app/api/settlements/, settlements table, settlement_items table, sales table, returns table | /docs/consignment/settlement-reports |
| /docs/consignment/settlement-reports | Reading Your Settlement Report | consignment settlement report | /lib/pdf/settlement-id.ts, settlement_items table | /docs/consignment/settlements |
| /docs/consignment/aging-discounts | Aging Discounts and Inventory Markdowns | cannabis inventory markdown expiring | aging_discount_tiers, getAgingPercent(), current_inventory table | /docs/consignment/settlements |
| /docs/consignment/profit-splits | Category Splits and Profit Sharing | consignment profit split cannabis | partnerships_settings.category_splits | /docs/consignment/contracts |

### Credit Recovery (5 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/credit-recovery/overview | How Credit Recovery Works | cannabis vendor credit recovery | /app/api/credit-memos/, /lib/credit-memo-notifications.ts, credit_memos table, credit_memo_line_items table | /credit-recovery, /docs/credit-recovery/returns |
| /docs/credit-recovery/returns | Return Credits | dispensary product return credit | credit_memos (reason=Returns), credit_memo_line_items, returns table | /docs/credit-recovery/overview |
| /docs/credit-recovery/expirations | Expiration Credits | cannabis expired product credit | credit_memos, credit_memo_line_items, METRC integration | /docs/credit-recovery/overview |
| /docs/credit-recovery/co-marketing | Co-Marketing Credits | dispensary co-op vendor marketing | promotions table, credit_memos (reason=Comarketing) | /docs/credit-recovery/overview, /docs/promotions/overview |
| /docs/credit-recovery/approval-workflow | Credit Memo Approval Process | credit memo approval cannabis | credit_memo_responses, disputes table, credit_memos statuses | /docs/credit-recovery/overview |

### Accounts Payable (5 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/accounts-payable/overview | How Managed AP Works | cannabis dispensary accounts payable | /app/api/payments/, /app/api/purchase-orders/, purchase_orders table, payments table, invoices table | /accounts-payable, /docs/accounts-payable/creating-payments |
| /docs/accounts-payable/vendor-onboarding | Vendor Onboarding | onboard cannabis vendor | /app/api/users/invite, vendor signup flow | /docs/vendor-portal/overview |
| /docs/accounts-payable/creating-payments | Payments and Check Generation | cannabis vendor check payment | /app/api/payments/, payments table, bank_accounts table | /docs/checks/overview |
| /docs/accounts-payable/invoice-verification | Invoice Verification and Delivery Matching | verify cannabis vendor invoice | invoices table, purchase_orders table, deliveries table | /docs/accounts-payable/overview, /docs/deliveries/overview |
| /docs/accounts-payable/email-deliveries | How to Manage Cannabis Deliveries by Email | manage cannabis deliveries by email | /lib/shelfiq/create-delivery-from-invoice.ts, /lib/shelfiq/retailer-ap-tools.ts, /lib/shelfiq/thread.ts, /lib/deliveries/notify-delivery-received.ts, /app/api/inbound-email/ | /docs/deliveries/overview, /docs/shelfiq/tools, /docs/accounts-payable/invoice-verification |

### QuickBooks (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/quickbooks/overview | QuickBooks Integration | shelfspace quickbooks cannabis | /app/api/quickbooks/, /lib/quickbooks/, qbo_connections table, qbo_sync_log table | /docs/accounts-payable/overview |
| /docs/quickbooks/setup | QuickBooks Setup Guide | shelfspace quickbooks setup | /app/api/quickbooks/, OAuth flow, qbo_vendor_mappings table, qbo_connections table | /docs/quickbooks/overview |

### Checks (3 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/checks/overview | Check 21 Payments on ShelfSpace | check 21 cannabis vendor payment | /app/api/payments/, payments table, bank_accounts table, check_images table | /checks, /docs/accounts-payable/creating-payments |
| /docs/checks/depositing | How to Deposit a ShelfSpace Check | deposit shelfspace check | check_images, payment statuses | /docs/checks/overview |
| /docs/checks/void-reissue | Voiding and Reissuing Checks | cannabis vendor payment void reissue | /app/api/payments/, void workflow | /docs/checks/overview |

### Vendor Portal (4 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/vendor-portal/overview | The ShelfSpace Vendor Portal | cannabis vendor portal | /app/(vendor)/ pages | /docs/accounts-payable/vendor-onboarding |
| /docs/vendor-portal/downloading-checks | Downloading Your Checks | download vendor check shelfspace | vendor payments page, documents | /docs/checks/depositing |
| /docs/vendor-portal/payment-history | Viewing Payment History | vendor payment history cannabis | vendor payments page | /docs/vendor-portal/overview |
| /docs/vendor-portal/disputes | Responding to Credit Memos | vendor dispute credit memo | /app/(vendor)/vendor/disputes/, dispute_responses | /docs/credit-recovery/approval-workflow |

### ShelfiQ (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/shelfiq/overview | ShelfiQ AI Assistant | cannabis ai assistant dispensary | /lib/shelfiq/system-prompt.ts, /lib/shelfiq/orchestrate.ts, /lib/shelfiq/tools.ts | /shelfiq, /docs/accounts-payable/overview |
| /docs/shelfiq/tools | What ShelfiQ Can Do | shelfspace ai invoice parsing | /lib/shelfiq/tool-handlers.ts, 20+ tools | /docs/shelfiq/overview, /docs/accounts-payable/invoice-verification |

### Promotions (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/promotions/overview | Co-Marketing Promotions | cannabis dispensary co-op promotions | /app/api/promotions/, promotions table | /docs/credit-recovery/co-marketing |
| /docs/promotions/creating | Creating a Promotion | dispensary vendor promotion setup | /app/api/promotions/, promotions table, credit_memos | /docs/promotions/overview |

### Insights (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/insights/overview | Insights and Analytics | cannabis dispensary analytics dashboard | /app/(retailer)/retailer/insights/, recharts | /docs/consignment/overview, /docs/accounts-payable/overview |
| /docs/insights/vendor-scorecards | Vendor Scorecards | cannabis vendor scorecard performance | /app/(retailer)/retailer/insights/, vendor dashboards | /docs/insights/overview |

### Integrations (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/integrations/pos | POS Integration | cannabis pos integration shelfspace | inventory upload, CSV import, /lib/csv/ | /docs/consignment/overview |
| /docs/integrations/metrc | METRC Compatibility | shelfspace metrc integration | current_inventory, delivery_items | /docs/integrations/pos |

### Deliveries (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/deliveries/overview | Delivery Tracking and Receiving | cannabis delivery tracking dispensary | /app/(retailer)/retailer/deliveries/, /app/api/deliveries/, deliveries table, delivery_items table, delivery_documents table, delivery_activity_log table | /docs/accounts-payable/invoice-verification |
| /docs/deliveries/reconciliation | Delivery Reconciliation | reconcile cannabis delivery invoice | delivery_items, purchase_orders | /docs/deliveries/overview |

### User Management (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/user-management/overview | Users, Roles, and Permissions | cannabis dispensary user roles permissions | /lib/auth/, /app/api/users/, user_profiles table | /docs/getting-started |
| /docs/user-management/mfa | Multi-Factor Authentication | shelfspace mfa setup | /app/api/mfa/, SMS/TOTP flows | /docs/user-management/overview, /docs/security/overview |

### Security & Compliance (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/security/overview | Security and Data Protection | shelfspace data security cannabis | RLS policies, audit_logs | /docs/security/audit-trail |
| /docs/security/audit-trail | Audit Trail and Compliance | cannabis audit trail compliance | audit_logs table, soft deletes | /docs/security/overview |

## Build Order (sequential — each agent must complete before the next starts)
- Agent 1: Getting Started (2) + Consignment overview, contracts, settlements (3) = 5 pages
- Agent 2: Consignment reports, aging, splits (3) + Credit Recovery overview, returns (2) = 5 pages
- Agent 3: Credit Recovery expirations, co-marketing, approval (3) + AP overview, onboarding (2) = 5 pages
- Agent 4: AP payments, verification (2) + QuickBooks (2) + Checks (3) = 7 pages
- Agent 5: Vendor Portal (4) + ShelfiQ (2) = 6 pages
- Agent 6: Promotions (2) + Insights (2) + Integrations POS, METRC (2) = 6 pages
- Agent 7: Deliveries (2) + User Management (2) + Security (2) = 6 pages

## Phase 2 Backlog — Platform Modules Without Doc Pages

The following customer-facing modules from platform-map.md have no dedicated doc page in Phase 1.
They are partially referenced in existing pages but warrant their own pages in a future expansion.

| Module | Currently Referenced In | Notes |
|--------|------------------------|-------|
| Conversion Credits | /docs/consignment/overview (tangential) | Wholesale-to-consignment conversion tracking |
| Reps Portal | none | Sales rep management, commissions; separate portal |
| Bulk Onboarding | /docs/getting-started (tangential) | CSV/XLSX import for retailers, vendors, inventory |
| Notifications & Email | none | Email preferences, transactional email management |
| Contacts & Key Contacts | /docs/accounts-payable/vendor-onboarding (tangential) | Contact management across portals |
| Accounting & Exports | /docs/quickbooks/overview (tangential) | QBO export builder, data export requests |

Internal-only modules intentionally excluded from docs:
- Cron Jobs (background scheduled tasks)
- Platform Administration (ShelfSpace admin tooling)
- Milestones & Gamification (minor UX feature, not a standalone workflow)

Modules covered implicitly by existing Phase 1 pages (no standalone page needed):
- Settlement Engine -> /docs/consignment/settlements, /docs/consignment/settlement-reports
- Invoicing -> /docs/accounts-payable/overview
- Partnerships & Onboarding -> /docs/accounts-payable/vendor-onboarding
- Dispute Resolution -> /docs/vendor-portal/disputes, /docs/credit-recovery/approval-workflow
