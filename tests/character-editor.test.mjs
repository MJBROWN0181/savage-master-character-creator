import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CharacterEditor,fingerprint,campaignRoute} from '../character-editor.mjs';
const snapshot=name=>({version:1,system:'dnd5e',character:{name,notes:'memory',inventory:[{name:'Pack',quantity:2}]}});
const record=(name='Cloud',revision=1)=>({id:'record',ownerScope:'owner',system:'dnd5e',revision,snapshot:snapshot(name)});
function fixture(storage=new Map(),initial=snapshot('Device')){
 let draft=initial,downloads=[],calls=[];
 const config={system:'dnd5e',key:'draft',ready:()=>true,storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},snapshot:()=>draft,meaningful:()=>true,normalize:x=>structuredClone(x),validateSave:()=>{},apply:x=>{draft=x;},download:x=>downloads.push(x),load:async()=>record(),save:async args=>{calls.push(args);return {id:'record',revision:2};}};
 const editor=new CharacterEditor(config);return {editor,config,storage,downloads,calls,get:()=>draft,set:x=>{draft=x;}};
}
test('fingerprints ignore object field order while preserving arrays and every character field',()=>{
 assert.equal(fingerprint({b:[2,1],a:1}),fingerprint({a:1,b:[2,1]}));assert.notEqual(fingerprint({a:[1,2]}),fingerprint({a:[2,1]}));
 assert.notEqual(fingerprint(snapshot('A')),fingerprint({...snapshot('A'),character:{...snapshot('A').character,notes:'new'}}));
 assert.equal(campaignRoute('savageWorlds','id&evil'), '/?game=savage&campaign=id%26evil');
});
test('opening is staged; cancel and download never replace the entire device draft',async()=>{
 const f=fixture();f.editor.setOwner('owner');const before=fingerprint(f.get());await f.editor.open({campaignId:'campaign'});
 assert.equal(f.editor.dialog.kind,'open');assert.equal(fingerprint(f.get()),before);f.editor.download();assert.deepEqual(f.downloads,[snapshot('Device')]);assert.equal(fingerprint(f.get()),before);
 f.editor.cancel();assert.equal(f.editor.dialog,null);assert.equal(fingerprint(f.get()),before);
 await f.editor.open({id:'record'});f.editor.acceptOpen();assert.deepEqual(f.get(),snapshot('Cloud'));f.editor.changed();assert.equal(f.editor.binding.id,'record');
});
test('editing while loading or while deciding requires a current replacement decision',async()=>{
 const f=fixture();f.editor.setOwner('owner');let resolve;f.config.load=()=>new Promise(r=>resolve=r);
 const pending=f.editor.open({id:'record'});f.set(snapshot('Edited during fetch'));resolve(record());await pending;
 assert.equal(f.get().character.name,'Edited during fetch');f.set(snapshot('Edited in decision'));f.editor.acceptOpen();assert.equal(f.get().character.name,'Edited in decision');f.editor.acceptOpen();assert.equal(f.get().character.name,'Cloud');
});
test('clearing or changing owner invalidates late load and save results',async()=>{
 const f=fixture();f.editor.setOwner('owner');let resolve;f.config.load=()=>new Promise(r=>resolve=r);const pending=f.editor.open({id:'record'});f.editor.clear();f.set(snapshot('New draft'));resolve(record());await pending;assert.equal(f.get().character.name,'New draft');assert.equal(f.editor.binding,null);
 f.config.save=()=>new Promise(r=>resolve=r);const saving=f.editor.save(true);f.editor.setOwner('other');resolve({id:'old-record',revision:2});await saving;assert.equal(f.editor.binding,null);assert.equal(f.editor.pending,false);
});
test('a save acknowledges only the submitted snapshot, retaining edits made in flight',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));let resolve;f.config.save=()=>new Promise(r=>resolve=r);
 const pending=f.editor.save();f.set(snapshot('Newer edits'));resolve({id:'record',revision:2});await pending;
 assert.equal(f.editor.binding.revision,2);assert.equal(f.editor.binding.baseline,fingerprint(snapshot('Device')));assert.equal(f.get().character.name,'Newer edits');assert.equal(f.editor.message(),'Changes on this device');
});
test('a dirty draft retains ID and old base revision across reload; auth loading does not erase it',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));f.set(snapshot('Unsaved edits'));f.editor.changed();
 const reloaded=fixture(f.storage,f.get());reloaded.editor.changed();assert.ok(f.storage.has('draft-editor-v1'));reloaded.editor.setOwner('owner');assert.equal(reloaded.editor.binding.id,'record');assert.equal(reloaded.editor.binding.revision,1);assert.equal(reloaded.editor.isDirty(),true);
 reloaded.config.load=async()=>record('Device');await reloaded.editor.save();assert.equal(reloaded.calls[0].id,'record');assert.equal(reloaded.calls[0].expectedRevision,1);
});
test('a late classic bridge restores metadata only after ready, before persisting another event',()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));f.editor.changed();const reload=fixture(f.storage,f.get());let ready=false;reload.config.ready=()=>ready;reload.editor.setOwner('owner');reload.editor.changed();assert.equal(reload.editor.binding,null);ready=true;reload.editor.changed();assert.equal(reload.editor.binding.id,'record');
});
test('partial or other-owner metadata cannot attach a legacy draft or refresh its revision',()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record());f.editor.changed();
 const mismatch=fixture(new Map(f.storage),snapshot('Different'));mismatch.editor.setOwner('owner');assert.equal(mismatch.editor.binding,null);
 const other=fixture(new Map(f.storage),f.get());other.editor.setOwner('other');assert.equal(other.editor.binding,null);
});
test('conflict leaves local data and revision intact; load latest uses the same guard',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Old'));f.set(snapshot('My work'));f.config.save=async()=>{throw {data:{code:'CHARACTER_CONFLICT'}};};await f.editor.save();assert.equal(f.editor.dialog.kind,'conflict');assert.equal(f.editor.binding.revision,1);assert.equal(f.get().character.name,'My work');f.editor.cancel();await f.editor.save();assert.equal(f.editor.dialog.kind,'conflict');await f.editor.open({id:'record'});assert.equal(f.editor.dialog.kind,'open');assert.equal(f.get().character.name,'My work');
});
test('connection and serialization failures preserve draft and never claim an account save',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.config.load=async()=>{throw Error('offline')};await f.editor.open({id:'record'});assert.equal(f.get().character.name,'Device');assert.match(f.editor.message(),/Could not confirm/);
 f.config.download=()=>{throw Error('serialize')};f.editor.download();assert.equal(f.get().character.name,'Device');assert.match(f.editor.message(),/Could not prepare/);
});
test('new saves require an explicit account-copy decision and double click does not duplicate requests',async()=>{
 const f=fixture();f.editor.setOwner('owner');await f.editor.save();assert.equal(f.calls.length,0);assert.equal(f.editor.dialog.kind,'create');let resolve;f.config.save=args=>{f.calls.push(args);return new Promise(r=>resolve=r)};const pending=f.editor.save(true);await f.editor.save(true);assert.equal(f.calls.length,1);assert.equal(f.calls[0].expectedOwnerScope,'owner');resolve({id:'new',revision:1});await pending;assert.equal(f.editor.binding.id,'new');
});
test('restored binding revalidation detects a newer cloud copy without changing draft or its base token',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));f.set(snapshot('Unsaved'));f.editor.changed();
 const reload=fixture(f.storage,f.get());reload.editor.setOwner('owner');reload.config.load=async()=>record('Other device',2);await reload.editor.save();
 assert.equal(reload.calls.length,0);assert.equal(reload.editor.binding.revision,1);assert.equal(reload.get().character.name,'Unsaved');assert.equal(reload.editor.dialog.kind,'conflict');
});
test('offline account requests and a cancelled pending open never apply or upload a draft',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.config.online=()=>false;await f.editor.open({id:'record'});await f.editor.save(true);assert.equal(f.calls.length,0);assert.equal(f.get().character.name,'Device');assert.match(f.editor.message(),/offline/);
 f.config.online=()=>true;let resolve;f.config.load=()=>new Promise(r=>resolve=r);const pending=f.editor.open({id:'record'});f.editor.cancelOpen();resolve(record());await pending;assert.equal(f.get().character.name,'Device');assert.equal(f.editor.dialog,null);
});
test('an old Save awaiting verification cannot save a different newly opened character',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));f.editor.bindingVerified=false;let resolve;f.config.load=()=>new Promise(r=>resolve=r);
 const saving=f.editor.save();f.editor.cancelOpen();f.editor.apply({...record('Different'),id:'different-record'});resolve(record('Device'));await saving;assert.equal(f.calls.length,0);assert.equal(f.editor.binding.id,'different-record');
});

