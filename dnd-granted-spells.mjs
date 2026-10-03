import {classLevels,castingAbilityFor,thirdCaster} from './dnd-multiclass.mjs';
// Fixed grants from SRD 5.2.1. These never consume the normal preparation allowance.
const grants={
 Cleric:{match:/^(life|life domain)$/i,levels:{3:['Aid','Bless','Cure Wounds','Lesser Restoration'],5:['Mass Healing Word','Revivify'],7:['Aura of Life','Death Ward'],9:['Greater Restoration','Mass Cure Wounds']}},
 Paladin:{match:/^(devotion|oath of devotion)$/i,levels:{3:['Protection from Evil and Good','Shield of Faith'],5:['Aid','Zone of Truth'],9:['Beacon of Hope','Dispel Magic'],13:['Freedom of Movement','Guardian of Faith'],17:['Commune','Flame Strike']}},
 Sorcerer:{match:/^(draconic|draconic sorcery|draconic bloodline)$/i,levels:{3:['Alter Self','Chromatic Orb','Command',"Dragon’s Breath"],5:['Fear','Fly'],7:['Arcane Eye','Charm Monster'],9:['Legend Lore','Summon Dragon']}},
 Warlock:{match:/^(fiend|fiend patron|the fiend)$/i,levels:{3:['Burning Hands','Command','Scorching Ray','Suggestion'],5:['Fireball','Stinking Cloud'],7:['Fire Shield','Wall of Fire'],9:['Geas','Insect Plague']}}
};
const land={Arid:{3:['Blur','Burning Hands','Fire Bolt'],5:['Fireball'],7:['Blight'],9:['Wall of Stone']},Polar:{3:['Fog Cloud','Hold Person','Ray of Frost'],5:['Sleet Storm'],7:['Ice Storm'],9:['Cone of Cold']},Temperate:{3:['Misty Step','Shocking Grasp','Sleep'],5:['Lightning Bolt'],7:['Freedom of Movement'],9:['Tree Stride']},Tropical:{3:['Acid Splash','Ray of Sickness','Web'],5:['Stinking Cloud'],7:['Polymorph'],9:['Insect Plague']}};
export function alwaysPreparedGrants(c){return classLevels(c).flatMap(r=>{
 const names=[];if(r.className==='Rogue'&&thirdCaster(r))names.push('Mage Hand');if(r.className==='Ranger')names.push("Hunter’s Mark");if(r.className==='Paladin'&&r.level>=2)names.push('Divine Smite');if(r.className==='Paladin'&&r.level>=5)names.push('Find Steed');
 const g=grants[r.className],table=g?.match.test(r.subclass?.trim())?g.levels:r.className==='Druid'&&/^(land|circle of the land)$/i.test(r.subclass?.trim())?land[r.land]:null;
 for(const [level,spells] of Object.entries(table||{}))if(r.level>=Number(level))names.push(...spells);
 return names.length?[{source:'always:'+r.className,label:r.className+' always ready',className:r.className,ability:thirdCaster(r)?3:castingAbilityFor(r.className),names}]:[];
});}
export function readySpellbook(c){const book=(c.spellbook||[]).map(b=>({...b,grants:{...(b.grants||{class:{prepared:b.prepared}})}}));for(const g of alwaysPreparedGrants(c))for(const name of g.names){let entry=book.find(b=>b.name===name);if(!entry){entry={name,prepared:true,grants:{}};book.push(entry);}entry.grants[g.source]={prepared:true};entry.prepared=true;}return book;}
