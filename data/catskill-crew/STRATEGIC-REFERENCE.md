# Catskill Crew — Strategic Reference

Competitive analysis playbook for Santa Fe Minutes and related local newsletter projects. Synthesized from the local 147-issue corpus (`data/catskill-crew/`) and public profiles (beehiiv, Nieman Journalism Lab, Creator Diaries, High Signal).

**Last updated:** 2026-09-03  
**Corpus sync:** `npm run sync:catskill-crew`

---

## Purpose

This document captures **how Catskill Crew monetizes, scales, and structures editorial** — so you can `@`-reference it in Cursor without re-scraping beehiiv or re-reading interviews.

Use alongside:

- `catalog.md` — issue index
- `issues/YYYY/` — primary sources
- Edition #1: `issues/2023/2023-11-27-catskill-crew-newsletter-b178.md`
- Edition #147: `issues/2026/2026-09-01-launch-calendar.md`

---

## Corpus snapshot

| Metric | Value |
|--------|-------|
| Total issues | 147 |
| Date range | Nov 27, 2023 → Sep 1, 2026 |
| Total words | 213,544 |
| Avg words/issue | 1,453 |
| First edition words | 929 |
| Latest edition words | 1,569 |
| Source | Public web versions at catskillcrew.beehiiv.com |

---

## Core thesis

**The newsletter is distribution, not the business.**

Michael Kauffman (Nieman, 2025): he runs a local company with a media arm that acts as a "validation engine and distribution vehicle for everything else."

Implication for Santa Fe Minutes: a **$50K Year 1 ads-only ceiling** is realistic for Santa Fe County (~157K people), but a **full-stack local media operation** can plausibly reach **$200K–500K+** at maturity without NYC-scale audience — if you launch products and events through the list, not just ad slots.

---

## Revenue model — full stack

| Stream | What it is | Evidence / economics |
|--------|-----------|---------------------|
| **Newsletter sponsorships** | Primary/secondary sponsors, "TOGETHER WITH" blocks, partner CTAs | ~$18,200 ads in one month, 100% inbound (Kauffman). Early format: "This week's Newsletter is Sponsored by…" + "Let's Talk." 2026: "PARTNER WITH CATSKILL CREW" in 33/35 issues. |
| **Ticketed events** | Happy hours, Mushroom Madness, Social Studies lectures | beehiiv case study: ~$2K/event early. Corpus: $20 presales, community fundraisers ($940 for soccer club). Events sell out. |
| **Dinner Club** | Matched strangers, restaurant dinners, optional afterparty | Launched Nov 2025. In 27/35 issues in 2026. Quiz → match → morning-of reveal → secret afterparty. |
| **Crew Cards** | Local discount/coupon book | Feb 2024 launch, 150 units, email-to-buy. beehiiv projected ~$12K profit/launch. Peaked 2024 (19 issues), faded by 2026. |
| **Board games** | Catskillopoly ($50 retail) | 500 units in 17 days (beehiiv). Reports of $50K+ total. Murder in the Mountains (Clue variant) in development 2026. |
| **Merchandise** | Hats, pins, Trout Cap ($49), limited drops | shop.catskillcrew.com from Mar 2024. Shop mentions in ~90% of 2024 issues. |
| **Puzzles / games** | Mountain Memory, Catskill puzzle (~$30) | Part of product rotation alongside merch. |
| **Physical field guides** | Food, antiquing, destinations | Kauffman cites $2,750 spent on burger research for a guide (2026). |
| **Snail Mail / Quarterly** | Physical mailed envelope, seasonal | $25 pre-order. "Four envelopes stuffed with Catskill Goodness." Premium physical sub, not paywalled digital. 25/35 issues in 2026. |
| **Art / prints** | Nature art + local artists | Original beehiiv "11+ streams" at ~10K subs. |
| **Wholesale** | Products through local retailers | beehiiv webinar. |
| **Reader contributions** | "MAKE A CREW CONTRIBUTION" / tip jar | 35/35 issues in 2026. beehiiv paywall branded "Tip Jar." |
| **Sponsored events** | Free/ticketed events with sponsor layer | Fly fishing kickoff with partner raffle, Local's Night co-brands. |
| **Consulting** | Advising media operators | Adjacent income, not Catskill Crew P&L. |
| **Newsletter Club** | Paid community for newsletter builders (~$499/yr, 175+ members) | **Separate business** — not Catskill Crew revenue. |
| **Local investment / holdco** | CRE, equity in local businesses | Emerging strategy; not proven recurring revenue yet. |

