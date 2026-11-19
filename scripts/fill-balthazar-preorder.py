import re,csv,sys,shutil,os,zipfile
src,out,csvp=sys.argv[1],sys.argv[2],sys.argv[3]
z=zipfile.ZipFile(src); doc=z.read('word/document.xml').decode()
guests=[r for r in csv.DictReader(open(csvp))]
esc=lambda t:t.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
def fillcell(cell,text):
    if not text: return cell
    run=f'<w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">{esc(text)}</w:t></w:r>'
    return re.sub(r'(</w:pPr>)(</w:p>)',r'\1'+run.replace('\\','\\\\')+r'\2',cell,count=1) if '</w:pPr></w:p>' in cell else cell.replace('</w:p>',run+'</w:p>',1)
rows=re.findall(r'<w:tr[ >].*?</w:tr>',doc,flags=re.S)
txt=lambda x:''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>',x))
# event details rows 1-3
vals={'Booking Ref:':'','Name':'monday.com: Creator & Community Dinner (Ilan Manassen)','Date':'Monday 23/11/2026, 19:30','Numbers':str(len(guests)),'Space':'Le Grand Salon Privé'}
for ri in (1,2,3):
    r=rows[ri]; cells=re.findall(r'<w:tc>.*?</w:tc>',r,flags=re.S); new=r
    for a,b in zip(cells,cells[1:]):
        lab=txt(a).strip()
        if lab in vals and not txt(b).strip() and vals[lab]:
            new=new.replace(b,fillcell(b,vals[lab]),1)
    doc=doc.replace(r,new,1); rows[ri]=new
data=[r for r in rows[5:]]
tmpl=data[-1]
need=len(guests)-len(data)
if need>0:
    doc=doc.replace(tmpl,tmpl+tmpl*need,1)
rows=re.findall(r'<w:tr[ >].*?</w:tr>',doc,flags=re.S)
data=rows[5:5+len(guests)]
newdoc=doc
pos=0
parts=[]
last=0
for r,g in zip(data,guests):
    cells=re.findall(r'<w:tc>.*?</w:tc>',r,flags=re.S)
    vals_=[g['name'],g['starter'],g['main'],g['dessert'],g['dietary']]
    nr=r
    for c,v in zip(cells,vals_): nr=nr.replace(c,fillcell(c,v),1)
    j=newdoc.index(r,last); newdoc=newdoc[:j]+nr+newdoc[j+len(r):]; last=j+len(nr)
zo=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED)
for it in z.infolist():
    zo.writestr(it, newdoc.encode() if it.filename=='word/document.xml' else z.read(it.filename))
zo.close(); print(len(guests),'guests,',sum(1 for g in guests if g['main']),'with choices')
