import zipfile,re,sys,json
import xml.etree.ElementTree as ET
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=zipfile.ZipFile(sys.argv[1])
ss=[]
for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns):
    ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%ns['m'])))
# hyperlinks
rels={}
try:
    for r in ET.fromstring(z.read('xl/worksheets/_rels/sheet2.xml.rels')): rels[r.get('Id')]=r.get('Target')
except: pass
root=ET.fromstring(z.read('xl/worksheets/sheet2.xml'))
links={}
for h in root.iter('{%s}hyperlink'%ns['m']):
    rid=h.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    links[h.get('ref')]=rels.get(rid,h.get('location'))
rows=[]
for row in root.iter('{%s}row'%ns['m']):
    r={}
    for c in row.findall('m:c',ns):
        ref=c.get('r'); col=re.match(r'[A-Z]+',ref).group()
        v=c.find('m:v',ns); t=c.get('t')
        if t=='s' and v is not None: val=ss[int(v.text)]
        elif t=='inlineStr': val=''.join(x.text or '' for x in c.iter('{%s}t'%ns['m']))
        else: val=v.text if v is not None else ''
        if ref in links: val=(val+' <'+links[ref]+'>').strip()
        if val: r[col]=val
    rows.append((row.get('r'),r))
json.dump(rows,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
for n,r in rows:
    print('ROW',n, ' | '.join(f'{k}:{v}' for k,v in r.items()))
