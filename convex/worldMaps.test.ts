import {convexTest} from 'convex-test';
import {expect,test} from 'vitest';
import {makeFunctionReference as ref} from 'convex/server';
import schema from './schema';
import {newWorld} from '../builder-model.mjs';
import {newAtlas} from '../map-atlas.mjs';
const modules=import.meta.glob('./**/*.ts');
const save=ref<'mutation'>('masterBuilder:save'),start=ref<'mutation'>('worldMaps:uploadUrl'),finish=ref<'action'>('worldMaps:finishUpload'),list=ref<'query'>('worldMaps:list'),remove=ref<'mutation'>('worldMaps:remove');
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]);
test('map upload, retrieval, removal, and upload tickets remain owner-only',async()=>{
  const t=convexTest(schema,modules),a=await t.run(ctx=>ctx.db.insert('users',{})),b=await t.run(ctx=>ctx.db.insert('users',{})),owner=t.withIdentity({subject:a}),other=t.withIdentity({subject:b});
  const world=newWorld();world.name='Atlas';world.rules.base='savageWorlds';const worldId=await owner.mutation(save,{world});
  await expect(other.mutation(start,{worldId})).rejects.toThrow('World not found');await expect(t.query(list,{worldId})).rejects.toThrow('World not found');
  const {ticket}=await owner.mutation(start,{worldId}),storageId=await t.run(ctx=>ctx.storage.store(new Blob([png],{type:'image/png'})));
  // convex-test's storeBlob omits the Content-Type that real HTTP uploads store.
  await t.run(ctx=>(ctx.db as any).patch(storageId,{contentType:'image/png'}));
  const args={ticket,storageId,name:'Coast',category:'Region',caption:'GM notes'};
  await expect(other.action(finish,args)).rejects.toThrow('Upload expired');
  const id=await owner.action(finish,args),rows=await owner.query(list,{worldId});expect(rows).toMatchObject([{_id:id,name:'Coast',caption:'GM notes',size:16}]);expect(rows[0].url).toBeTruthy();
  await expect(other.query(list,{worldId})).rejects.toThrow('World not found');await expect(other.mutation(remove,{id})).rejects.toThrow('Map not found');
  await expect(owner.action(finish,args)).rejects.toThrow('Upload expired');
  await owner.mutation(remove,{id});expect(await owner.query(list,{worldId})).toEqual([]);expect(await t.run(ctx=>ctx.storage.get(storageId))).toBeNull();
});
test('map uploads reject mismatched headers and expired tickets',async()=>{
  const t=convexTest(schema,modules),a=await t.run(ctx=>ctx.db.insert('users',{})),owner=t.withIdentity({subject:a});
  const world=newWorld();world.name='Atlas';world.rules.base='dnd5e';const worldId=await owner.mutation(save,{world});
  const {ticket}=await owner.mutation(start,{worldId}),storageId=await t.run(ctx=>ctx.storage.store(new Blob(['<script>danger</script>'],{type:'image/png'})));
  await t.run(ctx=>(ctx.db as any).patch(storageId,{contentType:'image/png'}));
  await expect(owner.action(finish,{ticket,storageId,name:'Fake',category:'',caption:''})).rejects.toThrow('not a supported map');
  await t.run(ctx=>ctx.db.patch(ticket,{expiresAt:0}));await expect(owner.action(finish,{ticket,storageId,name:'Expired',category:'',caption:''})).rejects.toThrow('Upload expired');
  expect(await owner.query(list,{worldId})).toEqual([]);
});

test('annotations stay owner-only, preserve migrated atlas IDs, and reject invalid geometry and parent loops',async()=>{
  const t=convexTest(schema,modules),a=await t.run(ctx=>ctx.db.insert('users',{})),b=await t.run(ctx=>ctx.db.insert('users',{})),owner=t.withIdentity({subject:a}),other=t.withIdentity({subject:b});
  const world=newWorld();world.name='Atlas';world.rules.base='savageWorlds';const worldId=await owner.mutation(save,{world});
  const update=ref<'mutation'>('worldMaps:updateAtlas');
  async function upload(atlas:any){const {ticket}=await owner.mutation(start,{worldId}),storageId=await t.run(ctx=>ctx.storage.store(new Blob([png],{type:'image/png'})));await t.run(ctx=>(ctx.db as any).patch(storageId,{contentType:'image/png'}));return owner.action(finish,{ticket,storageId,name:'Map',category:'',caption:'',atlas});}
  const atlas=newAtlas('browser-map');atlas.markers.push({id:'place',x:.5,y:.5,name:'Harbor',type:'Town',layerId:'places',public:true,notes:'Port',gmNotes:'Secret tunnel',targetMapId:'',worldField:'section:history'});
  const id=await upload(atlas),child=newAtlas('child-map');child.parentMapId=atlas.id;await upload(child);
  await expect(other.mutation(update,{id,atlas})).rejects.toThrow('Map not found');await expect(t.mutation(update,{id,atlas})).rejects.toThrow('Map not found');
  const changed=structuredClone(atlas);changed.markers[0].notes='Updated port';await owner.mutation(update,{id,atlas:changed});
  expect((await owner.query(list,{worldId}))[0].atlas).toMatchObject({id:'browser-map',markers:[{notes:'Updated port',gmNotes:'Secret tunnel',worldField:'section:history'}]});
  const invalid=structuredClone(changed);invalid.markers[0].x=2;await expect(owner.mutation(update,{id,atlas:invalid})).rejects.toThrow('Invalid map annotations');
  await expect(owner.mutation(update,{id,atlas:{...changed,id:'different'}})).rejects.toThrow('identity cannot change');
  await expect(owner.mutation(update,{id,atlas:{...changed,parentMapId:'child-map'}})).rejects.toThrow('parent loop');
  await expect(upload(atlas)).rejects.toThrow('already in this world');
  expect((await owner.query(list,{worldId}))[0].atlas.parentMapId).toBe('');
});
