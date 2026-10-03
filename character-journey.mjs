const steps={
 dnd5e:[['species','Species','Who will you become? Open a card to meet each species.'],['class','Class','Choose how your hero meets a challenge.'],['background','Background','Choose the life your hero lived before adventuring.'],['level','Starting level','Level 1 is a good place to begin. Use another level if your GM asks.'],['abilities','Abilities','Shape your hero’s strengths using your table’s score method.'],['skills','Skills','Choose your additional trained skills. Background training is already included.'],['languages','Languages','Choose the languages your hero knows.'],['features','Features & choices','Record the choices granted by your species, class, and feats.'],['spells','Spells','Choose your magic, if your hero uses it.'],['gear','Equipment shop','Spend your game currency and equip your hero.'],['bio','Name & story','Give your finished hero a name and a story.'],['sheet','Character sheet','Your hero is ready for a final check and the table.']],
 pathfinder2e:[['species','Ancestry','Who will you become? Ancestry is Pathfinder’s term for your people.'],['class','Class','Choose how your hero meets a challenge.'],['heritage','Heritage','Choose the heritage that shapes your ancestry.'],['background','Background','Choose the life your hero lived before adventuring.'],['level','Starting level','Level 1 is a good place to begin. Use another level if your GM asks.'],['abilities','Attributes','Build your attributes one boost stage at a time.'],['skills','Skills','Choose your additional trained skills and skill increases.'],['feats','Feats & choices','Choose your granted feats and record their feature choices.'],['spells','Spells','Prepare your magic, if your hero uses it.'],['gear','Equipment shop','Spend your Pathfinder allowance and equip your hero.'],['bio','Name & story','Give your finished hero a name and a story.'],['sheet','Character sheet','Your hero is ready for a final check and the table.']]
};
export function journeyChapters(system,legacy,selections){
 const missing=Array.from({length:12},()=>[]);
 legacy[0].forEach(message=>missing[/name/i.test(message)?10:system==='dnd5e'?0:/heritage/.test(message)?2:3].push(message));
 missing[system==='dnd5e'?4:5].push(...legacy[1]);
 legacy[2].forEach(message=>missing[system==='dnd5e'?/skill proficienc|additional skill|class list|Keen Senses|Expertise/i.test(message)?5:/language/i.test(message)?6:7:/trained skill|class-granted skill|skill increase/i.test(message)?6:7].push(message));
 missing[8].push(...legacy[3]);
 legacy[4].forEach(message=>missing[system==='dnd5e'&&/maximum HP/.test(message)?3:9].push(message));
 if(selections){for(const [key,index] of [['species',0],['class',1],['background',system==='dnd5e'?2:3]])if(!selections[key])missing[index].unshift(`Choose your ${key==='species'&&system==='pathfinder2e'?'ancestry':key} from a card.`);}
 return steps[system].map(([id,title,hint],i)=>({id,title,hint,missing:missing[i]}));
}
export function restoredJourneyStep(system,saved,version){
 if(!Number.isInteger(saved)||saved<0)return 0;
 if(version===4)return saved<12?saved:0;
 if(saved>5)return 0;
 if(system==='pathfinder2e')return [0,5,6,8,9,11][saved];
 const step=version===3?saved:version!==2&&saved===4?5:saved===3?4:saved===4?3:saved;
 return [0,4,5,8,9,11][step];
}
