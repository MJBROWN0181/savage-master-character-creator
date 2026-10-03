// Revised 2024 multiclass rules. The initial class keeps its starting traits.
export const multiclassRequirements={Barbarian:[[0]],Bard:[[5]],Cleric:[[4]],Druid:[[4]],Fighter:[[0,1]],Monk:[[1],[4]],Paladin:[[0],[5]],Ranger:[[1],[4]],Rogue:[[1]],Sorcerer:[[5]],Warlock:[[5]],Wizard:[[3]]};
const abilityNames=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
export function classLevels(c){const extra=c.multiclass||[];return [{className:c.className,level:c.level-extra.reduce((n,r)=>n+r.level,0),subclass:c.subclass||'',order:c.order||'',land:c.land||'',source:'class'},...extra.map(r=>({...r,source:'class:'+r.className}))];}
export const classLevel=(c,name)=>classLevels(c).find(r=>r.className===name)?.level||0;
export const classLabel=c=>classLevels(c).map(r=>`${r.className} ${r.level}`).join(' / ');
export function multiclassIssues(c,{abilities=true}={}){
 if(!Array.isArray(c.multiclass||[]))return ['Choose a valid list of additional classes.'];
 const rows=classLevels(c),issues=[];
 if(!Array.isArray(c.multiclass||[])||rows.length>12||new Set(rows.map(r=>r.className)).size!==rows.length||rows.some(r=>!Object.hasOwn(multiclassRequirements,r.className)||!Number.isInteger(r.level)||r.level<1)||!Number.isInteger(c.level)||c.level>20) return ['Keep at least one level in each different class, with a total level from 1 to 20.'];
 if(rows.length>1&&abilities)for(const r of rows){const req=multiclassRequirements[r.className];if(req.some(group=>!group.some(i=>Math.min(20,c.scores[i]+c.boosts[i])>=13)))issues.push(`${r.className} multiclassing requires ${req.map(group=>group.map(i=>abilityNames[i]).join(' or ')).join(' and ')} 13 or higher. Adjust your abilities or remove this class.`);}
 return issues;
}
export const castingAbilityFor=name=>({Bard:5,Cleric:4,Druid:4,Paladin:5,Ranger:4,Sorcerer:5,Warlock:5,Wizard:3})[name];
export function thirdCaster(r){return r.level>=3&&(r.className==='Fighter'&&/^eldritch knight$/i.test(r.subclass?.trim())||r.className==='Rogue'&&/^arcane trickster$/i.test(r.subclass?.trim()));}
// 2024 Player's Handbook progression, verified against the licensed class tables.
export function subclassSpellGuide(r){if(!thirdCaster(r))return null;return {cantrips:r.level>=10?3:2,prepared:[3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13][r.level-3]};}
