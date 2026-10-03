import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../appearance.js',import.meta.url),'utf8');
function boot({saved=null,dark=false,path='/campaigns',search='',blocked=false}={}) {
  const events={},media={matches:dark,addEventListener:(_,fn)=>events.device=fn};
  const root={dataset:{},style:{}},meta={}; let stored=saved;
  const window={matchMedia:()=>media,dispatchEvent:()=>{},addEventListener:(name,fn)=>events[name]=fn};
  runInNewContext(source,{window,document:{documentElement:root,querySelector:()=>meta},location:{pathname:path,search},URLSearchParams,CustomEvent:class {},localStorage:{getItem:()=>{if(blocked)throw Error();return stored;},setItem:(_,value)=>{if(blocked)throw Error();stored=value;}}});
  return {root,meta,window,events,media,stored:()=>stored};
}
test('auto follows device changes; manual appearance persists and ignores device changes',()=>{
  const a=boot({dark:true}); assert.equal(a.root.dataset.theme,'dark');
  a.media.matches=false;a.events.device();assert.equal(a.root.dataset.theme,'light');
  a.window.smAppearance.setPreference('dark');assert.equal(a.stored(),'dark');
  a.events.device();assert.equal(a.root.dataset.theme,'dark');
  assert.equal(boot({saved:a.stored(),dark:false}).root.dataset.theme,'dark');
  a.window.smAppearance.setPreference('auto');assert.equal(a.root.dataset.theme,'light');
});
test('cross-tab changes and storage removal synchronize appearance',()=>{
  const a=boot();a.events.storage({key:'savage-master-appearance-v1',newValue:'dark'});
  assert.equal(a.root.dataset.theme,'dark');a.events.storage({key:null,newValue:null});
  assert.equal(a.root.dataset.appearance,'auto');assert.equal(a.root.style.colorScheme,'light');
});
test('invalid or inaccessible storage does not prevent rendering or local overrides',()=>{
  for(const options of [{saved:'invalid',dark:true},{blocked:true,dark:true}]){
    const a=boot(options);assert.equal(a.root.dataset.theme,'dark');
    a.window.smAppearance.setPreference('light');assert.equal(a.root.dataset.theme,'light');
    a.window.smAppearance.setPreference('invalid');assert.equal(a.root.dataset.theme,'light');
  }
});
test('HTML and clean routes resolve to the correct workspace',()=>{
  for(const [path,workspace] of [['/profile.html','profile'],['/chronicles','community'],['/builder/','world'],['/support','support'],['/pathfinder','characters']]) assert.equal(boot({path}).root.dataset.workspace,workspace);
  assert.equal(boot({path:'/',search:'?game=savage'}).root.dataset.workspace,'characters');
  assert.equal(boot({path:'/settings.html'}).root.dataset.workspace,'settings');
  assert.equal(boot({path:'/p/a-public-post'}).root.dataset.workspace,'community');
});
