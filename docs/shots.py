"""Screenshot every page at desktop + phone, 5 scroll points each, for the council. Writes docs/council/shots/*.jpg and a manifest."""
import os, sys, json, threading, http.server, functools, time
from pathlib import Path
from playwright.sync_api import sync_playwright
SITE = Path(r'C:\dev\anar-arch'); OUT = SITE / 'docs' / 'shots'; OUT.mkdir(parents=True, exist_ok=True)
PORT = 5181
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE))
srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
pages = ['index.html', 'weddings.html']
views = {'desktop': (1440, 900), 'phone': (390, 844)}
manifest, errors = [], []
with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge')
    for vname, (w, h) in views.items():
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=(vname == 'phone'))
        pg = ctx.new_page(); pg.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        for page in pages:
            if not (SITE / page).exists(): continue
            pg.goto(f'http://127.0.0.1:{PORT}/{page}', wait_until='load'); pg.wait_for_timeout(2500)
            total = pg.evaluate('document.documentElement.scrollHeight')
            for i, frac in enumerate([0, .22, .45, .68, .92]):
                pg.evaluate(f'window.scrollTo(0, {int((total - h) * frac)})'); pg.wait_for_timeout(900)
                f = OUT / f'{page[:-5]}-{vname}-{i}.jpg'; pg.screenshot(path=str(f), type='jpeg', quality=80)
                manifest.append({'page': page, 'view': vname, 'scroll': frac, 'file': f.name})
            ov = pg.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
            if ov: errors.append(f'{page} {vname}: horizontal overflow')
        ctx.close()
    b.close()
srv.shutdown()
(OUT / 'manifest.json').write_text(json.dumps({'shots': manifest, 'errors': errors}, indent=1), encoding='utf8')
print(len(manifest), 'shots;', len(errors), 'errors'); [print(' ', e) for e in errors[:20]]
