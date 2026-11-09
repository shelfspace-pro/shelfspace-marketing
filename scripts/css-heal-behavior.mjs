// Runs CSS_HEAL (scripts/css-heal-snippet.mjs) against a stub DOM in node:vm and asserts what it
// DOES, so an inert or broken heal can't pass check:css-heal on text equality alone. Returns a list
// of failures (empty = pass). Each case names the defect it guards.
import vm from 'node:vm';

const ORIGIN = 'https://shelfspace.pro';
function sheetOf(state) {
  if (state === 'ok') return { cssRules: { length: 400 } };
  if (state === 'empty') return { cssRules: { length: 0 } };
  if (state === 'throws') return { get cssRules() { throw new Error('SecurityError'); } };
  return null; // 'none' or pending
}
function makeLink(doc, href, state, extra = {}) {
  const attrs = {};
  const l = {
    nodeType: 1, tagName: 'LINK', rel: 'stylesheet', href, disabled: false, ...extra,
    get sheet() { return sheetOf(this._state); }, _state: state,
    setAttribute(k, v) { attrs[k] = v; }, hasAttribute(k) { return k in attrs; },
    parentNode: doc.head,
  };
  return l;
}
function env() {
  const timers = [], winH = {}, docH = {};
  const head = { kids: [], insertBefore(n, ref) { const i = ref ? this.kids.indexOf(ref) : -1; n.parentNode = this; i < 0 ? this.kids.push(n) : this.kids.splice(i, 0, n); }, removeChild(n) { this.kids.splice(this.kids.indexOf(n), 1); n.parentNode = null; } };
  const doc = { head,
    querySelectorAll(sel) { return head.kids.filter(k => k.tagName === 'LINK' && (!/rel="stylesheet"/.test(sel) || k.rel === 'stylesheet')); },
    createElement() { const l = makeLink(doc, '', 'pending'); l.rel = ''; l.parentNode = null; return l; },
    addEventListener(n, f, cap) { docH[n] = { f, cap }; } };
  const add = (href, state, extra) => { const l = makeLink(doc, href, state, extra); head.kids.push(l); l.nextSibling = null; return l; };
  const ctx = { document: doc, window: { addEventListener(n, f) { winH[n] = f; } }, location: { origin: ORIGIN },
    setTimeout(f) { timers.push(f); }, Date };
  return { doc, head, add, timers, winH, docH, ctx };
}
function run(E, code) {
  for (const k of E.head.kids) Object.defineProperty(k, 'nextSibling', { configurable: true, get() { const i = E.head.kids.indexOf(k); return E.head.kids[i + 1] || null; } });
  vm.runInNewContext(code, E.ctx);
}
const retries = E => E.head.kids.filter(k => k.hasAttribute('data-retry'));

