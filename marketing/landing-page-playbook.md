# ShelfSpace Landing Page Playbook
# A reusable framework for building high-converting pages.
# Reference this file when designing or rewriting any marketing page.

## The Core Rule

Every page has ONE job: make the visitor feel something so strongly that they take action. Information doesn't convert. Emotion converts. Then logic justifies the decision.

## The 5-Beat Emotional Arc

Every landing page should follow these 5 beats. Under 60 seconds of attention. Each beat earns the scroll to the next.

### Beat 1: RECOGNITION (0-3 seconds)
**Goal:** "Oh shit, that's me."
- Use a specific number or scenario that mirrors the visitor's reality
- NOT advice ("stop doing X"), NOT a question ("what would you do with...") — a MIRROR
- One sentence. No subhead needed if the headline is strong enough.
- Example: "You paid $300,000 for the product sitting on your shelves right now."

### Beat 2: PAIN AMPLIFICATION (3-10 seconds)
**Goal:** "It's worse than I thought."
- Show the cost of the current situation with specific numbers
- Use a visual breakdown (big numbers, short lines) not paragraphs
- End with a pivot line that introduces the solution possibility
- Loss framing is 2x more powerful than gain framing
- Example: "$300,000 on your shelves. $50,000 will expire. $0 you can get back. Unless..."

### Beat 3: RELIEF (10-20 seconds)
**Goal:** "Wait, there's a way out — and I don't have to do anything?"
- Interactive element (calculator, quiz) makes it personal
- Show THEIR number, not a generic stat
- Emotional kicker below the number: translate dollars into what it MEANS (payroll, expansion, breathing room)
- Single CTA button right here — don't make them scroll further if they're ready
- Example: "$187,500 back in your account. Tomorrow's payroll covered. The stress you feel right now? Gone."

