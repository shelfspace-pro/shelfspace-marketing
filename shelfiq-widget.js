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

/**
 * Chelsea chat widget (sales row D4, 10/19/2026).
 * Chelsea is ShelfSpace's AI assistant. Everything that matters lives on the platform route
 * https://ourshelf.space/api/public/sales-chat (prompt, model, guardrail check, lead capture,
 * booking, "call me now"); this file is only the UI. Nothing is sent until the visitor opens the
 * chat. Model text is rendered as TEXT (never innerHTML); the only server html inserted is the
 * registered call-consent disclosure, and only when it has the exact registry shape.
 */
(function () {
  var API = 'https://ourshelf.space/api/public/sales-chat';
  var TIMEOUT_MS = 55000;
  var STORE_KEY = 'chelsea-chat-v1';
  var OPEN_KEY = 'chelsea-chat-open';
  var FALLBACK_HREF = '/contact?cta=chat-widget-fallback';
  var DISCLOSURE_RE = /^<p class="sales-consent">[^<]*<\/p>$/;

  // state: token + the signed model history; ui = what the visitor sees (incl. notes); flags.
  var st = { token: null, history: [], ui: [], disclosure: null, siteKey: null, captured: false, offers: null, booked: false, ended: false };
  var busy = false;
  var cardOpenedAt = 0;

  function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch (e) { /* best-effort */ } }
  function load() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s.token === 'string' && Array.isArray(s.history) && Array.isArray(s.ui)) st = s;
    } catch (e) { /* ignore */ }
  }

  // --- CSS ---
  var style = document.createElement('style');
  style.textContent = [
    '.cw-toggle{position:fixed;bottom:24px;right:24px;z-index:9998;display:flex;align-items:center;gap:8px;background:#1b4332;color:#fff;border:none;padding:12px 20px 12px 16px;border-radius:100px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 24px rgba(27,67,50,0.3);transition:all .3s cubic-bezier(.22,1,.36,1)}',
    '.cw-toggle:hover{background:#2d6a4f;transform:translateY(-2px);box-shadow:0 8px 32px rgba(27,67,50,0.4)}',
    '.cw-window{position:fixed;bottom:24px;right:24px;z-index:9998;width:400px;height:580px;max-height:calc(100dvh - 48px);background:#fff;border-radius:20px;box-shadow:0 16px 64px rgba(27,67,50,0.18),0 2px 8px rgba(27,67,50,0.06);display:none;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;font-family:inherit}',
    '.cw-window.open{display:flex}',
    '.cw-title{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0}',
    '.cw-avatar{width:34px;height:34px;border-radius:12px;background:linear-gradient(135deg,#1b4332,#40916c);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0}',
    '.cw-title-info{flex:1;min-width:0}',
    '.cw-name{font-size:14px;font-weight:700;color:#1b4332}',
    '.cw-sub{font-size:11px;color:#64748b}',
    '.cw-sched{border:1px solid rgba(149,213,178,.6);background:#f0faf4;color:#1b4332;font-family:inherit;font-size:12px;font-weight:600;padding:6px 10px;border-radius:12px;cursor:pointer;white-space:nowrap}',
    '.cw-sched:hover{background:#d8f3dc}',
    '.cw-close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:#94a3b8;border-radius:8px;font-size:20px;flex-shrink:0}',
    '.cw-close:hover{background:#f1f5f9;color:#1e293b}',
    '.cw-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
    '.cw-msg{max-width:86%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}',
    '.cw-msg a{color:inherit;text-decoration:underline}',
    '.cw-msg.user{align-self:flex-end;background:#1b4332;color:#fff;border-bottom-right-radius:6px}',
    '.cw-msg.ai{align-self:flex-start;background:#f8fafc;color:#334155;border:1px solid #f1f5f9;border-bottom-left-radius:6px}',
    '.cw-msg.note{align-self:stretch;max-width:100%;background:#f0faf4;color:#1b4332;border:1px solid rgba(149,213,178,.5);font-size:13px}',
    '.cw-chips{display:flex;flex-direction:column;gap:8px}',
    '.cw-chip,.cw-btn{background:#f0faf4;border:1px solid rgba(149,213,178,0.5);color:#1b4332;padding:9px 13px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;text-align:left;font-family:inherit;line-height:1.4}',
    '.cw-chip:hover,.cw-btn:hover{background:#d8f3dc;border-color:#95d5b2}',
    '.cw-btn.pri{background:#1b4332;color:#fff;border-color:#1b4332;font-weight:600;text-align:center}',
    '.cw-btn.pri:hover{background:#2d6a4f}',
    '.cw-btn:disabled{opacity:.5;cursor:not-allowed}',
    '.cw-actions{display:flex;flex-direction:column;gap:8px}',
    '.cw-card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;background:#fff;box-shadow:0 2px 12px rgba(27,67,50,0.06)}',
    '.cw-card h4{margin:0;font-size:14px;color:#1b4332}',
    '.cw-card label{font-size:12px;color:#475569;display:flex;flex-direction:column;gap:3px}',
    '.cw-card input,.cw-card select{font-family:inherit;font-size:14px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:12px;color:#1e293b;background:#fff;width:100%;box-sizing:border-box}',
    '.cw-card .sales-consent{margin:2px 0 0;font-size:12px;line-height:1.5;color:#475569}',
    '.cw-err{font-size:12px;color:#b91c1c;min-height:0}',
    '.cw-loading{align-self:flex-start;display:flex;gap:4px;padding:12px 16px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:16px}',
    '.cw-dot{width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:cw-bounce .6s ease-in-out infinite}',
    '.cw-dot:nth-child(2){animation-delay:.15s}.cw-dot:nth-child(3){animation-delay:.3s}',
    '@keyframes cw-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}',
    '.cw-input-bar{display:flex;align-items:center;gap:8px;padding:12px 14px;border-top:1px solid #f1f5f9;background:#fff;flex-shrink:0}',
    '.cw-input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#1e293b;background:transparent;min-width:0}',
    '.cw-send{width:34px;height:34px;border-radius:12px;border:none;background:#1b4332;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.cw-send:disabled{opacity:.4;cursor:not-allowed}',
    '@media(max-width:480px){.cw-window{width:calc(100vw - 16px);height:calc(100dvh - 16px);max-height:calc(100dvh - 16px);bottom:8px;right:8px;border-radius:16px}.cw-toggle{bottom:16px;right:16px}}',
  ].join('\n');
  document.head.appendChild(style);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // Text with safe links: only shelfspace.pro pages and support@shelfspace.pro become links.
  function richText(parent, text) {
    var re = /((?:https?:\/\/)?(?:www\.)?shelfspace\.pro(?:\/[A-Za-z0-9\-_/]*)?|support@shelfspace\.pro)/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      var raw = m[0].replace(/[.,;:!?)]+$/, '');
      var a = document.createElement('a');
      if (raw.indexOf('@') !== -1) a.href = 'mailto:' + raw;
      else { var p = raw.replace(/^https?:\/\//, '').replace(/^www\./, ''); a.href = 'https://' + p; }
      a.textContent = raw;
      parent.appendChild(a);
      if (raw.length < m[0].length) parent.appendChild(document.createTextNode(m[0].slice(raw.length)));
      last = m.index + m[0].length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  // --- DOM ---
  var toggle = el('button', 'cw-toggle');
  toggle.setAttribute('aria-label', 'Chat with Chelsea, ShelfSpace’s AI assistant');
  toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  toggle.appendChild(el('span', '', 'Chat with Chelsea'));
  document.body.appendChild(toggle);

  var win = el('div', 'cw-window');
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Chat with Chelsea');
  var title = el('div', 'cw-title');
  title.appendChild(el('div', 'cw-avatar', 'C'));
  var info = el('div', 'cw-title-info');
  info.appendChild(el('div', 'cw-name', 'Chelsea'));
  info.appendChild(el('div', 'cw-sub', 'ShelfSpace’s AI assistant'));
  title.appendChild(info);
  var schedBtn = el('button', 'cw-sched', 'Schedule a call');
  title.appendChild(schedBtn);
  var closeBtn = el('button', 'cw-close', '×');
  closeBtn.setAttribute('aria-label', 'Close chat');
  title.appendChild(closeBtn);
  win.appendChild(title);
  var body = el('div', 'cw-body');
  body.setAttribute('aria-live', 'polite');
  win.appendChild(body);
  var bar = el('div', 'cw-input-bar');
  var input = el('input', 'cw-input');
  input.type = 'text';
  input.maxLength = 600;
  input.placeholder = 'Ask Chelsea about ShelfSpace…';
  input.setAttribute('aria-label', 'Your message');
  var send = el('button', 'cw-send');
  send.setAttribute('aria-label', 'Send');
  send.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  bar.appendChild(input);
  bar.appendChild(send);
  win.appendChild(bar);
  document.body.appendChild(win);

  // --- network ---
  function call(payload) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { b.__status = r.status; return b; }); })
      .finally(function () { clearTimeout(timer); });
  }

  // --- rendering ---
  function scroll() { body.scrollTop = body.scrollHeight; }
  function bubble(kind, text) {
    var d = el('div', 'cw-msg ' + kind);
    richText(d, text);
    body.appendChild(d);
    scroll();
    return d;
  }
  function addUi(kind, text) { st.ui.push({ k: kind, t: text }); save(); bubble(kind, text); }
  function fallbackNote(text) {
    var d = el('div', 'cw-msg note');
    d.appendChild(document.createTextNode((text || 'Sorry, I couldn’t connect just now.') + ' '));
    var a = el('a', '', 'Schedule a call');
    a.href = FALLBACK_HREF;
    d.appendChild(a);
    body.appendChild(d);
    scroll();
  }
  function loading(on) {
    var x = document.getElementById('cwLoading');
    if (on && !x) {
      x = el('div', 'cw-loading');
      x.id = 'cwLoading';
      for (var i = 0; i < 3; i++) x.appendChild(el('div', 'cw-dot'));
      body.appendChild(x);
      scroll();
    } else if (!on && x) x.remove();
  }
  function setBusy(b) { busy = b; send.disabled = b || st.ended; input.disabled = st.ended; }

  function renderAll() {
    body.textContent = '';
    st.ui.forEach(function (m) { bubble(m.k, m.t); });
    if (!st.captured && st.ui.length <= 1) renderChips();
    if (st.captured && st.offers && !st.booked) renderOffers();
    setBusy(false);
  }

  function renderChips() {
    var c = el('div', 'cw-chips');
    c.id = 'cwChips';
    [['How does ShelfCollect work for a brand?', null], ['I run a dispensary. How does ShelfPay work?', null], ['Schedule a call', 'card']].forEach(function (pair) {
      var b = el('button', 'cw-chip', pair[0]);
      b.addEventListener('click', function () { c.remove(); if (pair[1] === 'card') openCard(); else sendMessage(pair[0]); });
      c.appendChild(b);
    });
    body.appendChild(c);
    scroll();
  }
  function dropChips() { var c = document.getElementById('cwChips'); if (c) c.remove(); }

  // --- start / message ---
  function ensureSession() {
    if (st.token) return Promise.resolve(true);
    loading(true);
    return call({ action: 'start' }).then(function (b) {
      loading(false);
      if (!b.ok || !b.token) { fallbackNote('Chat isn’t available right now.'); return false; }
      st.token = b.token;
      st.history = [{ role: 'assistant', content: b.greeting }];
      st.disclosure = b.disclosure || null;
      st.siteKey = b.turnstileSiteKey || null;
      st.ui = [{ k: 'ai', t: b.greeting }];
      save();
      renderAll();
      return true;
    }, function () { loading(false); fallbackNote('Chat isn’t available right now.'); return false; });
  }

  function sendMessage(text) {
    text = (text || '').trim().slice(0, 600);
    if (!text || busy || st.ended) return;
    dropChips();
    setBusy(true);
    ensureSession().then(function (ok) {
      if (!ok) { setBusy(false); return; }
      addUi('user', text);
      loading(true);
      return call({ action: 'message', token: st.token, history: st.history, message: text }).then(function (b) {
        loading(false);
        if (b.ok && b.reply) {
          st.history = st.history.concat([{ role: 'user', content: text }, { role: 'assistant', content: b.reply }]);
          st.token = b.token;
          if (b.ended) st.ended = true;
          addUi('ai', b.reply);
          if (b.showCard && !st.captured) openCard();
        } else if (b.ok && b.note) {
          if (b.ended) st.ended = true;
          addUi('note', b.note);
          if (b.showCard && !st.captured) openCard();
        } else if (b.__status === 429) {
          fallbackNote('You’re sending messages quickly. Try again in a few minutes, or');
        } else if (b.error === 'session' || b.error === 'history') {
          st.token = null; st.history = []; st.ui = []; save();
          fallbackNote('This chat expired. Open it again to start over, or');
        } else {
          fallbackNote('Sorry, something went wrong.');
        }
        save();
        setBusy(false);
        input.focus();
      });
    }).catch(function () { loading(false); fallbackNote('Sorry, I couldn’t connect.'); setBusy(false); });
  }

  // --- Turnstile (own instance; never touches the /contact form's widget or its onload hook) ---
  var ts = { id: null, token: null, waiters: [] };
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      document.head.appendChild(s);
    }
    return new Promise(function (resolve) {
      var n = 0;
      var t = setInterval(function () {
        if (window.turnstile || ++n > 100) { clearInterval(t); resolve(window.turnstile || null); }
      }, 100);
    });
  }
  function renderTurnstile(slot) {
    if (!st.siteKey) return;
    loadTurnstile().then(function (T) {
      if (!T || ts.id !== null) return;
      ts.id = T.render(slot, {
        sitekey: st.siteKey, appearance: 'interaction-only',
        callback: function (tok) { ts.token = tok; var w = ts.waiters; ts.waiters = []; w.forEach(function (f) { f(tok); }); },
        'expired-callback': function () { ts.token = null; },
        'error-callback': function () { ts.token = null; },
      });
    });
  }
  function turnstileToken(ms) {
    if (ts.token) { var t = ts.token; ts.token = null; return Promise.resolve(t); }
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, ms);
      ts.waiters.push(function (tok) { if (!done) { done = true; clearTimeout(timer); ts.token = null; resolve(tok); } });
    });
  }
  function resetTurnstile() { ts.token = null; if (window.turnstile && ts.id !== null) window.turnstile.reset(ts.id); }

  // --- details card ---
  function attribution() {
    var s = {};
    try { s = JSON.parse(sessionStorage.getItem('ss-session-touch') || '{}') || {}; } catch (e) { s = {}; }
    function c(v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }
    return {
      utm_source: c(s.utmSource, 200), utm_medium: c(s.utmMedium, 200), utm_campaign: c(s.utmCampaign, 200),
      utm_term: c(s.utmTerm, 200), utm_content: c(s.utmContent, 200), fbclid: c(s.fbclid, 500), li_fat_id: c(s.liFatId, 500),
      referrer: c(s.referrer, 1000), landing_path: c(s.landing, 1000),
      // Sales row R3: this page's ?rep= first, else the session's.
      rep_code: (function () {
        var u = (new URLSearchParams(location.search).get('rep') || '').slice(0, 40);
        if (/^[A-Za-z0-9_-]{1,40}$/.test(u)) return u;
        return /^[A-Za-z0-9_-]{1,40}$/.test(c(s.rep, 40)) ? c(s.rep, 40) : '';
      })(),
    };
  }

  function field(card, label, name, type, auto) {
    var l = el('label', '', label);
    var i = el('input');
    i.name = name; i.type = type; i.required = true; i.autocomplete = auto; i.maxLength = name === 'email' ? 254 : 200;
    l.appendChild(i);
    card.appendChild(l);
    return i;
  }

  function openCard() {
    if (st.captured || document.getElementById('cwCard')) return;
    ensureSession().then(function (ok) {
      if (!ok || document.getElementById('cwCard')) return;
      if (!st.disclosure || !DISCLOSURE_RE.test(st.disclosure.html || '')) { fallbackNote('Leave your details on our contact page:'); return; }
      dropChips();
      cardOpenedAt = Date.now();
      var card = el('form', 'cw-card');
      card.id = 'cwCard';
      card.noValidate = true;
      card.appendChild(el('h4', '', 'Set up a call with Chris'));
      var hp = el('input'); hp.name = 'website'; hp.type = 'text'; hp.tabIndex = -1; hp.autocomplete = 'off';
      hp.setAttribute('aria-hidden', 'true'); hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      card.appendChild(hp);
      var name = field(card, 'Your name', 'name', 'text', 'name');
      var email = field(card, 'Work email', 'email', 'email', 'email');
      var phone = field(card, 'Mobile', 'phone', 'tel', 'tel');
      var company = field(card, 'Company', 'company', 'text', 'organization');
      var rl = el('label', '', 'I run a…');
      var role = el('select');
      [['', 'Choose one'], ['brand', 'Brand'], ['distributor', 'Distributor'], ['store', 'Dispensary or store'], ['other', 'Something else']].forEach(function (o) {
        var op = el('option', '', o[1]); op.value = o[0]; role.appendChild(op);
      });
      rl.appendChild(role);
      card.appendChild(rl);
      var tsSlot = el('div', 'cw-ts');
      card.appendChild(tsSlot);
      var disc = el('div');
      disc.innerHTML = st.disclosure.html; // registry html only (shape-checked above)
      card.appendChild(disc);
      var err = el('div', 'cw-err');
      card.appendChild(err);
      var LABEL = st.disclosure.buttonLabel || 'Submit';
      var submit = el('button', 'cw-btn pri', LABEL);
      submit.type = 'submit';
      card.appendChild(submit);
      body.appendChild(card);
      renderTurnstile(tsSlot);
      scroll();
      name.focus();

      card.addEventListener('submit', function (ev) {
        ev.preventDefault();
        err.textContent = '';
        if (!name.value.trim() || !email.value.trim() || !phone.value.trim() || !company.value.trim() || !role.value) { err.textContent = 'Please fill in every field.'; return; }
        submit.disabled = true;
        submit.textContent = 'Sending…';
        turnstileToken(20000).then(function (tok) {
          if (!tok) { err.textContent = 'Couldn’t verify you’re human. Try again.'; resetTurnstile(); submit.disabled = false; submit.textContent = LABEL; return; }
          var a = attribution();
          var payload = {
            action: 'capture', token: st.token, history: st.history,
            name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), company: company.value.trim(), role: role.value,
            turnstile_token: tok, website: hp.value, fill_ms: Date.now() - cardOpenedAt,
            disclosure_version: st.disclosure.version, disclosure_html_sha256: st.disclosure.sha256, button_label: LABEL,
            page_url: location.href.slice(0, 1000), cta_id: 'chat-widget',
          };
          Object.keys(a).forEach(function (k) { if (a[k]) payload[k] = a[k]; });
          return call(payload).then(function (b) {
            if (b.ok) {
              card.remove();
              st.captured = true;
              if (b.token) st.token = b.token;
              st.offers = b.offers || { booking: false, callNow: false };
              if (b.reply) addUi('note', b.reply);
              save();
              renderOffers();
              return;
            }
            resetTurnstile();
            submit.disabled = false;
            submit.textContent = LABEL;
            if (b.__status === 400 && b.fields && b.fields.length) {
              var map = { email: 'work email', phone: 'mobile number', name: 'name', company: 'company', role: 'role' };
              var names = b.fields.map(function (f) { return map[f] || f; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
              err.textContent = 'Please check your ' + names.join(' and ') + '.';
            } else if (b.__status === 429) err.textContent = 'Too many tries. Please wait a few minutes.';
            else if (b.__status === 403) err.textContent = 'Couldn’t verify you’re human. Try again.';
            else err.textContent = 'Something went wrong. You can also use our contact page.';
          });
        }).catch(function () { submit.disabled = false; submit.textContent = LABEL; err.textContent = 'Couldn’t connect. Try again.'; });
      });
    });
  }

  // --- offers: booking + call me now ---
  function renderOffers() {
    var old = document.getElementById('cwOffers');
    if (old) old.remove();
    if (!st.offers || st.booked || (!st.offers.booking && !st.offers.callNow)) return;
    var box = el('div', 'cw-actions');
    box.id = 'cwOffers';
    if (st.offers.booking) {
      var pick = el('button', 'cw-btn pri', 'Pick a time');
      pick.addEventListener('click', function () { pick.disabled = true; loadSlots(box); });
      box.appendChild(pick);
    }
    if (st.offers.callNow) {
      var cn = el('button', 'cw-btn', 'Call me now');
      cn.addEventListener('click', function () {
        cn.disabled = true;
        call({ action: 'call', token: st.token }).then(function (b) {
          addUi('note', b.reply || 'Chris will reach out soon.');
          st.offers.callNow = false; save(); renderOffers();
        }, function () { cn.disabled = false; fallbackNote(); });
      });
      box.appendChild(cn);
    }
    body.appendChild(box);
    scroll();
  }

  function zone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }

  function slotButtons(box, slots) {
    var list = el('div', 'cw-actions');
    list.id = 'cwSlots';
    slots.forEach(function (s) {
      var b = el('button', 'cw-btn', s.label);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(list.querySelectorAll('button'), function (x) { x.disabled = true; });
        call({ action: 'book', token: st.token, start: s.start, timeZone: zone() }).then(function (r) {
          list.remove();
          if (r.ok) { st.booked = true; if (r.token) st.token = r.token; addUi('note', r.reply); save(); renderOffers(); return; }
          if (r.token) st.token = r.token;
          addUi('note', r.reply || 'Chris will reach out to find a time.');
          save();
          if (r.slots && r.slots.length) slotButtons(box, r.slots);
        }, function () { list.remove(); fallbackNote(); });
      });
      list.appendChild(b);
    });
    body.appendChild(list);
    scroll();
  }

  function loadSlots(box) {
    loading(true);
    call({ action: 'slots', token: st.token, timeZone: zone() }).then(function (b) {
      loading(false);
      if (b.ok && b.slots && b.slots.length) {
        if (b.token) st.token = b.token;
        save();
        addUi('note', 'Here are the next open times (your time zone):');
        slotButtons(box, b.slots);
      } else fallbackNote('I couldn’t load open times.');
    }, function () { loading(false); fallbackNote('I couldn’t load open times.'); });
  }

  // --- events ---
  send.addEventListener('click', function () { var v = input.value; input.value = ''; sendMessage(v); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var v = input.value; input.value = ''; sendMessage(v); } });
  schedBtn.addEventListener('click', function () { openCard(); });

  function openChat() {
    win.classList.add('open');
    toggle.style.display = 'none';
    try { sessionStorage.setItem(OPEN_KEY, '1'); } catch (e) {}
    if (st.token) renderAll(); else ensureSession();
    setTimeout(function () { input.focus(); }, 100);
  }
  function closeChat() {
    win.classList.remove('open');
    toggle.style.display = '';
    try { sessionStorage.setItem(OPEN_KEY, '0'); } catch (e) {}
  }
  toggle.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('open')) closeChat(); });

  load();
  try { if (sessionStorage.getItem(OPEN_KEY) === '1' && st.token) openChat(); } catch (e) {}
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
