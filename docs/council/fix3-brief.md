# Arch execution fixes — from council round 3 (Argon 8/8.8/9, Astra 6/6/6, Fable 7/7/6.5)

Owner rule: Arch keeps its morning design and copy. Apply ONLY execution fixes below (typography rule, performance, accessibility, readability, polish on the chosen poster CTA). Do NOT restructure sections, reorder the journey, change copy, add form fields or change the palette tokens. Sources: docs/council/results/r3-*.json.

## 1. Owner's standing typography rule
- TT Ramillas BOLD (weight 700, normal) for ALL Latin text — body, eyebrows, captions, quote, notes, form controls, buttons. Remove every Regular/Italic face and weight-400/italic override; hierarchy by size, tracking and colour. Keep Noto Naskh for Persian. Preload only the Bold file; remove Regular/Italic woff2 files and their @font-face rules.

## 2. Performance
- Hero video: the current hero-1080.mp4 (30.9 MB) and hero-720.mp4 (12 MB) are far too heavy. Copy the loop files from C:\dev\anar-site\assets\video\ (hero-1080-loop.mp4 2.5 MB, hero-720-loop.mp4 1.2 MB, hero-poster-small.jpg) and use them; pick the source in JS via matchMedia('(min-width:901px)') (browsers ignore `media` on <source>), preload=none with the poster, don't load under prefers-reduced-motion or Save-Data, pause when off-screen and on document.hidden. Delete the two big files.
- Painted WebPs (branches, clouds, leaf band, ground): export 1400px-wide variants with Pillow and add srcset/sizes (branches render ≤520px, bands ≤1440px).
- Remove `loading="lazy"` from above-the-fold art; keep it on below-fold images.

## 3. Accessibility / robustness
- Accordion: register click/keyboard handlers BEFORE the motion-only early return; panels get ids + aria-controls, closed desktop bodies hidden/inert; everything operable under reduced motion and without GSAP.
- A visible, keyboard-accessible pause/play control for the hero video, docked in the header bar (right side) — never floating over content; default to the poster under reduced motion.
- The wordmark morph must keep an accessible <h1>: when `.hero__word` is visually hidden use opacity:0 + a visually-hidden "Anar Events" span (not visibility:hidden on the h1).
- Phone drawer open over the hero: `.site-header--over.nav-open{background:var(--cream);color:var(--brown)}` and the red header wordmark visible in that state.
- Skip link / same-page anchors: header-sized `scroll-margin-top` on targets; move focus to the destination.
- Form: submit via fetch (Accept: application/json) to the existing Formspree action; pending/success/failure states in a role="status" region; keep values on failure; required fields marked in the label; `aria-describedby` for the names hint; add a WhatsApp link beside the phone in the form note (wa.me/19252639949). Keep the field set exactly as is.
- Hero video pauses when the hero leaves the viewport.
- og:image absolute (https://anarevents.com/assets/video/hero-poster.jpg), og:url + canonical on both pages.

## 4. Readability / polish (no design change)
- Hero wordmark over bright video: add `filter:drop-shadow(0 4px 24px rgba(67,38,23,.45))` to `.hero__word`; raise `.hero__shade` to rgba(67,38,23,.76). Phone: window top 12vh so it clears the header; `.hero__tag` gets text-shadow 0 1px 6px rgba(67,38,23,.6) and the Persian/English on two lines at 16px.
- Journey on desktop: show the notes (12–13px muted under each label); keep the vertical list up to 1023px and use the 9-column line only from 1024px with `overflow-wrap:anywhere` — order of stops unchanged.
- Branches: slow 8s ±1.2° sway tween (paused under reduced motion); BRANCH_MAX ~40vh.
- Poster CTA (#cta): frame 2px; the kashida-tagline rules in amber (var(--amber)); padding-block clamp(64px,10vh,112px).
- Footer: remove `.site-footer` border-top (the ground band separates it); bottom row rule = 2px cream kashida style.

Verify: `node --check assets/js/site.js`; `PYTHONIOENCODING=utf-8 python docs/shots.py` (0 errors); Read every shot (desktop + phone) — Bold everywhere, nothing covered, hero readable; Playwright: reduced motion → accordion opens, poster only, header logo visible; drawer over hero readable; form shows inline states. Commit `git -c user.name=anar -c user.email=anar@local commit -am "Arch: execution fixes (Bold, video weight, a11y, form states, readability)"`. ≤12-line summary.
