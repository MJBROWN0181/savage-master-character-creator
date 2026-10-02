import {classData,backgrounds,speciesNames,skillAbilities,creationIssues} from './dnd-model.mjs';
export function validateDndCharacter(c,{draft=false}={}){
 const fail=()=>{throw new Error('Invalid 5e character.');};
 if(!c||typeof c!=='object'||Array.isArray(c)||JSON.stringify(c).length>190000)fail();
 const text=(k,max)=>typeof c[k]==='string'&&c[k].length<=max;
 if(c.setting!=='dnd5e'||c.rules!=='srd-5.2.1'||!Object.hasOwn(classData,c.className)||!Object.hasOwn(backgrounds,c.background)||!speciesNames.includes(c.species)||!['standard','points','physical'].includes(c.method))fail();
 for(const [k,max] of [['name',120],['concept',10000],['notes',30000],['equipment',10000],['spells',10000],['features',10000],['languages',1000],['alignment',200],['subclass',200]])if(!text(k,max))fail();
 if(!Number.isInteger(c.level)||c.level<1||c.level>20)fail();
 if(!Array.isArray(c.scores)||c.scores.length!==6||c.scores.some(n=>!Number.isInteger(n)||n<3||n>18))fail();
 if(!Array.isArray(c.boosts)||c.boosts.length!==6||c.boosts.some(n=>!Number.isInteger(n)||n<0||n>2))fail();
 for(const key of ['skills','expertise'])if(!Array.isArray(c[key])||c[key].length>18||new Set(c[key]).size!==c[key].length||c[key].some(n=>!Object.hasOwn(skillAbilities,n)))fail();
 const trained=new Set([...backgrounds[c.background].skills,...c.skills]);if(c.expertise.some(n=>!trained.has(n)))fail();
 for(const [k,min,max,nullable] of [['ac',1,50,true],['hp',1,10000,true],['currentHp',0,10000,true],['tempHp',0,10000,false],['speed',0,300,false]])if(!(nullable&&c[k]===null)&&(!Number.isInteger(c[k])||c[k]<min||c[k]>max))fail();
 if(!draft&&creationIssues(c).length)fail();
 const safe=(v,depth=0)=>{if(depth>12)fail();if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','prototype','constructor'].includes(k))fail();safe(v[k],depth+1);}};safe(c);
}