for(const errorName of ['QuotaExceededError','SecurityError'])test(`${errorName} while caching cannot turn a recovered account character into a new copy`,async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Old'));f.editor.changed();f.set(snapshot('Unsaved'));
 f.config.load=async()=>record('Latest',2);await f.editor.open({id:'record'});f.editor.acceptOpen();f.editor.changed();
 const baseline=f.editor.binding.baseline;f.config.storage.setItem=()=>{throw new DOMException('Storage rejected the write',errorName);};
 f.set(snapshot('Edited after recovery'));const before=structuredClone(f.get());f.editor.changed();
 assert.equal(f.editor.binding?.id,'record');assert.equal(f.editor.binding.revision,2);assert.equal(f.editor.binding.baseline,baseline);assert.match(f.editor.message(),/Browser storage/);
 f.config.save=async args=>{f.calls.push(args);return {id:'record',revision:3};};await f.editor.save();
 assert.equal(f.editor.dialog,null);assert.equal(f.calls.length,1);assert.equal(f.calls[0].id,'record');assert.equal(f.calls[0].expectedRevision,2);assert.equal(f.calls[0].expectedOwnerScope,'owner');assert.deepEqual(f.calls[0].snapshot,before);
 assert.equal(f.editor.binding.id,'record');assert.equal(f.editor.binding.revision,3);assert.match(f.editor.message(),/Browser storage/);
});

