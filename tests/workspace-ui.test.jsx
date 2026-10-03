import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test,vi} from 'vitest';

vi.stubGlobal('document',{getElementById:()=>null});
const {CampaignTable,CampaignJournal}=await import('../campaigns.jsx');
const data={name:'The Lantern Coast',system:'savageWorlds',isGM:false,party:[],adventures:[{_id:'a',title:'The First Voyage'}],scenes:[{_id:'s',adventureId:'a',title:'Secret betrayal',notes:'Hidden villain identity'}],journals:[]};
test('player table never renders GM scene notes even if supplied by a caller',()=>{
  const html=renderToStaticMarkup(<CampaignTable data={data} adventure="a"/>);
  expect(html).toContain('The First Voyage');expect(html).toContain('Ready for the adventure');
  expect(html).not.toContain('Secret betrayal');expect(html).not.toContain('Hidden villain identity');
  expect(html).toContain('href="/?game=savage"');
});
test('GM table uses a valid fallback scene and identifies private reference',()=>{
  const html=renderToStaticMarkup(<CampaignTable data={{...data,isGM:true}} adventure="a" sceneId="stale"/>);
  expect(html).toContain('Hidden villain identity');expect(html).toContain('visible only to you');
});
test('journal preserves draft text and escapes entry content',()=>{
  const html=renderToStaticMarkup(<CampaignJournal data={{...data,journals:[{_id:'j',updatedAt:0,text:'<script>secret</script>'}]}} draft="Unfinished memory" onDraft={()=>{}}/>);
  expect(html).toContain('Unfinished memory');expect(html).toContain('&lt;script&gt;secret&lt;/script&gt;');
  expect(html).toContain('Only you can read these entries');expect(html).not.toContain('<script>');
});
