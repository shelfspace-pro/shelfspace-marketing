(function() {
  'use strict';

  if (window.__shelfDocsSearchLoaded) return;
  window.__shelfDocsSearchLoaded = true;

  var DOCS = [
    { t: "Getting Started with ShelfSpace", d: "Setup for dispensaries — live in under a week. What to expect during onboarding and what we handle for you.", s: "Getting Started", u: "/docs/getting-started", k: "onboarding setup live week" },
    { t: "How Consignment Works", d: "Vendor-owned inventory, weekly settlements, profit splits. We handle the math and the checks.", s: "Consignment", u: "/docs/consignment/overview", k: "consigned model pay after sale" },
    { t: "Weekly Consignment Settlements", d: "How weekly payouts are calculated from POS data, category splits, aging discounts, and credits. Penny-precise.", s: "Consignment", u: "/docs/consignment/settlements", k: "payout weekly" },
    { t: "Reading Your Settlement Report", d: "Payout table, returns, discounts, inventory snapshot, and final check. How to read every section.", s: "Consignment", u: "/docs/consignment/settlement-reports", k: "report" },
    { t: "Consignment Contracts and Terms", d: "Profit splits, shrinkage, discounts, and payment terms. We draft it, you review.", s: "Consignment", u: "/docs/consignment/contracts", k: "agreement" },
    { t: "Category Splits and Profit Sharing", d: "How category-level splits are negotiated, configured, and applied in weekly settlements.", s: "Consignment", u: "/docs/consignment/profit-splits", k: "split percentage margin gross" },
    { t: "Aging Discounts and Inventory Markdowns", d: "How aging discounts work for expiring product, why they exist, and how they affect settlements.", s: "Consignment", u: "/docs/consignment/aging-discounts", k: "markdown expiring stale dead stock shrinkage" },
    { t: "How Credit Recovery Works", d: "We track returns, expirations, and co-marketing credits so dispensaries recover what they're owed.", s: "Credit Recovery", u: "/docs/credit-recovery/overview", k: "credit memo recovery" },
    { t: "Return Credits", d: "We track returned cannabis products in METRC and generate credit memos against vendor payments.", s: "Credit Recovery", u: "/docs/credit-recovery/returns", k: "returns" },
    { t: "Expiration Credits", d: "We monitor expiration dates, flag aging inventory, and generate credit memos for you.", s: "Credit Recovery", u: "/docs/credit-recovery/expirations", k: "expired expiration" },
    { t: "Co-Marketing Credits", d: "We track vendor-funded promotions and generate credit memos so you collect what was agreed to.", s: "Credit Recovery", u: "/docs/credit-recovery/co-marketing", k: "co-op marketing" },
    { t: "Credit Memo Approval Process", d: "Each status from Draft to Applied, how vendors respond, and what happens when the 16-day window closes.", s: "Credit Recovery", u: "/docs/credit-recovery/approval-workflow", k: "approval workflow status" },
    { t: "How Managed AP Works", d: "Cannabis dispensary accounts payable end-to-end. We pay vendors, verify invoices, handle questions, and sync QuickBooks.", s: "Accounts Payable", u: "/docs/accounts-payable/overview", k: "AP managed" },
    { t: "Vendor Onboarding", d: "Onboard cannabis vendor partners in minutes. Email invite, portal setup, cannabis and non-cannabis vendors.", s: "Accounts Payable", u: "/docs/accounts-payable/vendor-onboarding", k: "invite vendor" },
    { t: "Invoice Verification and Delivery Matching", d: "Verify cannabis vendor invoice accuracy before payment. We match invoices to deliveries and resolve issues.", s: "Accounts Payable", u: "/docs/accounts-payable/invoice-verification", k: "invoice match" },
    { t: "Payments and Check Generation", d: "Cannabis vendor check payment processing with Check 21. We create payments, generate checks, and sync QuickBooks.", s: "Accounts Payable", u: "/docs/accounts-payable/creating-payments", k: "create payment" },
    { t: "Manage Cannabis Deliveries by Email", d: "AP workflow by email — send invoices, update deliveries, attach COAs, and add receiving notes through one inbox.", s: "Accounts Payable", u: "/docs/accounts-payable/email-deliveries", k: "email inbox COA" },
    { t: "QuickBooks Integration", d: "Settlements, bills, vendor lists, and payment records sync to QuickBooks Online with no manual data entry.", s: "QuickBooks", u: "/docs/quickbooks/overview", k: "QBO sync" },
    { t: "QuickBooks Setup Guide", d: "OAuth connection, vendor mapping, GL account mapping, and bank account configuration. We handle it during onboarding.", s: "QuickBooks", u: "/docs/quickbooks/setup", k: "OAuth GL mapping" },
    { t: "Cannabis Vendor QuickBooks Setup", d: "Vendor-side QBO setup. Connect QBO, map customers and items, backfill history. Every settlement becomes an Invoice plus a matching Payment.", s: "QuickBooks", u: "/docs/vendor-portal/quickbooks-setup", k: "vendor qbo invoice payment received OAuth mapping refresh token closed period" },
    { t: "Check 21 Payments", d: "Why cannabis needs Check 21, how digital checks work, and how vendors deposit them.", s: "Checks", u: "/docs/checks/overview", k: "digital check" },
    { t: "How to Deposit a ShelfSpace Check", d: "Deposit via mobile deposit, print at home, or branch visit. Compatible with every major U.S. bank.", s: "Checks", u: "/docs/checks/depositing", k: "deposit mobile bank ACH wire substitute check IRD" },
    { t: "Voiding and Reissuing Checks", d: "Cannabis vendor payment void and reissue in one step. Maintain a full audit trail.", s: "Checks", u: "/docs/checks/void-reissue", k: "void reissue cancel stop payment lost check" },
    { t: "Cannabis Vendor Portal", d: "Where every vendor checks downloads, payment history, and credit memos across all retailer partners — free.", s: "Vendor Portal", u: "/docs/vendor-portal/overview", k: "vendor portal" },
    { t: "Downloading Vendor Checks", d: "How vendors access, download, and deposit Check 21-compliant payment checks through the secure portal.", s: "Vendor Portal", u: "/docs/vendor-portal/downloading-checks", k: "download check" },
    { t: "Vendor Payment History", d: "View all payments, filter by date and retailer, export data, and track every dollar through the portal.", s: "Vendor Portal", u: "/docs/vendor-portal/payment-history", k: "history export csv 1099 statement" },
    { t: "Vendor Dispute Credit Memo", d: "How vendors review credit memos, accept or dispute charges, and upload documentation through the portal.", s: "Vendor Portal", u: "/docs/vendor-portal/disputes", k: "dispute" },
    { t: "ShelfiQ — Cannabis AI Assistant", d: "ShelfiQ answers vendor questions, parses invoices, manages AP, and exports data through a simple chat.", s: "ShelfiQ", u: "/docs/shelfiq/overview", k: "AI chat assistant" },
    { t: "ShelfiQ Tools", d: "AI invoice parsing, vendor matching, payment queries, data exports, and AP management — everything ShelfiQ can do.", s: "ShelfiQ", u: "/docs/shelfiq/tools", k: "tools invoice parsing" },
    { t: "Co-Op Promotions", d: "How retailers and vendors run joint promotions, track impact, and generate credits.", s: "Promotions", u: "/docs/promotions/overview", k: "co-op promo" },
    { t: "Creating a Promotion", d: "How to create a co-op promotion, get vendor approval, track performance, and generate credits.", s: "Promotions", u: "/docs/promotions/creating", k: "create promo setup" },
    { t: "Insights and Analytics", d: "Track sales velocity, dead inventory, vendor performance, and cash liberation in real time.", s: "Insights", u: "/docs/insights/overview", k: "analytics dashboard" },
    { t: "Vendor Scorecards", d: "Grade suppliers on volume, velocity, growth, and reliability with real sell-through data.", s: "Insights", u: "/docs/insights/vendor-scorecards", k: "scorecard supplier" },
    { t: "POS Integration", d: "Works with any system. CSV upload or API sync with Dutchie, Flowhub, BLAZE, and more. No IT team required.", s: "Integrations", u: "/docs/integrations/pos", k: "Dutchie Flowhub BLAZE point of sale" },
    { t: "METRC Integration", d: "Official Metrc third-party vendor. Read-only connection to power settlements, credit recovery, and AP.", s: "Integrations", u: "/docs/integrations/metrc", k: "Metrc compliance track and trace" },
    { t: "Delivery Tracking and Receiving", d: "Track incoming shipments, receive inventory, reconcile to purchase orders, and move deliveries to payment.", s: "Deliveries", u: "/docs/deliveries/overview", k: "receiving shipment PO" },
    { t: "Delivery Reconciliation", d: "Match what was ordered to what arrived, catch discrepancies, and approve deliveries for payment.", s: "Deliveries", u: "/docs/deliveries/reconciliation", k: "reconcile" },
    { t: "Users, Roles, and Permissions", d: "Three roles per portal, email invites, and location-scoped access for your team.", s: "User Management", u: "/docs/user-management/overview", k: "role permission user" },
    { t: "Multi-Factor Authentication (MFA)", d: "Enable SMS, TOTP, or email multi-factor authentication to protect your accounts and stay compliant.", s: "User Management", u: "/docs/user-management/mfa", k: "MFA 2FA TOTP SMS authenticator" },
    { t: "Security and Data Protection", d: "Row-level security, multi-tenant isolation, encryption at rest and in transit, and zero hard deletes.", s: "Security", u: "/docs/security/overview", k: "encryption RLS data protection" },
    { t: "Audit Trail and Compliance", d: "Every action is logged in an immutable record for regulatory audits and internal accountability.", s: "Security", u: "/docs/security/audit-trail", k: "audit log compliance" }
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
    var titleHay = (doc.t + ' ' + doc.s).toLowerCase();
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
      .slice(0, 8)
      .map(function(r) { return r.d; });
  }

  function mountInto(host) {
    var floating = host.hasAttribute('data-floating');
    host.classList.add('docs-search-wrap');
    if (floating) host.classList.add('is-floating');
    var placeholder = host.getAttribute('data-placeholder') || 'Search the docs — payments, settlements, METRC...';

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
        resultsEl.innerHTML = '<div class="docs-search-empty">No matches. Try "settlement", "METRC", or "vendor".</div>';
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

  function init() {
    var host = document.querySelector('[data-docs-search]');
    if (!host) return;
    injectStyles();
    mountInto(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
