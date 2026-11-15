import json,re,statistics as st,sys
from collections import defaultdict
d=json.load(open(sys.argv[1]))
g=defaultdict(list)
for r in d:
    if r.get('user_posted'): g[r['user_posted']].append(r)
fol={'huwprosser':127946,'futurebriefing':5724,'jadebeason':89084,'itstundeanthony':326872,'smartgirltechworld':4264,'jordanplatten':66863,'harrystebbings_':None}
comp=r'asana|clickup|notion|wrike|smartsheet|atlassian|jira|confluence|trello|loom|airtable|servicenow|salesforce|hubspot|pipedrive|attio|gohighlevel|highlevel|monday'
spon=r'#ad\b|\bad\b ?\||#\w*partner\b|paid partnership|sponsored|#gifted|#collab|in partnership|thanks to @\w+ for'
for u,ps in g.items():
    ps.sort(key=lambda r:r['date_posted'],reverse=True)
    f=fol.get(u) or ps[0].get('followers')
    print('=====',u,'followers',f,'posts in 12m',len(ps),'oldest',ps[-1]['date_posted'][:10])
    rec=ps[:12]
    ers=[((p.get('likes') or 0)+(p.get('num_comments') or 0))/f*100 for p in rec if p.get('likes') is not None]
    hidden=sum(1 for p in rec if p.get('likes') is None)
    if ers: print('  last12 mean %.2f median %.2f (n=%d, hidden likes %d)'%(st.mean(ers),st.median(ers),len(ers),hidden))
    for p in rec:
        er=((p.get('likes') or 0)+(p.get('num_comments') or 0))/f*100
        print('   ',p['date_posted'][:10],p.get('content_type'),p.get('likes'),p.get('num_comments'),'%.2f'%er,'|',(p.get('description') or '')[:110].replace('\n',' '),'|',p['url'])
    for p in ps:
        t=(p.get('description') or '')
        c=set(x.lower() for x in re.findall(comp,t,re.I)); s=set(x.lower() for x in re.findall(spon,t,re.I))
        if p.get('is_paid_partnership') or p.get('partnership_details'): s.add('PAIDFLAG')
        if c or s: print('  FLAG',p['date_posted'][:10],c,s,'|',t[:200].replace('\n',' '),'|',p['url'])
