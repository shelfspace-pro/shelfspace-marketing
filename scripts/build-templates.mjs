#!/usr/bin/env node
// Build the four free templates (SEO row C3, 10/29/2026) from scripts/templates/content.mjs:
//   templates/files/<slug>.docx   hand-built OOXML in a store-only zip, fixed timestamps (byte-deterministic)
//   templates/files/<slug>.pdf    the same blocks as a print sheet, printed by Chrome (playwright-core)
//   templates/<slug>.html         the preview between <!-- template-preview:start/end --> markers
//   templates/files/manifest.json source/docx/pdf sha256 per template (check:assets compares them)
//
//   npm run build:templates     (needs Chrome for the PDF: CHROME_PATH, default the macOS install)
//
// No new dependencies. check:assets imports renderPreview/renderDocx/sourceHash from this file and never prints.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TEMPLATES, DISCLAIMER, CREDIT } from "./templates/content.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const FILES_DIR = join(ROOT, "templates", "files");
export const MANIFEST = join(FILES_DIR, "manifest.json");
export const MARK_A = "<!-- template-preview:start -->";
export const MARK_B = "<!-- template-preview:end -->";
const RENDERER_VERSION = "2"; // 2: OOXML child order fixed (w:color before w:sz, w:pBdr before w:spacing)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** Refuse a template without exactly one disclaimer block, placed last. */
export function validate(t) {
  const discs = t.blocks.filter((b) => b.t === "disc").length;
  if (discs !== 1 || t.blocks[t.blocks.length - 1].t !== "disc") throw new Error(`build-templates: ${t.slug} needs exactly one disclaimer block, last`);
  if (!/not legal advice/i.test(DISCLAIMER) || !/have your counsel review/i.test(DISCLAIMER)) throw new Error("build-templates: the disclaimer lost its words");
}

/** What a rendered file was built from: the template blocks, the disclaimer, the credit line, the renderer version. */
export const sourceHash = (t) => sha256(JSON.stringify({ v: RENDERER_VERSION, t, DISCLAIMER, credit: CREDIT(t.slug) }));

// ---------- HTML (page preview + PDF print sheet) ----------
function blocksHtml(t) {
  validate(t);
  const out = [`<h2>${esc(t.title)}</h2>`];
  for (const b of t.blocks) {
    if (b.t === "h") out.push(`<h3>${esc(b.x)}</h3>`);
    else if (b.t === "p") out.push(`<p>${esc(b.x)}</p>`);
    else if (b.t === "f") out.push(`<div class="f"><span>${esc(b.x)}:</span><span></span></div>`);
    else if (b.t === "fs") for (const x of b.x) out.push(`<div class="f"><span>${esc(x)}:</span><span></span></div>`);
    else if (b.t === "table") out.push(`<table><thead><tr>${b.head.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${Array.from({ length: b.rows }, () => `<tr>${b.head.map(() => "<td></td>").join("")}</tr>`).join("")}</tbody></table>`);
    else if (b.t === "sig") out.push(`<div class="sig">${b.x.map((x) => `<div>${esc(x)}</div>`).join("")}</div>`);
    else if (b.t === "disc") out.push(`<p class="disc">${esc(DISCLAIMER)}</p>`);
    else throw new Error(`build-templates: unknown block ${b.t}`);
  }
  return out.join("\n");
}

export function renderPreview(t) {
  return `${MARK_A}\n<div class="a-doc" id="preview">\n${blocksHtml(t)}\n<p class="disc">${esc(CREDIT(t.slug))}</p>\n</div>\n${MARK_B}`;
}

