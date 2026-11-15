import json,subprocess,urllib.parse,sys,concurrent.futures as cf
qfile,out=sys.argv[1],sys.argv[2]
qs=[l.strip() for l in open(qfile,encoding='utf-8') if l.strip()]
def q(s):
    hl='iw' if any('֐'<=ch<='׿' for ch in s) else 'en'
    u="https://www.google.com/search?q="+urllib.parse.quote(s)+f"&hl={hl}&gl=il&num=20&brd_json=1"
    err=''
    for zone in ['marko_serp_json','marko_serp_json','serp_api_community_kb','marko_serp_json']:
        o=subprocess.run(['curl','-sS','--max-time','90','-X','POST','https://api.brightdata.com/request','-H','Content-Type: application/json','-d',json.dumps({"zone":zone,"url":u,"format":"raw"})],capture_output=True,text=True).stdout
        try:
            d=json.loads(o); return s,[((x.get('link') if 'google.com/goto' not in (x.get('link') or '') else x.get('display_link')),x.get('title'),(x.get('description') or '')[:300]) for x in d.get('organic',[])]
        except Exception:
            err=o[:150]; import time; time.sleep(17)
    return s,'FAIL '+err
with cf.ThreadPoolExecutor(5) as ex: res=list(ex.map(q,qs))
json.dump(res,open(out,'w'),ensure_ascii=False,indent=1)
for s,v in res:
    print('##',s)
    if isinstance(v,str): print(v); continue
    for l,t,d in v[:12]: print(' -',l,'|',t,'|',d[:160])
