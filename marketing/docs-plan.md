# ShelfSpace Documentation Plan
# Generated: 2026-03-25

## Doc Pages (32 total)

### Getting Started (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs | What is ShelfSpace? | shelfspace cannabis | Platform overview | /consignment, /accounts-payable, /credit-recovery |
| /docs/getting-started | Getting Started with ShelfSpace | shelfspace setup dispensary | Onboarding flow | /contact, /docs |

### Consignment (6 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/consignment/overview | How Consignment Works on ShelfSpace | cannabis consignment platform | /lib/settlement/calculations.ts, partnerships table | /consignment, /docs/consignment/settlements |
| /docs/consignment/contracts | Consignment Contracts and Terms | cannabis consignment agreement | partnerships_settings, category_splits | /docs/consignment/overview |
| /docs/consignment/settlements | Weekly Consignment Settlements | consignment settlement cannabis | /lib/settlement/calculations.ts, settlements table | /docs/consignment/settlement-reports |
| /docs/consignment/settlement-reports | Reading Your Settlement Report | consignment settlement report | /lib/pdf/settlement-id.ts, settlement_items | /docs/consignment/settlements |
| /docs/consignment/aging-discounts | Aging Discounts and Inventory Markdowns | cannabis inventory aging discount | aging_discount_tiers, getAgingPercent() | /docs/consignment/settlements |
| /docs/consignment/profit-splits | Category Splits and Profit Sharing | consignment profit split cannabis | partnerships_settings.category_splits | /docs/consignment/contracts |

### Credit Recovery (5 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/credit-recovery/overview | How Credit Recovery Works | cannabis vendor credit recovery | /app/api/credit-memos/, credit_memos table | /credit-recovery, /docs/credit-recovery/returns |
| /docs/credit-recovery/returns | Return Credits | dispensary product return credit | credit_memos (reason=Returns), returns table | /docs/credit-recovery/overview |
| /docs/credit-recovery/expirations | Expiration Credits | cannabis expired product credit | credit_memos, METRC integration | /docs/credit-recovery/overview |
| /docs/credit-recovery/co-marketing | Co-Marketing Credits | cannabis co-marketing vendor credit | promotions table, credit_memos (reason=Comarketing) | /docs/credit-recovery/overview, /docs/promotions |
| /docs/credit-recovery/approval-workflow | Credit Memo Approval Process | credit memo approval cannabis | credit_memo_responses, disputes | /docs/credit-recovery/overview |

### Accounts Payable (5 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/accounts-payable/overview | How Managed AP Works | cannabis dispensary accounts payable | /app/api/payments/, /app/api/purchase-orders/ | /accounts-payable, /docs/accounts-payable/creating-payments |
| /docs/accounts-payable/vendor-onboarding | Vendor Onboarding | onboard cannabis vendor | /app/api/users/invite, vendor signup flow | /docs/vendor-portal/overview |
| /docs/accounts-payable/creating-payments | Payments and Check Generation | cannabis vendor check payment | /app/api/payments/, payments table | /docs/checks/overview |
| /docs/accounts-payable/invoice-verification | Invoice Verification and Delivery Matching | verify cannabis vendor invoice | deliveries table, purchase_orders table | /docs/accounts-payable/overview |
| /docs/accounts-payable/quickbooks | QuickBooks Integration | shelfspace quickbooks cannabis | /app/api/quickbooks/, quickbooks_integrations | /docs/accounts-payable/overview |

### Checks (3 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/checks/overview | Check 21 Payments on ShelfSpace | check 21 cannabis vendor payment | /app/api/payments/, payments table | /checks, /docs/accounts-payable/creating-payments |
| /docs/checks/depositing | How to Deposit a ShelfSpace Check | deposit shelfspace check | check_images, payment statuses | /docs/checks/overview |
| /docs/checks/void-reissue | Voiding and Reissuing Checks | void reissue cannabis check | /app/api/payments/, void workflow | /docs/checks/overview |

### Vendor Portal (4 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/vendor-portal/overview | The ShelfSpace Vendor Portal | cannabis vendor portal | /app/(vendor)/ pages | /docs/accounts-payable/vendor-onboarding |
| /docs/vendor-portal/downloading-checks | Downloading Your Checks | download vendor check shelfspace | vendor payments page, documents | /docs/checks/depositing |
| /docs/vendor-portal/payment-history | Viewing Payment History | vendor payment history cannabis | vendor payments page | /docs/vendor-portal/overview |
| /docs/vendor-portal/disputes | Responding to Credit Memos | vendor dispute credit memo | /app/(vendor)/vendor/disputes/, dispute_responses | /docs/credit-recovery/approval-workflow |

### Integrations (3 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/integrations/pos | POS Integration | cannabis pos integration shelfspace | inventory upload, CSV import | /docs/consignment/overview |
| /docs/integrations/metrc | METRC Compatibility | shelfspace metrc integration | current_inventory, delivery_items | /docs/integrations/pos |
| /docs/integrations/quickbooks | QuickBooks Setup Guide | shelfspace quickbooks setup | /app/api/quickbooks/, OAuth flow | /docs/accounts-payable/quickbooks |

### Deliveries (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/deliveries/overview | Delivery Tracking and Receiving | cannabis delivery tracking dispensary | /app/api/deliveries/, deliveries table | /docs/accounts-payable/invoice-verification |
| /docs/deliveries/reconciliation | Delivery Reconciliation | reconcile cannabis delivery invoice | delivery_items, purchase_orders | /docs/deliveries/overview |

### Security & Compliance (2 pages)
| URL | Title | Primary Keyword | Source Files | Cross-links |
|-----|-------|----------------|-------------|-------------|
| /docs/security/overview | Security and Data Protection | shelfspace data security cannabis | RLS policies, audit_logs | /docs/security/audit-trail |
| /docs/security/audit-trail | Audit Trail and Compliance | cannabis audit trail compliance | audit_logs table, soft deletes | /docs/security/overview |

## Build Order (by agent)
- Agent 1: Getting Started (2) + Consignment overview, contracts, settlements (3) = 5 pages
- Agent 2: Consignment reports, aging, splits (3) + Credit Recovery overview, returns (2) = 5 pages
- Agent 3: Credit Recovery expirations, co-marketing, approval (3) + AP overview, onboarding (2) = 5 pages
- Agent 4: AP payments, verification, quickbooks (3) + Checks (3) = 6 pages
- Agent 5: Vendor Portal (4) + Integrations POS, METRC (2) = 6 pages
- Agent 6: Integrations QB (1) + Deliveries (2) + Security (2) = 5 pages
