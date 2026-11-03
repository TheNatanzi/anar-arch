# Anar Events website — build brief (overnight, 3 Nov 2026)

Owner: Medi. Business: Anar Events (Anar LLC), wedding planning and coordination for Persian, Afghan and South Asian families, San Francisco Bay Area. Say NOTHING about catering, decor or rentals (not "we do", not "we don't"). Phone (925) 263-9949 · hello@anarevents.com · anarevents.com.

## Reference to recreate (condensed): white-desert.com — motion map, frame by frame
1. Hero: full-bleed looping video (muted, autoplay) seen THROUGH a frame (their plane window). Ours: the video sits behind an arched "mirror window" (brand device: half-circle top, square bottom corners, 2px line). Giant word across the bottom third: theirs ANTARCTICA; ours انار / ANAR in the logo's condensed caps feel (use the logo SVG for the word, never retype).
2. Scroll 1 (0–100vh): the giant word blurs (filter: blur 0→12px) and fades as it rises slower than the page; clouds roll in from the bottom (two soft cloud PNG layers moving up at different speeds). Ours: clouds = soft pomegranate-leaf canopy / blossom haze, cream and sage, drifting in.
3. Scroll 2: the hero fades to a white (ours: cream #F0E6D5) page. A thin 6-column grid of hairlines stays visible across the whole page (they use 1px vertical lines at the column edges). We use the brand grid: 12 cols on desktop, hairlines in #C9B9A2 at 25% opacity.
4. Statement block: small italic label ("The Last Continent") with a hand-drawn signature scribble under it, then a big uppercase serif statement (4–5 lines, letter-spaced). Ours: label "Reimagined Heritage" in TT Ramillas, scribble = one red kashida line drawn on by scroll (SVG stroke-dashoffset), statement in TT Ramillas Bold caps, brown.
5. Scroll 3: a photo of mountains rises from below and PARALLAXES at a different speed to the text that sits on it (text column top-left, 1/3 width). Ours: the pomegranate TREE begins here: canopy top with fruit, we scroll DOWN the tree: canopy → fruit → trunk → roots → ground. 4–5 image layers at different speeds (far canopy slowest, near fruit fastest). Text blocks ("Who we are", "Three pillars") sit beside the trunk as we descend.
6. "OUR TRIPS": centred serif title with a scribble, then an accordion of full-width image panels: the open one is wide (60%), the closed ones are narrow blurred strips (10% each) that expand on hover. Ours: "The celebrations" — Sofreh Aghd · Nikah · Mehndi & Sangeet · Reception & Walima, same accordion. Use the few portfolio photos later; for now a tinted brand-pattern panel + the pomegranate photos we have.
7. Quote: big italic quote, hand signature, name + title. Ours: founder line from Medi, signed "Medi, founder".
8. "OUR CAMPS": title over a full-bleed photo; as you scroll, 3 vertical cyan-ice strips slide over the photo from the right (curtain reveal), then the next section cards (WHICHAWAY / ECHO) slide in over an ice texture, two cards side by side with a coordinates caption. Ours: "How we work" teaser with 2 cards (Plan · Run the day) over the Termeh weave pattern, strips = kashida lines in anar red.
9. Map section: route line draws on with scroll, stats (flight time, distance, temp). Ours: "The journey": 9 stops on ONE kashida line that draws on with scroll (Enquiry → Consultation → Proposal → Planning → Khastegari → Aghd/Nikah → Mehndi → Reception → Thank-you), each stop a red dot with Persian + English label.
10. Footer CTA: "START PLANNING YOUR ADVENTURE" + Get in touch. Ours: "Reimagined Heritage" + Inquire. Then footer: cream logo on brown band, contact, Instagram, Persian line انار · برنامه‌ریزی عروسی و جشن.
11. Persistent: nav top (left: Weddings · How we work · About; centre: logo; right: Inquire), a vertical orange "How it works +" tab pinned right-middle that opens a SLIDE-OUT PANEL from the right with 6 numbered steps (ours: amber #FFB401 tab "How we work +", panel on cream, 5 steps). A round chat bubble bottom-right (ours: none).
12. Feel: every section enters with a slow fade+rise (0.9s, ease out), images have a soft 1.02→1 scale on reveal, hover on cards nudges 4px, text under photos staggers in. Smooth scroll (Lenis). Cursor: default.

## Brand (from the brand book, day palette)
- Anar red #9E1B32 (accent on cream, logo), Seed red #E8243F (big type on brown only), Cream #F0E6D5 (page), Brown #432617 (ink + dark ground), Brown-muted #756053 (captions), Amber #FFB401 (accent on brown only; the one button), Gold #B8922F (foil feel, sparingly).
- Type: TT Ramillas Bold for ALL Latin (trial woff2 in assets/fonts — Medi must BUY before launch, say so in the handoff). Persian: Noto Naskh Arabic (Google). Persian never italic, never tracked, never caps.
- Logo files: assets/logo/*.svg (red on cream, cream on brown, with/without URL in the kashida). Never retype the logo.
- Devices: the kashida line (1/2/4px), the mirror window (arched frame), patterns: Termeh weave (assets/patterns/termeh.svg), Kashida courses.
- Taglines: "Reimagined Heritage". Brand lines: "Honoring the roots. Elevating the vibe." / "Timeless traditions, curated for the modern era." / "Keep the soul. Redefine the style."
- Copy source: ../anar-brand-book.md (voice, snippets, promises). Short pitch: "Bespoke Persian, Afghan & South Asian weddings. Deeply fluent in the traditions your family cherishes; obsessed with the modern aesthetic you actually want."

## Pages
- index.html (long scroll, sections 1–11 above)
- weddings.html (one section per tradition: Sofreh Aghd, Nikah, Mehndi & Sangeet, Reception & Walima, Nowruz/Yalda seasonal note; each: Persian title right, English left, 3 lines, one image slot)
- how-we-work.html (5 steps on one kashida line + FAQ 6 items + "what you get")
- about.html (founder letter 6 lines, the name/pomegranate story with the 3 pomegranate photos, the promise)
- inquire: a section on index + its own anchor; form posts to Formspree: action="https://formspree.io/f/FORMSPREE_ID" (placeholder; Medi replaces). Fields: your names, email, phone, wedding date, traditions (checkboxes), guest count, message. Button: "Begin the conversation".
- EN only for now. Persian lines as accents only.

## Tech
- Static: /site/index.html + /site/assets/{css,js,fonts,img,tree,video,logo,patterns}. No build step. GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.x (cdnjs or unpkg pinned). No React.
- Video: assets/video/hero-1080.mp4 + hero-720.mp4 (muted loop, poster hero-poster.jpg). <video autoplay muted loop playsinline>.
- Tree layers (PNG on transparent, 1600px wide unless noted; produced by Gemini, keyed): assets/tree/canopy-far.png (soft, blurred, 2400w), canopy-near.png, fruit-cluster-1.png, fruit-cluster-2.png, trunk.png (tall, ~1200×4800), roots.png, ground.png, cloud-1.png, cloud-2.png, leaf-1.png … leaf-4.png (small floaters). Until they exist, use the placeholders in assets/tree/placeholder-*.svg so layout can be built and tested.
- Performance: lazy-load everything below the hero, prefers-reduced-motion respected, no layout shift (set width/height), Lighthouse mobile ≥ 85.
- Mobile: single column, tree layers scaled, accordion becomes stacked cards, panel becomes a bottom sheet.
- Launch.json: a static server on port 5173 (npx serve or python -m http.server) for the Browser pane.

## Council (9 seats): each scores /10 with 3 fixes; ALL must be ≥ 9 to pass
Models: Codex Astra (`codex exec --skip-git-repo-check -m gpt-6-astra`, run from C:\Claude), Claude Fable (`claude -p --model claude-fable-5-1`), Gemini Argon (gemini.google.com in Chrome, model Argon; Flash as a second opinion). Roles per model: Wedding planner (Persian/Afghan/South Asian families, conversion), Brand creative lead (does it feel like the brand book, premium, alive), Web developer (code quality, motion, performance, mobile, a11y). Inputs: screenshots desktop + mobile at 5 scroll points, the HTML/CSS/JS, this brief. Output JSON: {role, model, score, fixes:[...]}.

## RULE from Medi (3 Nov): the tree frames the page, never covers it
- Tree art lives ONLY on the left side, right side and bottom of the viewport. The centre and the top band (nav + headline area, top ~25%) stay clear, like White Desert's mountains that frame the edges.
- So the layers are: left-branch.png (branches + leaves + fruit entering from the left edge), right-branch.png (mirror, from the right edge), bottom-canopy.png (fruit and leaves rising from the bottom edge, like their clouds), trunk-left.png and trunk-right.png (vertical trunks hugging the left/right edges as we scroll down), roots-bottom.png, ground-bottom.png. No layer sits in the middle 50% of the width above the fold.
- Text and photos always sit in the open centre.
