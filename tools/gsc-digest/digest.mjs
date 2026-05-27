// Weekly Google Search Console digest.
//
// Pulls the last full 7-day window from the Search Analytics API, compares it
// to the prior 7 days, and emails a readable HTML summary via Gmail SMTP.
//
// Only external dependency is the Search Console API itself (the same data
// source you already use in the GSC web UI). Auth is a Google Cloud service
// account that you add as a user on the GSC property. Email goes through your
// own Gmail with an app password — no third-party email service.
//
// Required env (see README.md):
//   GCP_SA_KEY           service account JSON, as a single string
//   GMAIL_USER           the gmail address sending the digest
//   GMAIL_APP_PASSWORD   16-char Gmail app password (spaces stripped)
//   DIGEST_TO            recipient(s), comma-separated (defaults to GMAIL_USER)
// Optional env:
//   GSC_SITE_URL         property string (default 'https://shelfspace.pro/';
//                        use 'sc-domain:shelfspace.pro' for a Domain property)
//   GSC_LAG_DAYS         how many days back the window ends, to clear the GSC
//                        reporting lag (default 3)

import { JWT } from 'google-auth-library';
import nodemailer from 'nodemailer';

const SITE_URL = process.env.GSC_SITE_URL || 'https://shelfspace.pro/';
const LAG_DAYS = Number(process.env.GSC_LAG_DAYS || 3);
const BRAND = '#1b4332';

// ---- date helpers (UTC) ----------------------------------------------------
const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date(Date.now());

const curEnd = new Date(today.getTime() - LAG_DAYS * DAY);
const curStart = new Date(curEnd.getTime() - 6 * DAY);
const prevEnd = new Date(curStart.getTime() - 1 * DAY);
const prevStart = new Date(prevEnd.getTime() - 6 * DAY);

const CUR = { startDate: iso(curStart), endDate: iso(curEnd) };
const PREV = { startDate: iso(prevStart), endDate: iso(prevEnd) };

// ---- auth + API ------------------------------------------------------------
function authClient() {
  const raw = process.env.GCP_SA_KEY;
  if (!raw) throw new Error('GCP_SA_KEY is not set');
  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error('GCP_SA_KEY is not valid JSON — paste the full service account key file contents');
  }
  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

async function query(client, body) {
  const { token } = await client.getAccessToken();
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      throw new Error(
        `403 from Search Console for "${SITE_URL}". The service account email is probably not added as a ` +
        `user on this GSC property, or GSC_SITE_URL doesn't match a property exactly. Details: ${text}`
      );
    }
    throw new Error(`Search Console API ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.rows || [];
}

// ---- formatting ------------------------------------------------------------
const nf = new Intl.NumberFormat('en-US');
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const pos = (n) => n.toFixed(1);

function delta(cur, prev, { invert = false } = {}) {
  // invert=true means "down is good" (used for avg position)
  if (prev === 0 && cur === 0) return { txt: '—', color: '#94a3b8' };
  if (prev === 0) return { txt: 'new', color: BRAND };
  const change = (cur - prev) / prev;
  const up = cur >= prev;
  const good = invert ? !up : up;
  const arrow = up ? '▲' : '▼';
  const color = good ? '#1b7a45' : '#b91c1c';
  return { txt: `${arrow} ${pct(Math.abs(change))}`, color };
}

function sum(rows, key) {
  return rows.reduce((a, r) => a + (r[key] || 0), 0);
}

function totalsBlock(cur, prev) {
  const cClicks = sum(cur, 'clicks');
  const pClicks = sum(prev, 'clicks');
  const cImpr = sum(cur, 'impressions');
  const pImpr = sum(prev, 'impressions');
  const cCtr = cImpr ? cClicks / cImpr : 0;
  const pCtr = pImpr ? pClicks / pImpr : 0;
  // position is impression-weighted average
  const cPos = cImpr ? sum(cur, '_posWeighted') / cImpr : 0;
  const pPos = pImpr ? sum(prev, '_posWeighted') / pImpr : 0;

  const cells = [
    ['Clicks', nf.format(cClicks), delta(cClicks, pClicks)],
    ['Impressions', nf.format(cImpr), delta(cImpr, pImpr)],
    ['CTR', pct(cCtr), delta(cCtr, pCtr)],
    ['Avg. position', pos(cPos), delta(cPos, pPos, { invert: true })],
  ];

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
    <tr>${cells.map(([label, val, d]) => `
      <td style="width:25%;padding:16px 12px;background:#f0faf4;border:1px solid #d7efe2;text-align:center;vertical-align:top">
        <div style="font:600 11px/1.4 'Helvetica Neue',Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#5b8a72">${label}</div>
        <div style="font:700 26px/1.2 'Helvetica Neue',Arial,sans-serif;color:#1b4332;margin:6px 0 2px">${val}</div>
        <div style="font:600 12px/1.4 'Helvetica Neue',Arial,sans-serif;color:${d.color}">${d.txt}</div>
      </td>`).join('')}</tr>
  </table>`;
}

