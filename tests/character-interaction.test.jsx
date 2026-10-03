// @vitest-environment happy-dom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
vi.mock('convex/react',()=>({useConvexAuth:()=>({isAuthenticated:false}),useConvex:()=>({}),useQuery:()=>undefined,useMutation:()=>()=>{},ConvexReactClient:class{}}));
vi.mock('@convex-dev/auth/react',()=>({ConvexAuthProvider:({children})=>children}));
vi.mock('../account.jsx',()=>({CharacterAccount:()=>null}));
import {DndBuilder} from '../dnd-builder.jsx';
import {App as PathfinderBuilder} from '../pathfinder.jsx';
import {newDndCharacter} from '../dnd-model.mjs';
import {SpellBook} from '../dnd-sheet.jsx';
let root,container;
beforeEach(()=>{
 localStorage.clear();document.body.innerHTML='<div id="test-creator"></div>';container=document.getElementById('test-creator');root=createRoot(container);
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('requestAnimationFrame',cb=>{cb(0);return 1});vi.stubGlobal('cancelAnimationFrame',()=>{});window.scrollTo=vi.fn();
 HTMLDialogElement.prototype.showModal=function(){this.open=true};HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new Event('close'))};
});
afterEach(async()=>{await act(()=>root.unmount());vi.unstubAllGlobals();document.body.innerHTML='';});
function button(name){const match=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===name||b.getAttribute('aria-label')===name);expect(match,`Button: ${name}`).toBeTruthy();return match;}
async function click(name){const b=button(name);expect(b.disabled).toBe(false);await act(()=>b.click());}
function title(){return document.querySelector('.creation-step-heading h2').textContent;}
async function fill(input,value){const setter=Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;await act(()=>{setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});}
async function continueNotice(){const d=document.querySelector('#creationLimitNotice');expect(d.open).toBe(true);await act(()=>d.querySelector('button:last-child').click());}
async function choose(select,value){await act(()=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));});}
async function card(name){await click('Meet '+name);expect(document.querySelector('.choice-preview').open).toBe(true);await click('My choice: '+name);await continueNotice();}
async function story(name){expect(title()).toBe('Name & story');await fill(document.querySelector('input[placeholder="What will your hero be called?"]'),name);await click('ChatGPT: help with bio & portrait');expect(document.querySelector('#characterStoryHelp').open).toBe(true);await click('Character portrait');expect(document.querySelector('#story-help-prompt').value).toContain('original fantasy character portrait');await click('Close');await click('Continue to Character sheet');expect(title()).toBe('Character sheet');await click('Finish character review');expect(document.querySelector('.creation-book').open).toBe(true);expect(document.querySelector('.creation-book').textContent).not.toContain('remaining');expect(window.scrollTo).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'});}
test('new D&D character walks cards, missing-choice book, shop and final story without an early name gate',async()=>{
 await act(()=>root.render(<DndBuilder/>));expect(title()).toBe('Species');expect(document.querySelector('.creation-summary').textContent).not.toContain('Derived stats');
 await click('Greater Detail about Dwarf');expect(document.querySelector('.choice-full-details').open).toBe(true);expect(document.querySelector('.choice-preview').textContent).toContain('Poison damage resistance');await click('My choice: Dwarf');await continueNotice();expect(title()).toBe('Class');expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.languages).toBe('Common, Dwarvish');
 await card('Fighter');expect(title()).toBe('Background');await card('Soldier');expect(title()).toBe('Starting level');await click('Continue to Abilities');await click('Continue to Skills');expect(title()).toBe('Skills');
 await click('Continue to Languages');expect(title()).toBe('Skills');expect(document.querySelector('#creationLimitNotice').textContent).toContain('2 more skill');await click('Edit these choices');
 for(const name of ['Perception','Survival'])await act(()=>document.querySelector(`input[aria-label="${name} proficiency"]`).click());
 await click('Continue to Languages');await act(()=>document.querySelector('input[aria-label="Elvish language"]').click());await continueNotice();expect([...document.querySelectorAll('.creation-timeline button')].some(b=>b.textContent.endsWith('Spells'))).toBe(false);await click('Continue to Equipment shop');expect(title()).toBe('Equipment shop');await click('Continue to Name & story');await story('Journey QA Dwarf');
 const draft=JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1'));expect(draft.character.species).toBe('Dwarf');expect(draft.completed).toHaveLength(11);
 await click('Close book');await act(()=>[...document.querySelectorAll('.creation-timeline button')].find(b=>b.textContent.trim().endsWith('Class')).click());await card('Fighter');expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.skills).toEqual(['Perception','Survival']);
});
test('new Pathfinder character walks separate origins and each boost stage through final story',async()=>{
 await act(()=>root.render(<PathfinderBuilder/>));await card('Human');await card('Fighter');await card('Versatile Human');await card('Warrior');expect(title()).toBe('Starting level');await click('Continue to Attributes');
 for(const picks of [['STR','CON'],['STR','DEX'],['STR'],['STR','DEX','CON','WIS']]){
  for(const name of picks){const b=[...document.querySelectorAll('.creation-page article button')].find(b=>b.textContent.startsWith(name+' '));await act(()=>b.click());}
  if(picks.length!==4)await click('Next boost stage');
 }
 await click('Continue to Skills');expect(title()).toBe('Skills');
 for(const name of ['Athletics','Acrobatics','Survival','Medicine']){const article=[...document.querySelectorAll('.creation-page article')].find(a=>a.querySelector('h3')?.textContent.startsWith(name+' '));await act(()=>article.querySelector('input[type="checkbox"]').click());}
 await click('Continue to Feats & choices');expect(title()).toBe('Feats & choices');
 await act(()=>[...document.querySelectorAll('.creation-page button')].find(b=>b.textContent.startsWith('My choice: ')).click());
 const category=document.querySelector('.creation-page select');await act(()=>{category.value='class';category.dispatchEvent(new Event('change',{bubbles:true}));});await act(()=>[...document.querySelectorAll('.creation-page button')].find(b=>b.textContent.startsWith('My choice: ')).click());
 await act(()=>{category.value='general';category.dispatchEvent(new Event('change',{bubbles:true}));});await act(()=>[...document.querySelectorAll('.creation-page button')].find(b=>b.textContent.startsWith('My choice: ')).click());await click('Continue to Spells');expect(document.querySelector('.creation-page').textContent).toContain('No spells required');await click('Continue to Equipment shop');expect(document.querySelector('.creation-page').textContent).toContain('15.00 GP');await click('Continue to Name & story');await story('Journey QA Pathfinder');
 expect(JSON.parse(localStorage.getItem('smsheets-pathfinder-draft-v1')).setting).toBe('pathfinder2e');expect(JSON.parse(localStorage.getItem('smsheets-pathfinder-draft-v1-journey')).completed).toHaveLength(12);
 await click('Close book');await act(()=>[...document.querySelectorAll('.creation-timeline button')].find(b=>b.textContent.trim().endsWith('Class')).click());await card('Fighter');expect(Object.keys(JSON.parse(localStorage.getItem('smsheets-pathfinder-draft-v1')).ranks)).toHaveLength(4);expect(JSON.parse(localStorage.getItem('smsheets-pathfinder-draft-v1')).feats).toHaveLength(3);
});

