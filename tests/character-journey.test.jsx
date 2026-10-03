import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {test,expect,vi} from 'vitest';
import {newDndCharacter} from '../dnd-model.mjs';
import {fresh} from '../pathfinder-model.mjs';
vi.mock('convex/react',()=>({useConvexAuth:()=>({isAuthenticated:false}),useConvex:()=>({}),useQuery:()=>undefined,useMutation:()=>()=>{},ConvexReactClient:class{}}));
vi.mock('@convex-dev/auth/react',()=>({ConvexAuthProvider:({children})=>children}));
vi.mock('../account.jsx',()=>({CharacterAccount:()=>null}));
vi.mock('react-dom/client',()=>({createRoot:()=>({render:()=>{}})}));
const storage=new Map();
vi.stubGlobal('localStorage',{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)});
vi.stubGlobal('location',{search:''});
vi.stubGlobal('document',{getElementById:()=>({})});
const {DndBuilder}=await import('../dnd-builder.jsx');
const {App:PathfinderBuilder}=await import('../pathfinder.jsx');
const {CreateCharacter}=await import('../create.jsx');
const chosen={species:true,class:true,background:true};
function renderDnd(step,selections=chosen){storage.clear();storage.set('savage-master-dnd-draft-v1',JSON.stringify({character:{...newDndCharacter(),className:'Wizard'},step,stepVersion:4,selections,completed:[]}));return renderToStaticMarkup(<DndBuilder/>);}
function renderPf(step,selections=chosen){storage.clear();storage.set('smsheets-pathfinder-draft-v1',JSON.stringify(fresh()));storage.set('smsheets-pathfinder-draft-v1-journey',JSON.stringify({step,version:4,selections,completed:[]}));return renderToStaticMarkup(<PathfinderBuilder/>);}
test('game entry has exactly three separate game routes and reserved artwork',()=>{
 const html=renderToStaticMarkup(<CreateCharacter/>);
 expect(html.match(/class="tarot-card game-tarot"/g)).toHaveLength(3);
 for(const url of ['/?game=savage&amp;create=1','/dnd?create=1','/pathfinder?create=1'])expect(html).toContain('href="'+url+'"');
});
test('all twelve chapters render and place the editable name only in the final story step',()=>{
 for(const render of [renderDnd,renderPf])for(let step=0;step<12;step++){
  const html=render(step);expect(html).toContain('Step '+(step+1)+' of 12');
  expect(html.includes('placeholder="What will your hero be called?"')).toBe(step===10);
  if(step===10)expect(html).toContain('ChatGPT: help with bio &amp; portrait');
  expect(html).toContain('Live character preview');expect(html).toContain('Creation book');
 }
});
test('opening origins show a single category and do not pretend a new draft has made choices',()=>{
 for(const render of [renderDnd,renderPf]){
  const html=render(0,{});expect(html).toContain('Meet Human');expect(html).not.toContain('Meet Fighter');expect(html).not.toContain('Derived stats');expect(html).toContain('Greater Detail about Human');expect(html).toContain('Check with your GM');
  const cls=render(1);expect(cls).toContain('Meet Fighter');expect(cls).not.toContain('Meet Human');
 }
});
