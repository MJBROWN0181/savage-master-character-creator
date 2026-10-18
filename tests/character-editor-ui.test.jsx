// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {test,expect,vi,beforeEach,afterEach} from 'vitest';
import {getFunctionName} from 'convex/server';
import {newDndCharacter} from '../dnd-model.mjs';
import {fresh} from '../pathfinder-model.mjs';
import feats from '../pathfinder-data/feats.json';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const state=vi.hoisted(()=>({owner:'owner',record:null,saves:[],load:null}));
vi.mock('convex/react',async()=>{
 const {getFunctionName}=await import('convex/server');
 return {ConvexReactClient:class{},useConvexAuth:()=>({isAuthenticated:!!state.owner,isLoading:false}),useQuery:r=>getFunctionName(r)==='characters:editorIdentity'?state.owner:[],useConvex:()=>({query:async(r,args)=>state.load?state.load(args):structuredClone(state.record)}),useMutation:r=>async args=>{
  if(getFunctionName(r)!=='characters:saveForEdit')throw Error('Unsafe mutation');
  state.saves.push(structuredClone(args));
  if(args.expectedOwnerScope!==state.owner)throw {data:{code:'ACCOUNT_CHANGED'}};
  if(args.id&&args.expectedRevision!==state.record.revision)throw {data:{code:'CHARACTER_CONFLICT'}};
  state.record={...state.record,snapshot:args.snapshot,revision:state.record.revision+1};return {id:state.record.id,revision:state.record.revision};
 }};
});
vi.mock('@convex-dev/auth/react',()=>({ConvexAuthProvider:({children})=>children,useAuthActions:()=>({signIn:vi.fn(),signOut:vi.fn()})}));
vi.mock('../account.jsx',()=>({CharacterAccount:()=>null}));
import {DndBuilder} from '../dnd-builder.jsx';
import {App as Pathfinder} from '../pathfinder.jsx';
const {CharacterAccount:Savage}=await vi.importActual('../account.jsx');
let root,app;
beforeEach(()=>{
 localStorage.clear();window.history.replaceState({},'','/dnd?campaign=campaign');state.owner='owner';state.saves=[];state.load=null;
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('requestAnimationFrame',cb=>{cb(0);return 1});vi.stubGlobal('cancelAnimationFrame',()=>{});window.scrollTo=vi.fn();
 HTMLDialogElement.prototype.showModal=function(){this.open=true;};HTMLDialogElement.prototype.close=function(){this.open=false;};
 document.body.innerHTML='<div id="test-root"></div><ul id="stepNav"></ul><nav id="savageJourney"></nav><main id="mainContent"></main><aside id="summaryPanel"></aside><div id="summaryOverlay"></div>';
 root=createRoot(document.getElementById('test-root'));
});
afterEach(async()=>{await act(()=>root.unmount());delete window.savageMasterBridge;vi.unstubAllGlobals();});
const dnd=()=>({version:1,system:'dnd5e',character:{...newDndCharacter(),name:'Cloud Dwarf',species:'Dwarf',skills:['Perception','Survival'],languageChoices:['Elvish'],languages:'Common, Dwarvish, Elvish'}});
const pf=()=>({version:1,system:'pathfinder2e',character:{...fresh(),name:'Cloud Pathfinder',heritage:'Versatile Human',background:'Warrior',boosts:{ancestry:['str','con'],background:['str','dex'],class:['str'],free:['str','dex','con','wis']},ranks:{Athletics:1,Acrobatics:1,Survival:1,Medicine:1},feats:[feats.find(r=>r.data.category==='ancestry'&&r.data.level.value===1&&r.data.traits.value.includes('human')),feats.find(r=>r.data.category==='class'&&r.data.level.value===1&&r.data.traits.value.includes('fighter')),feats.find(r=>r.data.category==='general'&&r.data.level.value===1)]}});
function savage(){
 const ctx=vm.createContext({window,document,localStorage,console,URLSearchParams,location:{search:''},confirm:()=>true,fetch:()=>Promise.reject(Error('offline fixture'))});
 for(const file of ['data.js','settings.js','app.js'])vm.runInContext(readFileSync(file,'utf8'),ctx);
 app=vm.runInContext('app',ctx);app.init();return {version:1,character:{...JSON.parse(JSON.stringify(app.character)),name:'Cloud Savage'}};
}
async function render(Component){await act(async()=>root.render(<Component/>));}
async function click(text){const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);expect(button,text).toBeTruthy();await act(async()=>button.click());}