test('D&D skill cap opens Bug, blocks extra selections, and continues using the latest choices',async()=>{
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),species:'Dwarf'},step:5,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(()=>root.render(<DndBuilder/>));
 for(const name of ['Perception','Survival'])await act(()=>document.querySelector(`input[aria-label="${name} proficiency"]`).click());
 const guide=document.querySelector('#creationLimitNotice');expect(guide.open).toBe(true);expect(guide.querySelector('img').alt).toContain('Bug');expect(guide.textContent).toContain('all 2 additional skills');
 expect(document.querySelector('input[aria-label="History proficiency"]').disabled).toBe(true);expect(document.querySelector('input[aria-label="Perception expertise, if granted"]').disabled).toBe(true);
 await click('Edit these choices');expect(guide.open).toBe(false);expect(title()).toBe('Skills');
 await act(()=>document.querySelector('input[aria-label="Survival proficiency"]').click());expect(document.querySelector('input[aria-label="History proficiency"]').disabled).toBe(false);
 await act(()=>document.querySelector('input[aria-label="History proficiency"]').click());await continueNotice();expect(title()).toBe('Languages');
 expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.skills).toEqual(['Perception','History']);
});

test('D&D languages include species language, enforce the cap, and let Bug continue with the latest choices',async()=>{
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),species:'Dwarf',skills:['Perception','Survival']},step:6,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(()=>root.render(<DndBuilder/>));
 expect(title()).toBe('Languages');expect(document.querySelector('.dnd-languages').textContent).toContain('Dwarvish — Dwarf species');
 expect(document.querySelector('input[aria-label="Dwarvish language"]')).toBeNull();
 expect(document.querySelector('input[aria-label="Common language"]')).toBeNull();
 expect(document.querySelector('input[aria-label="Celestial language"]').disabled).toBe(true);
 await click('Continue to Features & choices');expect(title()).toBe('Languages');expect(document.querySelector('#creationLimitNotice').textContent).toContain('1 more different starting language');await click('Edit these choices');
 await act(()=>document.querySelector('input[aria-label="Elvish language"]').click());
 expect(document.querySelector('#creationLimitNotice').textContent).toContain('Language choices complete');expect(document.querySelector('#creationLimitNotice img').alt).toContain('Bug');
 expect(document.querySelector('input[aria-label="Giant language"]').disabled).toBe(true);
 await click('Edit these choices');await act(()=>document.querySelector('input[aria-label="Elvish language"]').click());expect(document.querySelector('input[aria-label="Giant language"]').disabled).toBe(false);
 await act(()=>document.querySelector('input[aria-label="Giant language"]').click());await continueNotice();expect(title()).toBe('Features & choices');
 const saved=JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character;
 expect(saved.languageChoices).toEqual(['Giant']);expect(saved.languages).toBe('Common, Dwarvish, Giant');expect(window.scrollTo).toHaveBeenCalledWith({top:0,left:0,behavior:'instant'});
});

