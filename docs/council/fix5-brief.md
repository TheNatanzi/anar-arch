# Arch execution fixes 3 — from council round 5 (Argon 9.5/8/8, Astra 8/7/7, Fable 7/8/6)

Owner rule unchanged: design, section/journey order, copy, form fields and palette tokens stay. Execution only. Sources: docs/council/results/r5-*.json.

## 1. Bugs (blocking)
- how-we-work.html: the five-step kashida line renders as broken dashes — the V1000 path uses vector-effect:non-scaling-stroke so dash lengths must come from the rendered box: in pathLength(): `if (getComputedStyle(p).vectorEffect === 'non-scaling-stroke') { var b = p.getBoundingClientRect(); return Math.max(b.width, b.height); }`; remeasure on refresh. Check every kashida/track line on all four pages.
- index 1024–1600px: the nine-column journey (24px gutter) collides with the fixed branches masked for the 760px text column. Give `.journey` `position:relative; z-index:3` with a cream gradient background (transparent → cream at 96px) OR widen the branch mask stop to the journey's actual width while it is in view — no art under labels at 1024/1280/1440/1600.
- Opening the mobile drawer during the hero morph shows the header logo AND the travelling logo: hide the morph layer while `nav-open`, show the docked logo only, restore on close.
- OS reduced-motion change at runtime: destroy Lenis + remove its ticker callback, revert the gsap context, stop the video; re-init when motion returns.
- Inner pages run the branch sway with no pause control: include the header motion toggle on weddings/how-we-work/about (same behaviour, remembers the visitor's choice via sessionStorage).
- `.cta--poster` padding-top → `clamp(48px,8vh,80px)` (drop the header term; keep scroll-margin-top = header + 24px); `#inquire` scroll-margin-top = header + 24px.

## 2. Polish (execution)
- Phones: the left branch shows only a ~24px sliver — width 200px, `--phone-shift` 32px so a leafy tip shows, masked 24px before the text column; safe-area insets on `.hero__tag` / `.hero__word` bottoms.
- Desktop branches: left top 25vh, right top 38vh scaled .9 (so they don't mirror), masks unchanged.
- Form: inputs `border:2px solid var(--brown)` (match the 2px system); custom checkboxes (appearance:none, 18px, 2px brown, 2px radius, brown fill + cream tick when checked).
- Header: drop the 1px shadow line on the solid bar (box-shadow:none).
- Accordion phones: inactive overlay triggers hidden=true and out of the tab order (restore on desktop); reveal interactive containers immediately on focusin incl. hidden ancestors.
- Defer cloud image requests until motion is enabled; skip loading the hidden right branch on phones; add 700w variants for the branch, leaf band and ground (Pillow) to the srcsets; `.reveal-img` srcset/sizes on weddings; ScrollTrigger.refresh on every `<details>` toggle.
- Self-host Noto Naskh Arabic (copy C:\dev\anar-site\assets\fonts\NotoNaskhArabic-arabic.woff2 + its @font-face with unicode-range) and remove the Google Fonts link + preconnects on all pages.
- Celebrations strips: a visible "+" expand indicator on collapsed desktop panels (small gold/cream mark at the strip bottom), keeping the strip layout.

## Parked for the owner (do NOT do): --red token; cell-top borders; journey stop order / "Enquiry" spelling / Who-we-are copy and Persian pair; statement tracking; form fields (Attan, venue).

Verify: `node --check assets/js/site.js`; `PYTHONIOENCODING=utf-8 python docs/shots.py` (4 pages) → 0 errors; Read the how-we-work shots (line solid), index at 1024/1280/1440/1600 (journey clear of art), phone hero (branch tip visible, nothing under the header); Playwright: drawer during morph shows one logo; reduced-motion toggle at runtime stops Lenis. Commit `git -c user.name=anar -c user.email=anar@local commit -am "Arch: round 5 execution fixes"`. ≤12-line summary.
