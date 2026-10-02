import fs from 'node:fs';
const items=JSON.parse(fs.readFileSync(new URL('../dnd-rules-data/items.json',import.meta.url)));
const gear=items.filter(r=>[91,92].includes(r.page)).map(r=>({...r,details:Object.fromEntries(r.stats.map(s=>{const i=s.indexOf(':');return [s.slice(0,i),s.slice(i+1).trim()];}))}));
fs.writeFileSync(new URL('../dnd-combat-data.mjs',import.meta.url),'// SRD 5.2.1 weapon and armor reference. Regenerate with node scripts/build-combat-data.mjs.\nexport const gear='+JSON.stringify(gear,null,2)+';\n');
