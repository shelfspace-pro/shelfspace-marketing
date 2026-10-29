// One-shot sitewide head edit (SEO row A4): Vercel Speed Insights tag + defer on shelfiq-widget.js.
// Idempotent. Generated tutorials already carry both via build-tutorials.mjs; this covers the hand-kept ones.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
export const SI_TAG = `<script>window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};</script>\n<script defer src="/_vercel/speed-insights/script.js"></script>\n`;
const files = execFileSync("git", ["ls-files", "*.html"], { encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !/^(email|_pdf-source|og-templates|node_modules)\//.test(f) && !/^google[0-9a-f]+\.html$/.test(f));
let n = 0;
for (const f of files) {
  let h = readFileSync(f, "utf8"); const o = h;
  if (!h.includes("/_vercel/speed-insights/script.js") && h.includes("</head>")) h = h.replace(/(<style id="cta-micro-css">[^<]*<\/style>\n)?<\/head>/, (m, micro) => SI_TAG + (micro || "") + "</head>"); // cta-sweep keeps its style last before </head>
  h = h.replace('<script src="/shelfiq-widget.js"></script>', '<script defer src="/shelfiq-widget.js"></script>');
  if (h !== o) { writeFileSync(f, h); n++; }
}
console.log(`apply-head: ${n} files changed`);
