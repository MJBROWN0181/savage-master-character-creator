export const ruleSets = [
  {id:'savageWorlds', name:'Savage Worlds', detail:'Choose your edition and setting.'},
  {id:'dnd5e', name:'Dungeons & Dragons 5e', detail:'Choose your edition or revision.'},
  {id:'pathfinder2e', name:'Pathfinder 2e', detail:'Choose your edition or remaster.'},
  {id:'other', name:'Another rule set', detail:'Use any game system you choose.'},
  {id:'original', name:'My own rules', detail:'Create a system from scratch.'},
];
export const worldSections = [
  ['premise','World premise','What makes this world yours? Describe its central idea and conflicts.'],
  ['tone','Genre & tone','Fantasy, horror, science fiction, comedy, or your own combination.'],
  ['geography','Geography & places','Continents, realms, climates, landmarks, and borders.'],
  ['history','History & timeline','Origins, ages, turning points, and the present day.'],
  ['cultures','Peoples & cultures','Cultures, societies, languages, and how they relate.'],
  ['factions','Factions & powers','Who holds power? What do they want?'],
  ['cosmology','Gods & cosmology','Faiths, planes, creation stories, and higher powers.'],
  ['magic','Magic & technology','How do they work, what do they cost, and who can use them?'],
  ['dailyLife','Everyday life','Trade, travel, laws, customs, and life for ordinary people.'],
  ['conflicts','Conflicts & adventure hooks','Threats, mysteries, opportunities, and starting situations.'],
  ['secrets','Private GM lore','Hidden truths and discoveries for future sessions.'],
];
export function newWorld() {
  return {mapKey:crypto.randomUUID(),name:'',rules:{base:'',name:'',edition:'',approach:'',notes:''},
    ...Object.fromEntries(worldSections.map(([key])=>[key,''])),
    playStyle:{experience:'',resolution:'',characters:'',advancement:'',table:''},houseRules:[],customFields:[]};
}
export function foundationIssues(world) {
  const issues=[];
  if(!ruleSets.some(s=>s.id===world.rules.base)) issues.push('Choose the rule set your world is based on.');
  if(['other','original'].includes(world.rules.base)&&!world.rules.name.trim()) issues.push('Name your rule set.');
  return issues;
}
export function worldIssues(world) {
  return [...foundationIssues(world),...(!world.name.trim()?['Give your world a name.']:[]),
    ...(world.houseRules.some(r=>!r.name.trim()||!r.text.trim())?['Give each house rule a name and a rule description.']:[]),
    ...(world.customFields.some(f=>!f.label.trim())?['Give each custom field a label.']:[])];
}
export function ruleSetName(world) {
  return ['other','original'].includes(world.rules.base)?world.rules.name:ruleSets.find(s=>s.id===world.rules.base)?.name||'Rule set not chosen';
}
export function validateWorld(world,{draft=false}={}) {
  const fail=()=>{throw new Error('Invalid world backup.');};
  const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const text=(x,max)=>typeof x==='string'&&x.length<=max;
  const keys=(x,allowed)=>record(x)&&Object.keys(x).every(k=>allowed.includes(k));
  if(!keys(world,['mapKey','name','rules',...worldSections.map(([k])=>k),'playStyle','houseRules','customFields'])||JSON.stringify(world).length>400000) fail();
  if(world.mapKey!==undefined&&(!text(world.mapKey,100)||!/^[a-zA-Z0-9_-]+$/.test(world.mapKey)))fail();
  if(!text(world.name,160)||!keys(world.rules,['base','name','edition','approach','notes'])) fail();
  const r=world.rules;
  if(!text(r.base,40)||!(draft&&r.base===''||ruleSets.some(s=>s.id===r.base))||!text(r.name,160)||!text(r.edition,200)||!text(r.approach,200)||!text(r.notes,10000)) fail();
  for(const [key] of worldSections) if(!text(world[key],30000)) fail();
  if(!keys(world.playStyle,['experience','resolution','characters','advancement','table'])) fail();
  for(const key of ['experience','resolution','characters','advancement','table']) if(!text(world.playStyle[key],10000)) fail();
  for(const [key,allowed] of [['houseRules',['id','name','category','text']],['customFields',['id','label','value']]]) {
    const rows=world[key];
    if(!Array.isArray(rows)||rows.length>100) fail();
    const ids=new Set();
    for(const row of rows) {
      if(!keys(row,allowed)||!text(row.id,100)||!/^[a-zA-Z0-9_-]+$/.test(row.id)||ids.has(row.id)) fail();
      ids.add(row.id);
      if(key==='houseRules'&&(!text(row.name,160)||!text(row.category,160)||!text(row.text,10000))) fail();
      if(key==='customFields'&&(!text(row.label,160)||!text(row.value,30000))) fail();
    }
  }
  if(!draft&&worldIssues(world).length) throw new Error(worldIssues(world).join(' '));
  return world;
}
export function worldBackup(world) {validateWorld(world,{draft:true});return {version:1,kind:'savage-master-world',world};}
export function readWorldBackup(snapshot) {
  if(!snapshot||snapshot.version!==1||snapshot.kind!=='savage-master-world') throw new Error('Choose a Savage Master world backup.');
  return validateWorld(snapshot.world,{draft:true});
}
