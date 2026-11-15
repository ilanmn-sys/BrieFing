import json,sys,re,statistics as st,collections
COMP=['asana','clickup','notion','wrike','smartsheet','atlassian','jira','confluence','trello','loom','airtable','servicenow','salesforce','agentforce','hubspot','pipedrive','attio','gohighlevel','highlevel']
AD=re.compile(r'(#ad\b|#sponsored|#partner|sponsored|in partnership|paid partnership|בשיתוף|שת"פ|שת״פ|thanks to .{0,30} for (sponsoring|partnering))',re.I)
d=json.load(open(sys.argv[1]))
by=collections.defaultdict(list)
for r in d:
    if r.get('user_id'): by[r['user_id']].append(r)
for u,ps in by.items():
    ps=[p for p in ps if not p.get('repost')] or ps
    ps=sorted(ps,key=lambda r:r.get('date_posted') or '',reverse=True)
    fol=max((p.get('user_followers') or 0) for p in ps)
    ers=[((p.get('num_likes') or 0)+(p.get('num_comments') or 0))/fol*100 for p in ps[:12] if fol]
    dates=[p['date_posted'][:10] for p in ps if p.get('date_posted')]
    print(f"=== {u} f={fol} n={len(ps)} (61d window) ERmed12={round(st.median(ers),2) if ers else None} ERmean={round(st.mean(ers),2) if ers else None} dates {dates[-1:]}..{dates[:1]}")
    for p in ps:
        t=(p.get('post_text') or '')
        low=t.lower()
        c=[x for x in COMP if re.search(r'\b'+x+r'\b',low)]
        tags=[x.get('name') if isinstance(x,dict) else str(x) for x in (p.get('tagged_companies') or [])]
        if AD.search(t) or c or 'monday' in low or 'viktor' in low or tags:
            print('   ',p.get('date_posted','')[:10],'COMP',c,'TAGS',tags[:5],'|',t[:200].replace('\n',' '))
    for p in ps[:5]: print('     -',p.get('date_posted','')[:10],p.get('num_likes'),p.get('num_comments'),(p.get('post_text') or '')[:90].replace('\n',' '))
