import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- Rate limiter (graceful degradation if Upstash env vars aren't set yet) ---
// Vercel Marketplace's Upstash integration provisions UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN automatically. Until those exist this falls through
// to Turnstile + origin gating only. Uses its own `interest:` prefixes so it
// never shares counters with the ShelfiQ chat limiter.
let burstLimiter = null;
let dailyLimiter = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = Redis.fromEnv();
    burstLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      prefix: 'interest:burst',
      analytics: true,
    });
    dailyLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 d'),
      prefix: 'interest:day',
      analytics: true,
    });
  }
} catch (err) {
  console.warn('Interest form rate limiter not initialized:', err.message);
}

// --- Origin allowlist (mirrors api/shelfiq-chat.js) ---
const ALLOWED_ORIGINS = new Set([
  'https://shelfspace.pro',
  'https://www.shelfspace.pro',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
]);
const ORIGIN_HOST_SUFFIXES = ['.vercel.app'];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return ORIGIN_HOST_SUFFIXES.some(suffix => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    return xff.split(',')[0].trim();
  }
  if (typeof req.headers['x-real-ip'] === 'string') {
    return req.headers['x-real-ip'];
  }
  return 'unknown';
}

// --- Validation constants ---
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'chris@shelfspace.pro';
const ROLES = new Set(['Retailer', 'Vendor', 'Other']);
const ROLE_LABEL = { Retailer: 'Dispensary', Vendor: 'Brand', Other: 'Other' };
const SHOP_RANGES = new Set(['1', '2-5', '6-10', '11-20', '21+']);
const STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_BUSINESS = 200;
const MAX_OTHER = 500;
const MAX_NOTE = 1000;
// Real people take a few seconds to fill the form; scripted posts don't.
const MIN_FILL_MS = 2500;

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function cleanSubject(v) {
  return String(v).replace(/[\r\n]+/g, ' ').trim().slice(0, 140);
}

// --- Attribution ---------------------------------------------------------
// The client sends a best-effort `source` object (first-touch landing page,
// referrer, UTMs). Untrusted: every field is coerced to a short string and
// HTML-escaped at render. Absent or malformed is normal — never fail the lead.
const SOURCE_FIELDS = [
  'referrer', 'landing', 'firstReferrer',
  'utmSource', 'utmMedium', 'utmCampaign', 'gclid', 'firstSeen',
];
const MAX_SOURCE_FIELD = 300;

function sanitizeSource(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const key of SOURCE_FIELDS) {
    const v = str(raw[key]);
    if (v) out[key] = v.slice(0, MAX_SOURCE_FIELD);
  }
  return out;
}

const SEARCH_HOSTS = [
  ['google', 'Google search'],
  ['bing', 'Bing search'],
  ['duckduckgo', 'DuckDuckGo search'],
  ['yahoo', 'Yahoo search'],
  ['ecosia', 'Ecosia search'],
  ['brave', 'Brave search'],
  ['perplexity', 'Perplexity'],
  ['chatgpt', 'ChatGPT'],
  ['openai', 'ChatGPT'],
  ['claude.ai', 'Claude'],
];
const SOCIAL_HOSTS = [
  ['linkedin', 'LinkedIn'],
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['reddit', 'Reddit'],
  ['twitter', 'X/Twitter'],
  ['x.com', 'X/Twitter'],
  ['youtube', 'YouTube'],
];

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Human-readable channel, e.g. "Organic — Google search" or "Direct / untracked".
function describeChannel(source) {
  if (source.gclid || (source.utmMedium || '').toLowerCase() === 'cpc') return 'Paid search';
  if (source.utmSource) {
    const medium = source.utmMedium ? ` / ${source.utmMedium}` : '';
    return `Campaign — ${source.utmSource}${medium}`;
  }
  const ref = source.firstReferrer || source.referrer || '';
  if (!ref) return 'Direct / untracked';
  const host = hostOf(ref);
  if (!host) return 'Unknown referrer';
  if (host.endsWith('shelfspace.pro')) return 'Direct / untracked';
  for (const [needle, label] of SEARCH_HOSTS) {
    if (host.includes(needle)) return `Organic — ${label}`;
  }
  for (const [needle, label] of SOCIAL_HOSTS) {
    if (host.includes(needle)) return `Social — ${label}`;
  }
  return `Referral — ${host}`;
}

// MM/DD/YYYY per the ShelfSpace date convention — never ISO in a human-facing surface.
function formatDateMDY(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function sourceRows(source) {
  if (!Object.keys(source).length) return [];
  const rows = [['Found us via', describeChannel(source)]];
  if (source.landing) rows.push(['Landed on', source.landing]);
  if (source.utmCampaign) rows.push(['Campaign', source.utmCampaign]);
  const first = source.firstSeen ? formatDateMDY(source.firstSeen) : '';
  if (first) rows.push(['First visit', first]);
  return rows;
}

// --- Cloudflare Turnstile server-side verification ---
// Graceful degrade: if TURNSTILE_SECRET_KEY isn't provisioned yet, skip the
// check (logged) so the endpoint still works. Once the secret is set, an
// invalid/absent token fails closed.
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('Interest form: TURNSTILE_SECRET_KEY not set — skipping bot verification');
    return true;
  }
  if (!token) return false;
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (ip && ip !== 'unknown') params.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await r.json();
    return data.success === true;
  } catch (err) {
    console.error('Interest form: Turnstile verification error:', err);
    return false;
  }
}

