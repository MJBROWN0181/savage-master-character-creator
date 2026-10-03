import {readFile,writeFile} from 'node:fs/promises';
const path='design/CHARACTER-CARD-ART-QUEUE.json';
const queue=JSON.parse(await readFile(path,'utf8'));
const subjects={
 rf_psiStalker:'A bald adult human psychic wilderness tracker with ordinary rounded human ears, pale skin, alert eyes, practical fully enclosed leather-and-metal scouting armor and a travel cloak. Crouching on a broken roadway examining a faint golden psychic trail. No elf ears, no staff, no hair. Human mutant, not a fantasy elf.',
 rf_grackletooth:'A very tall barrel-chested muscular reptilian humanoid with a long dinosaur-like toothy muzzle, a cheerful broad grin, exactly two arms and two legs, and a long powerful prehensile tail curling around a closed tool pouch. Wears complete opaque heavy adventuring clothes and a utility harness. Sitting beside an industrial campfire in a ruined roadside station. No beak, no insect carapace, no antennae.',
 rf_quickflex:'An agile humanlike adult alien acrobat with exactly two arms, two legs and no tail. Short curly dark hair, large eyes and a slightly elongated expressive face. Fully clothed in teal practical flight suit and brown boots, vaulting lightly across a broken industrial walkway. No insect limbs, no extra arms.',
 rf_trimadore:'A tall adult humanoid alien technician with a very long tapering neck, a small elongated head, a narrow wiry torso, exactly two long arms and two long legs. The visible hand has two long fingers and one thumb. Fully clothed in opaque loose teal work overalls. Working at a machinery bench with a brass precision tool, side profile, inside a salvaged technology workshop. No extra arms.',
 rf_simvan:'An adult alien monster rider with rugged gray leathery skin, a broad humanoid face, short bristly hair and small pointed ears, wearing complete opaque teal and brown nomadic travel armor. Beside a saddled large original horned dinosaur-like mount, holding reins gently in one hand. A windswept rocky open plain, profile composition. No elf portrait, no human horse rider.'
};
const style='Original premium hand-painted ink-and-watercolor storybook illustration with etched linework and paper texture. Forest teal, antique gold, ivory parchment, worn brown leather and restrained amber. Vertical 4:5 tarot artwork only, no border, text, lettering, logo or watermark. Original character, no existing named character. Readable at small card size, full anatomy within central frame, inviting family-friendly fully clothed adventure art.';
for(const [id,subject] of Object.entries(subjects)){
 const job=queue.jobs.find(j=>j.id===id);
 if(job.status==='installed'){job.previousWeb=job.web;job.version=(job.version||1)+1;job.status='pending';}
 job.prompt=`Unique ${job.name} ancestry card for Savage Worlds Rifts in Savage Master. ${subject} ${style}`;
}
await writeFile(path,JSON.stringify(queue,null,2)+'\n');
