#!/usr/bin/env python3
"""Build data.json for the Elevate creator content gallery from the content-watch state.
Usage: build-elevate-content-data.py <out_dir> [thumbs_manifest.json]"""
import json, sys, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ST = os.path.join(ROOT, 'agents/elevate-nyc-content-watch/state')
found = json.load(open(os.path.join(ST, 'found.json')))['found']
roster = json.load(open(os.path.join(ST, 'roster.json')))
roster = roster.get('creators', roster) if isinstance(roster, dict) else roster
out = sys.argv[1]
thumbs = {}
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
    thumbs = json.load(open(sys.argv[2]))

def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
def match(name):
    n = norm(name)
    for c in roster:
        cn = norm(c['name'])
        if cn and (n.startswith(cn) or cn.startswith(n) or cn in n): return c
    first = norm(name.split()[0])
    for c in roster:
        if norm(c['name'].split()[0]) == first: return c
    return None

posts = []
for i, p in enumerate(found):
    c = match(p['creator'])
    ev = p.get('event') or (c or {}).get('event') or 'nyc'
    t = thumbs.get(str(i))
    posts.append({
        'id': i, 'creator': p['creator'], 'event': ev,
        'platform': p['platform'], 'type': p['type'].capitalize(), 'date': p['date'],
        'url': p['url'], 'summary': p['summary'],
        'likes': p.get('likes'), 'comments': p.get('comments'), 'views': p.get('views'),
        'viewsNote': p.get('viewsNote'),
        'thumb': ('thumbs/' + t['file']) if t else None,
        'ratio': (round(t['w'] / t['h'], 3) if t and t.get('h') else None),
    })
posted = {norm((match(p['creator']) or {'name': p['creator']})['name']) for p in found}
upcoming = [{'name': c['name'], 'event': c.get('event', 'nyc'),
             'links': {k: c[k] for k in ('instagram', 'tiktok', 'youtube', 'x', 'linkedin') if c.get(k)}}
            for c in roster if norm(c['name']) not in posted]
lr = json.load(open(os.path.join(ST, 'found.json'))).get('lastRun') or ''
m = re.match(r'(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})', lr)
data = {'updated': (m.group(1) + ' ' + m.group(2) + ' UTC') if m else None,
        'posts': sorted(posts, key=lambda x: x['date'], reverse=True), 'upcoming': upcoming}
os.makedirs(out, exist_ok=True)
json.dump(data, open(os.path.join(out, 'data.json'), 'w'), ensure_ascii=False, indent=0)
print(len(posts), 'posts;', len(upcoming), 'upcoming;', sum(1 for p in posts if p['thumb']), 'thumbs')
