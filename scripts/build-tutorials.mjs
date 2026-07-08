#!/usr/bin/env node
// Generate the ShelfSpace tutorials hub + per-video pages from video-catalog.json
// (platform training-video program v2, spec 1.2 + 1.3).
//
//   /tutorials.html            card grid grouped by series (the legitimacy page:
//                              "this platform is documented, taught, real")
//   /tutorials/<slug>.html     per-video page: embed + VideoObject JSON-LD +
//                              full transcript + "open this screen in ShelfSpace"
//
// Self-contained: reads ONLY video-catalog.json (which carries pre-rendered
// JSON-LD). Run after regenerating the catalog. Vercel auto-deploys on push.
//
//   node scripts/build-tutorials.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(ROOT, "video-catalog.json"), "utf8"));
const videos = catalog.videos.filter((v) => v.privacy === "public");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Which in-app screen each video opens (login-gated; ourshelf.space is the app).
const APP_SCREEN = {
  deliveryDashboard: "/retailer/deliveries",
  createDelivery: "/retailer/deliveries",
  receiveDelivery: "/retailer/deliveries",
  approveDelivery: "/retailer/deliveries",
  troubleshootMetrc: "/retailer/deliveries",
  troubleshootDuplicates: "/retailer/deliveries",
};
const appUrl = (topic) => `https://ourshelf.space${APP_SCREEN[topic] || ""}`;

// ── shared chrome (copied verbatim from the site's top-level pages) ───────────
const NAV = `<nav id="nav">
  <a href="/" class="nav-logo">
    <div class="nav-logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/><polyline points="5,7 12,3 19,7"/><polyline points="3,13 5,7 7,13"/><polyline points="17,13 19,7 21,13"/><path d="M3 13a2 2 0 0 0 4 0"/><path d="M17 13a2 2 0 0 0 4 0"/></svg></div>
    <span class="nav-logo-text">ShelfSpace</span>
  </a>
  <ul class="nav-links">
    <li><a href="/accounts-payable">Accounts Payable</a></li>
    <li><a href="/consignment">Consignment</a></li>
    <li><a href="/credit-recovery">Credit Recovery</a></li>
    <li class="nav-dropdown"><button class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Platform <svg class="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button><div class="nav-dropdown-menu"><a href="/vendor-management">Vendor Management</a><a href="/how-it-works">How It Works</a><a href="/features">Features</a><a href="/shelfiq">ShelfiQ</a><a href="/checks">Check Payments</a><a href="/tutorials">Tutorials</a></div></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/about">About</a></li>
    <li class="nav-login-mobile"><a href="https://ourshelf.space/login">Login</a></li>
    <li><a href="/contact" class="nav-cta">Get Started <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a></li>
  </ul>
  <div class="nav-hamburger" onclick="document.querySelector('.nav-links').classList.toggle('mobile-open'); event.stopPropagation();"><span></span><span></span><span></span></div>
</nav>`;

const FOOTER = `<footer>
  <div class="footer-top">
    <div class="footer-brand">
      <a href="/" class="nav-logo"><div class="nav-logo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/><polyline points="5,7 12,3 19,7"/><polyline points="3,13 5,7 7,13"/><polyline points="17,13 19,7 21,13"/><path d="M3 13a2 2 0 0 0 4 0"/><path d="M17 13a2 2 0 0 0 4 0"/></svg></div><span class="nav-logo-text">ShelfSpace</span></a>
      <p>Every Vendor. Every Payment. One Engine.</p>
    </div>
    <div class="footer-col"><h3>Services</h3><ul><li><a href="/accounts-payable">Accounts Payable</a></li><li><a href="/consignment">Consignment</a></li><li><a href="/credit-recovery">Credit Recovery</a></li><li><a href="/checks">Check Payments</a></li><li><a href="/shelfiq">ShelfiQ</a></li></ul></div>
    <div class="footer-col"><h3>Platform</h3><ul><li><a href="/features">Features</a></li><li><a href="/how-it-works">How It Works</a></li><li><a href="/pricing">Pricing</a></li><li><a href="/about">About</a></li><li><a href="/blog">Blog</a></li><li><a href="/docs">Docs</a></li><li><a href="/tutorials">Tutorials</a></li></ul></div>
    <div class="footer-col"><h3>Access</h3><ul><li><a href="https://ourshelf.space/login">Login</a></li><li><a href="/contact">Sign Up</a></li><li><a href="/contact">Contact</a></li><li><a href="/vendors">For Vendors</a></li><li><a href="/for-bookkeepers">For Bookkeepers</a></li></ul></div>
    <div class="footer-col"><h3>Company</h3><ul><li><a href="mailto:support@shelfspace.pro">Email</a></li><li><a href="mailto:support@shelfspace.pro">Support</a></li><li><a href="https://linkedin.com/company/shelfspace-pro" target="_blank" rel="noopener" class="footer-social-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</a></li></ul></div>
  </div>
  <div class="footer-bottom"><p>&copy; 2026 ShelfSpace Technologies Inc.</p><div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-top:12px;"><img src="/metrc-logo.png" alt="Metrc" style="height:18px;opacity:0.4;filter:brightness(0) invert(1);"><span style="font-size:11px;color:rgba(255,255,255,0.35);">Certified Metrc Third-Party Vendor</span></div><div class="footer-bottom-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
</footer>`;