### Revenue stack diagram

```
Newsletter (weekly, free)
    │
    ├── Ads / sponsors (TOGETHER WITH, PARTNER WITH)
    ├── Events (ticketed + sponsored)
    ├── Dinner Club (recurring community product)
    ├── Physical products (Crew Card, games, merch, guides, Quarterly)
    ├── Reader contributions
    └── Owned infrastructure (events calendar, games IP)
```

---

## Scale signals

| Metric | Number | Caveat |
|--------|--------|--------|
| Launch | Oct/Nov 2023 | Edition #1: Nov 27, 2023 |
| Subscribers late 2024 | ~12K | Meta ads ~$35/day |
| Subscribers 2025–26 | 33K–42K+ | Nieman, High Signal |
| **One month revenue** | **~$57K** | Stated when under 20K subs; mix of product launches + events — **do not annualize blindly** |
| Business scale | "Multi-six-figure," $250K+ cited | Newsletter Club marketing, Nieman |
| Profit | "Healthy six figures" at ~33K subs | Industry profile — directional |
| Ad philosophy | Ads exist but aren't the engine | "I never want to be limited to just ad revenue" — Nieman |

The **$57K/month headline is real but misleading as recurring ad ARR.** That month likely included product drops, events, and launch spikes. Steady-state is lower; diversified stack is the point.

---

## Monetization evolution by year

Counts = **issues in that year containing the pattern** (from corpus text analysis).

| CTA type | 2023 (5) | 2024 (55) | 2025 (52) | 2026 (35*) |
|----------|----------|-----------|-----------|------------|
| Subscribe / growth | 4 | 52 | 52 | 35 |
| Shop / merch | 3 | 50 | 49 | 29 |
| Events / tickets | 4 | 47 | 48 | 34 |
| Sponsor CTA ("Let's Talk" / "PARTNER WITH") | 0 | 12 | 0 | 33 |
| Crew Card | 0 | 19 | 6 | 0 |
| Contribute / tip jar | 0 | 1 | 15 | 35 |
| Snail Mail / Quarterly | 0 | 1 | 12 | 25 |
| Dinner Club | 0 | 0 | 8 | 27 |
| TOGETHER WITH (named sponsor block) | 0 | 3 | 7 | 13 |
| Product drops (games, guides, caps) | 0 | 20 | 31 | 28 |
| Events calendar (owned product) | 0 | 0 | 0 | 1 |

\*2026 partial year through Sep 1.

### Era narrative

**2023 — pure utility, zero monetization**

- Edition #1: events list + share CTA + subscribe footer only
- No sponsors, shop, products, or partner blocks
- Editorial = the product

**2024 — monetization begins**

- Mar: shop live, ticketed events ($20 presales)
- Feb–Mar: Crew Card launch (150 units, email-to-buy)
- Sponsor format: "This week's Newsletter is Sponsored by…" + "Interested in sponsoring? Let's Talk"
- Merch/shop in ~91% of issues
- Still mostly events calendar + local culture

**2025 — product and community stack**

- Branded editorial (burger quest, field reports, vintage shops)
- Dinner Club launches (Nov)
- Quarterly / Snail Mail ramps
- Contribute appears — reader support layer
- Sponsor CTA language drops as products take over

**2026 — full ecosystem integration**

- Almost every issue: PARTNER WITH + DINNER CLUB + SNAIL MAIL + CONTRIBUTE
- Named TOGETHER WITH blocks return
- Owned products inline: Murder in the Mountains, River Legends game, events calendar
- Fixed chassis: THE REPORT + THE BULLETIN + HAPPENINGS

---

## Edition 1 vs Edition 147