### Beat 4: PROOF (20-40 seconds)
**Goal:** "This is real. Someone already did this."
- Timeline format > paragraph format (Day 1 → Day 60)
- Show SPEED (how fast they'll see results)
- Show EASE (emphasize what they DON'T have to do)
- Short stat block with real numbers (de-identified if needed)
- No long paragraphs. Punchy proof points only.

### Beat 5: ACTION (40-60 seconds)
**Goal:** "I need to call these people. Right now."
- Time-bound headline: "Your [thing] could change in [timeframe]."
- Explain what the FREE analysis/consultation includes
- Chris's photo — humanize the CTA
- Single primary button, first-person language ("Get MY Free Analysis")
- Risk reversal: "Free. No commitment. You only pay if we deliver."

## Psychological Triggers

### Loss Aversion (2x stronger than gain)
- "You're LOSING $X" beats "You could SAVE $X"
- "Every month you wait costs you $17K" creates urgency
- Frame the current state as a loss, not the future state as a gain

### Specificity Beats Generality
- "$187,500" beats "hundreds of thousands"
- "14 days" beats "quickly"
- "40 vendors" beats "dozens of vendors"
- Specific numbers feel researched and real. Round numbers feel made up.

### The Mirror Effect
- Describe the visitor's exact situation so specifically they feel seen
- Use scenarios they live with daily (making payroll, expired product, vendor calls)
- Don't teach them about their problem — reflect it back at them

### First-Person CTAs
- "Get MY free analysis" converts 90% higher than "Get a free analysis"
- The visitor is the hero, ShelfSpace is the tool

### Monthly > Annual
- $10,625/month hits harder than $127,500/year
- Operators think in monthly cash flow, not annual projections

### One CTA Per Screen
- Multiple CTAs create decision paralysis
- The visitor should always see exactly ONE button
- Primary only. No secondary. No "learn more." Just the action.

## Visual Design Rules

### Whitespace = Confidence
- Don't pack content. Let numbers breathe.
- A page with fewer words feels premium and trustworthy.
- If you're tempted to add another section, cut one instead.

### Big Numbers, Few Words
- Dollar amounts should be the largest text on the page after the hero
- Visual breakdowns (3 big numbers stacked) > paragraphs explaining the same thing
- If it can be a number, make it a number. If it can be a visual, don't make it text.

### Dark Sections = Emphasis
- Use dark (green-deep) backgrounds sparingly — maximum 1-2 per page
- Every dark section should be a "holy shit" moment
- Multiple dark sections = visual noise. One = dramatic emphasis.

### Timeline > Process Steps
- "Day 1 → Day 14 → Day 30 → Day 60" tells a story
- "Step 1, Step 2, Step 3, Step 4" is a manual
- Stories create emotion. Manuals create boredom.

### Sticky Bar
- Thin bar at bottom of viewport, appears after scrolling past the calculator/key section
- One line of text + one button. That's it.
- Catches visitors who scroll but don't commit at the in-page CTA.

## Page Structure Template

```
1. Hero — Mirror headline, specific number, no subhead
2. Pain — Visual breakdown with numbers, pivot line
3. Calculator/Interactive — Personal number, emotional kicker, single CTA
4. Proof — Timeline + stat block, speed + ease emphasis
5. Final CTA — Time-bound headline, Chris's photo, risk reversal
6. FAQ — 5 questions max, fear-based only
7. Sticky bar — appears on scroll
```

Seven sections. That's the max. If you need more sections, you're over-explaining and under-feeling.

## Copy Rules

### Voice
- "We" for ShelfSpace, "you" for the reader
- Direct, operator-to-operator. No jargon. No SaaS-speak.
- Short sentences. Short paragraphs. If a sentence doesn't make someone FEEL something, cut it.

### Forbidden
- **No pricing, tiers, trial, or subscription copy** — no "$X/location," no "30-day free trial," no "cancel anytime," no plan names, no dollar plans. Engagements are custom, scoped in the consult. (Illustrative example dollar amounts inside worked examples are fine.) `marketing/scripts/check-docs-forbidden.sh` Scan B blocks the pricing/trial tokens.
- **Managed-service framing is ALLOWED** — "we run your AP/AR," "done for you," "hands-off." Reverses the old 2026-05-19 "system, not a managed service" rule. Lead with the outcome; keep "automate/automation" out of heroes (AI is a supporting proof point, never the pitch).
- No "scan-based trading" or "SBT"
- **"Diem Cannabis" only in Chris's bio** — never as a ShelfSpace customer, reference, or testimonial. No other customer names anywhere; proof is anonymized case studies.
- No `<br>` tags in headings
- No questions as headlines (questions give permission to say "no")
- No "learn more" as a CTA (it's a dead end, not an action)

## Pricing — custom, consult-first (NO public numbers)

**The site shows no pricing.** No tiers, no plan names, no "$X/location," no trial, no subscription. Every operation is different — AP, AR, consignment, and credit recovery are scoped in the sales conversation, and delivered as software the operator drives OR done-for-you, decided per account. So the site sells the outcome and routes to a conversation.

### The free on-ramp (keep it — it's the upsell engine, reframed)
Keep the "see what you're owed" mechanic that makes the pain visible ("you're owed $X in credits," "$Y of your AR is overdue," "N invoices don't match Metrc"). It is now framed as the **first step of the conversation**, not a "Free plan": a free money-review that quantifies the leak, then → **Talk to us** to get it back. Never present it as a pricing tier or pair it with a paid tier.

### The "How We Work" page (`/pricing`, repurposed)
The old pricing page lives on at `/pricing` (URL kept for SEO) as **"How We Work With You"** — a numberless page: every operation is different → we scope your AP / AR / consignment / credit recovery → software or done-for-you → one CTA, Talk to us. A cost FAQ ("How much does ShelfSpace cost?") answers "custom, based on your operation — let's talk."

### Do NOT reintroduce
The two-tier Visibility/Automate subscription, the 30-day trial, the tier numbers ($999/$899/$799/$749, $499+), "cancel anytime," and the "$20/artifact" model are all RETIRED from the site.

### Headlines
- Statements > questions
- Numbers > adjectives
- Specific > clever
- Short > long
- "You paid $300,000" > "What would you do with extra capital?"

### Body Copy
- If you need more than 2 sentences to explain something, you're explaining the wrong thing
- Every paragraph should create an emotion: fear, relief, excitement, urgency
- If a paragraph is informational but not emotional, move it to the FAQ or cut it

## FAQ Rules

- Maximum 5 questions per page
- Only include fears that would STOP someone from taking action
- Answer in 2 sentences max
- Always end the answer with a confidence statement
- Order: biggest fear first, smallest last

## CTA Rules

- Primary button: "Talk to us" / "See what you're owed" / "Get started" → `/contact` (first-person variants like "Get MY free money-review" convert well)
- Below button: reassure — "Free. No commitment. We'll show you what you're owed." (results-based, no pricing)
- Chris's photo next to the CTA on bottom sections (humanize)
- The free "see what you're owed" on-ramp is the soft entry; `/contact` is the destination. One primary action per screen.
- No "learn more" dead ends. No trial-signup and no "Sign Up" as a primary CTA — the site is consult-first.

## SEO Rules

Every page needs to convert AND be findable. Emotion gets the click. SEO gets the visitor there in the first place.

### Page-Level Requirements
- Every page gets a unique `<title>` tag — include the primary keyword and "ShelfSpace"
- Every page gets a unique `<meta name="description">` — write it as a direct answer to the question someone would Google. 150-160 characters max.
- Every page gets a canonical URL (`<link rel="canonical">`)
- One H1 per page. It should contain the primary keyword naturally — don't stuff it.
- Use H2s for section headings, H3s for sub-sections. Don't skip levels.

### Keyword Strategy
- Each page targets ONE primary keyword phrase (e.g., "cannabis consignment management")
- Use the keyword in: H1, meta description, first paragraph of body copy, and at least one H2
- Use natural variations and related terms throughout — don't repeat the exact phrase robotically
- Think about what a dispensary operator would actually type into Google, not what a marketer would

### Structured Data
- Every page gets Organization schema in JSON-LD
- FAQ sections get FAQPage schema — this is free real estate in search results
- Service pages get Service schema
- The homepage gets WebSite schema with a SearchAction if applicable

### Technical SEO
- All images need descriptive `alt` text — not "image1.png", not empty
- Open Graph and Twitter Card meta tags on every page (title, description, image)
- All internal links use relative paths (`/consignment`, not `https://shelfspace.pro/consignment`)
- Page load speed matters — no massive images, no render-blocking scripts above the fold
- Mobile-first: every page must work perfectly on a phone. Google indexes mobile-first.

### Content for AI Search (GEO)
- Write FAQ answers as complete, standalone statements — AI models pull these verbatim
- Include `llms.txt` at the site root with a structured summary of what ShelfSpace does
- Use clear, factual language in at least one section per page — AI models favor authoritative, direct answers over marketing fluff
- Structured data helps AI models parse your content — don't skip it
- Being cited on external sites (directories, LinkedIn, industry blogs) compounds AI search visibility

### What NOT to Do
- Don't sacrifice conversion copy for keyword density — the emotional arc comes first
- Don't add thin "SEO pages" that exist only for keywords — every page must earn its existence
- Don't duplicate meta descriptions across pages
- Don't hide text or keyword-stuff — Google's smarter than that, and so are AI models

## How to Use This Playbook

1. Before writing ANY marketing page, read this file
2. Map your content to the 5-beat emotional arc
3. Write the hero first — if it doesn't pass the "oh shit, that's me" test, start over
4. Count your sections — if more than 7, cut until it's 7 or fewer
5. Read every sentence and ask: "Does this make someone FEEL something?" If no, cut it.
6. Test the page by reading only the headlines and CTA buttons (skip all body copy). Does the page still make sense? Does it still compel action? If not, the headlines aren't strong enough.
7. Before shipping, run the SEO checklist: unique title, unique meta description, one H1 with keyword, structured data, alt text on images, OG/Twitter tags.
