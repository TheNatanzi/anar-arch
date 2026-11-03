"""Arch version: painted replacements for the flat clip-art layers (same roles, same placements), in the Canopy tree's
gouache style. Paid Gemini image API (Medi: no cap on this project). Writes src-assets/painted/<role>.png (magenta bg)
and assets/tree/painted/<role>.webp (keyed). Usage: arch_art.py [role ...]"""
import os, sys, json, base64, urllib.request, time
import numpy as np
from PIL import Image, ImageFilter
SITE = r'C:\dev\anar-arch'; RAW = os.path.join(SITE, 'src-assets', 'painted'); OUT = os.path.join(SITE, 'assets', 'tree', 'painted')
os.makedirs(RAW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
REF = r'C:\dev\anar-site\src-assets\tree\tiles\tile-A.png'
MODEL = 'gemini-3.1-flash-image'
STYLE = ("Painted illustration in opaque gouache, exactly matching the reference painting's style: olive-green leaves with light and dark "
         "facets, glossy red pomegranates with small crowns, warm brown bark with visible brush strokes, soft painterly edges, no outlines. "
         "The background is one flat, solid, uniform magenta #FF00FF everywhere there is no painting. No text, no border, no sky.")
JOBS = {
  'left-branch':  ("Landscape. ONE pomegranate branch enters from the LEFT edge at mid-height and reaches about 55% of the width, "
                   "with leaves and five or six pomegranates; the right 45% of the image and the top and bottom stay empty magenta.", '16:9'),
  'right-branch': ("Landscape. ONE pomegranate branch enters from the RIGHT edge at mid-height and reaches about 55% of the width, "
                   "with leaves and five or six pomegranates; the left 45% of the image and the top and bottom stay empty magenta.", '16:9'),
  'bottom-canopy':("Landscape. A dense band of large pomegranate leaves with three ripe pomegranates fills the BOTTOM 55% of the image, "
                   "spanning the full width, with a soft irregular upper edge; the top 45% stays empty magenta.", '16:9'),
  'ground-bottom':("Landscape. A painted ground band fills the BOTTOM 45% of the image across the full width: dark soil, tufts of grass, "
                   "low roots creeping along the ground, two fallen pomegranates (one split open) and scattered seeds. NO tree trunks, nothing rising above the ground band; the top 55% stays empty magenta.", '16:9'),
  'cloud-1':      ("Landscape. One soft, loosely painted cream-and-warm-grey cloud shape, gouache, occupying the centre 60% of the image; "
                   "everything else empty magenta.", '16:9'),
  'cloud-2':      ("Landscape. Two soft, loosely painted cream-and-warm-grey cloud shapes, gouache, one left, one right, lower half of the image; "
                   "everything else empty magenta.", '16:9'),
}
def key(src):
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = np.clip(((r + b) / 2 - g) / 255, 0, 1); alpha = np.clip((0.55 - mag) / 0.25, 0, 1)
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    alpha = np.asarray(al).astype(np.float32) / 255
    fruit = (r > b + 60); spill = np.clip(np.minimum(r, b) - g, 0, 255); spill = np.where(fruit, 0, spill)
    rgb = np.dstack([r - spill, g, b - spill]); return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')
ref = base64.b64encode(open(REF, 'rb').read()).decode()
for role in (sys.argv[1:] or JOBS):
    prompt, ar = JOBS[role]
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": "image/png", "data": ref}}, {"text": STYLE + ' ' + prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": ar, "imageSize": "2K"}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    t = time.time(); r = json.load(urllib.request.urlopen(req, timeout=300))
    for p in r["candidates"][0]["content"]["parts"]:
        if "inlineData" in p:
            raw = os.path.join(RAW, f'{role}.png'); open(raw, 'wb').write(base64.b64decode(p["inlineData"]["data"]))
            im = key(raw); im.save(os.path.join(OUT, f'{role}.webp'), 'WEBP', quality=88, method=6)
            print(role, im.size, round(time.time() - t, 1), 's', os.path.getsize(os.path.join(OUT, f'{role}.webp')) // 1024, 'KB')