// --- Resend email send (REST, no SDK dependency — matches the org's pattern) ---
async function sendEmail({ from, to, replyTo, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html, ...(text ? { text } : {}) }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend responded ${res.status}: ${detail}`);
  }
  return res.json().catch(() => ({}));
}

// Bulletproof table-based branded email shell. Live-text wordmark + table
// bgcolors mean the branding survives even when a client blocks images.
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
function emailShell({ preheader = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>ShelfSpace</title>
</head>
<body style="margin:0;padding:0;background:#eef3f0;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:#eef3f0;height:0;width:0;font-size:1px;line-height:1px;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef3f0;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:${FONT};">
        <tr><td bgcolor="#40916c" style="height:4px;line-height:4px;font-size:0;background:#40916c;">&nbsp;</td></tr>
        <tr><td style="padding:22px 32px;border-bottom:1px solid #eef2f0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:12px;"><img src="https://shelfspace.pro/shelfspace-logo.png" width="40" height="40" alt="ShelfSpace" style="display:block;border-radius:9px;"></td>
            <td style="vertical-align:middle;font-family:${FONT};font-size:20px;font-weight:700;color:#1b4332;letter-spacing:-0.3px;">ShelfSpace</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;font-family:${FONT};color:#334155;font-size:15px;line-height:1.65;">${bodyHtml}</td></tr>
        <tr><td bgcolor="#1b4332" style="background:#1b4332;padding:28px 32px;font-family:${FONT};">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#ffffff;">ShelfSpace</p>
          <p style="margin:0 0 14px;font-size:13px;color:#95d5b2;font-style:italic;">Operations and Payments Intelligence</p>
          <p style="margin:0 0 6px;font-size:13px;"><a href="https://shelfspace.pro" style="color:#d8f3dc;text-decoration:none;font-weight:600;">shelfspace.pro</a></p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);">Certified Metrc Third-Party Vendor &nbsp;&middot;&nbsp; &copy; 2026 ShelfSpace Technologies Inc.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function notificationHtml(lead) {
  const rows = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Business', lead.businessName],
    ['Role', lead.role],
  ];
  if (lead.role === 'Retailer' && lead.shops) rows.push(['Number of stores', lead.shops]);
  if (lead.state) rows.push(['State', lead.state]);
  if (lead.role === 'Other') rows.push(['What they do', lead.otherDescription]);
  if (lead.note) rows.push(['Their note', lead.note]);
  rows.push(...sourceRows(lead.source || {}));
  const cells = rows
    .map(([k, v]) => `<tr>
        <td style="padding:10px 16px 10px 0;color:#64748b;font-size:14px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #eef2f0;">${escapeHtml(k)}</td>
        <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:600;border-bottom:1px solid #eef2f0;">${escapeHtml(v)}</td>
      </tr>`)
    .join('');
  const body = `
      <h1 style="margin:0 0 4px;font-size:19px;font-weight:700;color:#1b4332;">New lead: ${escapeHtml(lead.businessName)}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;">The page promised ${escapeHtml(lead.name)} a personal reply by end of the next business day. Hit reply to answer them directly.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">${cells}</table>`;
  const channel = Object.keys(lead.source || {}).length ? ` · ${describeChannel(lead.source)}` : '';
  return emailShell({ preheader: `${lead.role} · ${lead.businessName}${channel}`, bodyHtml: body });
}

// The prospect's confirmation reads as a personal note from Chris (the page
// promises "Chris reads every one"), not a branded team blast. Plain layout,
// one link, replies land in his inbox.
const ROLE_LINES = {
  Retailer: "Your free review looks at your last 90 days and shows, in dollars, what your vendors owe you and where your AP is leaking. If we take it on, the credits pay for it, or we refund the difference.",
  Vendor: "Your free review looks at what your stores owe you and how long they take to pay. If we take it on, we collect more than we cost, or we refund the difference.",
  Other: "",
};

function autoReplyParts(firstName, role, businessName) {
  const hi = firstName ? `Hi ${firstName},` : 'Hi there,';
  const lines = [
    hi,
    `Thanks for reaching out about ${businessName}. I read every one of these myself, and I'll email you within one business day with the one thing I need to run your numbers.`,
    ROLE_LINES[role] || '',
    "If there's anything you want me to know before then, just reply here.",
  ].filter(Boolean);
  return { lines, signoff: ['Chris Mitchem', 'Founder, ShelfSpace', 'shelfspace.pro'] };
}

function autoReplyText(firstName, role, businessName) {
  const { lines, signoff } = autoReplyParts(firstName, role, businessName);
  return lines.join('\n\n') + '\n\n' + signoff.join('\n');
}

