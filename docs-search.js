(function() {
  'use strict';

  if (window.__shelfDocsSearchLoaded) return;
  window.__shelfDocsSearchLoaded = true;

  var DOCS = [
    { t: "Getting Started with ShelfSpace", n: "Onboarding", d: "Setup for dispensaries — live in under a week. What to expect during onboarding and what the platform handles.", s: "Getting Started", u: "/docs/getting-started", k: "onboarding setup live week" },
    { t: "How Consignment Works", n: "Overview", d: "Vendor-owned inventory, weekly settlements, profit splits. The platform runs the math and the checks.", s: "Consignment", u: "/docs/consignment/overview", k: "consigned model pay after sale" },
    { t: "Weekly Consignment Settlements", n: "Weekly Settlements", d: "How weekly payouts are calculated from POS data, category splits, aging discounts, and credits. Penny-precise.", s: "Consignment", u: "/docs/consignment/settlements", k: "payout weekly settlement remittance vendor pay weekly check consignment payment accrual week sell-through" },
    { t: "Reading Your Settlement Report", n: "Settlement Reports", d: "Payout table, returns, discounts, inventory snapshot, and final check. How to read every section.", s: "Consignment", u: "/docs/consignment/settlement-reports", k: "report PDF read settlement review breakdown sections payout sheet six-page report sample" },
    { t: "Consignment Contracts and Terms", n: "Contracts & Terms", d: "Profit splits, shrinkage, discounts, and payment terms. You set them with your vendor; the platform applies them.", s: "Consignment", u: "/docs/consignment/contracts", k: "agreement contract terms consignment terms payment terms Net 30 Net 45 amendment partnership amend renegotiate" },
    { t: "Category Splits and Profit Sharing", n: "Profit Splits", d: "How category-level splits are negotiated, configured, and applied in weekly settlements.", s: "Consignment", u: "/docs/consignment/profit-splits", k: "split percentage margin gross category split profit share revenue share keystone vendor share retailer share" },
    { t: "Aging Discounts and Inventory Markdowns", n: "Aging Discounts", d: "How aging discounts work for expiring product, why they exist, and how they affect settlements.", s: "Consignment", u: "/docs/consignment/aging-discounts", k: "markdown expiring stale dead stock shrinkage aging tiers shelf age discount tier sell-through deep discount" },
    { t: "How to Receive a Cannabis Consignment Order", n: "Receiving & Payout", d: "Step-by-step receiving SOP for a consignment delivery — designate Order Type, upload manifest, confirm receipt, run payday.", s: "Consignment", u: "/docs/consignment/receiving-and-payout", k: "consignment receiving SOP receive consignment order Order Type Consignment Wholesale mixed consignment same vendor two modes Approve and Pay Mark as paid externally Check 21 settlement report Master Vendor Split Operational Discount Cap" },
    { t: "Approve & Pay vs Mark as Paid Externally", n: "Payday Decision", d: "Two ways to resolve a consignment settlement — when to have the platform cut a Check 21 versus record an off-platform payment. QuickBooks, fees, vendor experience compared.", s: "Consignment", u: "/docs/consignment/approve-pay-vs-paid-externally", k: "Approve and Pay Mark as paid externally settlement payment decision Check 21 QuickBooks sync per-check fee paid externally stamp own check ACH bank bill-pay reversibility void reissue consignment payday" },
    { t: "How Credit Recovery Works", n: "Overview", d: "Returns, expirations, and co-marketing credits — tracked and recovered, so you collect what you're owed.", s: "Credit Recovery", u: "/docs/credit-recovery/overview", k: "credit memo recovery vendor credit claw back return expiration co-marketing monthly statement waste destruction" },
    { t: "Credit Recovery Onboarding — Getting Started", n: "Onboarding SOP", d: "Step-by-step onboarding from signing on to your first monthly credit memos. Vendor list, buyer kickoff, monthly cycle.", s: "Credit Recovery", u: "/docs/credit-recovery/onboarding-sop", k: "credit recovery onboarding credit recovery setup get started credit recovery new credit recovery customer onboard credit recovery first month credit recovery vendor list upload monthly review setup buyer notification template kickoff email partnership rollout new retailer signup credit memo lifecycle" },
    { t: "Return Credits", n: "Return Credits", d: "Returned cannabis products tracked in Metrc; credit memos generated against vendor payments.", s: "Credit Recovery", u: "/docs/credit-recovery/returns", k: "returns return to vendor RTV defective broken seal metrc return rejected product customer return refund" },
    { t: "Expiration Credits", n: "Expiration Credits", d: "Expiration dates monitored, aging inventory flagged, credit memos generated before product walks.", s: "Credit Recovery", u: "/docs/credit-recovery/expirations", k: "expired expiration best by aging product stale out of date expired inventory credit short-dated near expiry waste" },
    { t: "Co-Marketing Credits", n: "Co-Marketing Credits", d: "Vendor-funded promotions tracked; credit memos generated so you collect what was agreed.", s: "Credit Recovery", u: "/docs/credit-recovery/co-marketing", k: "co-op marketing MDF promotional credit vendor funded promo below keystone keystone pricing market development funds" },
    { t: "Credit Memo Approval Process", n: "Approval Workflow", d: "Each status from Draft to Applied, how vendors respond in the 10-business-day window, and what happens on silence.", s: "Credit Recovery", u: "/docs/credit-recovery/approval-workflow", k: "approval workflow status Draft Pending Vendor Approved Applied deemed approval 10 business day review window vendor response in discussion dispute silence" },
    { t: "How Cannabis AP Works", n: "Overview", d: "Cannabis dispensary accounts payable, end to end: verify invoices, generate checks, ShelfiQ answers vendor questions, QuickBooks synced. You approve and pay.", s: "Accounts Payable", u: "/docs/accounts-payable/overview", k: "AP accounts payable vendor payment invoice processing three-way matching Check 21 bookkeeper QuickBooks" },
    { t: "Vendor Onboarding", n: "Vendor Onboarding", d: "Onboard cannabis vendor partners in minutes. Email invite, portal setup, cannabis and non-cannabis vendors.", s: "Accounts Payable", u: "/docs/accounts-payable/vendor-onboarding", k: "invite vendor add vendor new vendor onboard vendor vendor signup supplier onboarding invite supplier non-cannabis vendor W9 partnership" },
    { t: "Invoice Verification and Delivery Matching", n: "Invoice Verification", d: "Verify cannabis vendor invoice accuracy before payment. The platform matches invoices to deliveries; ShelfiQ raises issues with vendors.", s: "Accounts Payable", u: "/docs/accounts-payable/invoice-verification", k: "invoice match verify invoice three-way match PO match invoice review wholesale invoice invoice parsing buyer mismatch line item check" },
    { t: "Payments and Check Generation", n: "Creating Payments", d: "Cannabis vendor check payment processing with Check 21. The platform creates payments, generates checks, and syncs QuickBooks.", s: "Accounts Payable", u: "/docs/accounts-payable/creating-payments", k: "create payment pay vendor issue check schedule payment vendor check send check check run pay run batch payment vendor pay" },
    { t: "Recurring Vendor Payments", n: "Recurring Payments", d: "Schedule weekly, biweekly, or monthly vendor checks for rent, utilities, and fixed costs. Pause, skip, edit, or cancel anytime.", s: "Accounts Payable", u: "/docs/accounts-payable/recurring-payments", k: "recurring payment scheduled payment automatic payment rent utilities subscription recurring vendor payment weekly biweekly monthly autopay standing payment fixed cost cadence" },
    { t: "Managing Your Cannabis Vendors", n: "Managing Vendors", d: "One searchable vendor list, a full profile per vendor (deliveries, payments, credits, SKUs, settings), and auto-filled vendor details for your review.", s: "Accounts Payable", u: "/docs/accounts-payable/managing-vendors", k: "manage vendors vendor list vendor directory vendor profile vendor detail vendor enrichment auto fill vendor details vendor record vendor management supplier list invite vendor vendor announcement" },
    { t: "Manage Cannabis Deliveries by Email", n: "Email Workflow", d: "AP workflow by email — send invoices, update deliveries, attach COAs, and add receiving notes through one inbox.", s: "Accounts Payable", u: "/docs/accounts-payable/email-deliveries", k: "email inbox COA forward invoice ShelfiQ email AP bot send via email email-driven delivery email ingestion email AP" },
    { t: "QuickBooks Integration", n: "Overview", d: "Settlements, bills, vendor lists, and payment records sync to QuickBooks Online with no manual data entry.", s: "QuickBooks", u: "/docs/quickbooks/overview", k: "QBO sync QuickBooks Online accounting integration bill sync payment sync vendor sync intuit chart of accounts cleared status" },
    { t: "Cannabis Dispensary QuickBooks Setup", n: "Setup Guide", d: "Connect QBO, pick accounts, set per-vendor overrides, watch Bookkeeper Match Health. Every settlement and AP payment becomes a Bill + Check.", s: "QuickBooks", u: "/docs/quickbooks/setup", k: "QuickBooks Setup Guide OAuth GL mapping bookkeeper match health backfill checks cleared status sync expense account bank account per-vendor override" },
    { t: "Cannabis Vendor QuickBooks Setup", n: "Vendor QuickBooks Setup", d: "Vendor-side QBO setup. Connect QBO, map customers and items, backfill history. Every settlement becomes an Invoice plus a matching Payment.", s: "Vendor Portal", u: "/docs/vendor-portal/quickbooks-setup", k: "vendor qbo invoice payment received OAuth mapping refresh token closed period" },
    { t: "Check 21 Payments", n: "Overview (Check 21)", d: "Why cannabis needs Check 21, how digital checks work, and how vendors deposit them.", s: "Checks", u: "/docs/checks/overview", k: "digital check check 21 RCC remote check IRD image replacement document mailed check paper check substitute check" },
    { t: "How to Deposit a ShelfSpace Check", n: "How to Deposit", d: "Deposit via mobile deposit, print at home, or branch visit. Compatible with every major U.S. bank.", s: "Checks", u: "/docs/checks/depositing", k: "deposit mobile bank ACH wire substitute check IRD remote deposit cash check vendor check branch deposit print at home" },
    { t: "Deposit with a Check Scanner", n: "Check Scanner Workflow", d: "Print the Settle Report check page, cut, endorse, and run it through your desktop scanner. Works with RDM, Digital Check, Panini, and other RDC hardware.", s: "Checks", u: "/docs/checks/check-scanner", k: "RDM scanner Digital Check Panini Epson Burroughs desktop scanner RDC remote deposit capture MICR hand key endorse Settle Report tear off cut substitute check magnetic ink TellerScan CheXpress Vision X mI:Deal TM-S EC-series check scanner workflow" },
    { t: "Voiding and Reissuing Checks", n: "Void & Reissue", d: "Cannabis vendor payment void and reissue in one step. Maintain a full audit trail.", s: "Checks", u: "/docs/checks/void-reissue", k: "void reissue cancel stop payment lost check replacement check reissue void check cancel check check problems" },
    { t: "Mailing Physical Checks to Vendors", n: "Mailing Checks", d: "Mail a physical vendor check instead of digital portal delivery. How retailers opt a vendor into mailed checks, and how vendors request paper.", s: "Checks", u: "/docs/checks/mailing", k: "mail mailed check physical check paper check by mail USPS tracking request mail vendor mailing address opt in postal print and mail mailed paper checks" },
    { t: "How ShelfSpace Billing Works", n: "Billing & Fees", d: "Flat $20 per artifact — every check cut and every credit memo recovered. Free to start, no subscription. Vendors never pay.", s: "Billing", u: "/docs/billing/overview", k: "billing fees pricing cost $20 per artifact fee statement charge what does it cost monthly statement how much do i pay collection" },
    { t: "Cannabis Vendor Portal", n: "Overview", d: "Where every vendor checks downloads, payment history, and credit memos across all retailer partners — free.", s: "Vendor Portal", u: "/docs/vendor-portal/overview", k: "vendor portal vendor login supplier portal vendor sign in partner portal ourshelf.space free vendor access supplier login" },
    { t: "Downloading Vendor Checks", n: "Downloading Checks", d: "How vendors access, download, and deposit Check 21-compliant payment checks through the secure portal.", s: "Vendor Portal", u: "/docs/vendor-portal/downloading-checks", k: "download check print check save PDF retrieve check get check vendor check PDF mobile deposit download payment" },
    { t: "Vendor Payment History", n: "Payment History", d: "View all payments, filter by date and retailer, export data, and track every dollar through the portal.", s: "Vendor Portal", u: "/docs/vendor-portal/payment-history", k: "history export csv 1099 statement payment history past payments filter payments year-end vendor statement" },
    { t: "Vendor Dispute Credit Memo", n: "Disputes", d: "How vendors review credit memos, accept or dispute charges, and upload documentation through the portal.", s: "Vendor Portal", u: "/docs/vendor-portal/disputes", k: "dispute reject decline disagree push back contest in discussion challenge credit memo dispute vendor disagree dispute charges" },
    { t: "ShelfiQ — Cannabis AI Assistant", n: "Overview", d: "ShelfiQ answers vendor questions, parses invoices, manages AP, and exports data through a simple chat.", s: "ShelfiQ", u: "/docs/shelfiq/overview", k: "AI chat assistant ShelfiQ ask question email AP helper invoice parsing AP bot vendor query LLM agent" },
    { t: "ShelfiQ Tools", n: "Tools", d: "AI invoice parsing, vendor matching, payment queries, data exports, and AP management — everything ShelfiQ can do.", s: "ShelfiQ", u: "/docs/shelfiq/tools", k: "tools invoice parsing AI capability email parsing vendor matching payment query export ask question AP bot tool calling" },
    { t: "Co-Op Promotions", n: "Overview", d: "How retailers and vendors run joint promotions, track impact, and generate credits.", s: "Promotions", u: "/docs/promotions/overview", k: "co-op promo promotion BOGO deal discount vendor promotion joint promo MDF promo overview vendor-funded promotion" },
    { t: "Creating a Promotion", n: "Creating a Promotion", d: "How to create a co-op promotion, get vendor approval, track performance, and generate credits.", s: "Promotions", u: "/docs/promotions/creating", k: "create promo setup new promo promo setup MDF setup vendor approval performance tracking joint promo create promotion" },
    { t: "Vendor Pre-Approval SOP for Promotions", n: "Pre-Approval SOP", d: "Step-by-step SOP for buyers and marketing staff: get every promotion pre-approved before it runs so co-marketing credits clear without dispute at month-end.", s: "Promotions", u: "/docs/promotions/vendor-pre-approval-sop", k: "pre-approval pre approval preapproval promotion approval SOP buyer marketing dispensary promo signoff vendor signoff vendor approval workflow ask vendor record evidence portal email AP bot ShelfiQ promotion creation exact POS wording promotion name match credit memo pre-approved promotions without prior approval split co-marketing approval before run Tincture Tuesday how to pre-approve" },
    { t: "Insights and Analytics", n: "Overview", d: "Track sales velocity, dead inventory, vendor performance, and cash liberation in real time.", s: "Insights", u: "/docs/insights/overview", k: "analytics dashboard KPI metric performance sales velocity sell-through dead inventory cash insights chart report" },
    { t: "Vendor Scorecards", n: "Vendor Scorecards", d: "Grade suppliers on volume, velocity, growth, and reliability with real sell-through data.", s: "Insights", u: "/docs/insights/vendor-scorecards", k: "scorecard supplier rank grade supplier rating vendor evaluation reliability volume velocity growth vendor performance" },
    { t: "POS Integration", n: "POS Integration", d: "Works with any system. CSV upload or API sync with Dutchie, Flowhub, BLAZE, and more. No IT team required.", s: "Integrations", u: "/docs/integrations/pos", k: "Dutchie Flowhub BLAZE point of sale POS Treez Cova Meadow IndicaOnline MJ Freeway Greenbits CSV upload API sync" },
    { t: "Metrc Integration", n: "Metrc", d: "Official Metrc third-party vendor. Read-only connection to power settlements, credit recovery, and AP.", s: "Integrations", u: "/docs/integrations/metrc", k: "Metrc compliance track and trace state compliance Metrc API Metrc manifest seed to sale read-only Metrc connection" },
    { t: "Delivery Tracking and Receiving", n: "Overview", d: "Track incoming shipments, receive inventory, reconcile to purchase orders, and move deliveries to payment.", s: "Deliveries", u: "/docs/deliveries/overview", k: "receiving shipment PO purchase order incoming delivery track delivery vendor delivery wholesale order dock receiving" },
    { t: "Delivery Reconciliation", n: "Reconciliation", d: "Match what was ordered to what arrived, catch discrepancies, and approve deliveries for payment.", s: "Deliveries", u: "/docs/deliveries/reconciliation", k: "reconcile match invoice delivery match verify delivery short shipment discrepancy hold delivery on hold partial delivery" },
    { t: "How to Receive Cannabis Deliveries — Inventory Team SOP", n: "Receiving SOP", d: "Step-by-step receiving SOP for dispensary inventory teams. Upload manifest, confirm what arrived, and adjust before payment.", s: "Deliveries", u: "/docs/deliveries/receiving-sop", k: "receiving inventory clerk dock SOP physical receipt manifest short damaged not compliant receive delivery how to receive" },
    { t: "Cannabis Inventory Reorder Planning with Slots", n: "Slots", d: "Demand velocity, days of supply, and suggested reorder quantities by shelf slot (category and size) — plan across rotating SKUs.", s: "Inventory", u: "/docs/inventory/slots", k: "slots shelf slot inventory reorder planning days of supply demand velocity suggested reorder dead stock stockout par level category size reorder point sell-through buying forecast" },
    { t: "Users, Roles, and Permissions", n: "Roles & Permissions", d: "Three roles per portal, email invites, and location-scoped access for your team.", s: "User Management", u: "/docs/user-management/overview", k: "role permission user invite team member retailer admin viewer inventory employee access location scoped add user" },
    { t: "Multi-Factor Authentication (MFA)", n: "MFA", d: "Enable SMS, TOTP, or email multi-factor authentication to protect your accounts and stay compliant.", s: "User Management", u: "/docs/user-management/mfa", k: "MFA 2FA TOTP SMS authenticator two factor multi factor authenticator app login security enroll" },
    { t: "Cannabis Multi-Location Management", n: "Multiple Locations", d: "Run every dispensary store under one account — add locations, invite per-store contacts, switch between stores, and verify each location separately.", s: "User Management", u: "/docs/user-management/multi-location", k: "multi location multiple stores multi store locations add location store switcher chain dispensary multiple dispensaries retailer group per location second location new store" },
    { t: "Security and Data Protection", n: "Overview", d: "Row-level security, multi-tenant isolation, encryption at rest and in transit, and zero hard deletes.", s: "Security", u: "/docs/security/overview", k: "encryption RLS data protection multi tenant isolation soft delete row level security GDPR SOC2 data security" },
    { t: "Audit Trail and Compliance", n: "Audit Trail", d: "Every action is logged in an immutable record for regulatory audits and internal accountability.", s: "Security", u: "/docs/security/audit-trail", k: "audit log compliance history change log immutable activity trail who did when did regulator state inspection" }
  ];

  /* Section order for sidebar TOC + hub layout */
  var SECTION_ORDER = [
    "Getting Started",
    "Consignment",
    "Accounts Payable",
    "Credit Recovery",
    "Vendor Portal",
    "Checks",
    "Billing",
    "QuickBooks",
    "ShelfiQ",
    "Promotions",
    "Deliveries",
    "Inventory",
    "Insights",
    "Integrations",
    "User Management",
    "Security"
  ];

  var CSS = [
    '.docs-search-wrap{max-width:760px;margin:0 auto 56px;padding:0 48px;position:relative;z-index:5;}',
    '.docs-search-wrap.is-floating{margin:-32px auto 56px;}',
    '.docs-search{position:relative;display:flex;align-items:center;background:var(--white);border:1px solid var(--slate-200);border-radius:14px;padding:0 16px;box-shadow:0 8px 32px rgba(27,67,50,0.06);transition:border-color 0.2s,box-shadow 0.2s;}',
    '.docs-search:focus-within{border-color:var(--green-accent);box-shadow:0 8px 32px rgba(27,67,50,0.10),0 0 0 4px rgba(149,213,178,0.18);}',
    '.docs-search-icon{flex-shrink:0;color:var(--slate-500);margin-right:12px;}',
    '#docs-search{flex:1;border:0;outline:0;background:transparent;font:400 16px/1.5 "DM Sans",sans-serif;color:var(--green-deep);padding:18px 0;min-width:0;}',
    '#docs-search::placeholder{color:var(--slate-500);}',
    '.docs-search-kbd{flex-shrink:0;font:600 12px "Space Mono",monospace;background:var(--slate-100);color:var(--slate-500);padding:4px 8px;border-radius:6px;margin-left:12px;border:1px solid var(--slate-200);}',
    '.docs-search-clear{flex-shrink:0;background:transparent;border:0;cursor:pointer;color:var(--slate-500);padding:4px;margin-left:8px;display:none;border-radius:6px;}',
    '.docs-search-clear:hover{color:var(--green-deep);background:var(--slate-100);}',
    '.docs-search.has-query .docs-search-kbd{display:none;}',
    '.docs-search.has-query .docs-search-clear{display:flex;align-items:center;}',
    '.docs-search-results{position:absolute;top:calc(100% + 8px);left:48px;right:48px;background:var(--white);border:1px solid var(--slate-200);border-radius:14px;box-shadow:0 16px 48px rgba(27,67,50,0.12);max-height:60vh;overflow-y:auto;display:none;z-index:10;}',
    '.docs-search-results.is-open{display:block;}',
    '.docs-search-result{display:block;text-decoration:none;padding:14px 20px;border-bottom:1px solid var(--slate-100);transition:background 0.15s;}',
    '.docs-search-result:last-child{border-bottom:0;}',
    '.docs-search-result:hover,.docs-search-result.is-active{background:var(--green-ghost);}',
    '.docs-search-result-section{font:600 11px/1 "Space Mono",monospace;color:var(--green-mid);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;}',
    '.docs-search-result-title{font:600 15px/1.4 "DM Sans",sans-serif;color:var(--green-deep);margin-bottom:2px;}',
    '.docs-search-result-desc{font:400 13px/1.5 "DM Sans",sans-serif;color:var(--slate-500);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}',
    '.docs-search-result mark{background:rgba(149,213,178,0.4);color:inherit;padding:0 2px;border-radius:2px;}',
    '.docs-search-empty{padding:24px 20px;text-align:center;font:400 14px/1.5 "DM Sans",sans-serif;color:var(--slate-500);}',
    '@media (max-width:900px){.docs-search-wrap{padding:0 24px;margin-bottom:40px;}.docs-search-results{left:24px;right:24px;}}',
    '@media (max-width:600px){.docs-search-kbd{display:none;}}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('docs-search-styles')) return;
    var style = document.createElement('style');
    style.id = 'docs-search-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function highlight(text, terms) {
    var safe = escapeHtml(text);
    if (!terms.length) return safe;
    var pattern = terms
      .filter(Boolean)
      .map(function(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); })
      .sort(function(a, b) { return b.length - a.length; })
      .join('|');
    if (!pattern) return safe;
    return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
  }

  function score(doc, terms) {
    var hay = (doc.t + ' ' + doc.s + ' ' + doc.d + ' ' + (doc.k || '')).toLowerCase();
    var titleHay = (doc.t + ' ' + doc.s + ' ' + (doc.n || '')).toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (!hay.includes(t)) return 0;
      total += titleHay.includes(t) ? 10 : 1;
      if (titleHay.startsWith(t)) total += 5;
    }
    return total;
  }

  function search(q) {
    var terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return DOCS
      .map(function(d) { return { d: d, s: score(d, terms) }; })
      .filter(function(r) { return r.s > 0; })
      .sort(function(a, b) { return b.s - a.s; })
      .slice(0, 10)
      .map(function(r) { return r.d; });
  }

  function mountInto(host) {
    var floating = host.hasAttribute('data-floating');
    var prominent = host.hasAttribute('data-prominent');
    host.classList.add('docs-search-wrap');
    if (floating) host.classList.add('is-floating');
    if (prominent) host.classList.add('is-prominent');
    var placeholder = host.getAttribute('data-placeholder') || 'Search the docs — settlements, vendor portal, credit memo...';

    host.innerHTML =
      '<label class="docs-search" for="docs-search">' +
        '<svg class="docs-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<input type="search" id="docs-search" role="combobox" placeholder="' + escapeHtml(placeholder) + '" aria-label="Search documentation" aria-controls="docs-search-results" aria-haspopup="listbox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" spellcheck="false">' +
        '<kbd class="docs-search-kbd">/</kbd>' +
        '<button type="button" class="docs-search-clear" aria-label="Clear search">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</label>' +
      '<div class="docs-search-results" id="docs-search-results" role="listbox" aria-label="Search results"></div>';

    var input = host.querySelector('#docs-search');
    var resultsEl = host.querySelector('#docs-search-results');
    var clearBtn = host.querySelector('.docs-search-clear');
    var wrap = host.querySelector('.docs-search');
    var activeIdx = -1;
    var current = [];

    function render(q) {
      var matches = search(q);
      current = matches;
      activeIdx = -1;
      input.removeAttribute('aria-activedescendant');

      if (!q.trim()) {
        resultsEl.classList.remove('is-open');
        resultsEl.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      if (!matches.length) {
        resultsEl.innerHTML = '<div class="docs-search-empty">No matches. Try "settlement", "Metrc", or "vendor".</div>';
        resultsEl.classList.add('is-open');
        input.setAttribute('aria-expanded', 'true');
        return;
      }

      var terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
      resultsEl.innerHTML = matches.map(function(d, i) {
        return '<a href="' + d.u + '" class="docs-search-result" role="option" id="docs-search-result-' + i + '" data-idx="' + i + '" aria-selected="false">' +
          '<div class="docs-search-result-section">' + escapeHtml(d.s) + '</div>' +
          '<div class="docs-search-result-title">' + highlight(d.t, terms) + '</div>' +
          '<div class="docs-search-result-desc">' + highlight(d.d, terms) + '</div>' +
        '</a>';
      }).join('');
      resultsEl.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    }

    function setActive(idx) {
      var items = resultsEl.querySelectorAll('.docs-search-result');
      items.forEach(function(el, i) {
        var on = i === idx;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (idx >= 0 && items[idx]) {
        items[idx].scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', 'docs-search-result-' + idx);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
      activeIdx = idx;
    }

    function close() {
      resultsEl.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIdx = -1;
    }

    input.addEventListener('input', function() {
      var q = input.value;
      wrap.classList.toggle('has-query', q.length > 0);
      render(q);
    });

    input.addEventListener('focus', function() {
      if (input.value.trim()) render(input.value);
    });

    input.addEventListener('keydown', function(e) {
      var max = current.length - 1;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (max < 0) return;
        setActive(activeIdx >= max ? 0 : activeIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (max < 0) return;
        setActive(activeIdx <= 0 ? max : activeIdx - 1);
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && current[activeIdx]) {
          e.preventDefault();
          window.location.href = current[activeIdx].u;
        } else if (current.length === 1) {
          e.preventDefault();
          window.location.href = current[0].u;
        }
      } else if (e.key === 'Escape') {
        if (input.value) {
          input.value = '';
          wrap.classList.remove('has-query');
          close();
          resultsEl.innerHTML = '';
        } else {
          input.blur();
          close();
        }
      }
    });

    clearBtn.addEventListener('click', function() {
      input.value = '';
      wrap.classList.remove('has-query');
      resultsEl.innerHTML = '';
      close();
      input.focus();
    });

    document.addEventListener('click', function(e) {
      if (!host.contains(e.target)) close();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && document.activeElement !== input && !e.metaKey && !e.ctrlKey && !e.altKey) {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        input.focus();
        input.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  /* ─── SIDEBAR (article pages) ─── */
  function renderSidebar(host) {
    var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    var groups = {};
    DOCS.forEach(function(d) {
      if (!groups[d.s]) groups[d.s] = [];
      groups[d.s].push(d);
    });

    var html = '';
    html += '<button class="docs-sidebar-mobile" type="button" aria-expanded="false" aria-controls="docs-sidebar-nav">';
    html += '<span>Browse all docs</span>';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
    html += '</button>';

    html += '<nav id="docs-sidebar-nav" aria-label="Documentation sections">';
    SECTION_ORDER.forEach(function(section) {
      var items = groups[section] || [];
      if (!items.length) return;
      html += '<div class="docs-sidebar-group">';
      html += '<div class="docs-sidebar-group-label">' + escapeHtml(section) + '</div>';
      items.forEach(function(d) {
        var isActive = (d.u === path);
        html += '<a href="' + d.u + '" class="docs-sidebar-link' + (isActive ? ' is-active' : '') + '"'
              + (isActive ? ' aria-current="page"' : '') + '>'
              + escapeHtml(d.n || d.t) + '</a>';
      });
      html += '</div>';
    });

    html += '<button class="docs-sidebar-search-hint" type="button" aria-label="Focus search input">';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    html += '<span>Search docs</span>';
    html += '<kbd>/</kbd>';
    html += '</button>';
    html += '</nav>';

    host.innerHTML = html;

    /* Scroll the active sidebar link into view inside the sticky aside */
    var activeLink = host.querySelector('.docs-sidebar-link.is-active');
    if (activeLink) {
      var linkTop = activeLink.offsetTop;
      var hostHeight = host.clientHeight;
      if (linkTop > hostHeight * 0.6) {
        host.scrollTop = linkTop - hostHeight * 0.3;
      }
    }

    var mobileBtn = host.querySelector('.docs-sidebar-mobile');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', function() {
        var isOpen = host.classList.toggle('is-mobile-open');
        mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    var searchHint = host.querySelector('.docs-sidebar-search-hint');
    if (searchHint) {
      searchHint.addEventListener('click', function() {
        var input = document.getElementById('docs-search');
        if (input) {
          input.focus();
          input.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      });
    }
  }

  function slugify(text) {
    return String(text).toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /* ─── ON THIS PAGE (right rail) ─── */
  function renderOnThisPage(host) {
    var main = document.querySelector('.docs-content');
    if (!main) { host.classList.add('is-hidden'); return; }

    var allH2s = main.querySelectorAll('h2');
    var contentH2s = [];
    Array.prototype.forEach.call(allH2s, function(h2) {
      /* skip h2s inside the at-a-glance label box */
      if (h2.closest && h2.closest('.docs-glance')) return;
      contentH2s.push(h2);
    });

    if (contentH2s.length < 3) {
      host.classList.add('is-hidden');
      return;
    }

    var html = '<div class="docs-otp-label">On this page</div>';
    html += '<ul class="docs-otp-list">';
    contentH2s.forEach(function(h2) {
      if (!h2.id) {
        var baseId = slugify(h2.textContent);
        var id = baseId;
        var i = 2;
        while (document.getElementById(id)) {
          id = baseId + '-' + i;
          i++;
        }
        h2.id = id;
      }
      html += '<li><a href="#' + h2.id + '" class="docs-otp-link" data-target="' + h2.id + '">' + escapeHtml(h2.textContent) + '</a></li>';
    });
    html += '</ul>';
    host.innerHTML = html;

    var links = host.querySelectorAll('.docs-otp-link');
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          links.forEach(function(link) {
            link.classList.toggle('is-active', link.getAttribute('data-target') === id);
          });
        }
      });
    }, { rootMargin: '-90px 0px -60% 0px', threshold: 0 });
    contentH2s.forEach(function(h2) { observer.observe(h2); });
  }

  function init() {
    var searchHost = document.querySelector('[data-docs-search]');
    if (searchHost) {
      injectStyles();
      mountInto(searchHost);
    }
    var sidebarHost = document.querySelector('[data-docs-sidebar]');
    if (sidebarHost) {
      renderSidebar(sidebarHost);
    }
    var otpHost = document.querySelector('[data-on-this-page]');
    if (otpHost) {
      renderOnThisPage(otpHost);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
