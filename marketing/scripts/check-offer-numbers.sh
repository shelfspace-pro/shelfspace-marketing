#!/usr/bin/env bash
# check-offer-numbers.sh — the "Total value, first year" numbers must agree on every page.
#
# Canonical source: the value stacks in pricing.html (dispensary + brand cards).
# Mirrors that must match it:
#   - accounts-payable.html  (ShelfPay stack, copied from pricing)
#   - accounts-receivable.html (ShelfCollect stack, copied from pricing)
#   - index.html  static defaults of #h-val-pay / #h-val-collect
#   - index.html  slider formulas evaluated at the $500k default
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

const home = read('index.html');
const dflt = id => (home.match(new RegExp(`id="${id}">\\$([\\d,]+)<`)) || [])[1];
if (dflt('h-val-pay') !== pay) fail(`index.html #h-val-pay default ${dflt('h-val-pay')} ≠ ${pay}`);
if (dflt('h-val-collect') !== col) fail(`index.html #h-val-collect default ${dflt('h-val-collect')} ≠ ${col}`);

// Evaluate the homepage slider formulas at its default value.
const expr = name => (home.match(new RegExp(`var ${name} = ([^;]+);`)) || [])[1];
const def = (home.match(/id="h-sales-slider"[^>]*value="(\d+)"/) || [])[1];
if (!expr('pay') || !expr('col') || !expr('cash') || !def) fail('index.html: slider formulas or default value not found');
else {
  const S = Number(def);
  const cash = Function('S', `return ${expr('cash')}`)(S);
  const usd = n => (Math.round(n / 100) * 100).toLocaleString('en-US');
  const p = usd(Function('S', `return ${expr('pay')}`)(S));
  const c = usd(Function('S', 'cash', `return ${expr('col')}`)(S, cash));
  if (p !== pay) fail(`index.html slider dispensary at ${S}: ${p} ≠ ${pay}`);
  if (c !== col) fail(`index.html slider brand at ${S}: ${c} ≠ ${col}`);
}

if (bad) { console.log(`\n${bad} offer-number mismatch(es). pricing.html is canonical — update the mirrors.`); process.exit(1); }
console.log(`✅ Offer numbers agree: dispensary $${pay}, brand $${col} (pricing, ShelfPay, ShelfCollect, homepage + slider).`);
JS
