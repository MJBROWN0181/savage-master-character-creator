import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newAtlas,validateAtlas,exportAtlas,routeDistance,routeSummary,validateMapParents,printLayout} from '../map-atlas.mjs';
import {mapKeyHtml,printMapHtml} from '../map-export.mjs';
const marker=(id,patch={})=>({id,x:.25,y:.5,name:'Harbor',type:'Town',layerId:'places',public:true,notes:'Trading port',gmNotes:'GM_SECRET',targetMapId:'SECRET_MAP',worldField:'SECRET_LORE',...patch});
const route=(id,patch={})=>({id,name:'Coastal road',kind:'travel',layerId:'travel',public:true,points:[{x:0,y:0},{x:1,y:0}],factor:2,override:'SECRET_OVERRIDE',...patch});

test('player handouts omit private and hidden annotations and all GM references',()=>{
  const a=newAtlas('map');
  assert.throws(()=>exportAtlas(a),/base image without secrets/);
  a.playerSafeBase=true;a.publicTitle='Coast';
  a.layers.push({id:'hidden',name:'HIDDEN_LAYER',color:'#112233',visible:false,public:true});
  a.markers=[marker('public'),marker('private',{name:'PRIVATE_LOCATION',public:false}),marker('secret',{name:'SECRET_LAYER_LOCATION',layerId:'secrets'}),marker('hidden',{name:'HIDDEN_LOCATION',layerId:'hidden'})];
  a.routes=[route('public-route'),route('private-route',{name:'PRIVATE_ROUTE',public:false}),route('hidden-route',{name:'HIDDEN_ROUTE',layerId:'hidden'})];
  const p=exportAtlas(a),serialized=JSON.stringify(p)+mapKeyHtml(p);
  assert.equal(p.markers.length,1);assert.equal(p.routes.length,1);
  assert.equal(p.title,'Coast');assert.match(serialized,/Trading port/);
  for(const text of ['GM_SECRET','SECRET_MAP','SECRET_LORE','SECRET_OVERRIDE','PRIVATE_LOCATION','SECRET_LAYER_LOCATION','HIDDEN_LOCATION','HIDDEN_LAYER','PRIVATE_ROUTE','HIDDEN_ROUTE'])assert.ok(!serialized.includes(text),text);
  for(const field of ['gmNotes','targetMapId','worldField'])assert.ok(!Object.hasOwn(p.markers[0],field),field);
  for(const field of ['factor','override'])assert.ok(!Object.hasOwn(p.routes[0],field),field);
  for(const field of ['scale','travel'])assert.ok(!Object.hasOwn(p,field),field);
  const gm=exportAtlas(a,'gm');assert.equal(gm.markers.length,3);assert.equal(gm.markers[0].gmNotes,'GM_SECRET');
});

test('annotations validate bounded geometry, identities, layers, and explicit visibility',()=>{
  const valid=newAtlas('map');valid.markers=[marker('place')];valid.routes=[route('road')];assert.equal(validateAtlas(valid),valid);
  const invalid=[a=>a.markers[0].x=1.01,a=>a.markers[0].public='true',a=>a.markers[0].layerId='missing',a=>a.routes[0].id='place',a=>a.layers.push({...a.layers[0]}),a=>a.parentMapId='map',a=>a.scale={a:{x:0,y:0},b:{x:0,y:0},distance:10,unit:'miles'},a=>a.routes[0].factor=0,a=>a.routes[0].points[0].y=NaN,a=>a.routes[0].kind='unknown',a=>a.extra='unsupported',a=>a.markers[0].gmNotes='x'.repeat(10001),a=>a.routes[0].kind='border'];
  for(const mutate of invalid){const a=structuredClone(valid);mutate(a);assert.throws(()=>validateAtlas(a),/Invalid/);}
});

test('distance respects non-square artwork and custom travel rates and overrides',()=>{
  const a=newAtlas('map');a.scale={a:{x:0,y:0},b:{x:1,y:0},distance:100,unit:'leagues'};a.travel={rate:25,period:'watch'};
  assert.equal(routeDistance([{x:0,y:0},{x:0,y:1}],a.scale,2),50);
  assert.equal(routeDistance([{x:0,y:0},{x:.5,y:0},{x:1,y:0}],a.scale,2),100);
  assert.match(routeSummary(route('r',{override:''}),a,2),/100 leagues.*8 watches/);
  assert.match(routeSummary(route('r'),a,2),/SECRET_OVERRIDE/);
  a.scale=null;assert.equal(routeDistance([],a.scale,2),null);
});

test('map parents reject cycles while keeping missing maps reconnectable',()=>{
  const a=newAtlas('a'),b=newAtlas('b'),c=newAtlas('c');a.parentMapId='b';b.parentMapId='c';c.parentMapId='a';
  assert.throws(()=>validateMapParents('a',a,[{atlas:b},{atlas:c}]),/parent loop/);
  c.parentMapId='missing';assert.doesNotThrow(()=>validateMapParents('a',a,[{atlas:b},{atlas:c}]));
});

test('print layouts fit paper, tile with overlap, and bound oversized posters',()=>{
  for(const paper of ['letter','a4','a3'])for(const orientation of ['portrait','landscape']){const l=printLayout({paper,orientation,aspect:2});assert.equal(l.pages,1);assert.ok(l.mapWidth<=l.pageWidth);assert.ok(l.mapHeight<=l.pageHeight);}
  const l=printLayout({mode:'poster',width:20,aspect:2});assert.equal(l.columns,2);assert.equal(l.rows,2);assert.equal(l.overlap,.15);
  assert.throws(()=>printLayout({mode:'poster',width:200,aspect:.01}),/100 pages/);
  assert.throws(()=>printLayout({paper:'unknown'}),/valid print/);
  assert.equal(printLayout({mode:'fit',width:0}).pages,1);
});

test('print and location keys escape imported text and contain only approved player notes',()=>{
  const a=newAtlas('map');a.playerSafeBase=true;a.publicTitle='<img src=x onerror=alert(1)>';
  a.markers=[marker('p',{name:'<script>name</script>',notes:'<script>notes</script>'})];
  const html=printMapHtml('data:image/png;base64,AA==',exportAtlas(a),{mode:'poster',width:20,aspect:2});
  assert.equal((html.match(/class="sheet"/g)||[]).length,4);assert.match(html,/&lt;script&gt;notes/);assert.match(html,/width:1in/);assert.match(html,/row 2, column 2/);
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('GM_SECRET'));assert.ok(!html.includes('SECRET_MAP'));
  assert.throws(()=>printMapHtml('javascript:alert(1)',exportAtlas(a),{}),/Invalid rendered/);
});