test('failed browser storage retains the stale revision and complete conflict backup',async()=>{
 const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Old'));f.editor.changed();f.set(snapshot('My complete edits'));
 f.config.storage.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};f.editor.changed();
 f.config.save=async args=>{f.calls.push(args);throw {data:{code:'CHARACTER_CONFLICT'}};};await f.editor.save();
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].id,'record');assert.equal(f.calls[0].expectedRevision,1);assert.equal(f.editor.dialog?.kind,'conflict');assert.equal(f.editor.binding.revision,1);
 f.editor.download();assert.deepEqual(f.downloads,[snapshot('My complete edits')]);f.editor.cancel();assert.deepEqual(f.get(),snapshot('My complete edits'));assert.equal(f.editor.binding.id,'record');
});

test('explicit new draft and owner change still detach when browser storage is failing',async()=>{
 for(const action of ['new','owner']){
  const f=fixture();f.editor.setOwner('owner');f.editor.apply(record('Device'));f.editor.changed();
  f.config.storage.setItem=f.config.storage.removeItem=()=>{throw new DOMException('Blocked','SecurityError');};f.editor.changed();
  if(action==='new')f.editor.clear();else f.editor.setOwner('other');
  assert.equal(f.editor.binding,null);await f.editor.save();assert.equal(f.editor.dialog.kind,'create');assert.equal(f.calls.length,0);assert.deepEqual(f.get(),snapshot('Device'));
 }
});
