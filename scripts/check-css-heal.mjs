// Every page that loads /styles.css must carry the inline self-heal that re-fetches it when the
// download fails (Safari on a flaky mobile network rendered a bare page, 11/09/2026), and
// styles.css must define the --ss-css sentinel the self-heal reads.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const files = execSync("git ls-files '*.html'", { encoding: 'utf8' }).split('\n').filter(f => f && !f.startsWith('scripts/'));
const bad = []; let checked = 0;
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  if (!/styles\.css/.test(t)) continue;
  checked++;
  if (!t.includes('id="ss-css"') || !t.includes("getPropertyValue('--ss-css')")) bad.push(f);
}
const tpl = readFileSync('scripts/build-tutorials.mjs', 'utf8');
if (!tpl.includes('id="ss-css"')) bad.push('scripts/build-tutorials.mjs (template)');
if (!/:root\s*\{[^}]*--ss-css:\s*1/.test(readFileSync('styles.css', 'utf8'))) bad.push('styles.css (missing --ss-css sentinel in :root)');
if (checked === 0) { console.error('FAIL check:css-heal: no pages found'); process.exit(1); }
if (bad.length) { console.error(`FAIL check:css-heal: ${bad.length} missing the stylesheet self-heal:\n  ` + bad.join('\n  ')); process.exit(1); }
console.log(`PASS check:css-heal: ${checked} pages`);