test('Rogue language picker permits a rare class choice while still requiring a standard starting choice',async()=>{
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),className:'Rogue',species:'Dwarf',skills:['Acrobatics','Perception','Stealth','Deception'],expertise:['Perception','Stealth']},step:6,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(()=>root.render(<DndBuilder/>));expect(document.querySelector('.dnd-languages').textContent).toContain('Thieves’ Cant — Rogue level 1');
 await act(()=>document.querySelector('input[aria-label="Celestial language"]').click());expect(document.querySelector('#creationLimitNotice')?.open||false).toBe(false);
 expect(document.querySelector('input[aria-label="Sylvan language"]').disabled).toBe(true);
 await click('Continue to Features & choices');expect(title()).toBe('Languages');await click('Edit these choices');
 await act(()=>document.querySelector('input[aria-label="Goblin language"]').click());await continueNotice();expect(title()).toBe('Features & choices');
 expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.languages).toBe('Common, Dwarvish, Thieves’ Cant, Celestial, Goblin');
});

test('D&D spell cap blocks a fourth Wizard cantrip before it enters the book',async()=>{
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),className:'Wizard',species:'Dwarf'},step:8,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(async()=>{root.render(<DndBuilder/>);await import('../dnd-rules-data/spells.json');});
 await vi.waitFor(async()=>{await act(async()=>{});expect(document.querySelector('.dnd-spell-choice-cards article'),container.textContent.slice(0,2000)).toBeTruthy();});
 for(const name of ['Acid Splash','Chill Touch','Mage Hand']){await fill(document.querySelector('input[placeholder="Try fire, healing, invisibility…"]'),name);await click('Add to spell book');}
 expect(document.querySelector('#creationLimitNotice').textContent).toContain('3 cantrips');await click('Edit these choices');
 await fill(document.querySelector('input[placeholder="Try fire, healing, invisibility…"]'),'Fire Bolt');await click('Add to spell book');expect(document.querySelector('#creationLimitNotice').textContent).toContain('allows 3 cantrips');
 expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.spellbook).toHaveLength(3);
});

