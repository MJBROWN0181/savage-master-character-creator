"""Build compact reference excerpts from the CC-BY-4.0 English SRD 5.2.1.
Requires PyMuPDF. Original source stays in the OS temporary directory.
"""
import json, pathlib, re, tempfile, urllib.request
import pymupdf

URL='https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf'
source=pathlib.Path(tempfile.gettempdir())/'smsheets-srd-5.2.1.pdf'
if not source.exists(): urllib.request.urlretrieve(URL,source)
doc=pymupdf.open(source)
def clean(t):
    t=t.replace('\ufffd',"'").replace('\xad','').replace('\t',' ')
    t=re.sub(r"(?<=\d)'(?=\d)",'–',t)
    return re.sub(r'\s+',' ',t).strip()
def lines(start,end):
    out=[]
    for page in range(start-1,end):
        ls=[]
        for block in doc[page].get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                if line['bbox'][1]>742: continue
                spans=line['spans']; text=clean(''.join(s['text'] for s in spans))
                if not text:continue
                ls.append({'text':text,'page':page+1,'x':line['bbox'][0],'size':max(s['size'] for s in spans),'font':spans[0]['font']})
        # Keep PDF source order within each column: styled lines can overlap vertically.
        out.extend([l for l in ls if l['x']<297]);out.extend([l for l in ls if l['x']>=297])
    merged=[]
    for l in out:
        if merged and heading(l) and heading(merged[-1]) and l['page']==merged[-1]['page'] and (l['x']<297)==(merged[-1]['x']<297):
            merged[-1]['text']+=' '+l['text']
        else:merged.append(l)
    active='';subclass=''
    names={'Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'}
    for l in merged:
        if l['text'] in names and l['size']>12:active=l['text'];subclass=''
        if 'Subclass:' in l['text'] and l['size']>12:subclass=l['text']
        l['class']=active;l['subclass']=subclass
    return merged
def heading(l):return abs(l['size']-12)<.2 and 'GillSans' in l['font']
def join(ls):
    t=''
    for l in ls:
        v=l['text']
        if t.endswith('-') and v and v[0].islower():t=t[:-1]+v
        else:t+=(' ' if t else '')+v
    return clean(t)
def brief(text,limit=620):
    if len(text)<=limit:return text
    cut=text[:limit];ends=list(re.finditer(r'[.!?](?:\s|$)',cut))
    return cut[:ends[-1].end()].strip() if ends and ends[-1].end()>120 else cut.rsplit(' ',1)[0]+'…'
def entries(start,end,category,valid):
    ls=lines(start,end); indices=[i for i,l in enumerate(ls) if heading(l)]
    result=[]
    for n,i in enumerate(indices):
        stop=indices[n+1] if n+1<len(indices) else len(ls)
        chunk=ls[i+1:stop]
        if not valid(ls[i],chunk):continue
        meta=[];body=[];stats=[]
        for l in chunk:
            if 'Italic' in l['font'] and not body and not stats:meta.append(l)
            elif 'GillSans' in l['font'] and l['size']<11:stats.append(l)
            elif 'Cambria' in l['font']:body.append(l)
        stattext=join(stats)
        fields=[]
        if category=='Spells':
            # A few spells use Cambria metadata or singular "Component".
            # Identify labels by content rather than relying on the font.
            labels=[]
            for j,l in enumerate(chunk):
                m=re.match(r'^(Casting Time|Range|Components?|Duration):\s*(.*)',l['text'])
                if m:labels.append((j,m[1],m[2]))
            fields=[]
            for n,(j,label,value) in enumerate(labels):
                end=labels[n+1][0] if n+1<len(labels) else j+1
                fields.append(('Components' if label.startswith('Component') else label)+': '+join([{'text':value},*chunk[j+1:end]]))
            if labels:
                meta=chunk[:labels[0][0]]
                body=chunk[labels[-1][0]+1:]
        if category=='Feats':fields=[join(meta)] if meta else []
        if category=='Items' and meta:fields=[join(meta)]
        if category=='Items' and not meta:
            cost=re.search(r'\(([^()]+)\)$',ls[i]['text'])
            if cost:fields.append('Cost: '+cost[1])
            for label in ['Ability','Weight']:
                m=re.search(label+r':\s*(.*?)(?=Ability:|Weight:|Utilize:|Craft:|Variants:|$)',stattext)
                if m:fields.append(label+': '+m[1].strip())
        text=join(body) or stattext
        if not text:continue
        row={'name':ls[i]['text'],'category':category,'page':ls[i]['page'],'description':brief(text),'stats':fields,'tag':join(meta)}
        if category=='Spells':row['fullDescription']=text
        if category=='Items' and not meta:row['tag']='Tools' if 'Ability:' in stattext else 'Adventuring gear'
        if category=='Class features':
            row['name']=ls[i]['class']+' · '+row['name'];row['tag']=ls[i]['class'];row['stats']=[ls[i]['subclass']] if ls[i]['subclass'] else []
        result.append(row)
    return result
