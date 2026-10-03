import './creation-notice.js';
export function creationNotice(title,message,options={}){window.dispatchEvent(new CustomEvent('creation-choice-notice',{detail:{title,message,...options}}));}
