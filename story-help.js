/* A player reviews and copies the prompt before opening their own ChatGPT session. */
(() => {
 if(typeof window==='undefined')return;
 const prompt=(context,mode)=>{
  const game=({dnd5e:'Dungeons & Dragons, revised fifth edition (2024)',pathfinder2e:'Pathfinder Second Edition Remastered',savage:'Savage Worlds Adventure Edition'})[context.system];
  const identity=[game,context.setting,context.species,context.className,context.background,context.name].filter(Boolean).join(' · ');
  const seed=context.bio?.trim()?`My story ideas: ${context.bio.slice(0,3000)}\n`:'';
  return mode==='portrait'?`Create an original fantasy character portrait for my tabletop hero: ${identity}.\n${seed}Show one character, with clothing and equipment that fit this game and setting. Use rich forest teal, antique gold, and parchment tones, with a painterly fantasy style. No text, logos, or borders. Ask me about appearance if you need it.`:`Help me write a character biography for ${identity}.\n${seed}Suggest five fitting names if I have not chosen one. Write a short biography, a personality trait, a bond, a flaw, and two adventure hooks my GM can use. Keep it suitable for a beginning adventurer. Do not invent mechanical bonuses or feats. Ask one helpful question if you need more direction.`;
 };
 const open=context=>{
  document.getElementById('characterStoryHelp')?.remove();
  const dialog=document.createElement('dialog');dialog.id='characterStoryHelp';dialog.className='story-assistant';dialog.setAttribute('aria-labelledby','story-help-title');
  dialog.innerHTML='<header><h2 id="story-help-title">Create with ChatGPT</h2><button type="button" data-close>Close</button></header><p>Choose what you want help with. Review the prompt, copy it, and paste it into ChatGPT. Bring your finished story back to your biography.</p><div class="story-modes"><button type="button" data-mode="bio" aria-pressed="true">Biography</button><button type="button" data-mode="portrait" aria-pressed="false">Character portrait</button></div><label for="story-help-prompt">Your prompt</label><textarea id="story-help-prompt" maxlength="6000"></textarea><footer><button type="button" data-copy>Copy prompt</button><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a></footer><p role="status" data-status></p>';
  const textarea=dialog.querySelector('textarea');textarea.value=prompt(context,'bio');
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{dialog.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));textarea.value=prompt(context,button.dataset.mode);dialog.querySelector('[data-status]').textContent='';});
  dialog.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(textarea.value);dialog.querySelector('[data-status]').textContent='Prompt copied. Open ChatGPT and paste it into your chat.';}catch{textarea.focus();textarea.select();dialog.querySelector('[data-status]').textContent='Select and copy this prompt, then paste it into ChatGPT.';}};
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
 };
 window.smStory={prompt,open};
})();
