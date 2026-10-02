import {gear} from './dnd-combat-data.mjs';
export const weapons=gear.filter(r=>r.page===91);
export const armors=gear.filter(r=>r.page===92&&r.name!=='Shield');
export function combatStats(c,s){
 const armor=armors.find(r=>r.name===c.armor),dex=s.mods[1];
 let base=10+dex,label='Unarmored';
 if(armor){const rule=armor.details['Armor Class'];base=parseInt(rule)+(rule.includes('Dex')?(rule.includes('max 2')?Math.min(2,dex):dex):0);label=armor.name;}
 else if(c.className==='Monk'&&c.defense==='monk'&&!c.shield){base+=s.mods[4];label='Monk Unarmored Defense';}
 else if(c.className==='Barbarian'&&c.defense==='barbarian'){base+=s.mods[2];label='Barbarian Unarmored Defense';}
 const shield=c.shield?2:0,bonus=c.acBonus||0;
 return {ac:c.ac??base+shield+bonus,base,shield,bonus,label,armor,overridden:c.ac!==null,attacks:(c.weapons||[]).map(w=>{
  const item=weapons.find(r=>r.name===w.name);if(!item)return null;
  const properties=item.details.Properties||'',finesse=properties.includes('Finesse'),ranged=item.tag.includes('Ranged');
  const chosen=['str','dex','con','int','wis','cha'].indexOf(w.ability);
  const ability=chosen>=0?chosen:finesse?(s.mods[1]>s.mods[0]?1:0):ranged?1:0;
  const mod=s.mods[ability],attack=mod+(w.proficient?s.pb:0)+(w.attackBonus||0),damageBonus=mod+(w.damageBonus||0);
  const damage=w.twoHanded&&properties.includes('Versatile')?item.details.Damage.replace(/^\S+/,properties.match(/Versatile \(([^)]+)\)/)[1]):item.details.Damage;
  return {...w,item,ability,attack,damageBonus,damage};
 }).filter(Boolean)};
}
const slots=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
export function spellSlots(c){if(c.className==='Warlock')return Array.from({length:9},(_,i)=>i===Math.min(4,Math.floor((c.level-1)/2))?(c.level===1?1:c.level<11?2:c.level<17?3:4):0);const level=['Paladin','Ranger'].includes(c.className)?Math.ceil(c.level/2):['Bard','Cleric','Druid','Sorcerer','Wizard'].includes(c.className)?c.level:0;return Array.from({length:9},(_,i)=>slots[level][i]||0);}
