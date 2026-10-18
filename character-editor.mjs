// Account binding stays outside portable character backups.
export function fingerprint(value){
 const normalize=v=>Array.isArray(v)?v.map(normalize):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,normalize(v[k])])):v;
 return JSON.stringify(normalize(value));
}
export function campaignRoute(system,campaign){const q='campaign='+encodeURIComponent(campaign);return system==='dnd5e'?'/dnd?'+q:system==='pathfinder2e'?'/pathfinder?'+q:'/?game=savage&'+q;}
export function editorMessage(error){
 const code=error?.data?.code;
 return ({CHARACTER_CONFLICT:'Your account copy changed. Your device draft is still here.',ACCOUNT_CHANGED:'Your account changed. This draft has not been copied to the new account.',UPDATE_REQUIRED:'Update the app before saving this character to your account. Your device draft is still here.',SIGN_IN_REQUIRED:'Sign in to open or save your account character.',NO_CHARACTER:'You have no character attached to this campaign.',CAMPAIGN_UNAVAILABLE:'This campaign is unavailable to your account.',CAMPAIGN_SYSTEM_REQUIRED:'Your GM needs to choose a game system first.',SYSTEM_MISMATCH:'This character belongs to another game system.',CHARACTER_UNAVAILABLE:'This character is unavailable to your account.',INVALID_CHARACTER:'This character needs review before it can be loaded or saved.',INVALID_LOCATOR:'This character link is invalid.'})[code]||'Could not confirm your account request. Your draft is still here. Check your connection.';
}
export class CharacterEditor {
 constructor(config){this.config=config;this.owner=undefined;this.binding=null;this.generation=0;this.pending=false;this.dialog=null;this.status='';this.conflict=false;this.started=false;this.restored=false;this.bindingVerified=false;}
 emit(){this.config.onChange?.();}
 snapshot(){return structuredClone(this.config.snapshot());}
 mark(status){this.status=status;this.emit();}
 setOwner(owner){
  if(owner===undefined||owner===this.owner)return;
  const first=this.owner===undefined;this.owner=owner;this.generation++;this.pending=false;this.dialog=null;this.conflict=false;
  if(!first){this.started=false;this.restored=true;this.bindingVerified=false;this.binding=null;this.status='Changes on this device';this.persist();}
  else this.restore();
  this.emit();
 }
 restore(){
  if(this.restored||!this.owner||!this.config.ready())return;
  this.restored=true;
  try{const m=JSON.parse(this.config.storage.getItem(this.config.key+'-editor-v1'));
   if(m?.version===1&&m.system===this.config.system&&m.ownerScope===this.owner&&typeof m.id==='string'&&Number.isSafeInteger(m.revision)&&m.revision>=0&&typeof m.baseline==='string'&&m.draft===fingerprint(this.snapshot()))this.binding=m;
  }catch{};
 }
 persist(){
  if(this.owner===undefined||!this.config.ready())return;
  try{const storage=this.config.storage,key=this.config.key+'-editor-v1';
   if(this.binding&&this.binding.ownerScope===this.owner){this.binding={...this.binding,draft:fingerprint(this.snapshot())};storage.setItem(key,JSON.stringify(this.binding));}
   else storage.removeItem(key);
  }catch{this.binding=null;this.status='Browser storage is full. Your working draft is still here; download a backup.';}
 }
 changed(){this.restore();this.persist();this.emit();}
 clear(){this.generation++;this.started=true;this.binding=null;this.bindingVerified=false;this.dialog=null;this.pending=false;this.conflict=false;this.status='Changes on this device';this.persist();this.emit();}
 current(generation,owner){return this.generation===generation&&this.owner===owner;}
 isDirty(){return !this.binding||this.binding.baseline!==fingerprint(this.snapshot());}
 message(){return this.pending?this.status:this.conflict?this.status:this.status&&this.status!=='Saved to your account'?this.status:this.binding&&!this.isDirty()?'Saved to your account':'Changes on this device';}
 async verifyBinding(){
  if(!this.binding||this.bindingVerified||this.pending)return;
  const binding=this.binding,generation=this.generation,owner=this.owner;
  this.pending=true;this.mark('Checking account character');
  try{
   const record=await this.config.load({id:binding.id,expectedSystem:this.config.system});
   if(!this.current(generation,owner)||this.binding?.id!==binding.id)return;
   this.pending=false;
   if(record.ownerScope!==owner||record.id!==binding.id||record.system!==this.config.system)throw Error('Invalid binding');
   if(record.revision!==binding.revision){this.bindingVerified=true;this.conflict=true;this.dialog={kind:'conflict'};this.mark('Your account copy changed. Your device draft is still here.');return;}
   if(fingerprint(this.config.normalize(record.snapshot))!==binding.baseline){this.binding=null;this.persist();this.mark('This device draft is not linked to the account copy. Keep it or download a backup.');return;}
   this.bindingVerified=true;this.status=this.isDirty()?'Changes on this device':'Saved to your account';this.emit();
  }catch(error){if(this.current(generation,owner)){this.pending=false;this.mark(editorMessage(error));}}
 }
 async open(locator){
  if(this.pending)return;
  if(this.config.online?.()===false){this.mark('You are offline. Your draft is still here. Reconnect to open your account character.');return;}
  if(!this.owner){this.mark('Sign in to open your account character.');return;}
  if(!this.config.ready()){this.mark('Opening character.');return;}
  const generation=++this.generation,owner=this.owner,start=fingerprint(this.snapshot());
  this.pending=true;this.mark('Opening character');
  try{
   const record=await this.config.load({...locator,expectedSystem:this.config.system});
   if(!this.current(generation,owner))return;
   if(record.ownerScope!==owner||record.system!==this.config.system)throw new Error('Invalid editor record');
   const normalized=this.config.normalize(record.snapshot);const target={...record,snapshot:normalized};
   this.pending=false;
   // Always ask for meaningful device work, including edits made during the request.
   if(fingerprint(this.snapshot())!==start||this.config.meaningful()&&this.isDirty()){
    this.dialog={kind:'open',record:target,locator,guard:fingerprint(this.snapshot())};this.status='Your device draft will be replaced only if you choose Open.';this.emit();
   }else this.apply(target,generation,owner);
  }catch(error){if(this.current(generation,owner)){this.pending=false;this.mark(editorMessage(error));}}
 }
 apply(record,generation=this.generation,owner=this.owner){
  if(!this.current(generation,owner))return;
  try{
   // Normalize/validate before allowing any adapter to change its state.
   const snapshot=this.config.normalize(record.snapshot);
   this.config.apply(snapshot);
   this.binding={version:1,system:this.config.system,id:record.id,ownerScope:owner,revision:record.revision,baseline:fingerprint(snapshot),draft:fingerprint(snapshot)};
   this.bindingVerified=true;
   this.dialog=null;this.conflict=false;this.status='Saved to your account';this.emit();
   // React adapters persist after their state commit; classic scripts persist synchronously.
  }catch{this.mark('Could not open this character. Your existing draft is still here.');}
 }
 acceptOpen(){
  const d=this.dialog;if(d?.kind!=='open')return;
  const now=fingerprint(this.snapshot());
  if(now!==d.guard){this.dialog={...d,guard:now};this.mark('Your draft changed while this decision was open. Review it before choosing Open again.');return;}
  this.apply(d.record);
 }
 cancel(){this.dialog=null;this.mark(this.conflict?'Your account copy changed. Your device draft is still here.':'Changes on this device');}
 cancelOpen(){this.generation++;this.started=true;this.pending=false;this.dialog=null;this.mark('Opening cancelled. Your device draft is still here.');}
 download(){try{this.config.download(this.snapshot());}catch{this.mark('Could not prepare your backup. Your draft is still here.');}}
 async save(confirmed=false){
  if(this.pending)return;
  if(this.config.online?.()===false){this.mark('You are offline. Your draft is still here. Reconnect before saving to your account.');return;}
  if(!this.owner){this.mark('Sign in to save this character to your account.');return;}
  if(this.binding&&!this.bindingVerified){
   const generation=this.generation,owner=this.owner,id=this.binding.id;
   await this.verifyBinding();
   if(!this.current(generation,owner)||this.binding?.id!==id||!this.bindingVerified)return;
  }
  if(this.conflict){this.dialog={kind:'conflict'};this.emit();return;}
  let snapshot;
  try{snapshot=this.snapshot();this.config.validateSave(snapshot);}catch(error){this.mark(error.message||'Review your character before saving.');return;}
  if(!this.binding&&!confirmed){this.dialog={kind:'create'};this.emit();return;}
  const generation=this.generation,owner=this.owner,binding=this.binding;
  this.dialog=null;this.pending=true;this.mark('Saving to your account');
  try{
   const saved=await this.config.save({id:binding?.id,expectedRevision:binding?.revision,expectedOwnerScope:owner,snapshot});
   if(!this.current(generation,owner))return;
   this.pending=false;this.binding={version:1,system:this.config.system,id:saved.id,ownerScope:owner,revision:saved.revision,baseline:fingerprint(snapshot),draft:fingerprint(this.snapshot())};
   this.bindingVerified=true;
   this.status=fingerprint(this.snapshot())===this.binding.baseline?'Saved to your account':'Changes on this device';this.persist();this.emit();
  }catch(error){if(!this.current(generation,owner))return;this.pending=false;this.conflict=error?.data?.code==='CHARACTER_CONFLICT';if(this.conflict)this.dialog={kind:'conflict'};this.mark(editorMessage(error));}
 }
}
