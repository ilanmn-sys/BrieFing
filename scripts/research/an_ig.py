import json,sys,re,statistics as st,datetime as dt,collections
COMP=['asana','clickup','notion','wrike','smartsheet','atlassian','jira','confluence','trello','loom','airtable','servicenow','salesforce','hubspot','pipedrive','attio','gohighlevel','highlevel','זוהו','zoho']
AD=re.compile(r'(#ad\b|#sponsored|שת"פ|שת״פ|בשיתוף|paid partnership|#שיתוף|קוד הנחה|promo code|sponsored)',re.I)
rows=[]
for f in sys.argv[1:]: rows+=json.load(open(f))
by=collections.defaultdict(list)
for r in rows:
    if r.get('user_posted'): by[r['user_posted']].append(r)
now=dt.datetime(2026,11,11,tzinfo=dt.timezone.utc)
out={}
for u,ps in by.items():
    ps=sorted(ps,key=lambda r:r.get('date_posted') or '',reverse=True)[:12]
    fol=ps[0].get('followers') or 0
    ers=[((p.get('likes') or 0)+(p.get('num_comments') or 0))/fol*100 for p in ps if fol]
    views=[(p.get('video_play_count') or p.get('video_view_count')) for p in ps]
    vv=[v/fol*100 for v in views if v and fol]
    dates=[dt.datetime.fromisoformat(p['date_posted'].replace('Z','+00:00')) for p in ps if p.get('date_posted')]
    span=(max(dates)-min(dates)).days or 1
    cad=round((len(dates)-1)/span*30,1) if len(dates)>1 else None
    last=(now-max(dates)).days if dates else None
    flags=[];comp=[];mon=[]
    for p in ps:
        cap=(p.get('description') or '')
        d=(p.get('date_posted') or '')[:10]
        if p.get('is_paid_partnership') or AD.search(cap) or p.get('partnership_details'):
            flags.append(f"{d}: pp={p.get('is_paid_partnership')} {p.get('partnership_details') or ''} | {cap[:160]!r}")
        low=cap.lower()
        for c in COMP:
            if re.search(r'\b'+c+r'\b',low): comp.append(f"{d}:{c}")
        if 'monday' in low or 'מאנדיי' in cap or 'מנדיי' in cap: mon.append(f"{d}: {cap[:120]!r}")
    likes_hidden=sum(1 for p in ps if p.get('likes') in (None,0,-1))
    out[u]=dict(f=fol,n=len(ps),er_med=round(st.median(ers),2) if ers else None,er_mean=round(st.mean(ers),2) if ers else None,
        vv_med=round(st.median(vv),1) if vv else None,cad=cad,last_days=last,span=span,hidden=likes_hidden,flags=flags,comp=comp,mon=mon,
        caps=[(p.get('date_posted') or '')[:10]+' '+(p.get('content_type') or '')+' '+(p.get('description') or '')[:90].replace('\n',' ') for p in ps[:6]],
        coll=[ (p.get('date_posted') or '')[:10]+':'+','.join(x.get('username','') if isinstance(x,dict) else str(x) for x in (p.get('coauthor_producers') or [])) for p in ps if p.get('coauthor_producers')],
        tags=sorted({(t.get('username') if isinstance(t,dict) else str(t)) for p in ps for t in (p.get('tagged_users') or [])}))
for u,o in sorted(out.items(),key=lambda x:-x[1]['f']):
    print(f"=== {u} f={o['f']} n={o['n']} ERmed={o['er_med']} ERmean={o['er_mean']} views/f med={o['vv_med']}% cad/mo={o['cad']} last={o['last_days']}d span={o['span']}d hidden={o['hidden']}")
    for x in o['flags']: print('  AD?',x[:260])
    if o['comp']: print('  COMP',o['comp'])
    if o['mon']: print('  MONDAY',o['mon'])
    if o['coll']: print('  COLLAB',o['coll'])
    if o['tags']: print('  TAGS',o['tags'][:15])
    for c in o['caps']: print('   ',c)
json.dump(out,open(sys.argv[1].replace('.json','_an.json'),'w'),ensure_ascii=False,indent=1)
