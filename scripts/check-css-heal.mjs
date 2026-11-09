// Every page that loads /styles.css, and both page templates, must carry the canonical stylesheet
// self-heal (scripts/css-heal-snippet.mjs) byte-for-byte, directly after the /styles.css link,
// exactly once. Byte equality, not a substring: an inert or edited script must fail.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { CSS_BLOCK, CSS_HEAL } from './css-heal-snippet.mjs';
import { checkBehavior } from './css-heal-behavior.mjs';
const files = execSync("git ls-files '*.html'", { encoding: 'utf8' }).split('\n').filter(f => f && !f.startsWith('scripts/'));
const count = (t, s) => t.split(s).length - 1;
const bad = []; let checked = 0;
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  if (!/<link[^>]*styles\.css/.test(t)) continue;
  checked++;
  if (count(t, CSS_BLOCK) !== 1 || count(t, CSS_HEAL) !== 1 || count(t, 'styles.css"') !== 1) bad.push(f);
}
// Templates: the tutorials generator holds it as a JS template literal, the Days-to-Pay Index release page as HTML.
const tpl = readFileSync('scripts/build-tutorials.mjs', 'utf8');
if (count(tpl, '${CSS_BLOCK}') !== 1 || /<link[^>]*styles\.css/.test(tpl) || !/import\s*\{[^}]*CSS_BLOCK[^}]*\}\s*from\s*'\.\/css-heal-snippet\.mjs'/.test(tpl)) bad.push('scripts/build-tutorials.mjs (template must interpolate CSS_BLOCK from ./css-heal-snippet.mjs)');
const rel = readFileSync('scripts/seo/index-release/template.html', 'utf8');
if (count(rel, CSS_BLOCK) !== 1) bad.push('scripts/seo/index-release/template.html (Days-to-Pay Index release template)');
for (const f of checkBehavior(CSS_HEAL)) bad.push('scripts/css-heal-snippet.mjs behavior: ' + f);
if (checked < 300) { console.error(`FAIL check:css-heal: only ${checked} pages link styles.css (expected 300+); the page scan is broken`); process.exit(1); }
if (bad.length) { console.error(`FAIL check:css-heal: ${bad.length} without the canonical stylesheet self-heal (scripts/css-heal-snippet.mjs):\n  ` + bad.join('\n  ')); process.exit(1); }
console.log(`PASS check:css-heal: ${checked} pages + 2 templates + behavior (8 cases)`);
