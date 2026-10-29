#!/usr/bin/env node
// The homepage video section shows only public (brand) videos, with current thumbnails.
//   1. the strip between the VIDEO-STRIP markers equals what video-strip.mjs builds from the catalog
//   2. every YouTube id in index.html (strip AND the hand-written featured cards) is public
//   3. every i.ytimg.com URL in index.html and tutorials.html carries the current THUMB_V cache-buster
//   node scripts/check-video-strip.mjs [--root <dir>]
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStrip, START, END, THUMB_V } from "./video-strip.mjs";

const i = process.argv.indexOf("--root");
const ROOT = i > 0 ? process.argv[i + 1] : join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const catalog = JSON.parse(readFileSync(join(ROOT, "video-catalog.json"), "utf8"));
const pub = new Set(catalog.videos.filter((v) => v.privacy === "public").map((v) => v.videoId));
const fails = [];

const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < a) fails.push("no VIDEO-STRIP markers in index.html");
else if (html.slice(a, b + END.length) !== buildStrip(catalog)) fails.push("strip is stale: run node scripts/build-tutorials.mjs");

// Every way the page names a video: thumbnails (any YouTube image host), play buttons, embeds, links.
const ID_PATTERNS = [
  /(?:i\.ytimg\.com|img\.youtube\.com)\/(?:vi|vi_webp)\/([\w-]{11})\//g,
  /data-(?:yt|watch)="([\w-]{11})"/g,
  /youtube(?:-nocookie)?\.com\/(?:embed|watch\?v=)\/?([\w-]{11})/g,
  /youtu\.be\/([\w-]{11})/g,
];
const ids = new Set(ID_PATTERNS.flatMap((re) => [...html.matchAll(re)].map((m) => m[1])));
if (!ids.size) fails.push("found no YouTube ids in index.html (pattern broke?)");
for (const id of ids) if (!pub.has(id)) fails.push(`${id} is on the homepage but not a public video in video-catalog.json`);
for (const page of ["index.html", "tutorials.html"]) {
  const thumbs = [...readFileSync(join(ROOT, page), "utf8").matchAll(/(?:https?:)?\/\/(?:i\.ytimg\.com|img\.youtube\.com)\/(?:vi|vi_webp)\/[\w-]{11}\/[\w-]+\.(?:jpg|webp)(\?v=\w+)?/g)];
  if (!thumbs.length) fails.push(`${page}: no YouTube thumbnails found (pattern broke?)`);
  for (const m of thumbs) if (m[1] !== `?v=${THUMB_V}`) fails.push(`${page}: ${m[0]} lacks ?v=${THUMB_V} (browsers keep the old thumbnail)`);
}

if (fails.length) { console.error(`check:video-strip FAIL\n  ${fails.join("\n  ")}`); process.exit(1); }
console.log(`check:video-strip OK (${ids.size} public videos on the homepage)`);
