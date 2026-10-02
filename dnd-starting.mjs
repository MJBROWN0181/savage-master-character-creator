// Starting equipment and coin alternatives, SRD 5.2.1 class/background tables.
const kit=(gold,items)=>({gold,items});
export const classStarts={
 Barbarian:{gold:75,kits:[kit(15,[['Greataxe',1],['Handaxe',4],["Explorer’s Pack",1]])]},
 Bard:{gold:90,kits:[kit(19,[['Leather Armor',1],['Dagger',2],['Musical Instrument (choose one)',1],["Entertainer’s Pack",1]])]},
 Cleric:{gold:110,kits:[kit(7,[['Chain Shirt',1],['Shield',1],['Mace',1],['Holy Symbol',1],["Priest’s Pack",1]])]},
 Druid:{gold:50,kits:[kit(9,[['Leather Armor',1],['Shield',1],['Sickle',1],['Druidic Focus (Quarterstaff)',1],["Explorer’s Pack",1],['Herbalism Kit',1]])]},
 Fighter:{gold:155,kits:[kit(4,[['Chain Mail',1],['Greatsword',1],['Flail',1],['Javelin',8],["Dungeoneer’s Pack",1]]),kit(11,[['Studded Leather Armor',1],['Scimitar',1],['Shortsword',1],['Longbow',1],['Arrows',20],['Quiver',1],["Dungeoneer’s Pack",1]])]},
 Monk:{gold:50,kits:[kit(11,[['Spear',1],['Dagger',5],['Artisan’s Tools / Musical Instrument (choose one)',1],["Explorer’s Pack",1]])]},
 Paladin:{gold:150,kits:[kit(9,[['Chain Mail',1],['Shield',1],['Longsword',1],['Javelin',6],['Holy Symbol',1],["Priest’s Pack",1]])]},
 Ranger:{gold:150,kits:[kit(7,[['Studded Leather Armor',1],['Scimitar',1],['Shortsword',1],['Longbow',1],['Arrows',20],['Quiver',1],['Druidic Focus (sprig of mistletoe)',1],["Explorer’s Pack",1]])]},
 Rogue:{gold:100,kits:[kit(8,[['Leather Armor',1],['Dagger',2],['Shortsword',1],['Shortbow',1],['Arrows',20],['Quiver',1],["Thieves’ Tools",1],["Burglar’s Pack",1]])]},
 Sorcerer:{gold:50,kits:[kit(28,[['Spear',1],['Dagger',2],['Arcane Focus (crystal)',1],["Dungeoneer’s Pack",1]])]},
 Warlock:{gold:100,kits:[kit(15,[['Leather Armor',1],['Sickle',1],['Dagger',2],['Arcane Focus (orb)',1],['Book (occult lore)',1],["Scholar’s Pack",1]])]},
 Wizard:{gold:55,kits:[kit(5,[['Dagger',2],['Arcane Focus (Quarterstaff)',1],['Robe',1],['Spellbook',1],["Scholar’s Pack",1]])]}
};
export const backgroundStarts={
 Acolyte:kit(8,[["Calligrapher’s Supplies",1],['Prayer book',1],['Holy Symbol',1],['Parchment',10],['Robe',1]]),
 Criminal:kit(16,[['Dagger',2],["Thieves’ Tools",1],['Crowbar',1],['Pouch',2],["Traveler’s Clothes",1]]),
 Sage:kit(8,[['Quarterstaff',1],["Calligrapher’s Supplies",1],['History book',1],['Parchment',8],['Robe',1]]),
 Soldier:kit(14,[['Spear',1],['Shortbow',1],['Arrows',20],['Gaming Set (choose one)',1],["Healer’s Kit",1],['Quiver',1],["Traveler’s Clothes",1]])
};
export function higherStart(level){return level>=17?{base:20000,multiplier:250}:level>=11?{base:5000,multiplier:250}:level>=5?{base:500,multiplier:25}:null;}
export function startingResources(c){
 const start=c.starting,cls=classStarts[c.className],bg=backgroundStarts[c.background],issues=[];let gold=0,items=[],label='Starting option not selected';
 if(!start)return {gold,copper:0,items,label,issues,spent:0,balance:0};
 if(start.mode==='gear'){const chosen=cls.kits[start.kit||0]||cls.kits[0];gold=chosen.gold+bg.gold;items=[...chosen.items,...bg.items];label='Class + background starting gear';}
 if(start.mode==='gm'){gold=start.gmGold??0;label='GM-set starting money';if(start.gmGold===null||start.gmGold===undefined)issues.push('Enter the GM-set starting amount.');}
 if(start.mode==='money'){
  gold=cls.gold+50;label='SRD class + background coin allowance';
  if(start.method==='higher'){const rule=higherStart(c.level);label='GM-approved higher-level starting money';if(!rule)issues.push('The SRD money-roll guide starts at level 5.');else{gold+=rule.base+(start.rolls?.[0]||0)*rule.multiplier;if(!start.rolls?.[0])issues.push('Enter your physical d10 result for starting money.');}}
  if(start.method==='custom'){label='GM-approved physical-dice starting money';gold=(start.rolls||[]).reduce((a,b)=>a+b,0)*(start.multiplier||1)+(start.flat||0);if(start.rolls?.length!==start.count||(start.rolls||[]).some(n=>n<1||n>start.sides))issues.push('Enter every physical-dice result for starting money.');}
 }
 const copper=Math.round(gold*100),spent=(c.inventory||[]).reduce((n,r)=>n+r.quantity*r.paidCp,0),balance=copper-spent;
 if(balance<0)issues.push('Your equipment purchases exceed the selected starting money.');
 return {gold,copper,items,label,issues,spent,balance};
}
export function costCopper(row){const cost=row.stats.find(s=>s.startsWith('Cost:'))?.slice(5).trim(),m=cost?.match(/^([\d,]+(?:\.\d+)?)\s*(CP|SP|EP|GP|PP)\b/i);if(!m)return null;return Math.round(Number(m[1].replaceAll(',',''))*({CP:1,SP:10,EP:50,GP:100,PP:1000})[m[2].toUpperCase()]);}
export function coinText(copper){return (copper/100).toLocaleString('en-US',{maximumFractionDigits:2})+' GP';}
export const equipmentSections=['Weapons','Armor & shields','Adventuring gear','Tools','Magic items','Properties'];
export function equipmentSection(row){if(row.category==='Equipment properties')return 'Properties';if(row.page===91)return 'Weapons';if(row.page===92)return 'Armor & shields';if(row.tag==='Tools')return 'Tools';if(row.tag==='Adventuring gear')return 'Adventuring gear';return 'Magic items';}
