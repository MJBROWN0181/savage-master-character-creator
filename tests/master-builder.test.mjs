import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newWorld,foundationIssues,worldIssues,validateWorld,ruleSetName,worldBackup,readWorldBackup} from '../builder-model.mjs';

test('world creation starts with an explicit rule foundation and supports arbitrary systems',()=>{
  const w=newWorld();assert.equal(w.rules.base,'');assert.equal(foundationIssues(w).length,1);
  for(const base of ['savageWorlds','dnd5e','pathfinder2e']){w.rules.base=base;assert.deepEqual(foundationIssues(w),[]);}
  w.rules.base='other';assert.equal(foundationIssues(w).length,1);w.rules.name='A card-driven space opera';
  w.rules.edition='My table revision 7';w.name='The Drift';w.playStyle.resolution='Players trade cards to decide outcomes.';
  w.houseRules=[{id:'custom-rule',name:'Drift travel',category:'Exploration',text:'Spend a memory to move between stars.'}];
  w.customFields=[{id:'custom-field',label:'Starship consciousness',value:'Ships remember their crews.'}];
  assert.deepEqual(worldIssues(w),[]);assert.equal(ruleSetName(w),w.rules.name);assert.doesNotThrow(()=>validateWorld(w));
  w.rules.base='original';assert.doesNotThrow(()=>validateWorld(w));
});
test('world backups preserve original content and incomplete drafts',()=>{
  const w=newWorld();w.secrets='A hidden moon';w.customFields=[{id:'draft',label:'',value:'Unfinished ideas'}];
  assert.deepEqual(readWorldBackup(JSON.parse(JSON.stringify(worldBackup(w)))),w);
  assert.throws(()=>validateWorld(w));assert.throws(()=>readWorldBackup({version:2,kind:'savage-master-world',world:w}));
  assert.throws(()=>readWorldBackup({version:1,kind:'character',world:w}));
});
test('world validation rejects malformed data, unsafe keys, duplicate ids, and oversized content',()=>{
  const valid=()=>({...newWorld(),name:'Test',rules:{...newWorld().rules,base:'dnd5e'}});
  for(const mutate of [
    w=>{w.rules.base='unknown';},w=>{w.playStyle=null;},w=>{delete w.history;},w=>{w.name='x'.repeat(161);},
    w=>{w.customFields=[{id:'a',label:'A',value:''},{id:'a',label:'B',value:''}];},
    w=>{w.customFields=[{id:'constructor',label:'A',value:'',constructor:'unsafe'}];},
    w=>{Object.defineProperty(w,'__proto__',{value:'unsafe',enumerable:true});},
    w=>{w.houseRules=[{id:'a',name:'',category:'',text:''}];},
    w=>{w.customFields=Array.from({length:101},(_,i)=>({id:String(i),label:'Field',value:''}));},
    w=>{w.customFields=Array.from({length:20},(_,i)=>({id:String(i),label:'Field',value:'x'.repeat(30000)}));},
  ]){const w=valid();mutate(w);assert.throws(()=>validateWorld(w));}
});