| Dimension | Edition #1 (Nov 2023) | Edition #147 (Sep 2026) |
|-----------|----------------------|-------------------------|
| Word count | 929 | 1,569 |
| Sections | 3 (Mountains, Weekly Breakdown, Maker Market) | 10+ (Report, Bulletin, Happenings, games, contributor columns) |
| Monetization | None | Partner CTA, board game waitlist, calendar, contribute, bulletin ads |
| Sponsors | None | PARTNER WITH CATSKILL CREW + bulletin partner line |
| Owned products | None | Murder in the Mountains, Crew Calendar |
| Community products | None | Dinner Club, Social Studies, Local's Night partnerships |
| Reader participation | Share with friends | Polls, trivia/giveaways, comments gated |
| Contributor content | None | "CONTRIBUTED BY Sandy" columns; guest poetry |
| Editorial frame | Raw weekly events list | Events + nature report + bulletin + featured happenings + product launches |
| Footer | Subscribe only | SUBSCRIBE / PARTNER / CONTRIBUTE |

**Edition 1:** "Here's what's happening this week — tell your friends."

**Edition 147:** "Here's the world we're building" — calendar infrastructure, board game IP, partner inventory, contributor network, multiple conversion paths per send.

Commerce is **embedded in editorial beats**, not isolated ad slots.

---

## 2026 sponsor / partner block formats

Six distinct formats appear in 2026 issues:

### Format A: `TOGETHER WITH [BRAND]` — native advertorial

Reads like a regular editorial block. Most common paid integration.

```
TOGETHER WITH PINK'S

Spring has arrived... [2-3 paragraphs of benefit copy]
There's no better team... hundreds of 5 star reviews.

GET YOUR QUOTE RIGHT MEOW
```

**Repeat sponsors 2026:** Pink's (cleaning), Flowstate (wall printing), Frost Valley YMCA, River Valley Baroque, Keep Good Company Records

**Variants:**

- Giveaway + trivia: River Valley Baroque → "Take your shot on the trivia below"
- Discount code: Flowstate → "Crew Members get 10% with CATSKILLCREW"
- Destination piece: Boscobel House & Gardens (long-form)

### Format B: `TOGETHER WITH [PERSON]` — contributor-as-sponsor

```
TOGETHER WITH SANDY — OUR HEAD GARDENER
TOGETHER WITH IVY (CHIEF BUG OFFICER)
```

Not always paid — often community columnists anchoring recurring sections.

### Format C: `PARTNER WITH CATSKILL CREW` — inventory CTA

Always-on sponsor pipeline. Present in **33 of 35** 2026 issues.

```
PARTNER WITH CATSKILL CREWLET ME KNOW
WANT TO PARTNER WITH CATSKILL CREW? LIMITED SPOTS AVAILABLE.
WANT TO PARTNER WITH CATSKILL CREW? REACH OUT AND LET'S SEE IF IT'S A GOOD FIT.
```

### Format D: `THE BULLETIN` — classified-style partner slots

```
PARTNER: Want to join forces with Catskill Crew? LET'S CHAT.
CREW CONTRIBUTION: Looking to support local journalism...? CONTRIBUTE
```

Plus product lines (Quarterly preorder, Provisions Shop, etc.)

### Format E: Co-branded events (Local's Night)

Partnership as programming:

```
Catskill Crew has joined forces with Ralph's Bar and Bowling...
Every Monday night... $99 special for beer, shot, AND a room
```

### Format F: Footer strip

```
SUBSCRIBEPARTNERCONTRIBUTE
```

Three conversion paths in one line — every late-2026 issue.

---

## Santa Fe Minutes — implications

### Revised ceiling math

| Scenario | Ad revenue only | Full stack (Catskill-style) |
|----------|----------------|----------------------------|
| Meh Year 1 | $10–20K | — |
| Good execution | $25–40K | — |
| Very strong Year 1 | $50–70K | — |
| Mature operation | — | $200K–500K+ plausible |
| Stretch (ads) | ~$100K at 5K+ local readers | — |

**Treat $50K as realistic Year 1 ads target; $75K as "holy shit" ads result.**

SFR benchmark: ~$500–600/four weeks per placement, ~8K–10K subscribers; promotional package ~$495/week.

### Five streams to steal (not all fifteen)

| Priority | Stream | Why it fits Santa Fe |
|----------|--------|---------------------|
| 1 | **Newsletter sponsorships** | SFR proves local ad demand; civic/local business appetite |
| 2 | **Sponsored / ticketed events** | Santa Fe is event-heavy; civic + culture calendar is natural |
| 3 | **Local pass / discount product** | Crew Card equivalent — restaurants, galleries, markets |
| 4 | **Premium physical / civic guide** | Voter guides, neighborhood guides, seasonal print — matches Kauffman's physical-premium bet |
| 5 | **Curated commerce** | Limited merch or local product drops once trust is built |