test('adding a caster multiclass exposes its own spell allowance and filters higher-level spells',async()=>{
 const c={...newDndCharacter(),species:'Dwarf',method:'physical',scores:[13,13,13,13,13,13],level:2,hp:20};
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:c,step:3,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(()=>root.render(<DndBuilder/>));await choose(document.querySelector('.creation-page select'),'Wizard');await click('Add class');
 expect(document.querySelector('.creation-summary').textContent).toContain('Fighter 1 / Wizard 1');expect(document.querySelector('.creation-timeline').textContent).toContain('Spells');
 await act(()=>[...document.querySelectorAll('.creation-timeline button')].find(b=>b.textContent.endsWith('Spells')).click());expect(title()).toBe('Skills');
 for(const name of ['Perception','Survival'])await act(()=>document.querySelector(`input[aria-label="${name} proficiency"]`).click());await continueNotice();await act(()=>document.querySelector('input[aria-label="Elvish language"]').click());await continueNotice();await click('Continue to Spells');
 await act(async()=>{await import('../dnd-rules-data/spells.json');});expect([...document.querySelectorAll('.creation-page select option')].some(o=>o.textContent==='Wizard (level 1)')).toBe(true);
 await fill(document.querySelector('.dnd-spell-search input'),'Fireball');expect(document.querySelector('.creation-page').textContent).toContain('No spells match');
 await fill(document.querySelector('.dnd-spell-search input'),'Magic Missile');await click('Add to spell book');expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.spellbook[0].grants['class:Wizard']).toBeTruthy();
});
test('invalid multiclass prerequisites open Bug and prevent adding the class',async()=>{
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),species:'Dwarf',level:2,hp:20},step:3,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));
 await act(()=>root.render(<DndBuilder/>));await choose(document.querySelector('.creation-page select'),'Wizard');await click('Add class');expect(document.querySelector('#creationLimitNotice').textContent).toContain('Intelligence 13');expect(JSON.parse(localStorage.getItem('savage-master-dnd-draft-v1')).character.multiclass).toBeUndefined();await click('Edit these choices');await click('Adjust abilities');expect(title()).toBe('Abilities');
});
test('restoring a nonmagical draft on the old spell step opens the shop and Back skips magic',async()=>{
 const c={...newDndCharacter(),species:'Dwarf',skills:['Perception','Survival'],languages:'Common, Elvish, Dwarvish'};
 localStorage.setItem('savage-master-dnd-draft-v1',JSON.stringify({character:c,step:8,stepVersion:4,selections:{species:true,class:true,background:true},completed:[]}));await act(()=>root.render(<DndBuilder/>));expect(title()).toBe('Equipment shop');await click('Back');expect(title()).toBe('Features & choices');
});
test('Warlock multiclass sheet uses and restores the two slot pools independently',async()=>{
 let c={...newDndCharacter(),className:'Warlock',level:4,multiclass:[{className:'Wizard',level:1,subclass:'',order:''}],slotsUsed:Array(9).fill(0),pactSlotsUsed:0};
 const update=patch=>{c={...c,...patch};root.render(<SpellBook c={c} update={update}/>);};
 await act(()=>root.render(<SpellBook c={c} update={update}/>));await click('Use level 1 slot');await click('Use Pact Magic slot');expect(c.slotsUsed[0]).toBe(1);expect(c.pactSlotsUsed).toBe(1);await click('Restore Pact Magic slots');expect(c.slotsUsed[0]).toBe(1);expect(c.pactSlotsUsed).toBe(0);await click('Restore spell slots');expect(c.slotsUsed[0]).toBe(0);expect(document.querySelector('.dnd-spellbook').textContent).toContain('Warlock (level 3) · Charisma');expect(document.querySelector('.dnd-spellbook').textContent).toContain('Wizard (level 1) · Intelligence');
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('Savage Worlds setting and ancestry confirmation follow their own rules through final name and review',()=>{
 document.body.innerHTML='<div class="sidebar"></div><ul id="stepNav"></ul><nav id="savageJourney"></nav><main id="mainContent"></main><aside id="summaryPanel"></aside>';
 const context=vm.createContext({window,document,localStorage,console,URLSearchParams,location:{search:''},confirm:()=>true,fetch:()=>Promise.reject(Error('offline fixture'))});
 for(const f of ['data.js','settings.js','creation-notice.js','app.js'])vm.runInContext(readFileSync(new URL('../'+f,import.meta.url),'utf8'),context);
 const app=vm.runInContext('app',context);app.init();expect(document.querySelector('#mainContent').textContent).toContain('Choose your setting');expect(document.querySelector('#startingName')).toBeNull();
 app.previewChoice('settings','core');document.querySelector('.choice-confirm').click();document.querySelector('#creationLimitNotice button:last-child').click();expect(app.currentStep).toBe(1);app.nextStep();app.previewChoice('species','human');document.querySelector('.choice-confirm').click();document.querySelector('#creationLimitNotice button:last-child').click();expect(app.currentStep).toBe(3);app.nextStep();
 app.character.edges=['alertness'];app.renderContent();app.nextStep();expect(app.currentStep).toBe(5);
 app.character.attributes={agility:6,smarts:6,spirit:6,strength:6,vigor:6};app.nextStep();expect(app.currentStep).toBe(6);
 app.nextStep();expect(app.currentStep).toBe(6);expect(document.querySelector('#creationLimitNotice').open).toBe(true);document.querySelector('#creationLimitNotice').close();
 app.character.skills.fighting=8;app.character.skills.shooting=6;app.character.skills.survival=6;app.character.skills.athletics=6;app.character.skills.notice=6;app.character.skills.stealth=6;app.character.skills.persuasion=6;app.nextStep();expect(app.currentStep).toBe(7);app.nextStep();expect(app.currentStep).toBe(8);const item=app.getGearCategories().melee[0];app.previewGear('melee',item.id);expect(document.querySelector('#savageGearDetail').open).toBe(true);expect(document.querySelector('#savageGearDetail').textContent).toContain(item.name);document.querySelector('#savageGearDetail .choice-confirm').click();expect(app.character.gear[0].id).toBe(item.id);app.nextStep();expect(app.currentStep).toBe(9);expect(document.querySelector('#characterName')).not.toBeNull();
 app.nextStep();expect(app.currentStep).toBe(9);document.querySelector('#creationLimitNotice').close();app.character.name='Journey QA Savage';app.nextStep();expect(app.currentStep).toBe(10);expect(document.querySelector('#mainContent').textContent).toContain('Journey QA Savage');app.character.name='';app.renderSummary();expect([...document.querySelectorAll('#savageJourney button')].find(b=>b.textContent.includes('Name & story')).querySelector('span').textContent).toBe('10');
});