const REVEAL_SCRIPT = `<script>
(function(){
  var nav=document.getElementById('nav');
  var pageHero=document.querySelector('.page-hero');
  requestAnimationFrame(function(){ nav.classList.toggle('scrolled',window.scrollY>20); if(pageHero)pageHero.classList.add('hero-loaded'); });
  window.addEventListener('scroll',function(){ nav.classList.toggle('scrolled',window.scrollY>20); },{passive:true});
  var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');ro.unobserve(e.target);}})},{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(function(el){ro.observe(el);});
})();
</script>
<script src="/shelfiq-widget.js"></script>`;

const HERO_STYLE = `
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
  .page-hero { padding-bottom: 40px; }
  .hero-bg-gradient { position: absolute; top: -30%; right: -20%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(149,213,178,0.18) 0%, rgba(149,213,178,0) 70%); animation: float 8s ease-in-out infinite; pointer-events: none; }
  .hero-bg-gradient-2 { position: absolute; bottom: -20%; left: -15%; width: 550px; height: 550px; background: radial-gradient(circle, rgba(27,67,50,0.06) 0%, rgba(27,67,50,0) 70%); animation: float 10s ease-in-out infinite; animation-delay: -3s; pointer-events: none; }
  .page-hero .section-label, .page-hero .section-title, .page-hero .section-desc { opacity: 0; transform: translateY(30px); }
  .page-hero .section-label { transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1); }
  .page-hero .section-title { transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s; }
  .page-hero .section-desc { transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s; }
  .page-hero.hero-loaded .section-label, .page-hero.hero-loaded .section-title, .page-hero.hero-loaded .section-desc { opacity: 1; transform: translateY(0); }
  .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1); }
  .reveal.is-visible { opacity: 1; transform: translateY(0); }`;