catalogue=[]
catalogue+=entries(107,175,'Spells',lambda l,c:bool(c) and ('Cantrip' in c[0]['text'] or c[0]['text'].startswith('Level ')))
catalogue+=entries(87,88,'Feats',lambda l,c:bool(c) and 'Feat' in c[0]['text'])
catalogue+=entries(209,253,'Items',lambda l,c:bool(c) and re.match(r'(Armor|Weapon|Wondrous Item|Potion|Ring|Rod|Scroll|Staff|Wand)',c[0]['text']))
catalogue+=entries(93,100,'Items',lambda l,c:'(' in l['text'] and bool(c))
catalogue+=entries(89,90,'Equipment properties',lambda l,c:bool(c) and l['text'] not in ['Weapons','Coins'])
catalogue+=entries(176,191,'Game rules',lambda l,c:bool(c))
classes=[('Barbarian',28,30),('Bard',31,35),('Cleric',36,40),('Druid',41,46),('Fighter',47,49),('Monk',49,52),('Paladin',53,56),('Ranger',57,61),('Rogue',61,64),('Sorcerer',64,69),('Warlock',70,76),('Wizard',77,82)]
catalogue+=entries(28,82,'Class features',lambda l,c:bool(re.match(r'Level \d+:',l['text'])) and bool(c) and bool(l['class']))
for page,kind in [(91,'Weapon'),(92,'Armor')]:
    for table in doc[page-1].find_tables().tables:
        rows=table.extract();group=kind
        intact=next(r for r in table.rows if all(c is not None for c in r.cells))
        bounds=[(c[0],c[2]) for c in intact.cells]
        for row,row_geometry in zip(rows,table.rows):
            cells=[clean(v or '') for v in row]
            if not cells[0] or cells[0]=='Name':continue
            if sum(bool(v) for v in cells)==1:
                if cells[0].endswith('Weapons') or re.search(r'(Armor|Shield) \(',cells[0]) and not re.search(r'\d+ GP',cells[0]):group=cells[0];continue
                bbox=next(c for c in row_geometry.cells if c)
                cells=[]
                for x0,x1 in bounds:
                    words=doc[page-1].get_text('words',clip=pymupdf.Rect(x0,bbox[1],x1,bbox[3]))
                    cells.append(clean(' '.join(w[4] for w in words)))
            if len(cells)!=6:continue
            labels=['Damage','Properties','Mastery','Weight','Cost'] if kind=='Weapon' else ['Armor Class','Strength','Stealth','Weight','Cost']
            fields=[label+': '+('-' if value=="'" else value) for label,value in zip(labels,cells[1:])]
            description='A '+group.lower().removesuffix('s')+' for your adventuring equipment.' if kind=='Weapon' else ('A shield that adds to your Armor Class.' if cells[0]=='Shield' else 'Protective '+group.split('(')[0].strip().lower()+'. Check its defenses and requirements below.')
            catalogue.append({'name':cells[0],'category':'Items','page':page,'description':description,'stats':fields,'tag':group})
# Remove overlapping class-page entries and require stable identifiers for filtering.
unique={}
for row in catalogue:
    key=(row['category'],row['name'],row['page']);unique[key]=row
catalogue=sorted(unique.values(),key=lambda r:(r['category'],r['name']))
out=pathlib.Path(__file__).resolve().parents[1]/'dnd-rules-data'
out.mkdir(exist_ok=True)
groups={'spells':['Spells'],'feats':['Feats'],'items':['Items','Equipment properties'],'features':['Class features'],'rules':['Game rules']}
for filename,categories in groups.items():
    (out/(filename+'.json')).write_text(json.dumps([r for r in catalogue if r['category'] in categories],ensure_ascii=False,indent=2),encoding='utf-8')
print({k:sum(r['category']==k for r in catalogue) for k in sorted(set(r['category'] for r in catalogue))})
