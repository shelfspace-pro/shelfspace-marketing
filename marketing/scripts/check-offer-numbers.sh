#!/usr/bin/env bash
# check-offer-numbers.sh — the "Total value, first year" numbers must agree on every page.
#
# Canonical source: the value stacks in pricing.html (dispensary + brand cards).
# Mirrors that must match it:
#   - accounts-payable.html  (ShelfPay stack, copied from pricing)
#   - accounts-receivable.html (ShelfCollect stack, copied from pricing)
#   (the homepage value slider was removed 10/22/2026 — the homepage carries no offer totals)
# Drift here means a prospect sees two different numbers for the same offer.
#
# Usage: bash marketing/scripts/check-offer-numbers.sh   (exit 1 on any mismatch)
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

node - <<'JS'
const fs = require('fs');
const read = f => fs.readFileSync(f, 'utf8');
const totals = (html, f) => {
  const m = [...html.matchAll(/Total value, first year<\/b><div class="mono">\$([\d,]+)</g)].map(x => x[1]);
  if (!m.length) throw new Error(`${f}: no "Total value, first year" found — region is empty, check the markup`);
  return m;
};
let bad = 0;
const fail = msg => { console.log('🔴 ' + msg); bad++; };

const pricing = totals(read('pricing.html'), 'pricing.html');
if (pricing.length !== 2) fail(`pricing.html: expected 2 totals (dispensary, brand), found ${pricing.length}`);
const [pay, col] = pricing;

const ap = totals(read('accounts-payable.html'), 'accounts-payable.html');
if (ap.join() !== pay) fail(`accounts-payable.html total ${ap.join()} ≠ pricing dispensary ${pay}`);
const ar = totals(read('accounts-receivable.html'), 'accounts-receivable.html');
if (ar.join() !== col) fail(`accounts-receivable.html total ${ar.join()} ≠ pricing brand ${col}`);

// The homepage must not carry a stale copy of the totals (its slider was removed 10/22/2026).
if (/Total value, first year|id="h-val-(pay|collect)"/.test(read('index.html'))) fail('index.html carries offer totals again — add them back to this check');

if (bad) { console.log(`\n${bad} offer-number mismatch(es). pricing.html is canonical — update the mirrors.`); process.exit(1); }
console.log(`✅ Offer numbers agree: dispensary $${pay}, brand $${col} (pricing, ShelfPay, ShelfCollect).`);
JS