const TUT_STYLE = `
  .tut-wrap { background: var(--white); padding: 64px 0 96px; }
  .tut-series { max-width: 1180px; margin: 0 auto 56px; padding: 0 32px; }
  .tut-series-head { margin-bottom: 24px; }
  .tut-series-head h2 { font-size: 1.5rem; color: var(--green-deep); margin: 0 0 4px; }
  .tut-series-head p { color: var(--green-mid); font-size: 0.95rem; margin: 0; }
  .tut-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px; }
  .tut-card { display: flex; flex-direction: column; background: var(--white); border: 1px solid var(--green-light); border-radius: 16px; overflow: hidden; text-decoration: none; box-shadow: 0 10px 30px -18px rgba(27,67,50,0.35); transition: transform .25s ease, box-shadow .25s ease; }
  .tut-card:hover { transform: translateY(-4px); box-shadow: 0 22px 44px -20px rgba(27,67,50,0.45); }
  .tut-thumb { position: relative; aspect-ratio: 16/9; background: var(--green-ghost); overflow: hidden; }
  .tut-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tut-badge { position: absolute; top: 10px; left: 10px; background: rgba(27,67,50,0.92); color: #fff; font-size: 11px; font-weight: 600; letter-spacing: .04em; padding: 4px 9px; border-radius: 999px; }
  .tut-len { position: absolute; bottom: 10px; right: 10px; background: rgba(8,28,17,0.82); color: #fff; font-family: var(--font-mono); font-size: 12px; padding: 3px 8px; border-radius: 7px; }
  .tut-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .25s ease; }
  .tut-card:hover .tut-play { opacity: 1; }
  .tut-play span { width: 58px; height: 58px; border-radius: 50%; background: rgba(255,255,255,0.92); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(27,67,50,0.4); }
  .tut-body { padding: 18px 20px 22px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .tut-body h3 { font-size: 1.12rem; color: var(--green-deep); margin: 0; line-height: 1.3; }
  .tut-body p { font-size: 0.92rem; color: #52616b; margin: 0; line-height: 1.5; flex: 1; }
  .tut-cta { color: var(--green-mid); font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; }
  /* per-video page */
  .tut-video-wrap { background: var(--white); padding: 40px 0 96px; }
  .tut-video-inner { max-width: 860px; margin: 0 auto; padding: 0 24px; }
  .tut-crumbs { font-size: 0.85rem; color: var(--green-mid); margin-bottom: 18px; }
  .tut-crumbs a { color: var(--green-mid); text-decoration: none; }
  .tut-crumbs a:hover { text-decoration: underline; }
  .tut-embed { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 46px -20px rgba(27,67,50,0.4); margin-bottom: 24px; }
  .tut-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .tut-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
  .tut-actions a { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 12px; font-weight: 600; font-size: 0.92rem; text-decoration: none; }
  .tut-actions .primary { background: var(--green-deep); color: #fff; }
  .tut-actions .secondary { background: var(--green-ghost); color: var(--green-deep); border: 1px solid var(--green-light); }
  .tut-chapters { margin: 0 0 28px; }
  .tut-chapters h2, .tut-transcript-wrap summary { font-size: 1.15rem; color: var(--green-deep); }
  .tut-chapters ol { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 6px; }
  .tut-chapters li { display: flex; gap: 12px; font-size: 0.95rem; color: #334; }
  .tut-chapters .at { font-family: var(--font-mono); color: var(--green-mid); min-width: 46px; }
  .tut-transcript-wrap { border-top: 1px solid var(--green-light); padding-top: 20px; }
  .tut-transcript-wrap summary { cursor: pointer; font-weight: 600; }
  .tut-transcript { margin-top: 16px; color: #3d4a52; line-height: 1.7; }
  .tut-transcript p { margin: 0 0 12px; }
  @media (max-width: 640px) { .tut-actions { flex-direction: column; } .tut-actions a { justify-content: center; } }`;

function head(title, desc, canonical, extraStyle = "", extraHead = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://shelfspace.pro/og-image-v7.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-mobile-web-app-title" content="ShelfSpace">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<style>${HERO_STYLE}${TUT_STYLE}${extraStyle}</style>
${extraHead}</head>
<body>
${NAV}`;
}

const PLAY_SVG = `<span><svg width="24" height="24" viewBox="0 0 24 24" fill="var(--green-deep)"><path d="M8 5v14l11-7z"/></svg></span>`;

function card(v) {
  return `    <a class="tut-card reveal" href="/tutorials/${v.slug}">
      <div class="tut-thumb">
        <img src="${v.thumbHq}" alt="${esc(v.title)} — video thumbnail" loading="lazy" width="480" height="270">
        <span class="tut-badge">Episode ${v.episode}</span>
        ${v.durationLabel ? `<span class="tut-len">${v.durationLabel}</span>` : ""}
        <span class="tut-play">${PLAY_SVG}</span>
      </div>
      <div class="tut-body">
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.blurb)}</p>
        <span class="tut-cta">Watch + transcript <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></span>
      </div>
    </a>`;
}

function buildHub() {
  const bySeries = new Map();
  for (const v of videos) {
    if (!bySeries.has(v.series)) bySeries.set(v.series, []);
    bySeries.get(v.series).push(v);
  }
  const seriesBlocks = [...bySeries.entries()].map(([series, vids]) => {
    vids.sort((a, b) => a.episode - b.episode);
    return `  <section class="tut-series">
    <div class="tut-series-head">
      <h2>${esc(series)}</h2>
      <p>${vids.length} video${vids.length === 1 ? "" : "s"} — a step-by-step walkthrough of the ShelfSpace delivery workflow.</p>
    </div>
    <div class="tut-grid">