test.each([['dnd5e',DndBuilder,dnd,'savage-master-dnd-draft-v1'],['pathfinder2e',Pathfinder,pf,'smsheets-pathfinder-draft-v1'],['savageWorlds',Savage,savage,'savage-master-character-v1']])('%s actual adapter opens, keeps a draft, persists binding and saves the same record after reload',async(system,Component,make,key)=>{
 const snapshot=make();state.record={id:'record',ownerScope:'owner',revision:1,system,snapshot};
 await render(Component);
 if(document.querySelector('.character-editor-dialog').open)await click('Open '+snapshot.character.name);
 expect(JSON.parse(localStorage.getItem(key+'-editor-v1'))).toMatchObject({id:'record',revision:1});
 expect(document.querySelector('.character-editor-panel').textContent).toContain('Back to campaign');
 // Change the complete device payload and remount a real adapter as a reload would.
 await act(()=>root.unmount());const saved=JSON.parse(localStorage.getItem(key));if(system==='pathfinder2e')saved.notes='My later notes';else saved.character.notes='My later notes';localStorage.setItem(key,JSON.stringify(saved));
 const metadata=JSON.parse(localStorage.getItem(key+'-editor-v1'));
 const {fingerprint}=await import('../character-editor.mjs');metadata.draft=fingerprint(system==='pathfinder2e'?{version:1,system,character:saved}:{version:1,...(system==='dnd5e'?{system}:{}),character:saved.character});localStorage.setItem(key+'-editor-v1',JSON.stringify(metadata));
 window.history.replaceState({},'','/'+(system==='savageWorlds'?'?game=savage':system==='dnd5e'?'dnd':'pathfinder'));
 if(system==='savageWorlds'){app.character=app.parseCharacterBackup(saved);app.saveCharacter();}
 root=createRoot(document.getElementById('test-root'));await render(Component);
 await click(system==='savageWorlds'?'Save Character':'Save character');
 expect(state.saves).toHaveLength(1);expect(state.saves[0]).toMatchObject({id:'record',expectedRevision:1,expectedOwnerScope:'owner'});
 expect(state.saves[0].snapshot.character.notes).toBe('My later notes');
});
test('actual D&D adapter cancels a campaign open without changing payload or journey',async()=>{
 const snapshot=dnd();state.record={id:'record',ownerScope:'owner',revision:1,system:'dnd5e',snapshot};
 const draft={character:{...snapshot.character,name:'Unfinished device hero'},step:10,stepVersion:4,selections:{species:true,class:true,background:true},completed:[0,1,2]};localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify(draft));
 await render(DndBuilder);const before=localStorage.getItem('savage-master-dnd-draft-v1');expect(document.querySelector('.character-editor-dialog').open).toBe(true);await click('Keep this draft');expect(localStorage.getItem('savage-master-dnd-draft-v1')).toBe(before);expect(state.saves).toHaveLength(0);
});
test('actual D&D adapter preserves its draft on a stale save and never refreshes only its token',async()=>{
 state.record={id:'record',ownerScope:'owner',revision:1,system:'dnd5e',snapshot:dnd()};await render(DndBuilder);if(document.querySelector('.character-editor-dialog').open)await click('Open Cloud Dwarf');
 state.record.revision=2;state.record.snapshot.character.notes='Other device';const before=localStorage.getItem('savage-master-dnd-draft-v1');await click('Save character');
 expect(document.querySelector('.character-editor-dialog').textContent).toContain('Your account copy changed');expect(localStorage.getItem('savage-master-dnd-draft-v1')).toBe(before);expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1-editor-v1')).revision).toBe(1);expect(state.record.snapshot.character.notes).toBe('Other device');
});
test('Savage Worlds rerendering cannot detach the draft decision from the browser top layer',async()=>{
 const snapshot=savage();app.character.name='Device draft';app.saveCharacter();state.record={id:'record',ownerScope:'owner',revision:1,system:'savageWorlds',snapshot};await render(Savage);
 expect(document.querySelector('.character-editor-dialog').open).toBe(true);await act(()=>app.renderContent());
 const modal=document.querySelector('.character-editor-dialog');expect(modal.parentElement).toBe(document.body);expect(modal.open).toBe(true);await click('Keep this draft');expect(app.character.name).toBe('Device draft');
});
test('Savage Worlds backup import clears the loaded account binding before replacing its draft',async()=>{
 const snapshot=savage();state.record={id:'record',ownerScope:'owner',revision:1,system:'savageWorlds',snapshot};await render(Savage);if(document.querySelector('.character-editor-dialog').open)await click('Open Cloud Savage');
 vi.stubGlobal('confirm',()=>true);const restored={...snapshot,character:{...snapshot.character,name:'Imported separate hero'},id:'record',revision:999};
 await act(()=>app.importBackup({files:[{size:500,text:async()=>JSON.stringify(restored)}],value:'backup.json'}));
 expect(localStorage.getItem('savage-master-character-v1-editor-v1')).toBeNull();expect(app.character.name).toBe('Imported separate hero');await click('Save Character');expect(document.querySelector('.character-editor-dialog').textContent).toContain('Save this device draft?');expect(state.saves).toHaveLength(0);
});
