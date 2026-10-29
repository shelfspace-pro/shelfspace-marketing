/* ShelfSpace free tools (SEO row C3, 10/29/2026): DSO calculator, late-AR cost calculator,
 * net-terms policy builder. One file renders every widget into <div data-ss-tool="dso|late-ar|net-terms">
 * on both the tool page and its /tools/embed/ page, so the two can never drift.
 *
 * Money is integer cents end to end: parseCents() reads "$1,234.56" without floats, every formula
 * multiplies integers first and rounds once at the end. Dates show as MM/DD/YYYY and are computed in UTC.
 * No storage, no network, no cookies. Fence: npm run check:assets (scripts/seo/check-assets.mjs) loads
 * this file in a vm sandbox and checks the math.
 */
(function (root) {
  "use strict";

  // ---------- pure helpers (exported on window.SSTools) ----------

  /** "$1,234.56" -> 123456 (cents). null when not a non-negative amount with at most 2 decimals. */
  function parseCents(input) {
    var s = String(input == null ? "" : input).replace(/[$,\s]/g, "");
    if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
    var parts = s.split(".");
    var whole = parts[0].replace(/^0+(?=\d)/, "");
    var frac = ((parts[1] || "") + "00").slice(0, 2);
    if (whole.length > 9) return null; // up to $999,999,999.99; the formulas below run in BigInt anyway
    return Number(whole) * 100 + Number(frac);
  }

  /** A whole number in [min, max], or null. */
  function parseInt10(input, min, max) {
    var s = String(input == null ? "" : input).replace(/[,\s]/g, "");
    if (!/^\d+$/.test(s)) return null;
    var n = Number(s);
    return n >= min && n <= max ? n : null;
  }

  /** "12.5" -> 1250 basis points (two decimals max), or null. */
  function parseBps(input) {
    var s = String(input == null ? "" : input).replace(/[%\s]/g, "");
    if (!/^\d{1,3}(\.\d{0,2})?$/.test(s)) return null;
    var parts = s.split(".");
    return Number(parts[0]) * 100 + Number(((parts[1] || "") + "00").slice(0, 2));
  }

  /** "1.5" hours -> 15 tenths, or null. */
  function parseTenths(input) {
    var s = String(input == null ? "" : input).trim();
    if (!/^\d{1,4}(\.\d)?$/.test(s)) return null;
    var parts = s.split(".");
    return Number(parts[0]) * 10 + Number(parts[1] || 0);
  }

  /** Integer division rounded half up, for non-negative integers. BigInt inside, so no product loses precision. */
  function divRound(num, den) {
    var n = BigInt(num), d = BigInt(den);
    return Number((2n * n + d) / (2n * d));
  }

  /** 123456 -> "$1,234.56" */
  function fmtCents(c) {
    var neg = c < 0; c = Math.abs(c);
    var d = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-$" : "$") + d + "." + String(c % 100).padStart(2, "0");
  }

  /** Date -> "MM/DD/YYYY" (UTC fields). */
  function fmtMDY(d) {
    return String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + String(d.getUTCDate()).padStart(2, "0") + "/" + d.getUTCFullYear();
  }

  /** "MM/DD/YYYY" -> UTC Date, or null for anything that is not a real calendar date. */
  function parseMDY(s) {
    var m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(String(s == null ? "" : s));
    if (!m) return null;
    var mo = Number(m[1]), da = Number(m[2]), y = Number(m[3]);
    if (y < 1900 || y > 2199) return null;
    var d = new Date(Date.UTC(y, mo - 1, da));
    return d.getUTCFullYear() === y && d.getUTCMonth() === mo - 1 && d.getUTCDate() === da ? d : null;
  }

  function todayUTC() { var n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); }

  /**
   * DSO = AR / credit sales x days. Returns tenths of a day (an integer) plus, when net terms are given
   * and AR is more than terms' worth of sales, the cash tied up past terms in cents.
   */
  function dso(arCents, salesCents, days, netDays) {
    if (arCents == null || salesCents == null || !days || salesCents <= 0) return null;
    var dsoTenths = divRound(BigInt(arCents) * BigInt(days) * 10n, salesCents);
    var out = { dsoTenths: dsoTenths, pastTermsCents: null };
    // Cash past terms = AR - (credit sales per day x terms), from the unrounded DSO:
    // (arCents x days - netDays x salesCents) / days, one rounding.
    if (netDays != null) {
      var num = BigInt(arCents) * BigInt(days) - BigInt(netDays) * BigInt(salesCents);
      if (num > 0n) out.pastTermsCents = divRound(num, days);
    }
    return out;
  }

  /** Days late (never negative) between a due date and an as-of date, both UTC midnights. */
  function daysLate(due, asOf) { return Math.max(0, Math.round((asOf.getTime() - due.getTime()) / 86400000)); }

  /**
   * What one late invoice costs: carrying cost at your own cost of money + the time spent chasing it.
   * amountCents x bps x days / (10000 x 365), and hoursTenths x hourlyCents / 10, each rounded once.
   */
  function lateCost(amountCents, bps, lateDays, hoursTenths, hourlyCents) {
    var carrying = divRound(BigInt(amountCents) * BigInt(bps) * BigInt(lateDays), 10000 * 365);
    var chasing = divRound(BigInt(hoursTenths) * BigInt(hourlyCents), 10);
    return { carryingCents: carrying, chasingCents: chasing, totalCents: carrying + chasing };
  }

  var DISCLAIMER = "Not legal advice — have your counsel review it before you use it.";

  /** Plain-text net-terms policy from the builder's answers. */
  function buildPolicy(o) {
    var name = (o.company || "").trim() || "[Your company]";
    var L = [];
    L.push(name + " — Wholesale Credit and Payment Terms");
    L.push("Effective " + o.effective);
    L.push("");
    L.push("1. Payment terms");
    L.push(o.termsDays === 0
      ? "Every order is paid on delivery (cash on delivery). We do not extend credit."
      : "Approved accounts pay each invoice within " + o.termsDays + " days of the invoice date (Net " + o.termsDays + "). The invoice date is the day the order ships.");
    if (o.limitCents != null && o.termsDays > 0) L.push("Each account's open balance may not exceed " + fmtCents(o.limitCents) + " unless we approve a higher limit in writing.");
    L.push("");
    L.push("2. Opening an account");
    var req = [];
    if (o.termsDays > 0 && o.requireApplication) req.push("a signed credit application");
    if (o.termsDays > 0 && o.requireGuaranty) req.push("a signed personal guaranty from an owner");
    req.push("a copy of the store's current state cannabis license");
    L.push((o.termsDays > 0 ? "Before we extend terms, a new account provides " : "Before its first order, a new account provides ") + req.join(", ").replace(/, ([^,]*)$/, " and $1") + ".");
    if (o.codOrders > 0 && o.termsDays > 0) L.push((o.codOrders === 1 ? "The first order ships" : "The first " + o.codOrders + " orders ship") + " cash on delivery. Terms start after that.");
    L.push("");
    L.push("3. How to pay");
    L.push("We accept " + (o.methods.length ? o.methods.join(", ").replace(/, ([^,]*)$/, " and $1") : "the payment methods listed on the invoice") + ". Payment instructions are on every invoice.");
    L.push("");
    L.push("4. Reminders");
    L.push(o.reminders);
    L.push("");
    L.push("5. Past-due accounts");
    if (o.termsDays > 0) {
      L.push("When any invoice is " + o.holdDays + " or more days past due, new orders ship cash on delivery or are held until the account is current.");
      L.push("We may offer a written payment plan for a past-due balance. While a plan is current, we keep shipping on the terms the plan sets.");
    } else {
      L.push("Orders that are not paid on delivery are not released.");
    }
    L.push("Any late fee, interest or collection cost applies only if your signed credit agreement provides for it and the law allows it.");
    L.push("");
    L.push("6. Changes");
    L.push("We may change these terms for future orders with written notice. Open invoices keep the terms they were issued under.");
    L.push("");
    L.push(DISCLAIMER);
    return L.join("\n");
  }

  var api = { parseCents: parseCents, parseInt10: parseInt10, parseBps: parseBps, parseTenths: parseTenths, divRound: divRound,
    fmtCents: fmtCents, fmtMDY: fmtMDY, parseMDY: parseMDY, dso: dso, daysLate: daysLate, lateCost: lateCost,
    buildPolicy: buildPolicy, DISCLAIMER: DISCLAIMER };
  root.SSTools = api;

  // ---------- widgets ----------
  var doc = root.document;
  if (!doc || !doc.querySelectorAll) return;

  function h(tag, attrs, kids) {
    var el = doc.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === "text") el.textContent = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }
  var uid = 0;
  function field(label, attrs, hint) {
    var id = "ss-f" + (++uid);
    attrs = attrs || {}; attrs.id = id; attrs.class = "ss-in";
    if (!attrs.type) attrs.type = "text";
    var input = h("input", attrs);
    var wrap = h("div", { class: "ss-field" }, [h("label", { for: id, text: label }), input, hint ? h("span", { class: "ss-hint", text: hint }) : null]);
    return { wrap: wrap, input: input };
  }
  function out(label) {
    var v = h("output", { class: "ss-out-v" });
    return { wrap: h("div", { class: "ss-out" }, [h("span", { class: "ss-out-l", text: label }), v]), v: v };
  }

  function mountDso(el) {
    var ar = field("Accounts receivable balance", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 180,000" }, "Everything customers owe you today");
    var sales = field("Credit sales in the period", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 270,000" }, "Wholesale invoiced on terms");
    var per = h("select", { id: "ss-f" + (++uid), class: "ss-in" }, [
      h("option", { value: "30", text: "The last 30 days" }), h("option", { value: "90", text: "The last 90 days", selected: "selected" }), h("option", { value: "365", text: "The last 365 days" })]);
    var perWrap = h("div", { class: "ss-field" }, [h("label", { for: per.id, text: "Period" }), per]);
    var net = field("Your payment terms, in days (optional)", { inputmode: "numeric", autocomplete: "off", placeholder: "e.g. 30" }, "Net 30 = 30");
    var o1 = out("Days sales outstanding"), o2 = out("Cash tied up past your terms");
    var msg = h("p", { class: "ss-msg", role: "status" });
    var form = h("div", { class: "ss-form" }, [ar.wrap, sales.wrap, perWrap, net.wrap]);
    var res = h("div", { class: "ss-results", "data-price-note": "calculator", "aria-live": "polite" }, [o1.wrap, o2.wrap, msg]);
    el.appendChild(h("div", { class: "ss-card" }, [h("div", { class: "ss-card-h", text: "DSO calculator" }), form, res]));
    function run() {
      var a = parseCents(ar.input.value), s = parseCents(sales.input.value), d = Number(per.value);
      var n = net.input.value.trim() ? parseInt10(net.input.value, 0, 365) : null;
      o1.v.textContent = "—"; o2.v.textContent = "—"; msg.textContent = "";
      if (a == null || s == null) { msg.textContent = "Enter your AR balance and credit sales as dollar amounts."; return; }
      if (s === 0) { msg.textContent = "Enter your credit sales for the period (more than $0)."; return; }
      if (net.input.value.trim() && n == null) { msg.textContent = "Payment terms should be a whole number of days."; return; }
      var r = dso(a, s, d, n);
      o1.v.textContent = (r.dsoTenths / 10).toFixed(1) + " days";
      if (n == null) o2.v.textContent = "Add your terms";
      else if (r.pastTermsCents == null) { o2.v.textContent = fmtCents(0); msg.textContent = "You're collecting inside your terms."; }
      else { o2.v.textContent = fmtCents(r.pastTermsCents); msg.textContent = "That's the cash you'd have back if stores paid on your terms."; }
    }
    [ar.input, sales.input, net.input].forEach(function (i) { i.addEventListener("input", run); });
    per.addEventListener("change", run);
    run();
  }

  function mountLateAr(el) {
    var today = todayUTC();
    var amt = field("Invoice amount", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 7,200" });
    var due = field("Due date (MM/DD/YYYY)", { inputmode: "numeric", autocomplete: "off", placeholder: "MM/DD/YYYY" });
    var asof = field("As of (MM/DD/YYYY)", { inputmode: "numeric", autocomplete: "off", value: fmtMDY(today) });
    var rate = field("Your cost of money, % a year", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 12" }, "What you pay to borrow, or what the cash earns you elsewhere");
    var hrs = field("Hours spent chasing it", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 3" });
    var wage = field("Hourly cost of whoever chases", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 35" });
    var oD = out("Days late"), oC = out("Carrying cost"), oT = out("Time spent chasing"), oS = out("Total so far");
    var msg = h("p", { class: "ss-msg", role: "status" });
    var form = h("div", { class: "ss-form" }, [amt.wrap, due.wrap, asof.wrap, rate.wrap, hrs.wrap, wage.wrap]);
    var res = h("div", { class: "ss-results", "data-price-note": "calculator", "aria-live": "polite" }, [oD.wrap, oC.wrap, oT.wrap, oS.wrap, msg]);
    el.appendChild(h("div", { class: "ss-card" }, [h("div", { class: "ss-card-h", text: "What a late invoice costs you" }), form, res]));
    function run() {
      [oD, oC, oT, oS].forEach(function (o) { o.v.textContent = "—"; }); msg.textContent = "";
      var a = parseCents(amt.input.value), d = parseMDY(due.input.value), t = parseMDY(asof.input.value);
      if (a == null) { msg.textContent = "Enter the invoice amount."; return; }
      if (!d) { msg.textContent = "Enter the due date as MM/DD/YYYY."; return; }
      if (!t) { msg.textContent = "Enter the as-of date as MM/DD/YYYY."; return; }
      var late = daysLate(d, t);
      oD.v.textContent = late + (late === 1 ? " day" : " days");
      if (late === 0) { msg.textContent = "Not late yet as of " + fmtMDY(t) + "."; }
      var bps = rate.input.value.trim() ? parseBps(rate.input.value) : 0;
      var ht = hrs.input.value.trim() ? parseTenths(hrs.input.value) : 0;
      var w = wage.input.value.trim() ? parseCents(wage.input.value) : 0;
      if (bps == null) { msg.textContent = "Cost of money should be a percentage, like 12 or 12.5."; return; }
      if (ht == null) { msg.textContent = "Hours should be a number, like 3 or 2.5."; return; }
      if (w == null) { msg.textContent = "Hourly cost should be a dollar amount."; return; }
      var r = lateCost(a, bps, late, ht, w);
      oC.v.textContent = fmtCents(r.carryingCents); oT.v.textContent = fmtCents(r.chasingCents); oS.v.textContent = fmtCents(r.totalCents);
      if (late > 0) msg.textContent = "Due " + fmtMDY(d) + ", unpaid as of " + fmtMDY(t) + ".";
    }
    [amt, due, asof, rate, hrs, wage].forEach(function (f) { f.input.addEventListener("input", run); });
    run();
  }

  function mountNetTerms(el) {
    var co = field("Your company name", { autocomplete: "organization", placeholder: "e.g. Verdant Hill Botanical" });
    var terms = h("select", { id: "ss-f" + (++uid), class: "ss-in" }, ["0|Cash on delivery (no credit)", "7|Net 7", "15|Net 15", "30|Net 30", "45|Net 45"].map(function (x) {
      var p = x.split("|"); var o = h("option", { value: p[0], text: p[1] }); if (p[0] === "30") o.setAttribute("selected", "selected"); return o; }));
    var termsWrap = h("div", { class: "ss-field" }, [h("label", { for: terms.id, text: "Payment terms" }), terms]);
    var limit = field("Credit limit per store (optional)", { inputmode: "decimal", autocomplete: "off", placeholder: "e.g. 25,000" });
    var cod = field("First orders on cash on delivery", { inputmode: "numeric", autocomplete: "off", value: "1" });
    var hold = field("Hold new orders when an invoice is this many days past due", { inputmode: "numeric", autocomplete: "off", value: "15" });
    function check(label, on) { var id = "ss-f" + (++uid); var c = h("input", { type: "checkbox", id: id }); if (on) c.setAttribute("checked", "checked"); return { wrap: h("label", { class: "ss-check", for: id }, [c, doc.createTextNode(" " + label)]), input: c }; }
    var app = check("New accounts sign a credit application", true), gty = check("New accounts sign a personal guaranty", false);
    var mE = check("e-check", true), mA = check("ACH bank transfer", true), mC = check("paper check", true);
    var rem = h("select", { id: "ss-f" + (++uid), class: "ss-in" }, [
      h("option", { value: "s", text: "Standard: then weekly", selected: "selected" }),
      h("option", { value: "f", text: "Firm: then every 3 days" }),
      h("option", { value: "l", text: "Light: then every 2 weeks" })]);
    var remWrap = h("div", { class: "ss-field" }, [h("label", { for: rem.id, text: "Reminder schedule" }), rem,
      h("span", { class: "ss-hint", text: "Your policy spells out the full schedule" })]);
    var eff = field("Effective date (MM/DD/YYYY)", { inputmode: "numeric", autocomplete: "off", value: fmtMDY(todayUTC()) });
    var pre = h("pre", { class: "ss-policy", "aria-live": "polite", tabindex: "0" });
    var msg = h("p", { class: "ss-msg", role: "status" });
    var bCopy = h("button", { type: "button", class: "ss-btn", text: "Copy" }), bDl = h("button", { type: "button", class: "ss-btn", text: "Download .txt" }), bPr = h("button", { type: "button", class: "ss-btn", text: "Print" });
    var form = h("div", { class: "ss-form" }, [co.wrap, termsWrap, limit.wrap, cod.wrap, hold.wrap,
      h("fieldset", { class: "ss-set" }, [h("legend", { text: "New accounts" }), app.wrap, gty.wrap]),
      h("fieldset", { class: "ss-set" }, [h("legend", { text: "Payment methods you accept" }), mE.wrap, mA.wrap, mC.wrap]),
      remWrap, eff.wrap]);
    el.appendChild(h("div", { class: "ss-card ss-card--wide" }, [h("div", { class: "ss-card-h", text: "Net-terms policy builder" }), form,
      h("div", { class: "ss-results", "data-price-note": "calculator" }, [h("div", { class: "ss-out-l", text: "Your policy" }), pre, h("div", { class: "ss-actions" }, [bCopy, bDl, bPr]), msg])]));
    var REM = { s: "We send a reminder a few days before each invoice is due, another on the due date, then one a week until it is paid.",
      f: "We send a reminder a few days before each invoice is due, another on the due date, then one every 3 days until it is paid.",
      l: "We send a reminder on the due date, then one every 2 weeks until it is paid." };
    var text = "";
    function fail(m) { msg.textContent = m; text = ""; pre.textContent = "Fix the field above to see your policy."; }
    function run() {
      msg.textContent = "";
      var cod0 = Number(terms.value) === 0;
      var e = parseMDY(eff.input.value);
      var lc = limit.input.value.trim() ? parseCents(limit.input.value) : null;
      var c = parseInt10(cod.input.value || "0", 0, 12), hd = parseInt10(hold.input.value || "0", 1, 120);
      if (!e) return fail("Enter the effective date as MM/DD/YYYY.");
      if (!cod0 && limit.input.value.trim() && lc == null) return fail("Credit limit should be a dollar amount.");
      if (!cod0 && c == null) return fail("First cash-on-delivery orders: a whole number from 0 to 12.");
      if (!cod0 && hd == null) return fail("Hold days: a whole number from 1 to 120.");
      var methods = []; if (mE.input.checked) methods.push("e-check"); if (mA.input.checked) methods.push("ACH bank transfer"); if (mC.input.checked) methods.push("paper check");
      text = buildPolicy({ company: co.input.value, termsDays: Number(terms.value), limitCents: lc, requireApplication: app.input.checked, requireGuaranty: gty.input.checked,
        codOrders: c, holdDays: hd, methods: methods, reminders: REM[rem.value], effective: fmtMDY(e) });
      pre.textContent = text;
    }
    [co, limit, cod, hold, eff].forEach(function (f) { f.input.addEventListener("input", run); });
    [terms, rem, app.input, gty.input, mE.input, mA.input, mC.input].forEach(function (i) { i.addEventListener("change", run); });
    bCopy.addEventListener("click", function () {
      if (!text) { msg.textContent = "Fix the highlighted field first."; return; }
      if (root.navigator && root.navigator.clipboard) root.navigator.clipboard.writeText(text).then(function () { msg.textContent = "Copied."; }, function () { msg.textContent = "Select the text and copy it."; });
      else msg.textContent = "Select the text and copy it.";
    });
    bDl.addEventListener("click", function () {
      if (!text) { msg.textContent = "Fix the highlighted field first."; return; }
      var url = root.URL.createObjectURL(new root.Blob([text], { type: "text/plain;charset=utf-8" }));
      var a = doc.createElement("a"); a.href = url; a.download = "net-terms-policy.txt";
      doc.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { root.URL.revokeObjectURL(url); }, 1000);
    });
    bPr.addEventListener("click", function () {
      if (!text) { msg.textContent = "Fix the highlighted field first."; return; }
      var w = root.open("", "_blank"); if (!w) { msg.textContent = "Allow pop-ups to print, or use Copy."; return; }
      var p = w.document.createElement("pre"); p.style.cssText = "font:14px/1.6 Georgia,serif;white-space:pre-wrap;max-width:680px;margin:40px auto;";
      p.textContent = text; w.document.body.appendChild(p); w.print();
    });
    run();
  }

  // Copy buttons for embed snippets: <button data-ss-copy="#id">
  function wireCopy() {
    doc.querySelectorAll("[data-ss-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = doc.querySelector(b.getAttribute("data-ss-copy")); if (!t) return;
        t.select && t.select();
        var done = function () { var old = b.textContent; b.textContent = "Copied"; setTimeout(function () { b.textContent = old; }, 1600); };
        if (root.navigator && root.navigator.clipboard) root.navigator.clipboard.writeText(t.value || t.textContent).then(done, function () {});
      });
    });
  }

  function init() {
    doc.querySelectorAll("[data-ss-tool]").forEach(function (el) {
      if (el.getAttribute("data-ss-mounted")) return;
      el.setAttribute("data-ss-mounted", "1");
      var k = el.getAttribute("data-ss-tool");
      if (k === "dso") mountDso(el); else if (k === "late-ar") mountLateAr(el); else if (k === "net-terms") mountNetTerms(el);
    });
    wireCopy();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : this);
