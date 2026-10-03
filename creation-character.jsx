import React from 'react';

export function CreationCharacter({name,identity,concept,stats,abilities,skills,choices,equipment,spells,languages=[]}){
 return <><h3>{name||'Unnamed hero'}</h3><p className="creation-concept">{concept?.slice(0,140)||'Your story takes shape with every choice.'}</p><p className="creation-identity">{identity}</p>
  <div id="creation-preview-details">{stats.length>0&&<CharacterRows title="Derived stats" rows={stats}/>}
  {abilities.length>0&&<CharacterRows title="Attributes" rows={abilities}/>}
  {skills.length>0&&<details className="creation-extra"><summary>Trained skills ({skills.length})</summary><CharacterRows title="Trained skills" rows={skills}/></details>}
  {languages.length>0&&<details className="creation-extra"><summary>Languages ({languages.length})</summary><CharacterList title="Languages" items={languages}/></details>}
  {choices.length>0&&<details className="creation-extra"><summary>Background & features ({choices.length})</summary><CharacterList title="Background & features" items={choices}/></details>}
  {equipment.length>0&&<details className="creation-extra"><summary>Equipment ({equipment.length})</summary><CharacterList title="Equipment" items={equipment}/></details>}
  {spells.length>0&&<details className="creation-extra"><summary>Spells ({spells.length})</summary><CharacterList title="Spells" items={spells}/></details>}</div>
 </>;
}
function CharacterRows({title,rows,empty}){return <div className="creation-character-section"><h4>{title}</h4>{rows.length?<dl>{rows.map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>:<p>{empty}</p>}</div>;}
function CharacterList({title,items,empty}){return <div className="creation-character-section"><h4>{title}</h4>{items.length?<ul>{items.map((item,i)=><li key={i}>{item}</li>)}</ul>:<p>{empty||'Your choices will appear here.'}</p>}</div>;}
