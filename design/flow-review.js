// Final navigation pass: one selected destination, context-specific controls.
const journalsGroup=document.createElement('nav');journalsGroup.setAttribute('aria-label','Journals');journalsGroup.innerHTML='<p class="menu-group-label">Journals</p>';['My Journal','GM Private Journal'].forEach(label=>{const b=[...sideMenu.querySelectorAll('button')].find(x=>x.textContent===label);journalsGroup.append(b)});sideMenu.insertBefore(journalsGroup,sideMenu.querySelector('nav[aria-label="Library"]'));
const labelsByView={board:'GM Storyboard',table:'Table View',mat:'Game Mat',journal:'My Journal',gmJournal:'GM Private Journal',tome:'Campaign Tome',vault:'Personal Vault',books:'Books & Resources',marketplace:'Marketplace',keepsakes:'Keepsake Studio',settings:'Settings',support:'Community & Support',plans:'Account plans'};
const campaignViews=new Set(['board','table','mat','gmJournal']);
const campaignSubtitle=document.querySelector('.top > div > p');
const campaignEyebrow=document.querySelector('.top .eyebrow');
const originalSubtitle=campaignSubtitle.textContent,originalEyebrow=campaignEyebrow.textContent;
const sharedTurnPanel=document.querySelector('.turn-controls').closest('section');
// Use the same turn and Epic Roll controls in either play view, not duplicate forms.
matTurnLink.remove();matEpicButton.remove();
function reconcileFlow(){const visible=[...document.querySelectorAll('main > .view')].find(v=>!v.classList.contains('hidden'));if(!visible)return;const id=visible.id;sideMenu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent.trim()===labelsByView[id])));if(id==='plans')plansLink.setAttribute('aria-current','page');else plansLink.removeAttribute('aria-current');document.querySelector('main > .toolbar').classList.toggle('hidden',id!=='board');campaignSubtitle.textContent=campaignViews.has(id)?originalSubtitle:id==='journal'?'Your character’s journey and shared party memories.':'Your personal workspace · Local design preview';campaignEyebrow.textContent=campaignViews.has(id)?originalEyebrow:'Savage Master / '+labelsByView[id];document.getElementById('heading').textContent=id==='board'?'The Bell Beneath the Harbor':labelsByView[id];if(id==='mat'){document.querySelector('#mat > .toolbar').after(sharedTurnPanel);sharedTurnPanel.after(epicPanel)}else if(id==='table'){document.querySelector('#table .workspace').before(sharedTurnPanel,epicPanel)}turnBanner.classList.toggle('hidden',!(['mat','table'].includes(id)&&turnState.enabled&&turnState.order[turnState.active]===previewPlayer))}
sideMenu.addEventListener('click',()=>queueMicrotask(reconcileFlow));
document.querySelector('main').addEventListener('click',()=>queueMicrotask(reconcileFlow));
document.querySelector('.turn-controls').addEventListener('change',()=>queueMicrotask(reconcileFlow));
document.querySelector('.turn-controls').addEventListener('click',()=>queueMicrotask(reconcileFlow));
document.getElementById('playerEndTurn').addEventListener('click',()=>queueMicrotask(reconcileFlow));
// Close an unfinished form only when requested, never silently discard its input.
epicButton.onclick=()=>{openEpic();reconcileFlow()};
document.getElementById('epicCancel').onclick=()=>{epicPanel.classList.add('hidden');epicButton.focus()};
// Display one source of session notes from the compact table and the storyboard.
const turnHelp=document.createElement('p');turnHelp.className='small';turnHelp.textContent='Optional GM controls · Choose a player, then Next. Expand below to arrange turn order.';sharedTurnPanel.prepend(turnHelp);
const flowStyle=document.createElement('style');flowStyle.textContent='aside{max-height:100vh;overflow:auto;position:sticky;top:0;align-self:start}body.light .assistant-result{background:var(--bg)}#table > .panel,#mat > .panel{margin-bottom:16px}@media(max-width:600px){aside{position:relative;max-height:none}}';document.head.append(flowStyle);
reconcileFlow();
