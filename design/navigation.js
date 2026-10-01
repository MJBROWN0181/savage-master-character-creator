// Reorder the existing controls without replacing their navigation handlers.
const sideMenu=document.querySelector('aside');
const menuButtons=new Map([...sideMenu.querySelectorAll('button')].map(button=>[button.textContent.trim(),button]));
const workspaceHeading=sideMenu.querySelector('.eyebrow');
const plansButton=menuButtons.get('Account plans');
const plansLink=document.createElement('a');
plansLink.href='#plans';plansLink.textContent='Account plans';plansLink.className='account-plans-link';
plansLink.onclick=event=>{event.preventDefault();plansButton.click();sideMenu.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed','false'));plansLink.setAttribute('aria-current','page')};
menuButtons.forEach(button=>button.addEventListener('click',()=>plansLink.removeAttribute('aria-current')));
plansButton.hidden=true;plansButton.style.display='none';workspaceHeading.after(plansLink);
const groups=[['Play',['GM Storyboard','Game Mat','Table View','My Journal','GM Private Journal']],['Library',['Campaign Tome','Personal Vault','Books & Resources']],['Create & discover',['Marketplace','Keepsake Studio']],['Preferences',['Settings']]];
const accountBlock=sideMenu.querySelector('.account');
groups.forEach(([name,labels])=>{const section=document.createElement('nav');section.setAttribute('aria-label',name);const heading=document.createElement('p');heading.className='menu-group-label';heading.textContent=name;section.append(heading);labels.forEach(label=>{const button=menuButtons.get(label);if(button)section.append(button)});sideMenu.insertBefore(section,accountBlock)});
const menuStyle=document.createElement('style');menuStyle.textContent=`.account-plans-link{display:inline-block;margin:-4px 0 8px;color:var(--muted);font-size:12px;text-underline-offset:3px}.account-plans-link:hover,.account-plans-link[aria-current]{color:var(--accent)}.menu-group-label{margin:18px 0 6px;color:var(--muted);font-size:10px;letter-spacing:1.5px;text-transform:uppercase}aside nav button{padding:7px 10px;margin:5px 0;font-size:13px}aside .account{margin-top:22px}.account-plans-link:focus-visible{outline:2px solid var(--accent);outline-offset:4px}@media(max-width:600px){aside nav button{margin:4px 4px 4px 0} .menu-group-label{margin-top:12px}}`;document.head.append(menuStyle);
