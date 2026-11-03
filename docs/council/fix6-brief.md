# Arch execution fixes 4 — from council round 6 (Argon 9.5/8/9, Astra 8/7/7, Fable 7/8/8)

Owner rule unchanged: design, section/journey order, copy, form fields and palette tokens stay. Execution only. Sources: docs/council/results/r6-*.json.

## 1. Must fix
- Header over the poster CTA wordmark (flagged every round): `.cta--poster` desktop padding-top `clamp(112px,15vh,144px)` and `::before` frame top offset so the wordmark starts a full header height below the frame's top edge; verify at the 0.92 stop at 1440×900 and 1366×768.
- Saved "playing" preference must never bypass prefers-reduced-motion or Save-Data on load (honour them first; the saved choice only applies when motion is allowed).
- No-JS: desktop celebration cards fully visible by default; collapsing styles + overlay buttons only after JS initialises (`.js`-scoped rules).
- Desktop accordion: content-safe min-height (no viewport-capped height that clips); switch to stacked cards in short landscape viewports (≤ 700px tall).
- Pause motion: also stop Lenis, use immediate anchor scrolling while paused, keep the accordion usable.
- measure(): read the hero wordmark rect while `.logo-morph` is not transforming (or from the h1 img rect).

## 2. Polish
- Phones: wordmark positioned relative to the arch bottom so its lettering overlaps the lower arch band like on desktop (no 150px gap); or, if the arch must shrink to do that, cap it at 40svh. Desktop: `.hero__shade,.hero__window{max-height:62vh}` so the arch base and the kashida separate.
- Form: `.field__help` moves under the input (order:3; aria-describedby kept) so paired labels share a baseline; `invalid`/`input` listeners set aria-invalid + a per-field message; date input `min` = today; 54px inputs.
- `.journey` padding-bottom and `.inquire` padding-top `clamp(40px,6vh,64px)` below 1024px; phones `.section{padding-block:clamp(56px,8vh,80px)}`; `.pair` on phones keeps the Persian on the eyebrow row (`grid-template-columns:1fr auto`); `.pillar__n.fa{text-align:left}`; `.accordion__body .fa{text-align:right}`.
- Head: preload hero-poster-small.jpg (fetchpriority high) after the fonts; serve hero-1080-loop only when (min-width:1280px) and devicePixelRatio ≥ 1.5 (else 720); `TREE_LAYERS.leftBranch.sizes` matched to the rendered widths (520px ≥1400, 26vw ≥768, 200px phones).

## Parked for the owner (do NOT do): --red token; journey stop order (Mehndi before Aghd/Nikah — flagged by all three planners as culturally wrong); baraat sentence placement; "Our proposal" label; proof slot; cell-top borders; combined spacing between celebrations and quote.

Verify: `node --check assets/js/site.js`; `PYTHONIOENCODING=utf-8 python docs/shots.py` → 0 errors; Read index-desktop-4 (wordmark clear of the header), index-phone-0 (arch/wordmark relation), weddings/how-we-work/about one shot each; Playwright: no-JS accordion readable, reduced-motion + saved 'playing' → no video, short landscape accordion not clipped. Commit `git -c user.name=anar -c user.email=anar@local commit -am "Arch: round 6 execution fixes"`. ≤12-line summary.