function autoReplyHtml(firstName, role, businessName) {
  const { lines, signoff } = autoReplyParts(firstName, role, businessName);
  const paras = lines
    .map(l => `<p style="margin:0 0 16px;">${escapeHtml(l)}</p>`)
    .join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShelfSpace</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;padding:24px 20px;font-family:${FONT};font-size:15px;line-height:1.6;color:#1e293b;">
    ${paras}
    <p style="margin:24px 0 0;">${escapeHtml(signoff[0])}<br><span style="color:#64748b;">${escapeHtml(signoff[1])}</span><br><a href="https://shelfspace.pro" style="color:#2d6a4f;">shelfspace.pro</a></p>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Origin gate
  const origin = req.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 2. Per-IP rate limiting (burst first, then daily)
  const ip = getClientIp(req);
  if (burstLimiter) {
    const burst = await burstLimiter.limit(ip);
    if (!burst.success) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: "You're sending this too quickly. Try again in a minute." });
    }
  }
  if (dailyLimiter) {
    const daily = await dailyLimiter.limit(ip);
    if (!daily.success) {
      return res.status(429).json({ error: "You've reached today's limit. Email support@shelfspace.pro and we'll take it from there." });
    }
  }

  // 3. Body-shape validation (server re-validates every conditional)
  const body = req.body || {};
  const name = str(body.name);
  const email = str(body.email);
  const businessName = str(body.businessName);
  const role = str(body.role);
  const shops = str(body.shops);
  const state = str(body.state).toUpperCase();
  const otherDescription = str(body.otherDescription);
  const note = str(body.note).slice(0, MAX_NOTE);
  const token = str(body['cf-turnstile-response']);

  // Bot traps: a filled honeypot or an instant submit gets a quiet 200 and
  // no email — the bot learns nothing, Chris's inbox stays clean.
  const elapsedMs = Number(body.elapsedMs);
  if (str(body.website) || (Number.isFinite(elapsedMs) && elapsedMs < MIN_FILL_MS)) {
    console.log('interest_trap ' + JSON.stringify({ honeypot: !!str(body.website), elapsedMs }));
    return res.status(200).json({ ok: true });
  }

  if (!name || name.length > MAX_NAME) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!businessName || businessName.length > MAX_BUSINESS) {
    return res.status(400).json({ error: 'Please enter your business name.' });
  }
  if (!ROLES.has(role)) {
    return res.status(400).json({ error: 'Please tell us whether you\'re a retailer, vendor, or something else.' });
  }
  // Store count and state are optional now (fewer fields, more leads);
  // validate them only when sent.
  if (shops && !SHOP_RANGES.has(shops)) {
    return res.status(400).json({ error: 'Please pick how many stores you run.' });
  }
  if (state && !STATE_CODES.has(state)) {
    return res.status(400).json({ error: 'Please pick a valid state.' });
  }
  if (role === 'Other') {
    if (!otherDescription || otherDescription.length > MAX_OTHER) {
      return res.status(400).json({ error: 'Please tell us a bit about what you do.' });
    }
  }

  // 4. Bot verification (fails closed once the secret is provisioned)
  const human = await verifyTurnstile(token, ip);
  if (!human) {
    return res.status(403).json({ error: 'Verification failed. Please refresh and try again.' });
  }

  // 5. Build the lead + send. Notify Chris FIRST — that send must not be lost.
  const source = sanitizeSource(body.source);
  const lead = {
    name, email, businessName, role,
    shops: role === 'Retailer' ? shops : '',
    state: role === 'Retailer' || role === 'Vendor' ? state : '',
    otherDescription: role === 'Other' ? otherDescription : '',
    note,
    source,
  };
  const firstName = name.split(/\s+/)[0];

  try {
    await sendEmail({
      from: 'ShelfSpace Leads <noreply@shelfspace.pro>',
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: cleanSubject(`New lead: ${businessName} — ${ROLE_LABEL[role]}${role === 'Retailer' && shops ? ` (${shops} stores)` : ''}`),
      html: notificationHtml(lead),
    });
  } catch (err) {
    console.error('Interest form: notification email failed:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please email support@shelfspace.pro directly.' });
  }

  // Structured line so leads can be aggregated by channel from the Vercel logs
  // without standing up a CRM. One line per captured lead, JSON after the tag.
  console.log('interest_lead ' + JSON.stringify({
    role, state, shops, businessName, hasNote: !!note,
    channel: describeChannel(source),
    landing: source.landing || '',
    referrer: source.firstReferrer || source.referrer || '',
    utmSource: source.utmSource || '',
    utmCampaign: source.utmCampaign || '',
  }));

  // Auto-response to the prospect. Failure here shouldn't lose the lead.
  try {
    await sendEmail({
      from: 'Chris Mitchem <chris@shelfspace.pro>',
      to: email,
      replyTo: 'chris@shelfspace.pro',
      subject: `Got it, ${cleanSubject(firstName || 'thanks')} — here's what happens next`,
      html: autoReplyHtml(firstName, role, businessName),
      text: autoReplyText(firstName, role, businessName),
    });
  } catch (err) {
    console.error('Interest form: auto-response email failed (lead still captured):', err);
  }

  return res.status(200).json({ ok: true });
}
