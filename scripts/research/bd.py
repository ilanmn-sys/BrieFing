import json,sys,time,urllib.request,urllib.parse
B="https://api.brightdata.com"
def req(m,path,body=None):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(B+path,data=data,method=m,headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(r,timeout=120) as f: return f.read().decode()
def trigger(ds,inputs,extra=""):
    return json.loads(req("POST",f"/datasets/v3/trigger?dataset_id={ds}&include_errors=true{extra}",inputs))["snapshot_id"]
def wait(sid,maxs=900):
    t=time.time()
    while time.time()-t<maxs:
        p=json.loads(req("GET",f"/datasets/v3/progress/{sid}"))
        if p.get("status") in("ready","failed"): return p
        time.sleep(10)
    return p
def snap(sid): return json.loads(req("GET",f"/datasets/v3/snapshot/{sid}?format=json"))
if __name__=="__main__":
    name,ds,extra,infile=sys.argv[1:5]
    inputs=json.load(open(infile))
    sid=trigger(ds,inputs,extra); print(name,sid,flush=True)
    p=wait(sid); print(name,p,flush=True)
    d=snap(sid); json.dump(d,open(f"run/{name}.json","w"),ensure_ascii=False,indent=1); print(name,"rows",len(d) if isinstance(d,list) else d)