function rowsTable(title, rows, labelHead, { showPos = true } = {}) {
  if (!rows.length) {
    return `<h2 style="font:700 16px/1.3 'Helvetica Neue',Arial,sans-serif;color:#1b4332;margin:28px 0 10px">${title}</h2>
      <p style="font:400 14px/1.6 'Helvetica Neue',Arial,sans-serif;color:#64748b;margin:0 0 8px">No data for this window.</p>`;
  }
  const head = `<tr style="background:#1b4332;color:#fff">
    <th style="text-align:left;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">${labelHead}</th>
    <th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Clicks</th>
    <th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Impr.</th>
    <th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">CTR</th>
    ${showPos ? `<th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Pos.</th>` : ''}
  </tr>`;
  const body = rows.map((r, i) => `<tr style="background:${i % 2 ? '#f7fcf9' : '#fff'}">
    <td style="padding:8px 10px;font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#1f2937;word-break:break-word">${r.label}</td>
    <td style="padding:8px 10px;text-align:right;font:600 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#1b4332">${nf.format(r.clicks)}</td>
    <td style="padding:8px 10px;text-align:right;font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#64748b">${nf.format(r.impressions)}</td>
    <td style="padding:8px 10px;text-align:right;font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#64748b">${pct(r.impressions ? r.clicks / r.impressions : 0)}</td>
    ${showPos ? `<td style="padding:8px 10px;text-align:right;font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#64748b">${pos(r.position)}</td>` : ''}
  </tr>`).join('');
  return `<h2 style="font:700 16px/1.3 'Helvetica Neue',Arial,sans-serif;color:#1b4332;margin:28px 0 10px">${title}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0">${head}${body}</table>`;
}

function moversTable(rows) {
  if (!rows.length) {
    return '';
  }
  const body = rows.map((r, i) => `<tr style="background:${i % 2 ? '#f7fcf9' : '#fff'}">
    <td style="padding:8px 10px;font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#1f2937;word-break:break-word">${r.label}</td>
    <td style="padding:8px 10px;text-align:right;font:600 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#1b4332">${nf.format(r.clicks)}</td>
    <td style="padding:8px 10px;text-align:right;font:600 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:${r.diff >= 0 ? '#1b7a45' : '#b91c1c'}">${r.diff >= 0 ? '+' : ''}${nf.format(r.diff)}</td>
  </tr>`).join('');
  return `<h2 style="font:700 16px/1.3 'Helvetica Neue',Arial,sans-serif;color:#1b4332;margin:28px 0 10px">Biggest movers (clicks, week over week)</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0">
      <tr style="background:#1b4332;color:#fff">
        <th style="text-align:left;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Page</th>
        <th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Clicks</th>
        <th style="text-align:right;padding:8px 10px;font:600 12px/1.3 'Helvetica Neue',Arial,sans-serif">Δ vs prior wk</th>
      </tr>${body}</table>`;
}

