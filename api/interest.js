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
async function sendEmail({ from, to, replyTo, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, html }),
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
          <p style="margin:0 0 14px;font-size:13px;color:#95d5b2;font-style:italic;">Every Vendor. Every Payment. One Engine.</p>
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
  if (lead.role === 'Retailer') {
    rows.push(['Number of shops', lead.shops]);
    rows.push(['State', lead.state]);
  } else if (lead.role === 'Vendor') {
    rows.push(['State', lead.state]);
  } else if (lead.role === 'Other') {
    rows.push(['What they do', lead.otherDescription]);
  }
  const cells = rows
    .map(([k, v]) => `<tr>
        <td style="padding:10px 16px 10px 0;color:#64748b;font-size:14px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #eef2f0;">${escapeHtml(k)}</td>
        <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:600;border-bottom:1px solid #eef2f0;">${escapeHtml(v)}</td>
      </tr>`)
    .join('');
  const body = `
      <h1 style="margin:0 0 4px;font-size:19px;font-weight:700;color:#1b4332;">New interest form submission</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Reply to this email to respond to ${escapeHtml(lead.name)} directly.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">${cells}</table>`;
  return emailShell({ preheader: `${lead.role} · ${lead.businessName}`, bodyHtml: body });
}

function autoReplyHtml(firstName) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,';
  const body = `
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Thanks for reaching out to ShelfSpace. We've got your details and someone from our team will be in touch, usually within a business day.</p>
      <p style="margin:0 0 24px;">If it's easier, just reply straight to this email and we'll pick it up.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr>
        <td bgcolor="#1b4332" style="border-radius:10px;background:#1b4332;"><a href="https://shelfspace.pro/how-it-works" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">See how ShelfSpace works &rarr;</a></td>
      </tr></table>
      <p style="margin:0;font-weight:700;color:#1b4332;">&mdash; The ShelfSpace Team</p>`;
  return emailShell({ preheader: "We've got your details — we'll be in touch within a business day.", bodyHtml: body });
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
      return res.status(429).json({ error: "You've reached today's limit. Email chris@shelfspace.pro and I'll take it from there." });
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
  const token = str(body['cf-turnstile-response']);

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
  if (role === 'Retailer') {
    if (!SHOP_RANGES.has(shops)) {
      return res.status(400).json({ error: 'Please select how many shops you run.' });
    }
    if (!STATE_CODES.has(state)) {
      return res.status(400).json({ error: 'Please select your state.' });
    }
  } else if (role === 'Vendor') {
    if (!STATE_CODES.has(state)) {
      return res.status(400).json({ error: 'Please select your state.' });
    }
  } else if (role === 'Other') {
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
  const lead = {
    name, email, businessName, role,
    shops: role === 'Retailer' ? shops : '',
    state: role === 'Retailer' || role === 'Vendor' ? state : '',
    otherDescription: role === 'Other' ? otherDescription : '',
  };
  const firstName = name.split(/\s+/)[0];

  try {
    await sendEmail({
      from: 'ShelfSpace Leads <noreply@shelfspace.pro>',
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: cleanSubject(`New interest form: ${name} — ${role}`),
      html: notificationHtml(lead),
    });
  } catch (err) {
    console.error('Interest form: notification email failed:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please email chris@shelfspace.pro directly.' });
  }

  // Auto-response to the prospect. Failure here shouldn't lose the lead.
  try {
    await sendEmail({
      from: 'ShelfSpace <chris@shelfspace.pro>',
      to: email,
      replyTo: 'chris@shelfspace.pro',
      subject: 'Thanks for reaching out to ShelfSpace',
      html: autoReplyHtml(firstName),
    });
  } catch (err) {
    console.error('Interest form: auto-response email failed (lead still captured):', err);
  }

  return res.status(200).json({ ok: true });
}
