import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function makeApp(saved = null) {
  const storage = new Map(saved ? [['savage-master-character-v1', saved]] : []);
  const content={scrollTop:900},scrolls=[];
  const context = vm.createContext({
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    document: { addEventListener() {},getElementById:()=>content,querySelector:()=>null }, window: {scrollTo:options=>scrolls.push(options)}, console, confirm: () => true, URLSearchParams, location:{search:''},fetch:()=>Promise.reject(new Error('offline test')),
  });
  for (const file of ['data.js', 'settings.js', 'app.js']) vm.runInContext(readFileSync(file, 'utf8'), context);
  return { app: vm.runInContext('app', context), storage,content,scrolls };
}

test('Savage Worlds cannot buy extra copies or increase quantities beyond remaining funds', () => {
  const {app}=makeApp();app.renderContent=app.renderSummary=()=>{};
  const categories=app.getGearCategories();
  const [category,items]=Object.entries(categories).find(([,rows])=>rows.some(item=>item.cost>0&&item.cost<=500));
  const item=items.find(item=>item.cost>0&&item.cost<=500);
  app.character.gear=[{...item,qty:Math.floor(500/item.cost)}];
  const quantity=app.character.gear[0].qty;
  app.addGear(category,item.id);app.changeGearQty(0,1);
  assert.equal(app.character.gear[0].qty,quantity);assert.ok(app.getRemainingFunds()>=0);
  app.removeGear(0);assert.equal(app.getRemainingFunds(),500);
});

test('Savage Worlds rechecks earlier choices after returning from review', () => {
  const {app,content,scrolls}=makeApp();const checked=[];
  app.currentStep=8;app.renderNav=app.renderContent=app.renderSummary=()=>{};
  app.validateStep=i=>{checked.push(i);return {valid:i!==2,errors:['Choose ancestry']};};
  let shown;app.showValidationErrors=errors=>shown=errors;
  app.goToStep(9);assert.deepEqual(checked,[0,1,2]);assert.equal(app.currentStep,2);assert.deepEqual(shown,['Choose ancestry']);
  assert.equal(content.scrollTop,0);assert.ok(scrolls.every(options=>options.top===0));
});

test('Savage Worlds forward and backward section changes reset page and content scrolling',()=>{
 const {app,content,scrolls}=makeApp();app.renderNav=app.renderContent=app.renderSummary=()=>{};
 app.validateStep=()=>({valid:true,errors:[]});
 app.goToStep(1);assert.equal(content.scrollTop,0);assert.equal(scrolls.at(-1).top,0);
 content.scrollTop=800;app.goToStep(0);assert.equal(content.scrollTop,0);assert.equal(scrolls.length,2);
});

test('Savage Worlds cannot spend a final single point on a two-point skill raise', () => {
  const {app}=makeApp();app.renderContent=app.renderSummary=()=>{};
  app.getSkillPoints=()=>({remaining:1});
  app.character.attributes.agility=4;app.character.skills.stealth=4;
  app.changeSkill('stealth',1);assert.equal(app.character.skills.stealth,4);
  app.changeSkill('fighting',1);assert.equal(app.character.skills.fighting,4);
});

test('Savage Worlds blocks excess Hindrances, attributes, skills, and Edges at the mutation boundary',()=>{
 const {app}=makeApp();app.renderContent=app.renderSummary=()=>{};const notices=[];app.choiceNotice=(title,message)=>notices.push({title,message});
 const major=app.getHindrances().filter(h=>h.type==='Major').slice(0,3);for(const h of major)app.toggleHindrance(h.id);
 assert.equal(app.character.hindrances.length,2);assert.equal(app.getHindrancePoints().earned,4);assert.match(notices.at(-1).title,/limit reached/);
 app.character.hindrances=[];for(const h of app.getHindrances().filter(h=>h.type==='Minor').slice(0,5))app.toggleHindrance(h.id);assert.equal(app.character.hindrances.length,4);
 app.character.hindrances=[];for(let i=0;i<4;i++)app.changeAttribute('agility',1);app.changeAttribute('smarts',1);assert.equal(app.getAttributePoints().remaining,0);app.changeAttribute('vigor',1);assert.equal(app.character.attributes.vigor,4);
 for(let pass=0;pass<5&&app.getSkillPoints().remaining;pass++)for(const id of Object.keys(app.character.skills))app.changeSkill(id,1);
 assert.equal(app.getSkillPoints().remaining,0);const before=JSON.stringify(app.character.skills);for(const id of Object.keys(app.character.skills))app.changeSkill(id,1);assert.equal(JSON.stringify(app.character.skills),before);
 app.selectRace('human');app.toggleEdge('alertness');app.toggleEdge('dangerSense');assert.equal(app.character.edges.length,1);assert.equal(app.getEdgeBudget().remaining,0);
});

