"""Extract cantrip/preparation counts from the licensed SRD 5.2.1 class tables."""
import pathlib,tempfile,json
import pymupdf
doc=pymupdf.open(pathlib.Path(tempfile.gettempdir())/'smsheets-srd-5.2.1.pdf')
specs=[('Bard',31,4,5),('Cleric',36,4,5),('Druid',41,4,5),('Paladin',53,None,4),('Ranger',58,None,4),('Sorcerer',65,4,5),('Warlock',71,4,5),('Wizard',77,3,4)]
out={}
for name,page,cantrip_col,prepared_col in specs:
 p=doc[page-1];table=next(t for t in p.find_tables().tables if len(t.rows)>10)
 intact=next(r for r in table.rows if all(c is not None for c in r.cells))
 bounds=[(c[0],c[2]) for c in intact.cells]
 levels=[]
 for geometry in table.rows:
  bbox=next(c for c in geometry.cells if c)
  def cell(col):
   if col is None:return 0
   x0,x1=bounds[col];words=p.get_text('words',clip=pymupdf.Rect(x0,bbox[1],x1,bbox[3]));return int(''.join(w[4] for w in words).strip())
  levels.append({'level':cell(0),'cantrips':cell(cantrip_col),'prepared':cell(prepared_col)})
 # The final shaded row has no detected bottom border; locate its Level cell.
 x0,x1=bounds[0];w=next(w for w in p.get_text('words') if w[4]=='20' and x0<=w[0]<x1 and w[1]>=table.bbox[3]-1)
 def last(col):
  if col is None:return 0
  x0,x1=bounds[col];return int(''.join(v[4] for v in p.get_text('words',clip=pymupdf.Rect(x0,w[1]-1,x1,w[3]+1))))
 levels.append({'level':20,'cantrips':last(cantrip_col),'prepared':last(prepared_col)})
 assert [r['level'] for r in levels]==list(range(1,21)),name
 out[name]={'page':page,'levels':levels}
path=pathlib.Path(__file__).resolve().parents[1]/'dnd-spell-guidance.mjs'
path.write_text('// Cantrip and prepared-spell counts from SRD 5.2.1 class tables.\nexport const spellGuidance='+json.dumps(out,indent=2)+';\n',encoding='utf-8')
print({name:[data['levels'][0],data['levels'][-1]] for name,data in out.items()})
