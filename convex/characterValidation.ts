import {validateDndCharacter} from '../dnd-validation.mjs';
const identifier = /^[a-zA-Z0-9_-]{1,100}$/;
const dice = new Set([0,4,6,8,10,12]);
export function validateCharacterSnapshot(snapshot: any) {
  const fail=()=>{throw new Error("Invalid character or backup too large.");};
  if(!snapshot || snapshot.version!==1 || !snapshot.character || JSON.stringify(snapshot).length>200_000) fail();
  const c=snapshot.character;
  if(snapshot.system==='dnd5e'){validateDndCharacter(c);return;}
  const text=(x:any,max:number)=>typeof x==='string'&&x.length<=max;
  const id=(x:any)=>typeof x==='string'&&identifier.test(x);
  const record=(x:any)=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!record(c)||!text(c.name,120)||!c.name.trim()||!text(c.concept,10000)||!text(c.notes,30000))fail();
  if(c.setting!==null&&!['deadlands','rifts','pathfinder','pirates'].includes(c.setting))fail();
  if(c.race!==null&&!id(c.race)||c.heritageChoice!==null&&!id(c.heritageChoice))fail();
  if(!record(c.attributes)||!record(c.skills)||!record(c.hindrancePointsSpent))fail();
  for(const key of ['agility','smarts','spirit','strength','vigor'])if(!dice.has(c.attributes[key])||c.attributes[key]===0)fail();
  for(const [key,value] of Object.entries(c.skills))if(!id(key)||!dice.has(value as number))fail();
  if(Object.keys(c.skills).length<5||Object.keys(c.skills).length>100)fail();
  for(const key of ['attributes','edges','skills'])if(!Number.isInteger(c.hindrancePointsSpent[key])||c.hindrancePointsSpent[key]<0||c.hindrancePointsSpent[key]>4)fail();
  if(!Number.isFinite(c.funds)||c.funds<0||c.funds>1e9)fail();
  for(const key of ['edges','hindrances','languages','bonusRules'])if(!Array.isArray(c[key])||c[key].length>100||c[key].some((value:any)=>!id(value)))fail();
  if(!Array.isArray(c.gear)||c.gear.length>200||c.gear.some((g:any)=>!record(g)||!id(g.id)||!text(g.name,200)||!Number.isInteger(g.qty)||g.qty<1||g.qty>10000))fail();
  if(!Array.isArray(c.powers)||c.powers.length>100||c.powers.some((p:any)=>!record(p)||!id(p.id)||!text(p.trapping,2000)))fail();
  function safeKeys(value:any,depth=0){if(depth>12)fail();if(value&&typeof value==='object')for(const key of Object.keys(value)){if(['__proto__','prototype','constructor'].includes(key))fail();safeKeys(value[key],depth+1)}}safeKeys(snapshot);
}
