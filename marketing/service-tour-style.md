# Service-Tour Style

The big-font full-bleed section pattern. Originated on `/index` for the AP / Credit Recovery / Consignment / Checks / ShelfiQ tour. Reusable on any page where you want to walk the reader through a few beats — one giant statement + one visual + one link per beat.

When the user says **"the homepage style"** or **"the big-font sections"**, this is the pattern.

## When to use

- Walking the reader through 2–5 related concepts in a single scroll.
- Each beat earns its own full screen, not a card.
- The visual is the proof, not decoration.

**Don't use for:** content-listing pages (blog, docs index — see `user_design_compact_hierarchical` for those), single-message landing heroes, dense feature comparisons.

## Anatomy (top → bottom inside `.svc-section`)

```
<section class="svc-section svc-section--{white|slate|ghost|dark}" id="anchor-slug">
  <div class="svc-inner">
    <div class="svc-eyebrow reveal">Section Tag</div>      ← mono caps, ~12px
    <h2  class="svc-headline reveal">Giant Statement</h2>  ← clamp 40–80px, -2.5px tracking
    <p   class="svc-sub reveal">One-sentence supporting line.</p>
    <div class="svc-visual reveal reveal-delay-1">
      <!-- ONE centerpiece: mockup, chart, photo, chat, diagram -->
    </div>
    <p   class="svc-why reveal">Operator-voice "why this matters" — 1-3 sentences.</p>
    <a   class="svc-link reveal" href="/deeper-page">Read more <svg…/></a>
  </div>
</section>
```

All six slots can render — or you can drop `.svc-sub` / `.svc-why` / `.svc-visual` / `.svc-link` if a beat doesn't need them. The eyebrow + headline are non-negotiable.

## Background modifiers

Pick one per section, alternate down the page for rhythm:

| Class | Background | When |
|---|---|---|
| `.svc-section--white` | `--white` (with top border) | Default. Use most. |
| `.svc-section--slate` | `--slate-50` | Alternates with white. |
| `.svc-section--ghost` | `--green-ghost` | Accent beats (rare). |
| `.svc-section--dark` | `--green-deep`, white text | **Max 1–2 per page.** Use for emotional weight. Dark-section text colors flip automatically. |

The dark variant gets two soft radial-gradient blooms automatically (`::before` + `::after`). No extra markup needed.

## Visual centerpiece (`.svc-visual`)

Constrained to `max-width: 560px`. The contents are page-specific — the homepage uses CSS-built mockups (`.svc-invoice`, `.svc-memo`, `.svc-consign`, `.svc-check`, `.svc-chat`). Future pages compose their own.

**Default conventions:**
- Mark the visual `aria-hidden="true"` if the surrounding copy carries the meaning.
- Inline SVG, CSS-built cards, or photo — no AI illustration (forbidden per `marketing/docs-instructions.md`).
- One centerpiece. Don't pack two.

## Voice (per-section copy)

- Eyebrow: short tag. The section's name. Title Case or `MONO CAPS` — the CSS handles uppercasing.
- Headline: huge statement. Recent precedent on /index uses Title Case program-naming ("We Manage Your Accounts Payable"). Sentence case also works ("AI that doesn't suck"). No period unless the rhythm needs it. Match the page's overall headline pattern.
- Sub: one sentence, plain. Names what the thing actually *is*.
- Why: operator-voice. Why this matters to the reader's P&L. 1–3 sentences. Em-dashes sparingly — see `feedback_owner_grade_voice.md`.
- Link: "See how X works →" or "Meet X →" — text + arrow SVG, routes to the deeper page. **Not** a primary CTA; primary CTAs still go to `/contact`.

## Reveals

Every text/visual node carries `class="reveal"` (with optional `reveal-delay-1/2/3`). The existing IntersectionObserver script picks them up — no extra JS needed when adding `.svc-section` to a new page that already includes the homepage scroll-reveal pattern.

If you're building a page that doesn't have the reveal observer wired up yet, copy this block from `index.html`:

```js
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(function(el) { revealObserver.observe(el); });
```

## Mobile

Built-in. At `≤700px`:
- Section padding drops to `80px 24px`.
- Headline letter-spacing softens to `-1.5px`.
- The `clamp()` on headline naturally scales to 40px floor.

No manual overrides needed unless your visual centerpiece needs them.

## Where it lives

- **CSS:** `styles.css` (search for `SERVICE-TOUR SECTIONS` banner).
- **Live example:** `/` (index.html, 5 sections from AP through ShelfiQ).
- **Doc:** this file.

## Class-name note

`svc-` prefix is a legacy from "service tour" but the pattern is generic. Don't rename to `.section-story` or similar — every page that uses it would need updating. Treat the prefix as design-system shorthand.
