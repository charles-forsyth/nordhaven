#!/usr/bin/env python3
"""Verify the locally built Nordhaven site in /tmp/nhsite: privacy terms, internal links, optional PDF text.
Usage: nh_verify.py [--pdf]   Prints PRIV/LINK/PDF lines and 'VERIFY: CLEAN' when nothing is found.
Extend PRIV when new protected names/places come up; PRIV_OK whitelists known false positives
(forsythia the plant, Ursa Major the constellation, the charles-forsyth GitHub URLs)."""
import os,re,sys,html,subprocess
SITE=os.environ.get('NH_SITE','/tmp/nhsite'); BASE='/nordhaven'
PRIV=r"chuck|forsyth|laylla|rylie|michelle|chelle|seamus|leslie|omstead|tioga|button hill|pennsylvania|\bucr\b|riverside|ursa major|ursa-major|1,607|1607 ft|jayco|212qbw|daytona|milo|/home/|wilkins|elmira|corning|owego"
PRIV_OK=r"forsythia|ursa major wheels steadily|ursa major &amp; minor|<strong>ursa major</strong> wheels|ursa major & minor|ursa major\*\* wheels|ursa major \(the great bear|great & little bears"
bad=0
for root,_,fs in os.walk(SITE):
    for f in fs:
        p=os.path.join(root,f)
        if f.endswith(('.html','.xml','.txt','.json','.md')):
            t=open(p,encoding='utf-8',errors='ignore').read()
            txt=re.sub(r'<script.*?</script>','',t,flags=re.S)
            for m in re.finditer(PRIV,txt,re.I):
                ctx=txt[max(0,m.start()-40):m.end()+40].replace('\n',' ')
                if re.search(PRIV_OK,ctx,re.I): continue
                if 'charles-forsyth.github.io' in ctx or 'github.com/charles-forsyth' in ctx: continue
                print('PRIV',p.replace(SITE,''),'|',ctx); bad+=1
missing=set()
for root,_,fs in os.walk(SITE):
    for f in fs:
        if not f.endswith('.html'): continue
        p=os.path.join(root,f); t=open(p,encoding='utf-8',errors='ignore').read()
        for h in re.findall(r'(?:href|src)="([^"#?]+)',t):
            h=html.unescape(h)
            if h.startswith(('http','mailto:','//','data:','javascript')):
                if 'charles-forsyth.github.io/nordhaven' in h: h=h.split('charles-forsyth.github.io',1)[1]
                else: continue
            if not h.startswith(BASE):
                if h.startswith('/'): missing.add((p.replace(SITE,''),h))
                continue
            rel=h[len(BASE):] or '/'
            fp=SITE+rel
            if rel.endswith('/'): fp+='index.html'
            if not os.path.exists(fp) and not os.path.exists(fp+'.html'):
                missing.add((p.replace(SITE,''),h))
for m in sorted(missing): print('LINK',m); bad+=1
if '--pdf' in sys.argv:
    for f in sorted(os.listdir(SITE+'/assets/books')):
        t=subprocess.run(['pdftotext',SITE+'/assets/books/'+f,'-'],capture_output=True,text=True).stdout
        for m in re.finditer(PRIV+r"|ucr-ai-gateway",t,re.I):
            ctx=t[max(0,m.start()-30):m.end()+30].replace('\n',' ')
            if re.search(PRIV_OK,ctx,re.I): continue
            print('PDF',f,'|',ctx); bad+=1
print('VERIFY:', 'CLEAN' if bad==0 else f'{bad} problems')

sys.exit(0 if bad==0 else 1)
