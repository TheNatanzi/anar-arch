# Arch execution fixes 2 — from council round 4 (Argon 9.5/8/8, Astra 7/6/7, Fable 6/7/7)

Owner rule unchanged: Arch keeps its design and copy; execution fixes only. Sources: docs/council/results/r4-*.json.

## 1. Bugs (blocking)
- Desktop shot 4: the fixed header slices the top of the brown poster CTA's cream wordmark. Add `padding-top: calc(var(--header-h) + clamp(48px,8vh,80px))` on `.cta--poster` (and ensure the section's scroll-margin matches) so nothing sits under the header at any scroll stop; re-check every section top the same way.
- Nav links to how-we-work.html and about.html point at pages that do not exist in this build. CREATE both pages for Arch: take the content structure from C:\dev\anar-site (branch canopy) how-we-work.html and about.html (five steps, two options, FAQ, founder letter, hidden bio/proof slots) but render them with the Arch header/footer/palette/typography (cream, brown, red; TT Ramillas Bold; painted branches; same footer grid; same header with the centred red wordmark static; video pause control not needed there). No night-palette styles. Keep copy as in those source pages except any catering/decor/rentals wording.
- weddings.html Sofreh Aghd: "We design an architectural, modern sofreh and lay it exactly as your family keeps it." breaks the owner's no-decor rule → "We plan the sofreh with your family and your sofreh designer, and check the spread against the sofreh key before the elders are seated." Scan both pages for any other design/decor/rental/catering promise and neutralise to coordination wording.
- Mobile nav must work when site.js fails: links visible by default, collapsed only after the drawer handlers initialise; toggle hidden until then. Escape returns focus to `.nav-toggle`; close on outside click, on focus leaving the header and on resize ≥768; `aria-hidden` on the collapsed drawer; stop Lenis while the drawer is open.
- The header pause control must pause ALL motion (video + branch sway + clouds + parallax), not only the video; honour prefers-reduced-motion for the sway.

## 2. Polish (execution)
- Clouds hidden until their motion timeline initialises (no flash).
- `getTotalLength()` guarded (try/catch, skip hidden SVGs) and recomputed on refresh.
- `.hero-toggle` hit area 44px.
- Branch parallax cap: `BRANCH_MAX = max(0, .25*innerHeight - headerHeight - 16)` so a branch tip never passes under the header; phones: one branch tip only (left, 150px, top 60vh, opacity .8, masked 24px before the text column).
- Journey: labels 16px, notes ≥15px/22px brown at every width; no mid-word breaks (overflow-wrap:normal; hyphens:manual); phone dot centred on the line (left:-35px or line at left:6px).
- Form rows: bottom-align paired fields, consistent input height; phones: tradition checks in one column, each label ≥44px tall.
- Accordion images: srcset 800w/1200w + sizes; closed strips blur 2px (not 6px), scale 1.04, gradient rgba(67,38,23,.7)→.15.
- Self-host gsap/ScrollTrigger/lenis under assets/js/vendor (copy from C:\dev\anar-site\assets\js\vendor) instead of CDN tags.
- Poster CTA button href "#inquire" on index.

## Parked for the owner (do NOT do): red token #9E1B32 vs #D10C0C; column top rules; journey stop order; founder quote duplicating the Who paragraph; form fields; Persian eyebrow for "Who we are".

Verify: `node --check assets/js/site.js`; `PYTHONIOENCODING=utf-8 python docs/shots.py` with pages index, weddings, how-we-work, about (edit the pages list) → 0 errors; Read every shot — nothing under the header, nothing covered, Bold everywhere, new pages match Arch. Commit `git -c user.name=anar -c user.email=anar@local commit -am "Arch: round 4 execution fixes + how-we-work/about pages"`. ≤12-line summary.