export function checkBehavior(CSS_HEAL) {
  const code = CSS_HEAL.replace(/^<script>/, '').replace(/<\/script>$/, '');
  const fails = []; const expect = (c, msg) => { if (!c) fails.push(msg); };
  // A: healthy page = no retries
  { const E = env(); E.add(ORIGIN + '/styles.css', 'ok'); E.add(ORIGIN + '/missing.svg', 'none', { rel: 'icon' }); E.add(ORIGIN + '/x.woff2', 'none', { rel: 'preload' }); run(E, code); E.winH.load?.(); expect(retries(E).length === 0, 'A: a healthy styles.css, an icon and a preload must not be retried'); }
  // B: failed styles.css healed SYNCHRONOUSLY (not waiting for load), inserted right after the original
  { const E = env(); const l = E.add(ORIGIN + '/styles.css', 'throws'); E.add(ORIGIN + '/inline-marker', 'ok', { tagName: 'STYLE' }); run(E, code);
    const r = retries(E); expect(r.length === 1, 'B: a failed styles.css must get one retry at script time, before load');
    expect(r[0] && E.head.kids.indexOf(r[0]) === E.head.kids.indexOf(l) + 1, 'B: the retry must sit right after the original (cascade order)');
    expect(r[0] && /\/styles\.css\?retry=\d+$/.test(r[0].href), 'B: the retry URL must be /styles.css?retry=<ts>');
    expect(r[0] && r[0].rel === 'stylesheet', 'B: the retry must be rel=stylesheet');
    expect(typeof E.winH.load === 'function' && typeof E.winH.pageshow === 'function', 'B: must also heal on window load and pageshow'); }
  // C: 0-rule sheet (404 / wrong MIME) counts as failed
  { const E = env(); E.add(ORIGIN + '/styles.css', 'empty'); run(E, code); expect(retries(E).length === 1, 'C: a 0-rule sheet (404/wrong MIME) must be retried'); }
  // D: cross-origin and disabled sheets are skipped
  { const E = env(); E.add('https://fonts.googleapis.com/css2?x', 'throws'); E.add(ORIGIN + '/hero-motion.css', 'none', { disabled: true }); run(E, code); E.winH.load?.(); expect(retries(E).length === 0, 'D: cross-origin and disabled sheets must not be retried'); }
  // E: a pending retry is waited on (load / pageshow do not replace it)
  { const E = env(); const l = E.add(ORIGIN + '/styles.css', 'throws'); run(E, code); const r1 = retries(E)[0]; E.winH.load?.(); E.winH.pageshow?.(); expect(retries(E).length === 1 && retries(E)[0] === r1 && l._n === 1 && E.timers.length === 0, 'E: a retry still loading must not be replaced'); }
  // F: cap = 2 retries, via onerror AND via an empty onload
  { const E = env(); const l = E.add(ORIGIN + '/styles.css', 'throws'); run(E, code);
    let r1 = retries(E)[0]; r1 && r1.onerror && r1.onerror.call(r1); expect(E.timers.length === 1, 'F: a failed retry must schedule the next try');
    E.timers.shift()?.(); const r2 = retries(E)[0]; expect(retries(E).length === 1 && r2 !== r1, 'F: the second try must replace the first');
    if (r2) { r2._state = 'empty'; r2.onload && r2.onload.call(r2); } expect(E.timers.length === 1, 'F: a retry that loads EMPTY must count as failed');
    E.timers.shift()?.(); E.winH.load?.(); E.winH.pageshow?.(); expect((l._n || 0) === 2 && retries(E).length === 1, 'F: never more than 2 retries per sheet'); }
  // G: a LATER link's error is healed at once (before load), and only that link: a sibling still loading is left alone
  { const E = env(); E.add(ORIGIN + '/styles.css', 'ok'); run(E, code);
    const later = E.add(ORIGIN + '/seo-assets.css', 'throws'); const pending = E.add(ORIGIN + '/hero-motion.css', 'pending');
    for (const k of E.head.kids) Object.defineProperty(k, 'nextSibling', { configurable: true, get() { const i = E.head.kids.indexOf(k); return E.head.kids[i + 1] || null; } });
    const h = E.docH.error; expect(h && h.cap === true, 'G: must listen for link errors in the CAPTURE phase on document');
    h && h.f({ target: later }); const r = retries(E);
    expect(r.length === 1 && r[0].href.startsWith(ORIGIN + '/seo-assets.css?retry='), 'G: a later sheet that errors must be retried immediately, and only that sheet');
    expect(!pending._r, 'G: a sibling still loading must not be retried');
    const pre = E.add(ORIGIN + '/x.woff2', 'none', { rel: 'preload' }); h && h.f({ target: pre }); expect(retries(E).length === 1 && !pre._r, 'G: an erroring preload/icon link must not be re-fetched as a stylesheet'); }
  // H: a later sheet that settles EMPTY with no error event is healed by window load
  { const E = env(); E.add(ORIGIN + '/styles.css', 'ok'); run(E, code); const later = E.add(ORIGIN + '/seo-assets.css', 'empty');
    for (const k of E.head.kids) Object.defineProperty(k, 'nextSibling', { configurable: true, get() { const i = E.head.kids.indexOf(k); return E.head.kids[i + 1] || null; } });
    E.winH.load?.(); expect(later._r && retries(E).length === 1, 'H: window load must heal a later sheet that failed without an error event'); }
  return fails;
}
