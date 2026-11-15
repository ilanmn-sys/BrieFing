import json,sys,re,statistics as st,datetime as dt,collections
COMP=['asana','clickup','notion','wrike','smartsheet','atlassian','jira','trello','airtable','servicenow','salesforce','hubspot','pipedrive','attio','gohighlevel','סיילספורס']
AD=re.compile(r'(#ad\b|#sponsored|שת"פ|שת״פ|בשיתוף|paid partnership|קוד הנחה|#פרסומת)',re.I)
rows=[]
for f in sys.argv[1:]: rows+=json.load(open(f))
by=collections.defaultdict(list)
for r in rows:
    if r.get('profile_username'): by[r['profile_username']].append(r)
now=dt.datetime(2026,11,11,tzinfo=dt.timezone.utc)
for u,ps in sorted(by.items(),key=lambda x:-(x[1][0].get('profile_followers') or 0)):
    ps=sorted(ps,key=lambda r:r.get('create_time') or '',reverse=True)[:12]
    fol=ps[0].get('profile_followers') or 0
    er=[((p.get('digg_count') or 0)+(p.get('comment_count') or 0))/fol*100 for p in ps if fol]
    vv=[(p.get('play_count') or 0)/fol*100 for p in ps if fol]
    pl=[p.get('play_count') or 0 for p in ps]
    dates=[dt.datetime.fromisoformat(p['create_time'].replace('Z','+00:00')) for p in ps if p.get('create_time')]
    span=(max(dates)-min(dates)).days or 1 if dates else 1
    cad=round((len(dates)-1)/span*30,1) if len(dates)>1 else None
    last=(now-max(dates)).days if dates else None
    print(f"=== {u} f={fol} n={len(ps)} ERmed={round(st.median(er),2) if er else None} ERmean={round(st.mean(er),2) if er else None} plays med={st.median(pl) if pl else None} views/f med={round(st.median(vv),1) if vv else None}% cad/mo={cad} last={last}d span={span}d")
    for p in ps:
        c=p.get('description') or ''
        low=c.lower()
        cm=[x for x in COMP if x in low]
        if AD.search(c) or cm or p.get('commerce_info') and str(p.get('commerce_info'))not in ('{}','None') or 'monday' in low:
            print('   FLAG',(p.get('create_time') or '')[:10],cm,str(p.get('commerce_info'))[:80],'|',c[:160].replace('\n',' '))
    for p in ps[:4]: print('    ',(p.get('create_time') or '')[:10],p.get('play_count'),c[:0],(p.get('description') or '')[:90].replace('\n',' '))