function shortenUrl(u) {
  try {
    const url = new URL(u);
    return (url.pathname + url.search) || '/';
  } catch {
    return u;
  }
}

// ---- main ------------------------------------------------------------------
async function main() {
  const client = authClient();

  // Pull rows by page for both windows (rowLimit high enough to catch movers).
  const [curPages, prevPages, curQueries] = await Promise.all([
    query(client, { ...CUR, dimensions: ['page'], rowLimit: 500 }),
    query(client, { ...PREV, dimensions: ['page'], rowLimit: 500 }),
    query(client, { ...CUR, dimensions: ['query'], rowLimit: 15 }),
  ]);

  // Attach impression-weighted position for accurate aggregate avg position.
  const weight = (r) => ({ ...r, _posWeighted: (r.position || 0) * (r.impressions || 0) });
  const curW = curPages.map(weight);
  const prevW = prevPages.map(weight);

  // Top pages this week.
  const topPages = [...curPages]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12)
    .map((r) => ({ label: shortenUrl(r.keys[0]), clicks: r.clicks, impressions: r.impressions, position: r.position }));

  // Movers: join on page key.
  const prevByPage = new Map(prevPages.map((r) => [r.keys[0], r.clicks]));
  const curByPage = new Map(curPages.map((r) => [r.keys[0], r.clicks]));
  const allPages = new Set([...prevByPage.keys(), ...curByPage.keys()]);
  const movers = [...allPages]
    .map((p) => {
      const c = curByPage.get(p) || 0;
      const pr = prevByPage.get(p) || 0;
      return { label: shortenUrl(p), clicks: c, diff: c - pr };
    })
    .filter((m) => m.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 8);

  const topQueries = curQueries
    .map((r) => ({ label: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position }));

  const range = `${CUR.startDate} → ${CUR.endDate}`;
  const totalClicks = nf.format(sum(curPages, 'clicks'));

  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;padding:24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #e2e8f0">
        <tr><td style="background:#1b4332;padding:24px 28px">
          <div style="font:700 18px/1.2 'Helvetica Neue',Arial,sans-serif;color:#fff">ShelfSpace · Search performance</div>
          <div style="font:400 13px/1.4 'Helvetica Neue',Arial,sans-serif;color:#95d5b2;margin-top:4px">${range} &nbsp;·&nbsp; ${SITE_URL}</div>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <p style="font:400 14px/1.6 'Helvetica Neue',Arial,sans-serif;color:#334155;margin:0 0 20px">
            ${totalClicks} clicks from search this week. Compared against the prior 7 days (${PREV.startDate} → ${PREV.endDate}).
          </p>
          ${totalsBlock(curW, prevW)}
          ${rowsTable('Top pages', topPages, 'Page')}
          ${moversTable(movers)}
          ${rowsTable('Top queries', topQueries, 'Query')}
          <p style="font:400 12px/1.6 'Helvetica Neue',Arial,sans-serif;color:#94a3b8;margin:28px 0 0;border-top:1px solid #e2e8f0;padding-top:16px">
            Generated automatically from the Google Search Console API. Data lags ~${LAG_DAYS} days, which is why the window ends ${CUR.endDate}.
            Edit the schedule or contents in <code style="font-family:'SFMono-Regular',Menlo,monospace">tools/gsc-digest/</code>.
          </p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const to = process.env.DIGEST_TO || process.env.GMAIL_USER;
  const subject = `ShelfSpace search digest — ${totalClicks} clicks, ${range}`;

  if (process.env.DRY_RUN) {
    console.log('DRY_RUN — not sending. Subject:', subject);
    console.log(html);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
    },
  });
  await transporter.sendMail({
    from: `ShelfSpace Digest <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`Sent digest to ${to} — ${subject}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
