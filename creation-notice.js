// A small shared, focus-trapping guide for both React and the classic workshop.
if(typeof window!=='undefined')window.showCreationNotice = function ({title='Choice limit reached',message,onContinue,continueLabel='Continue to next selection'}) {
  let dialog=document.getElementById('creationLimitNotice');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='creationLimitNotice';dialog.className='creation-limit-notice';dialog.setAttribute('aria-labelledby','creation-limit-title');dialog.setAttribute('aria-describedby','creation-limit-message');document.body.append(dialog);}
  const previous=document.activeElement;
  const previousAction=previous?.getAttribute('onclick');
  dialog.replaceChildren();
  const portrait=document.createElement('span');portrait.className='creation-bug-portrait';const image=document.createElement('img');image.src='/images/art/the-bug.png';image.alt='Bug, your character creation guide';portrait.append(image);
  const heading=document.createElement('h2');heading.id='creation-limit-title';heading.textContent=title;
  const text=document.createElement('p');text.id='creation-limit-message';text.textContent=message;
  const copy=document.createElement('div');copy.className='creation-notice-copy';
  const actions=document.createElement('div');actions.className='creation-notice-actions';
  const edit=document.createElement('button');edit.textContent='Edit these choices';edit.autofocus=true;edit.onclick=()=>dialog.close();actions.append(edit);
  if(onContinue){const next=document.createElement('button');next.textContent=continueLabel==='Keep choosing spells'?continueLabel:'Continue';next.setAttribute('aria-label',continueLabel);next.onclick=()=>{dialog.close();onContinue();};actions.append(next);}
  dialog.onclose=()=>{const target=previous?.isConnected?previous:previousAction?[...document.querySelectorAll('[onclick]')].find(e=>e.getAttribute('onclick')===previousAction):null;target?.focus({preventScroll:true});};
  copy.append(heading,text,actions);dialog.append(portrait,copy);if(!dialog.open)dialog.showModal();
};
