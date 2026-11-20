import re,sys,json,shutil,zipfile
names=json.load(open(sys.argv[1])); out=sys.argv[2]
src='plan.pptx'; z=zipfile.ZipFile(src); s=z.read('ppt/slides/slide1.xml').decode()
sps=list(re.finditer(r'<p:sp>.*?</p:sp>',s,flags=re.S))
idx=[15,16,17,18,19,20,21,30,31,32,33,34,35,36,45,46,47,48,49,50,51,60,61,62,63,64,65,66,75,76,77,78,79,80,81,90,91,92,93,94,95,96,98,100]
esc=lambda t:t.replace('&','&amp;').replace('<','&lt;')
new=s; 
for i in reversed(idx):
    k=str(idx.index(i)); txt=names.get(k,'')
    if not txt: continue
    sp=sps[i].group(0)
    run=f'<a:r><a:rPr lang="en-GB" sz="650" dirty="0"/><a:t>{esc(txt)}</a:t></a:r>'
    if '<a:endParaRPr' in sp: nsp=re.sub(r'(<a:p>(?:<a:pPr[^>]*/>|<a:pPr.*?</a:pPr>)?)',r'\1'+run.replace('\\','\\\\'),sp,count=1)
    else: nsp=sp.replace('<a:p>','<a:p>'+run,1) if '<a:p>' in sp else sp.replace('<a:p/>','<a:p>'+run+'</a:p>',1)
    new=new[:sps[i].start()]+nsp+new[sps[i].end():]
zo=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
for it in z.infolist(): zo.writestr(it,new.encode() if it.filename=='ppt/slides/slide1.xml' else z.read(it.filename))
zo.close()
