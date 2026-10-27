/**
 * First-touch attribution capture.
 * Records the landing page, referrer, and campaign params of a visitor's FIRST
 * page view in this browser so the contact form can report where a lead
 * actually came from. Rides along in this file because it's the one script
 * included on every page — no new tag across 107 files. Written once and never
 * overwritten, so an internal click-through can't clobber the search referrer.
 */
(function () {
  var KEY = 'ss-first-touch';
  // This TAB SESSION's first touch, with every field the /contact lead system stores (row D2):
  // the UTMs incl. term/content and the Meta / LinkedIn click ids. sessionStorage, so a visitor
  // who returns later from a new campaign is attributed to that campaign. Keep this block if the
  // widget is replaced (row D4) — contact.html reads it.
  try {
    if (!sessionStorage.getItem('ss-session-touch')) {
      var sp = new URLSearchParams(location.search);
      var g = function (k, n) { return (sp.get(k) || '').slice(0, n); };
      sessionStorage.setItem('ss-session-touch', JSON.stringify({
        landing: (location.pathname + location.search).slice(0, 1000),
        referrer: (document.referrer || '').slice(0, 1000),
        utmSource: g('utm_source', 200), utmMedium: g('utm_medium', 200), utmCampaign: g('utm_campaign', 200),
        utmTerm: g('utm_term', 200), utmContent: g('utm_content', 200),
        fbclid: g('fbclid', 500), liFatId: g('li_fat_id', 500),
        // Sales row R3: a partner's booking-link code, kept for /contact and the chat capture.
        rep: /^[A-Za-z0-9_-]{1,40}$/.test(g('rep', 40)) ? g('rep', 40) : '',
        at: new Date().toISOString(),
      }));
    } else {
      // Sales row R3: a partner link opened LATER in the same tab still counts (backfill, never overwrite).
      var cur = JSON.parse(sessionStorage.getItem('ss-session-touch') || '{}') || {};
      var later = (new URLSearchParams(location.search).get('rep') || '').slice(0, 40);
      if (!cur.rep && /^[A-Za-z0-9_-]{1,40}$/.test(later)) { cur.rep = later; sessionStorage.setItem('ss-session-touch', JSON.stringify(cur)); }
    }
  } catch (err) {
    /* storage disabled — attribution is best-effort */
  }
  try {
    if (localStorage.getItem(KEY)) return;
    var params = new URLSearchParams(location.search);
    localStorage.setItem(KEY, JSON.stringify({
      landing: (location.pathname + location.search).slice(0, 300),
      referrer: (document.referrer || '').slice(0, 300),
      utmSource: (params.get('utm_source') || '').slice(0, 100),
      utmMedium: (params.get('utm_medium') || '').slice(0, 100),
      utmCampaign: (params.get('utm_campaign') || '').slice(0, 100),
      gclid: (params.get('gclid') || '').slice(0, 200),
      at: new Date().toISOString(),
    }));
  } catch (err) {
    /* private mode / storage disabled — attribution is best-effort, never blocking */
  }
})();

/* ── Nav dropdowns: ARIA sync + touch toggle (desktop hover/focus open via CSS) ──
   Clicking the toggle label NAVIGATES to the product overview page. Only on a
   no-hover (touch) device does the first tap open the menu instead. */
(function () {
  var noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('.nav-dropdown'), function (dd) {
    var toggle = dd.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;
    function setExpanded(v) { toggle.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    function close() { dd.classList.remove('open'); setExpanded(false); }
    toggle.addEventListener('click', function (e) {
      var mobileSheet = dd.closest('.nav-links.mobile-open');
      if (!noHover || mobileSheet || dd.classList.contains('open')) return;
      e.preventDefault();
      dd.classList.add('open'); setExpanded(true);
    });
    dd.addEventListener('mouseenter', function () { setExpanded(true); });
    dd.addEventListener('mouseleave', function () { if (!dd.classList.contains('open')) setExpanded(false); });
    dd.addEventListener('focusin', function () { setExpanded(true); });
    dd.addEventListener('focusout', function () { if (!dd.classList.contains('open')) setExpanded(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dd.classList.contains('open')) close(); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target) && dd.classList.contains('open')) close(); });
  });
})();
