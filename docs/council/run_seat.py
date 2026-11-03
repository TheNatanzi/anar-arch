"""Run one council seat on Medi's plans. Usage: run_seat.py <astra|fable|argon> <planner|brand|dev> [round]
astra -> codex exec (ChatGPT plan), fable -> claude -p (Claude plan). Argon seats run in the Gemini web app by hand.
Writes docs/council/results/r<round>-<model>-<role>.json"""
import os, sys, json, subprocess, re, time
SITE = r'C:\dev\anar-arch'; D = os.path.join(SITE, 'docs', 'council'); model, role = sys.argv[1], sys.argv[2]; rnd = sys.argv[3] if len(sys.argv) > 3 else '1'
os.makedirs(os.path.join(D, 'results'), exist_ok=True)
rubric = open(os.path.join(D, 'RUBRIC.md'), encoding='utf8').read()
files = ['index.html', 'weddings.html', 'how-we-work.html', 'about.html', 'assets/css/site.css', 'assets/js/site.js']
code = ''.join(f'\n\n===== {f} =====\n' + open(os.path.join(SITE, f), encoding='utf8').read() for f in files if os.path.exists(os.path.join(SITE, f)))
SH = os.path.join(SITE, 'docs', 'shots')
manifest = json.load(open(os.path.join(SH, 'manifest.json'), encoding='utf8'))
shots = [os.path.join(SH, s['file']) for s in manifest['shots'] if s['page'] == 'index.html'][:10]
errs = '\n'.join(manifest['errors']) or 'none'
seat = f"Your seat: model={model}, role={role}. Browser console errors/overflow found by the harness: {errs}.\nScreenshots of the home page (desktop then phone, 5 scroll points each) are at:\n" + '\n'.join(shots)
prompt = rubric + '\n\n' + seat + '\n\nTHE CODE:' + code
out = os.path.join(D, 'results', os.environ.get('RESDIR', ''), f'r{rnd}-{model}-{role}.json'); t = time.time()
if model == 'astra':
    cmd = ['codex.cmd', 'exec', '--skip-git-repo-check', '-m', 'gpt-6-astra', '-C', SITE, '-i', *shots[:6], '-']
    r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, encoding='utf8', errors='replace', cwd=r'C:\Claude', timeout=1500)
    txt = r.stdout
elif model == 'argon':
    # paid Gemini API (approved by Medi 2026-11-03, no cap on this project); the 10 shots go in as inline JPEGs
    import base64, urllib.request
    parts = [{'inlineData': {'mimeType': 'image/jpeg', 'data': base64.b64encode(open(s, 'rb').read()).decode()}} for s in shots] + [{'text': prompt}]
    body = {'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json'}}
    req = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-4-argon:generateContent', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': os.environ['GEMINI_API_KEY']})
    rr = json.load(urllib.request.urlopen(req, timeout=900)); txt = ''.join(p.get('text', '') for p in rr['candidates'][0]['content']['parts'])
    class R: stderr = json.dumps(rr.get('usageMetadata', {}))
    r = R()
else:
    cmd = ['claude', '-p', '--model', 'claude-fable-5-1', '--output-format', 'text']
    r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, encoding='utf8', errors='replace', cwd=SITE, timeout=1500, shell=True)
    txt = r.stdout
m = re.search(r'\{[\s\S]*\}', txt)
res = json.loads(m.group(0)) if m else {'error': 'no json', 'raw': txt[-2000:], 'stderr': r.stderr[-1000:]}
res.setdefault('model', model); res.setdefault('role', role)
json.dump(res, open(out, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
print(model, role, 'score', res.get('score'), round(time.time() - t), 's', '' if m else 'NO JSON')