### Defer

- Holdco / equity investing
- Newsletter Club-style education business (separate venture)
- Board games (unless Santa Fe has a killer hook)
- Multi-city until Santa Fe machine works

### Timing lessons from Catskill

1. **Year 1 should not look like edition 147.** Catskill ran ~12 months with zero monetization. Trust first.
2. **Sponsor format evolved:** 2024's "This week is sponsored by…" → 2026's "TOGETHER WITH" native sections + always-on partner inventory.
3. **Ads are one slot among many.** In 2026, contribute + dinner club + snail mail + product drops appear more often than named sponsor blocks.
4. **Repeat sponsors are a feature.** Pink's and Flowstate run multiple times.
5. **Fixed editorial chassis enables monetization.** THE REPORT + BULLETIN + HAPPENINGS gives predictable real estate without feeling ad-heavy.

### Multi-city strategy

Santa Fe doesn't need to become a $500K business alone. Get Santa Fe to $50–100K, then reproduce in Albuquerque, Las Cruces, Rio Rancho, Los Alamos, etc.

---

## Santa Fe vs Catskill — market comparison

| Factor | Catskills / Hudson Valley | Santa Fe County |
|--------|---------------------------|-----------------|
| Population | Regional (multiple counties + NYC weekender traffic) | ~157K county |
| Tourism / second-home | High | High |
| Event density | High | High |
| Existing newsletter comp | None dominant at Catskill scale | SFR (~8K–10K subs) |
| Civic / government angle | Light in Catskill Crew | Strong opportunity (Legistar, meetings — Albuquerque Minute stack) |

Santa Fe Minutes can differentiate on **civic intelligence + culture/events**, where Catskill Crew is primarily **culture/events/lifestyle**.

---

## Suggested Cursor prompts

### Corpus-wide

- Map monetization CTAs by year across `@data/catskill-crew/catalog.md`
- Compare edition 1 vs edition 147 — what changed in business model integration?
- What recurring sections appear in 2025 vs 2026?

### Sponsor / partner analysis

- Extract all TOGETHER WITH blocks from `@data/catskill-crew/issues/2026/`
- How often does Pink's appear, and how does copy change over time?
- Compare 2024 "Let's Talk" sponsor format vs 2026 "PARTNER WITH" format

### Product launch playbooks

- Extract the Crew Card launch sequence from `@data/catskill-crew/issues/2024/` (editions ~15–25)
- How was Dinner Club introduced in Nov 2025 issues?
- Trace Snail Mail / Quarterly rollout across 2025–2026

### Editorial / voice

- Compare voice and tone in first 10 vs last 10 issues
- Extract event-listing patterns from 2024 issues
- How does THE REPORT section evolve from first appearance to 2026?

### Santa Fe application

- Given `@STRATEGIC-REFERENCE.md`, draft a Year 1 monetization timeline for Santa Fe Minutes
- Which Catskill editorial sections translate to Santa Fe, which don't?
- Draft a "TOGETHER WITH" template based on 2026 Catskill partner blocks

---

## Sources

- Local corpus: `data/catskill-crew/issues/` (147 public web issues)
- [Creator Diaries — Michael Kauffman Q&A](https://creatordiaries.beehiiv.com/p/q-a-with-michael-kauffman-founder-of-catskill-crew-403e)
- [beehiiv — How Michael Kauffman Built a Profitable Newsletter Business](https://www.beehiiv.com/blog/how-michael-kaufman-built-a-profitable-newsletter-business)
- [Nieman Lab — Are these local newsletters local news?](https://www.niemanlab.org/2025/10/are-these-local-newsletters-local-news-and-does-it-matter/)
- [High Signal — Catskill Crew founder local media empire](https://www.highsignal.io/catskill-crew-founder-local-media-empire/)
- SFR newsletter inventory benchmarks (user research)

---

## Maintenance

Re-run corpus sync periodically to capture new issues:

```bash
npm run sync:catskill-crew
```

After sync, re-run year-over-year CTA analysis if monetization patterns shift. Update this doc when new public revenue disclosures appear.