function printSheet(t) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(t.title)}</title><style>
  @page { size: Letter; margin: 0.8in 0.85in 0.9in; }
  body { font: 11.5pt/1.55 Georgia, 'Times New Roman', serif; color: #1e293b; margin: 0; }
  .brand { font: 700 9pt Helvetica, Arial, sans-serif; letter-spacing: 1.5px; text-transform: uppercase; color: #40916c; margin-bottom: 6pt; }
  h2 { font: 700 20pt/1.2 Helvetica, Arial, sans-serif; color: #1b4332; margin: 0 0 12pt; }
  h3 { font: 700 12pt/1.3 Helvetica, Arial, sans-serif; color: #1b4332; margin: 16pt 0 6pt; page-break-after: avoid; }
  p { margin: 0 0 8pt; }
  .f { display: flex; gap: 8pt; align-items: baseline; margin: 0 0 9pt; page-break-inside: avoid; }
  .f span:last-child { flex: 1; border-bottom: 0.75pt solid #64748b; min-height: 14pt; }
  table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt; page-break-inside: avoid; }
  th, td { border: 0.75pt solid #94a3b8; padding: 5pt 7pt; font: 9.5pt Helvetica, Arial, sans-serif; text-align: left; height: 16pt; }
  th { background: #f0faf4; color: #1b4332; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28pt; page-break-inside: avoid; }
  .sig div { border-top: 0.75pt solid #64748b; padding-top: 3pt; margin-top: 30pt; font: 9pt Helvetica, Arial, sans-serif; color: #475569; }
  .disc { margin-top: 18pt; padding-top: 8pt; border-top: 0.75pt solid #cbd5e1; font: 700 10pt Helvetica, Arial, sans-serif; color: #2d6a4f; }
  </style></head><body><div class="brand">ShelfSpace · free template</div>
${blocksHtml(t)}
</body></html>`;
}

// ---------- DOCX ----------
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const xesc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = (text, rpr = "") => `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ""}<w:t xml:space="preserve">${xesc(text)}</w:t></w:r>`;
const para = (inner, ppr = "") => `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${inner}</w:p>`;
const LEADER = '<w:tabs><w:tab w:val="right" w:leader="underscore" w:pos="9360"/></w:tabs>';
const fillLine = (label) => para(run(label + ": ") + "<w:r><w:tab/></w:r>", `${LEADER}<w:spacing w:before="120" w:after="120"/>`);
const cell = (inner, w, shade) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shade ? '<w:shd w:val="clear" w:color="auto" w:fill="F0FAF4"/>' : ""}</w:tcPr>${inner}</w:tc>`;

function documentXml(t) {
  validate(t);
  const body = [para(run(t.title), '<w:pStyle w:val="Title"/>')];
  for (const b of t.blocks) {
    if (b.t === "h") body.push(para(run(b.x), '<w:pStyle w:val="Heading2"/>'));
    else if (b.t === "p") body.push(para(run(b.x)));
    else if (b.t === "f") body.push(fillLine(b.x));
    else if (b.t === "fs") for (const x of b.x) body.push(fillLine(x));
    else if (b.t === "table") {
      const w = Math.floor(9360 / b.head.length);
      const border = '<w:tblBorders>' + ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>`).join("") + "</w:tblBorders>";
      const head = `<w:tr>${b.head.map((c) => cell(para(run(c, "<w:b/>")), w, true)).join("")}</w:tr>`;
      const rows = Array.from({ length: b.rows }, () => `<w:tr><w:trPr><w:trHeight w:val="400"/></w:trPr>${b.head.map(() => cell(para(""), w, false)).join("")}</w:tr>`).join("");
      body.push(`<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/>${border}</w:tblPr><w:tblGrid>${b.head.map(() => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${head}${rows}</w:tbl>`, para(""));
    } else if (b.t === "sig") {
      for (const x of b.x) body.push(para("<w:r><w:tab/></w:r>", `${LEADER}<w:spacing w:before="360" w:after="0"/>`), para(run(x, '<w:color w:val="475569"/><w:sz w:val="18"/>'), '<w:spacing w:after="120"/>'));
    } else if (b.t === "disc") body.push(para(run(DISCLAIMER, '<w:b/><w:color w:val="2D6A4F"/>'), '<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="CBD5E1"/></w:pBdr><w:spacing w:before="360"/>'));
  }
  body.push(para(run(CREDIT(t.slug), '<w:color w:val="64748B"/><w:sz w:val="16"/>')));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${W}><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1152" w:right="1224" w:bottom="1152" w:left="1224" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="1B4332"/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="1B4332"/><w:sz w:val="24"/></w:rPr></w:style>
</w:styles>`;
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
const core = (t) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${xesc(t.title)}</dc:title><dc:creator>ShelfSpace</dc:creator><dc:description>${xesc(DISCLAIMER)}</dc:description></cp:coreProperties>`;

/** A store-only (no compression) zip with fixed DOS timestamps, so the same input gives the same bytes. */
export function zipStore(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameB = Buffer.from(name, "utf8"), dataB = Buffer.from(data, "utf8"), crc = crc32(dataB) >>> 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); // 01/01/1980 00:00
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(dataB.length, 18); lh.writeUInt32LE(dataB.length, 22);
    lh.writeUInt16LE(nameB.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(dataB.length, 20); ch.writeUInt32LE(dataB.length, 24);
    ch.writeUInt16LE(nameB.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nameB, dataB); centrals.push(ch, nameB);
    offset += lh.length + nameB.length + dataB.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

/** Read one stored (uncompressed) entry back out of zipStore's output. */
export function unzipEntry(buf, want) {
  let i = 0;
  while (i + 30 <= buf.length && buf.readUInt32LE(i) === 0x04034b50) {
    const size = buf.readUInt32LE(i + 18), nlen = buf.readUInt16LE(i + 26), xlen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nlen).toString("utf8"), start = i + 30 + nlen + xlen;
    if (name === want) return buf.slice(start, start + size).toString("utf8");
    i = start + size;
  }
  return null;
}

// ECMA-376 xsd:sequence order for the property children this builder emits. Word rejects ("unreadable content")
// a w:rPr / w:pPr whose children are out of this order, while LibreOffice opens it; check:assets enforces it.
export const RPR_ORDER = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "strike", "color", "spacing", "w", "kern", "position", "sz", "szCs", "highlight", "u"];
export const PPR_ORDER = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "bidi", "spacing", "ind", "jc", "outlineLvl"];
/** Every out-of-order or unknown property child in a WordprocessingML part, as "pPr: spacing before pBdr". */
export function ooxmlOrderErrors(xml) {
  const errs = [];
  for (const [tag, order] of [["rPr", RPR_ORDER], ["pPr", PPR_ORDER]]) {
    for (const m of xml.matchAll(new RegExp(`<w:${tag}>([\\s\\S]*?)</w:${tag}>`, "g"))) {
      const kids = [...m[1].matchAll(/<w:([A-Za-z]+)\b[^>]*?(?:\/>|>[\s\S]*?<\/w:\1>)/g)].map((k) => k[1]);
      let last = -1;
      for (const k of kids) {
        const i = order.indexOf(k);
        if (i < 0) { errs.push(`${tag}: unknown child ${k}`); continue; }
        if (i < last) errs.push(`${tag}: ${k} after ${order[last]}`);
        last = Math.max(last, i);
      }
    }
  }
  return errs;
}

export function renderDocx(t) {
  return zipStore([
    ["[Content_Types].xml", CONTENT_TYPES], ["_rels/.rels", RELS], ["docProps/core.xml", core(t)],
    ["word/_rels/document.xml.rels", DOC_RELS], ["word/document.xml", documentXml(t)], ["word/styles.xml", STYLES],
  ]);
}

export const pagePath = (slug) => join(ROOT, "templates", `${slug}.html`);
export function spliceRegion(html, region) {
  const a = html.indexOf(MARK_A), b = html.indexOf(MARK_B);
  if (a < 0 || b < a || html.indexOf(MARK_A, a + 1) >= 0) return null;
  return html.slice(0, a) + region + html.slice(b + MARK_B.length);
}

async function main() {
  mkdirSync(FILES_DIR, { recursive: true });
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const manifest = {};
  try {
    for (const t of TEMPLATES) {
      const docx = renderDocx(t);
      writeFileSync(join(FILES_DIR, `${t.slug}.docx`), docx);
      const page = await browser.newPage();
      await page.setContent(printSheet(t), { waitUntil: "load" });
      const pdf = await page.pdf({ format: "Letter", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>",
        footerTemplate: `<div style="font:8px Helvetica,Arial,sans-serif;color:#64748b;width:100%;padding:0 0.85in;display:flex;justify-content:space-between;"><span>${esc(CREDIT(t.slug))} · ${esc(DISCLAIMER)}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
        margin: { top: "0.8in", bottom: "0.9in", left: "0.85in", right: "0.85in" } });
      await page.close();
      writeFileSync(join(FILES_DIR, `${t.slug}.pdf`), pdf);
      const p = pagePath(t.slug);
      if (existsSync(p)) {
        const next = spliceRegion(readFileSync(p, "utf8"), renderPreview(t));
        if (next == null) throw new Error(`build-templates: ${p} needs exactly one ${MARK_A} … ${MARK_B} region`);
        writeFileSync(p, next);
      }
      manifest[t.slug] = { source_sha256: sourceHash(t), docx_sha256: sha256(docx), pdf_sha256: sha256(pdf) };
      console.log(`   templates/files/${t.slug}.{docx,pdf}  (${docx.length} + ${pdf.length} bytes)`);
    }
  } finally { await browser.close(); }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✅ ${TEMPLATES.length} templates built; manifest written`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