test('changing ancestry and heritage replaces free raises while keeping purchased raises', () => {
  const { app } = makeApp();
  app.renderContent = app.renderSummary = () => {};
  app.selectRace('elf');
  assert.equal(app.character.attributes.agility, 6);
  app.character.attributes.agility = 8;
  app.selectRace('human');
  assert.equal(app.character.attributes.agility, 6);
  app.selectRace('halfElf');
  assert.equal(app.validateStep(2).valid, false);
  app.selectHeritage('agile');
  assert.equal(app.character.attributes.agility, 8);
  assert.equal(app.validateStep(2).valid, true);
  app.selectHeritage('adaptable');
  assert.equal(app.character.attributes.agility, 6);
});

test('changing setting removes old ancestry bonuses', () => {
  const { app } = makeApp();
  app.renderContent = app.renderSummary = () => {};
  app.selectRace('elf');
  app.selectSetting('deadlands');
  assert.equal(app.character.attributes.agility, 4);
});

test('carrying multiple shields uses the best Parry bonus once', () => {
  const { app } = makeApp();
  app.character.skills.fighting = 6;
  app.character.gear = [{ parryBonus: 1, qty: 3 }, { parryBonus: 2 }];
  assert.equal(app.getDerivedStats().parry, 7);
});

test('hindrance allocations cannot exceed earned points', () => {
  const { app } = makeApp();
  app.character.hindrancePointsSpent.edges = 1;
  assert.equal(app.validateStep(3).valid, false);
});

test('local draft restores after refresh and reset replaces it', () => {
  const { app, storage } = makeApp();
  app.character.name = 'Sage';
  app.character.notes = 'A ranger';
  app.currentStep = 7;
  app.saveCharacter();
  const restored = makeApp(storage.get('savage-master-character-v1'));
  restored.app.renderNav = () => {};
  restored.app.goToStep = () => {};
  restored.app.init();
  assert.equal(restored.app.currentStep, 7);
  assert.equal(restored.app.character.name, 'Sage');
  assert.equal(restored.app.character.notes, 'A ranger');
  restored.app.resetCharacter();
  assert.equal(JSON.parse(restored.storage.get('savage-master-character-v1')).character.name, '');
});

test('editable backup round trips and rejects unrelated or malformed files', () => {
  const { app } = makeApp();
  app.character.name = 'Captain';
  app.character.setting = 'deadlands';
  const backup = JSON.parse(JSON.stringify({ version: 1, character: app.character }));
  assert.equal(app.parseCharacterBackup(backup).setting, 'deadlands');
  assert.throws(() => app.parseCharacterBackup({ name: 'summary' }), /backup/);
  backup.character.attributes.vigor = -1;
  assert.throws(() => app.parseCharacterBackup(backup), /attributes/);
});

test('Savage Worlds puts required name after the shop and migrates older story drafts',()=>{
 const {app}=makeApp();assert.match(app.validateStep(9).errors.join(' '),/name/);assert.deepEqual(Array.from(app.validateStep(0).errors),[]);
 app.character.name='Aster';assert.deepEqual(Array.from(app.validateStep(9).errors),[]);
 const old=makeApp(JSON.stringify({version:1,character:app.character,step:7}));old.app.renderNav=old.app.goToStep=()=>{};old.app.init();assert.equal(old.app.currentStep,9);
});
test('Savage Worlds preserves completed chapters on backward navigation and in its draft',()=>{
 const {app,storage}=makeApp();app.renderNav=app.renderContent=app.renderSummary=()=>{};app.goToStep(1);app.goToStep(0);assert.ok(app.completedSteps.includes(0));app.saveCharacter();assert.ok(JSON.parse(storage.get('savage-master-character-v1')).completedSteps.includes(0));
});
