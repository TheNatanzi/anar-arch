"""Round-6 verification: CTA wordmark vs header at the 0.92 stop (1440x900, 1366x768), no-JS accordion, reduced-motion +
saved 'playing' -> no video, short-landscape accordion, strip body not clipped, phone hero geometry, form messages, pause.
Writes docs/shots/fix6-*.jpg. Run: PYTHONIOENCODING=utf-8 python docs/fix6-verify.py"""
import threading, http.server, functools
from pathlib import Path
from playwright.sync_api import sync_playwright
SITE = Path(r'C:\dev\anar-arch'); OUT = SITE / 'docs' / 'shots'
PORT = 5182
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE))
class Quiet(H.func):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Quiet, directory=str(SITE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{PORT}/index.html'
RECT = "(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }"
fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')

    # 1. CTA wordmark vs header at the 0.92 stop
    for (w, h) in [(1440, 900), (1366, 768)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(2500)
        total = pg.evaluate('document.documentElement.scrollHeight')
        pg.evaluate(f'window.scrollTo(0, {int((total - h) * .92)})'); pg.wait_for_timeout(900)
        wm = pg.evaluate(RECT, '.cta__wordmark'); hb = pg.evaluate(RECT, '.site-header')
        sec = pg.evaluate(RECT, '#cta')
        print(f'{w}x{h}: total {total}, cta top {sec[1]}, wordmark top {wm[1]} (h {wm[3]}), header bottom {hb[1]+hb[3]}')
        check(wm[1] >= hb[1] + hb[3], f'{w}x{h} CTA wordmark clear of the header at the 0.92 stop')
        pg.screenshot(path=str(OUT / f'fix6-cta-{w}.jpg'), type='jpeg', quality=80)
        ctx.close()

    # 2. No-JS desktop: celebration cards stacked, every body visible, no overlay buttons
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, java_script_enabled=False)
    pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(800)
    pg.evaluate("document.querySelector('#celebrations').scrollIntoView()"); pg.wait_for_timeout(300)
    disp = pg.evaluate("getComputedStyle(document.querySelector('.accordion')).display")
    bodies = pg.evaluate("[...document.querySelectorAll('.accordion__body')].map(b => [getComputedStyle(b).opacity, getComputedStyle(b).position, b.getBoundingClientRect().height])")
    trig = pg.evaluate("[...document.querySelectorAll('.accordion__trigger')].map(t => getComputedStyle(t).display)")
    print('no-JS accordion:', disp, bodies, trig)
    check(disp == 'grid' and all(o == '1' and pos == 'relative' and hh > 100 for o, pos, hh in bodies) and all(t == 'none' for t in trig), 'no-JS: stacked cards, bodies visible, overlay buttons gone')
    pg.screenshot(path=str(OUT / 'fix6-nojs-accordion.jpg'), type='jpeg', quality=80)
    ctx.close()

    # 3. Reduced motion + saved 'playing' -> no video source, html.paused, no Lenis
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    ctx.add_init_script("try { sessionStorage.setItem('anar-motion', 'playing'); } catch (e) {}")
    pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(2500)
    src = pg.evaluate("document.querySelectorAll('.hero__video source').length")
    cls = pg.evaluate("document.documentElement.className")
    pressed = pg.evaluate("document.querySelector('.hero-toggle').getAttribute('aria-pressed')")
    print('reduced + saved playing:', 'sources', src, '| html class:', cls, '| aria-pressed', pressed)
    check(src == 0 and 'paused' in cls and 'lenis' not in cls and pressed == 'true', 'reduced motion + saved playing: no video, paused, no Lenis')
    ctx.close()

    # 4. Short landscape (1366x700): stacked cards, not clipped; triggers hidden
    ctx = b.new_context(viewport={'width': 1366, 'height': 700})
    pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(2000)
    pg.evaluate("document.querySelector('#celebrations').scrollIntoView()"); pg.wait_for_timeout(1500)
    disp = pg.evaluate("getComputedStyle(document.querySelector('.accordion')).display")
    clipped = pg.evaluate("[...document.querySelectorAll('.accordion__panel')].map(p => { const b = p.querySelector('.accordion__body').getBoundingClientRect(), r = p.getBoundingClientRect(); return b.bottom <= r.bottom + 1 && b.top >= r.top - 1; })")
    hidden = pg.evaluate("[...document.querySelectorAll('.accordion__trigger')].map(t => t.hidden)")
    print('1366x700:', disp, clipped, hidden)
    check(disp == 'grid' and all(clipped) and all(hidden), '1366x700: accordion stacked, bodies inside their cards, triggers hidden')
    pg.screenshot(path=str(OUT / 'fix6-short-landscape.jpg'), type='jpeg', quality=80)
    ctx.close()

    # 5. Strip at 1366x768: the open body sits inside its panel (no clipping), closed bodies out of flow
    ctx = b.new_context(viewport={'width': 1366, 'height': 768})
    pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(2000)
    pg.evaluate("document.querySelector('#celebrations').scrollIntoView()"); pg.wait_for_timeout(1500)
    for i in range(4):
        pg.evaluate(f"document.querySelectorAll('.accordion__trigger')[{i}].click()"); pg.wait_for_timeout(900)
        ok = pg.evaluate("(() => { const p = document.querySelector('.accordion__panel.is-open'), b = p.querySelector('.accordion__body').getBoundingClientRect(), r = p.getBoundingClientRect(), last = p.querySelector('.accordion__body p:last-child').getBoundingClientRect(); return [Math.round(r.height), Math.round(b.height), last.bottom <= r.bottom + 1 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1]; })()")
        print(f'strip panel {i}:', ok)
        check(ok[2], f'1366x768 strip: open panel {i} body not clipped')
    pg.evaluate("document.querySelectorAll('.accordion__trigger')[0].click()"); pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / 'fix6-strip-1366.jpg'), type='jpeg', quality=80)
    ctx.close()

    # 6. Phone hero: the lettering overlaps the lower arch band; wordmark clear of the tagline
    for (w, h) in [(390, 844), (390, 600), (430, 932)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=True)
        pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(1500)
        arch = pg.evaluate(RECT, '.hero__window'); wm = pg.evaluate(RECT, '.hero__word'); tag = pg.evaluate(RECT, '.hero__tag')
        letters_bottom = wm[1] + wm[3] * 0.566
        print(f'{w}x{h}: arch bottom {arch[1]+arch[3]}, wordmark {wm[1]}..{wm[1]+wm[3]} (letters end {letters_bottom:.0f}), tagline top {tag[1]}')
        check(wm[1] < arch[1] + arch[3] < wm[1] + wm[3] and wm[1] + wm[3] <= tag[1], f'{w}x{h}: wordmark hangs from the arch foot and clears the tagline')
        if (w, h) == (390, 844): pg.screenshot(path=str(OUT / 'fix6-phone-hero.jpg'), type='jpeg', quality=80)
        ctx.close()

    # 7. Form: empty submit -> aria-invalid + per-field messages, first invalid focused; date min = today
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); pg.goto(URL, wait_until='load'); pg.wait_for_timeout(1500)
    pg.evaluate("document.querySelector('#inquire').scrollIntoView()"); pg.wait_for_timeout(1200)
    pg.fill('#f-email', 'not-an-email')
    pg.click('.form button[type=submit]'); pg.wait_for_timeout(300)
    res = pg.evaluate("[...document.querySelectorAll('.field [aria-invalid=\"true\"]')].map(el => [el.id, el.getAttribute('aria-describedby'), document.getElementById(el.id + '-error').textContent])")
    focused = pg.evaluate("document.activeElement.id")
    dmin = pg.evaluate("document.querySelector('#f-date').min")
    print('form invalid:', res, '| focused:', focused, '| date min:', dmin)
    check(len(res) == 2 and res[0][0] == 'f-names' and 'f-names-help' in res[0][1] and focused == 'f-names' and len(dmin) == 10, 'form: aria-invalid + messages on names/email, help kept, first invalid focused, date min set')
    pg.fill('#f-names', 'Sara & Omid'); pg.fill('#f-email', 'sara@example.com'); pg.wait_for_timeout(200)
    left = pg.evaluate("document.querySelectorAll('.field [aria-invalid=\"true\"]').length")
    check(left == 0, 'form: messages clear on input')
    pg.evaluate("document.querySelector('#f-names').value=''"); pg.click('.form button[type=submit]'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / 'fix6-form-error.jpg'), type='jpeg', quality=80)
    # 7b. Pause motion: Lenis gone, html.paused, anchor jumps at once
    pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(600)
    pg.click('.hero-toggle'); pg.wait_for_timeout(400)
    cls = pg.evaluate('document.documentElement.className')
    pg.evaluate("document.querySelector('.site-inquire').click()"); pg.wait_for_timeout(120)
    y = pg.evaluate('window.scrollY'); target = pg.evaluate("document.querySelector('#inquire').getBoundingClientRect().top")
    print('paused class:', cls, '| scrollY 120ms after the anchor click:', y, '| #inquire top:', target)
    check('paused' in cls and 'lenis' not in cls and 'motion' not in cls and abs(target - 120) < 4, 'pause: no Lenis, html.paused, anchor landed at once (header + 24px)')
    pg.click('.hero-toggle'); pg.wait_for_timeout(400)
    cls = pg.evaluate('document.documentElement.className')
    check('paused' not in cls and 'lenis' in cls and 'motion' in cls, 'play: Lenis and motion back')
    ctx.close()
    b.close()
srv.shutdown()
print(len(fails), 'failures'); [print(' -', f) for f in fails]