${vids.map(card).join("\n")}
    </div>
  </section>`;
  }).join("\n\n");

  return head(
    "ShelfSpace Tutorials — Cannabis Dispensary Software Video Guides",
    "Step-by-step video tutorials for ShelfSpace — cannabis delivery tracking, invoice verification against Metrc, vendor payments, and credit recovery. Every video with a full transcript.",
    "https://shelfspace.pro/tutorials",
  ) + `
<div class="page-hero">
  <div class="hero-bg-gradient"></div>
  <div class="hero-bg-gradient-2"></div>
  <div class="section-label">Tutorials</div>
  <h1 class="section-title">Learn ShelfSpace, one video at a time</h1>
  <p class="section-desc">Short, focused walkthroughs of the platform — recorded in a live sandbox, narrated start to finish, each with a full transcript. Everything you need to run ShelfSpace without picking up the phone.</p>
</div>

<div class="tut-wrap">
${seriesBlocks}
</div>

${FOOTER}
${REVEAL_SCRIPT}
</body>
</html>`;
}

function buildVideoPage(v) {
  const related = videos.filter((x) => x.series === v.series && x.slug !== v.slug)
    .sort((a, b) => a.episode - b.episode);
  const chapters = Array.isArray(v.chapters) ? v.chapters : [];
  const chaptersHtml = chapters.length >= 2 ? `
    <div class="tut-chapters">
      <h2>Chapters</h2>
      <ol>
${chapters.map((c) => `        <li><span class="at">${esc(c.at)}</span><span>${esc(c.title)}</span></li>`).join("\n")}
      </ol>
    </div>` : "";
  const relatedHtml = related.length ? `
  <section class="tut-series" style="margin-top:16px;">
    <div class="tut-series-head"><h2>More in ${esc(v.series)}</h2></div>
    <div class="tut-grid">
${related.map(card).join("\n")}
    </div>
  </section>` : "";

  return head(
    `${v.title} — ShelfSpace Tutorial`,
    v.blurb || v.description,
    `https://shelfspace.pro/tutorials/${v.slug}`,
    "",
    // The VideoObject JSON-LD lives in <head> so Google associates it with the page.
    v.jsonld + "\n",
  ) + `
<div class="page-hero" style="padding-bottom:24px;">
  <div class="hero-bg-gradient"></div>
  <div class="section-label">Tutorial · Episode ${v.episode}</div>
  <h1 class="section-title" style="font-size:2.2rem;">${esc(v.title)}</h1>
  <p class="section-desc">${esc(v.subtitle || v.blurb)}</p>
</div>

<div class="tut-video-wrap">
  <div class="tut-video-inner">
    <div class="tut-crumbs"><a href="/tutorials">Tutorials</a> &rsaquo; ${esc(v.series)} &rsaquo; ${esc(v.title)}</div>

    <div class="tut-embed">
      <iframe src="https://www.youtube-nocookie.com/embed/${v.videoId}?rel=0&amp;modestbranding=1" title="${esc(v.title)} — ShelfSpace" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>

    <div class="tut-actions">
      <a class="primary" href="${appUrl(v.helpTopic)}">Open this screen in ShelfSpace <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
      ${v.blogSlug ? `<a class="secondary" href="/blog/${v.blogSlug}">Read the full guide</a>` : ""}
      <a class="secondary" href="https://youtu.be/${v.videoId}">Watch on YouTube</a>
    </div>
${chaptersHtml}
    <div class="tut-transcript-wrap">
      <details>
        <summary>Full transcript</summary>
        <div class="tut-transcript">
${v.transcriptHtml || "<p>Transcript coming soon.</p>"}
        </div>
      </details>
    </div>
  </div>
${relatedHtml}
</div>

${FOOTER}
${REVEAL_SCRIPT}
</body>
</html>`;
}

// ── write ─────────────────────────────────────────────────────────────────────
mkdirSync(join(ROOT, "tutorials"), { recursive: true });
writeFileSync(join(ROOT, "tutorials.html"), buildHub());
console.log(`✅ tutorials.html  (${videos.length} videos, ${new Set(videos.map((v) => v.series)).size} series)`);
for (const v of videos) {
  writeFileSync(join(ROOT, "tutorials", `${v.slug}.html`), buildVideoPage(v));
  console.log(`   tutorials/${v.slug}.html`);
}
