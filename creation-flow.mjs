export const creationSteps=['Identity','Abilities','Training','Spells','Equipment shop','Character sheet'];
const hints={
 dnd5e:[
  'Give your hero a name, then choose class, species, background, and level. Level 1 is the simplest place to begin.',
  'Assign your standard array, spend 27 points, or enter physical dice results. Background increases belong on the allowed abilities.',
  'Background skills are included. Add class skills, species choices, languages, feats, and any granted expertise. Record feature choices in the notes.',
  'Casters choose cantrips and prepare spells. Other heroes can continue without magic unless a background, species, or feat grants it.',
  'Choose starting kits, coin, or a GM allowance. Buy extra supplies with your remaining GP, then equip your weapons and armor. You may keep unspent coins.',
  'Review your totals and choices. Download a backup or sign in and save to your account before taking this hero to the table.'
 ],
 pathfinder2e:[
  'Choose ancestry, heritage, background, class, and level. Heritage is part of your ancestry, not a second ancestry.',
  'Use two free ancestry boosts, two background boosts, one class boost, and four free boosts. Later levels add advancement boosts.',
  'Choose trained skills and feats. Class and background grants are included where supported; read their feature choices and prerequisites.',
  'Casters select a tradition, spells, and daily slots, then prepare spells or build a repertoire. Noncasters can continue without spells.',
  'Level 1 starts with 15 GP. Choose level-appropriate gear, buy with your allowance, and equip armor and a weapon. Rare items need your GM’s approval.',
  'Review AC, HP, saves, attacks, and your three-action turn. Save or download your character and review conditional features with your GM.'
 ]
};
export function makeChapters(system,missing){return creationSteps.map((title,i)=>({title:system==='pathfinder2e'&&i===1?'Attributes':title,hint:hints[system][i],missing:missing[i]}));}
// Recheck earlier chapters even after a player goes back and changes a choice.
export function firstMissing(chapters,target){return chapters.findIndex((chapter,i)=>i<target&&!chapter.skipped&&chapter.missing.length>0);}
export function validCompletions(chapters,completed=[]){return [...new Set(completed)].filter(i=>Number.isInteger(i)&&i>=0&&i<chapters.length&&!chapters[i].skipped&&!chapters[i].missing.length&&(i!==chapters.length-1||chapters.every(chapter=>!chapter.missing.length)));}
export function advanceCompletions(chapters,completed,target){return firstMissing(chapters,target)>=0?validCompletions(chapters,completed):validCompletions(chapters,[...completed,...Array.from({length:target},(_,i)=>i)]);}
