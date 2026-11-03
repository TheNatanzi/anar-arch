# Arch fix pass 2 — from council round 2 (Argon 9.5/8/9, Astra 6/7/7, Fable 8/7.5/7)

Sources: docs/council/results/r2-*.json. Owner decisions stand (cream, arch window, wordmark, edge trunks, no tab, nothing covered, no stripes/hairlines, Bold Latin, no decor). Keep the rotated accordion labels (owner-approved strip design); do not add horizontal selectors.

## 1. Blocking (Fable dev/brand, Astra dev)
- Phone drawer over the hero: add `.site-header.nav-open` to the solid-header selector (cream bar, brown ink) so the open drawer is readable over the video.
- Phone ground seam: `.ground{isolation:isolate}` and trunk fade `end:'top 75%'` so the trunks are gone before the ground band (no hard horizontal cut).
- Desktop accordion: content-aware height (no fixed container height); stay stacked until the expanded panel has readable width; check 1024/1280/1440 at 700px tall.
- Reduced-motion change after load: revert GSAP context, destroy Lenis + its ticker, stop the video; re-init when motion returns.
- No-JS: nav links and all ceremony descriptions visible by default; collapsed states applied only after handlers init (`.js` prefix on the hiding rules).
- Kashida: use `getTotalLength()` for ordinary SVG paths; keep the rendered-length method only for non-scaling-stroke journey paths.
- Video button synced to play/pause/error events (update when play() rejects); keep `userPaused` as intent.

## 2. Brand (Argon brand, Fable brand, Astra brand)
- Remove repeated column/section borders (`.pillar`, `.tradition`, `.you-get` etc.) — spacing instead; keep the kashida and input outlines.
- Phone gutters asymmetric: 56px beside the trunk side, 24px on the open side (content column ≥ 300px at 390); phone trunk mask `object-position:-70px top; mask linear-gradient(to right,#000 25%,transparent 85%)`; `--edge-trunk:44px`.
- Desktop hero tokens: `--word-w:min(56vw,720px,80vh)`, `--arch-maxw:min(46vw,600px)` so the arch grows into the freed space; `.hero__shade` rgba(67,38,23,.8); phone arch capped ~40svh with the wordmark and lines rebalanced beneath.
- Hero tag: Persian on its own line above the English (two block spans; no " · " on phones).
- `.link-arrow`: `text-decoration:underline; text-decoration-color:var(--red); text-decoration-thickness:2px; text-underline-offset:.2em` instead of border-bottom; `.scribble` path → straight kashida stroke; kashida draw `end:'top 70%'`.
- `.pills`: flex-wrap centred, gap 6px 22px; separator on `.pill:not(:first-child)::before` (no dangling dot); `.ground` margin-top 0 with slightly more `.inquire` bottom padding.
- Accordion bodies: content aligned to the bottom (`justify-content:flex-end`); `::after` glyphs `content:"+" / ""` and `"\2013" / ""`; trigger names without "Show".
- Hide the video control once the hero leaves view; restore when it returns.

## 3. Dev (Argon dev, Fable dev)
- ScrollTrigger.refresh() on accordion transitionend / togglePhone and on crossing 769px; remove `loading="lazy"` from the trunk imgs; remove `will-change` from `.hero__foot`.
- Self-host gsap/ScrollTrigger/lenis under assets/js/vendor (copy from C:\dev\anar-site\assets\js\vendor) and drop the CDN tags; metric-matched "Ramillas Fallback" @font-face (size-adjust) before Georgia.

## 4. Planner copy (Astra planner, Fable planner, Argon planner)
- Coordination-only wording everywhere decor could be implied: replace "brief your sofreh designer / check the spread / seasonal table planning" with "We agree the ceremony timing, the family participants and the officiant cues; your sofreh designer and vendors get one timeline." (index #celebrations, #journey, weddings Sofreh/Nowruz & Yalda).
- Elders: "We agree elders' welcome, seating and access needs with your family and the ceremony venue." once per page instead of the universal "Elders are greeted first".
- "both scripts" → "the languages and scripts your families choose"; printed guides "coordinated when requested".
- #inquire: phone, WhatsApp and email links right under the intro ("Tell us about your family, your dates and the rituals that matter. We reply within one business day."); name + email + message visible, the rest under a native `<details>` "Tell us more"; traditions in one column on phones; "(optional)" on date(s)/season and guest count.
- Traditions: add Attan, Dholki / Mayun (pills + checkboxes); Haldi copy: "If your family observes the haldi, the turmeric blessing before the wedding…"; weddings Haldi & Pheras + Anand Karaj: milni "calling each pair of elders for the garland exchange, both sides agreed in advance".

Verify: `node --check assets/js/site.js`; `cd /c/dev/anar-arch && PYTHONIOENCODING=utf-8 python docs/council/shots.py` → "20 shots; 0 errors"; Read every shot; phone drawer-over-hero and ground seam must be visibly fixed; nothing covered. Commit `git -c user.name=anar -c user.email=anar@local commit -am "Arch fix pass 2"`. ≤15-line summary.
