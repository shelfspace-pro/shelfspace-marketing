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
        <td style="padding:8px 16px 8px 0;color:#64748b;font-size:14px;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td>
        <td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${escapeHtml(v)}</td>
      </tr>`)
    .join('');
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#1b4332;font-size:20px;margin:0 0 4px;">New interest form submission</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Reply to this email to respond to ${escapeHtml(lead.name)} directly.</p>
      <table style="border-collapse:collapse;width:100%;">${cells}</table>
    </div>`;
}

function autoReplyHtml(firstName) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,';
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;color:#334155;font-size:15px;line-height:1.65;">
      <p style="margin:0 0 16px;">${greeting}</p>
      <p style="margin:0 0 16px;">Thanks for reaching out to ShelfSpace. I've got your details and I'll be in touch personally, usually within a business day.</p>
      <p style="margin:0 0 16px;">If it's easier, just reply straight to this email &mdash; it comes right to me.</p>
      <p style="margin:0 0 4px;">Talk soon,</p>
      <p style="margin:0;font-weight:600;color:#1b4332;">Chris Mitchem</p>
      <p style="margin:0;color:#64748b;font-size:14px;">Founder, ShelfSpace</p>
    </div>`;
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
      from: 'Chris Mitchem <chris@shelfspace.pro>',
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
