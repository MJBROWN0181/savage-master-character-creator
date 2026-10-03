import { convexTest } from 'convex-test';
import { test, expect, vi, afterEach } from 'vitest';
import { makeFunctionReference as ref } from 'convex/server';
import { Scrypt } from 'lucia';
import schema from './schema';
import type { Id } from './_generated/dataModel';
import { deck, mixedDeck } from './campfireOrder';
const modules=import.meta.glob('./**/*.ts');
afterEach(()=>vi.useRealTimers());
async function fixture(){
 const t=convexTest(schema,modules);
 const people=await t.run(async ctx=>{
   const result=[];
   for(let i=0;i<6;i++){
     const id=await ctx.db.insert('users',{email:`person${i}@test.example`,...(i<5?{emailVerificationTime:Date.now()}: {})});
     const data={ownerId:id,handle:`person-${i}`,displayName:`Person ${i}`,bio:'An adventurer',games:[],memory:'',roles:[],links:[],favorites:[],highlights:[],appearance:{background:'midnight',accent:'gold',font:'classic',layout:'balanced',sections:['about','games','memory','characters','journal']},ageConfirmedAt:Date.now(),updatedAt:Date.now(),reviewStatus:'approved' as const};
     const profileId=await ctx.db.insert('profiles',{...data,publicSnapshot:{...data,ownerId:undefined}});
     result.push({id,profileId,handle:data.handle});
   }
   return result;
 });
 return {t,people,users:people.map(p=>t.withIdentity({subject:p.id}))};
}
async function guildFixture(visibility:'private'|'public'='private'){
 const f=await fixture();
 const id:any=await f.users[0].mutation(ref<'mutation'>('guilds:create'),{name:'The secret lantern',description:'Our table',visibility,founders:f.people.slice(1,4).map(p=>p.handle)});
 for(const user of f.users.slice(1,4))await user.mutation(ref<'mutation'>('guilds:respond'),{id,accept:true});
 return {...f,id};
}
test('the campfire deck mixes five followed posts with one discovery and cycles small pools',()=>{
 const followed=['A','B'],discovery=['C'];
 expect(mixedDeck(followed,discovery,0)).toEqual(['A','B','A','B','A','C']);
 expect(mixedDeck(followed,discovery,6)).toEqual(['B','A','B','A','B','C']);
 expect(mixedDeck([],discovery,12)).toEqual(Array(6).fill('C'));
 expect(mixedDeck([],[],0)).toEqual([]);
 const rows=Array.from({length:20},(_,i)=>({_id:`item-${i}`}));
 expect(deck(rows,'seed-one')).toEqual(deck(rows,'seed-one'));
 expect(deck(rows,'seed-two')).not.toEqual(deck(rows,'seed-one'));
});
test('campfire pages enforce the ratio, apply blocks and hide private Guild posts even from their members',async()=>{
 const {t,people,users,id}=await guildFixture();
 await users[0].mutation(ref<'mutation'>('chronicles:follow'),{handle:people[1].handle,enabled:true});
 await t.run(async ctx=>{
   for(let i=0;i<3;i++)await ctx.db.insert('chroniclePosts',{ownerId:people[1].id,title:`Followed ${i}`,body:'Story',game:'Savage Worlds',kind:'Session tale',createdAt:Date.now()+i,toastCount:0,hidden:false});
   await ctx.db.insert('chroniclePosts',{ownerId:people[2].id,title:'Discovery',body:'Public story',game:'Savage Worlds',kind:'Session tale',createdAt:Date.now()+9,toastCount:0,hidden:false});
   await ctx.db.insert('chroniclePosts',{ownerId:people[2].id,title:'Private old Tome story',body:'Secret',game:'Savage Worlds',kind:'Session tale',tomeId:id,createdAt:Date.now()+10,toastCount:0,hidden:false});
 });
 const page:any=await users[0].query(ref<'query'>('campfire:page'),{seed:'first',offset:0,game:'Savage Worlds'});
 expect(page.posts).toHaveLength(6);expect(page.posts.slice(0,5).every((p:any)=>p.author.handle===people[1].handle)).toBe(true);expect(page.posts[5].title).toBe('Discovery');
 expect(JSON.stringify(page)).not.toContain('Private old Tome');
 await t.run(ctx=>ctx.db.insert('friendBlocks',{ownerId:people[1].id,blockedId:people[0].id}));
 const blocked:any=await users[0].query(ref<'query'>('campfire:page'),{seed:'first',offset:6});
 expect(blocked.posts.every((p:any)=>p.title==='Discovery')).toBe(true);
 const guest:any=await t.query(ref<'query'>('campfire:page'),{seed:'guest',offset:0});
 expect(JSON.stringify(guest)).not.toContain('Private old Tome');
});
test('Guilds wait for four distinct reviewed verified profiles to accept; services and unverified accounts do not count',async()=>{
 const {t,people,users}=await fixture();
 await expect(users[0].mutation(ref<'mutation'>('guilds:create'),{name:'Small',description:'',visibility:'private',founders:[people[1].handle,people[2].handle]})).rejects.toThrow('at least three');
 await expect(users[0].mutation(ref<'mutation'>('guilds:create'),{name:'Unverified',description:'',visibility:'private',founders:[people[1].handle,people[2].handle,people[5].handle]})).rejects.toThrow('verified emails');
 const id:any=await users[0].mutation(ref<'mutation'>('guilds:create'),{name:'Lantern',description:'',visibility:'private',founders:people.slice(1,4).map(p=>p.handle)});
 expect((await users[0].query(ref<'query'>('guilds:detail'),{id}) as any)).toMatchObject({active:false,memberCount:1});
 await expect(users[0].mutation(ref<'mutation'>('guilds:send'),{id,body:'Not yet',requestId:'test-message-001'})).rejects.toThrow('four accepted');
 for(const user of users.slice(1,4))await user.mutation(ref<'mutation'>('guilds:respond'),{id,accept:true});
 expect((await users[0].query(ref<'query'>('guilds:detail'),{id}) as any)).toMatchObject({active:true,memberCount:4});
 await users[3].mutation(ref<'mutation'>('guilds:respond'),{id,accept:false});
 expect((await users[0].query(ref<'query'>('guilds:detail'),{id}) as any).active).toBe(false);
 await t.run(ctx=>ctx.db.patch(people[3].id,{email:'person1@test.example'}));
 await users[0].mutation(ref<'mutation'>('guilds:invite'),{id,handle:people[3].handle});
 await users[3].mutation(ref<'mutation'>('guilds:respond'),{id,accept:true});
 expect((await users[0].query(ref<'query'>('guilds:detail'),{id}) as any).active).toBe(false);
});
test('private Guild membership and chat cannot leak through directory, guest links, or public visibility changes',async()=>{
 const {t,users,id}=await guildFixture();
 expect(await users[4].query(ref<'query'>('guilds:detail'),{id})).toBeNull();
 expect(await t.query(ref<'query'>('guilds:list'),{})).toEqual([]);
 await expect(users[4].mutation(ref<'mutation'>('guilds:respond'),{id,accept:true})).rejects.toThrow('unavailable');
 const args={id,body:'Our private plan',requestId:'private-message-001'};
 expect(await users[0].mutation(ref<'mutation'>('guilds:send'),args)).toBe(await users[0].mutation(ref<'mutation'>('guilds:send'),args));
 expect(await users[4].query(ref<'query'>('guilds:chat'),{id})).toEqual([]);
 await users[0].mutation(ref<'mutation'>('guilds:configure'),{id,visibility:'public',close:false});
 expect(await t.query(ref<'query'>('guilds:list'),{})).toHaveLength(1);
 expect(await t.query(ref<'query'>('guilds:chat'),{id})).toEqual([]);
 expect(JSON.stringify(await t.query(ref<'query'>('guilds:detail'),{id}))).not.toContain('private plan');
});

test('retired Tome endpoints cannot bypass Guild verification, invitations or four-member activation',async()=>{
 const {users,id}=await guildFixture('private');
 await users[3].mutation(ref<'mutation'>('guilds:respond'),{id,accept:false});
 const story={title:'Our story',body:'A tabletop memory',game:'Savage Worlds',kind:'Session tale',consent:true,tomeId:id};
 await expect(users[0].mutation(ref<'mutation'>('chronicles:publish'),story)).rejects.toThrow('four accepted');
 await users[0].mutation(ref<'mutation'>('guilds:invite'),{id,handle:'person-4'});
 await expect(users[4].mutation(ref<'mutation'>('chronicles:publish'),story)).rejects.toThrow('Join this Guild');
 await expect(users[4].mutation(ref<'mutation'>('chronicles:join'),{id,enabled:true})).rejects.toThrow('Accept your invitation');
 await expect(users[5].mutation(ref<'mutation'>('chronicles:join'),{id,enabled:true})).rejects.toThrow('verified email');
});
test("only a member's own explicitly selected message can be copied to the public campfire",async()=>{
 const {t,users,id}=await guildFixture();
 const messageId:any=await users[0].mutation(ref<'mutation'>('guilds:send'),{id,body:'This story can be shared.',requestId:'share-message-001'});
 await expect(users[1].mutation(ref<'mutation'>('guilds:share'),{id:messageId,title:'Stolen',consent:true})).rejects.toThrow('your own');
 await expect(users[0].mutation(ref<'mutation'>('guilds:share'),{id:messageId,title:'A spark',consent:false})).rejects.toThrow('confirming');
 const postId:any=await users[0].mutation(ref<'mutation'>('guilds:share'),{id:messageId,title:'A spark',consent:true});
 expect(await users[0].mutation(ref<'mutation'>('guilds:share'),{id:messageId,title:'A spark',consent:true})).toBe(postId);
 const post:any=await t.query(ref<'query'>('chronicles:post'),{id:postId});
 expect(post.body).toBe('This story can be shared.');expect(JSON.stringify(post)).not.toContain('secret lantern');expect(post.public).toBe(true);
 const shareId:any=await users[4].mutation(ref<'mutation'>('chronicles:share'),{id:postId});
 expect((await t.query(ref<'query'>('chronicles:post'),{id:shareId}) as any).body).toBe(post.body);
 await users[0].mutation(ref<'mutation'>('chronicles:remove'),{id:postId});
 expect(await t.query(ref<'query'>('chronicles:post'),{id:shareId})).toBeNull();
});
test('Guild events respect privacy, validate timezones, and keep RSVPs idempotent',async()=>{
 const {t,users,id}=await guildFixture();
 const event={id,title:'Friday session',description:'Bring your dice.',startsAt:Date.now()+86400000,endsAt:Date.now()+90000000,timezone:'America/Chicago'};
 await expect(users[4].mutation(ref<'mutation'>('guilds:schedule'),event)).rejects.toThrow('four accepted');
 await expect(users[0].mutation(ref<'mutation'>('guilds:schedule'),{...event,timezone:'Imaginary/Nowhere'})).rejects.toThrow('timezone');
 const eventId:any=await users[0].mutation(ref<'mutation'>('guilds:schedule'),event);
 expect(await t.query(ref<'query'>('guilds:events'),{id})).toEqual([]);
 await users[0].mutation(ref<'mutation'>('guilds:invite'),{id,handle:'person-4'});
 expect(await users[4].query(ref<'query'>('guilds:events'),{id})).toEqual([]);
 await users[1].mutation(ref<'mutation'>('guilds:rsvp'),{id:eventId,choice:'going'});await users[1].mutation(ref<'mutation'>('guilds:rsvp'),{id:eventId,choice:'going'});
 expect((await users[1].query(ref<'query'>('guilds:events'),{id}) as any)[0]).toMatchObject({going:1,response:'going'});
 await users[0].mutation(ref<'mutation'>('guilds:configure'),{id,visibility:'public',close:false});
 expect((await t.query(ref<'query'>('guilds:events'),{id}) as any)[0].title).toBe('Friday session');
 await users[0].mutation(ref<'mutation'>('guilds:cancelEvent'),{id:eventId});expect(await t.query(ref<'query'>('guilds:events'),{id})).toEqual([]);
});
test('Bazaar ads enforce categories, ownership, safe booking links, review gates and seller privacy',async()=>{
 const {t,users,people}=await fixture();
 const ad={title:'Run your one shot',description:'An evening adventure.',category:'Game Master Hires',game:'Savage Worlds',price:'$25 per session',contactUrl:'https://smsheets.com/profile'};
 const id:any=await users[0].mutation(ref<'mutation'>('bazaar:save'),ad);
 await expect(users[1].mutation(ref<'mutation'>('bazaar:save'),{...ad,id})).rejects.toThrow('your own');
 await expect(users[1].mutation(ref<'mutation'>('bazaar:save'),{...ad,contactUrl:'javascript:alert(1)'})).rejects.toThrow('HTTPS');
 await expect(users[5].mutation(ref<'mutation'>('bazaar:save'),ad)).rejects.toThrow('verified email');
 const page:any=await t.query(ref<'query'>('bazaar:list'),{category:'Game Master Hires'});expect(page.rows).toHaveLength(1);expect(JSON.stringify(page)).not.toContain('test.example');
 await t.run(ctx=>ctx.db.insert('friendBlocks',{ownerId:people[0].id,blockedId:people[1].id}));expect((await users[1].query(ref<'query'>('bazaar:list'),{}) as any).rows).toHaveLength(0);
 await users[0].mutation(ref<'mutation'>('bazaar:close'),{id,closed:true});expect((await t.query(ref<'query'>('bazaar:list'),{}) as any).rows).toHaveLength(0);
});
test('deleting a profile requires its exact handle and preserves private game data while preventing post resurrection',async()=>{
 vi.useFakeTimers();const {t,users,people}=await fixture();
 const ids=await t.run(async ctx=>({character:await ctx.db.insert('characters',{ownerId:people[0].id,name:'My hero',snapshot:{},updatedAt:Date.now()}),journal:await ctx.db.insert('privateJournals',{ownerId:people[0].id,kind:'player',text:'Private memory',updatedAt:Date.now()}),post:await ctx.db.insert('chroniclePosts',{ownerId:people[0].id,title:'Old story',body:'Public',game:'Savage Worlds',kind:'Session tale',createdAt:Date.now(),toastCount:0,hidden:false})}));
 await expect(users[0].mutation(ref<'mutation'>('profiles:deleteProfile'),{confirmation:people[1].handle})).rejects.toThrow('exact profile handle');
 await users[0].mutation(ref<'mutation'>('profiles:deleteProfile'),{confirmation:people[0].handle});await t.finishAllScheduledFunctions(vi.runAllTimers);
 expect(await users[0].query(ref<'query'>('profiles:mine'),{})).toBeNull();
 const state=await t.run(async ctx=>({character:await ctx.db.get(ids.character),journal:await ctx.db.get(ids.journal),user:await ctx.db.get(people[0].id),post:await ctx.db.get(ids.post)}));
 expect(state.character?.name).toBe('My hero');expect(state.journal?.text).toBe('Private memory');expect(state.user).not.toBeNull();expect(state.post?.hidden).toBe(true);
});

test('Bazaar image ownership and open-ad limits survive a long history of closed ads',async()=>{
 const {t,users,people}=await fixture();
 const ad={title:'Custom portrait',description:'Original artwork.',category:'Custom Art',game:'Any tabletop game',price:'Quote on request'};
 const imageId=await t.run(async ctx=>{const id=await ctx.storage.store(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}));await ctx.db.insert('profileMedia',{ownerId:people[0].id,storageId:id,createdAt:Date.now()});return id;});
 await expect(users[1].mutation(ref<'mutation'>('bazaar:save'),{...ad,imageId})).rejects.toThrow('your own listing image');
 const listing=await users[0].mutation(ref<'mutation'>('bazaar:save'),{...ad,imageId});
 const own:any=await users[0].query(ref<'query'>('bazaar:list'),{});expect(own.rows[0].imageId).toBe(imageId);expect(own.rows[0].imageUrl).toBeTruthy();
 const guest:any=await t.query(ref<'query'>('bazaar:list'),{});expect(guest.rows[0].imageId).toBeUndefined();
 await t.run(async ctx=>{for(let i=0;i<75;i++)await ctx.db.insert('bazaarListings',{...ad,ownerId:people[1].id,status:i<20?'open':'closed',createdAt:Date.now()-100000+i,updatedAt:Date.now(),hidden:false});});
 await expect(users[1].mutation(ref<'mutation'>('bazaar:save'),ad)).rejects.toThrow('20 open listings');
 expect(listing).toBeTruthy();
});

test('profile deletion removes follows, membership and events without removing account-level blocks',async()=>{
 vi.useFakeTimers();const {t,users,people,id}=await guildFixture();
 const eventId=await users[1].mutation(ref<'mutation'>('guilds:schedule'),{id,title:'My event',description:'',startsAt:Date.now()+60000,endsAt:Date.now()+3600000,timezone:'America/Chicago'}) as Id<'guildEvents'>;
 await t.run(async ctx=>{
   await ctx.db.insert('chronicleFollows',{ownerId:people[1].id,targetId:people[2].id});
   await ctx.db.insert('chronicleFollows',{ownerId:people[2].id,targetId:people[1].id});
   await ctx.db.insert('friendBlocks',{ownerId:people[1].id,blockedId:people[5].id});
 });
 await users[1].mutation(ref<'mutation'>('guilds:rsvp'),{id:eventId,choice:'going'});
 vi.advanceTimersByTime(10);
 await users[1].mutation(ref<'mutation'>('profiles:deleteProfile'),{confirmation:people[1].handle});await t.finishAllScheduledFunctions(vi.runAllTimers);
 expect(await t.run(ctx=>ctx.db.query('chronicleFollows').collect())).toEqual([]);
 expect(await t.run(ctx=>ctx.db.query('chronicleMembers').withIndex('by_owner',q=>q.eq('ownerId',people[1].id)).collect())).toEqual([]);
 expect(await t.run(ctx=>ctx.db.query('guildRsvps').collect())).toEqual([]);
 expect((await t.run(ctx=>ctx.db.get(eventId)))?.cancelled).toBe(true);
 expect(await t.run(ctx=>ctx.db.query('friendBlocks').collect())).toHaveLength(1);
});
test('weekly Bug news uses official publisher links, game categories, and immutable per-week publication keys',async()=>{
 const {t}=await fixture();
 const args={week:'2026-10-05',items:[{game:'Savage Worlds',title:'Savage Worlds roundup',summary:'Publisher news checked this week.',url:'https://peginc.com/'}]};
 await expect(t.mutation(ref<'mutation'>('news:publishWeekly'),{...args,items:[{...args.items[0],url:'https://peginc.com.evil.test/fake'}]})).rejects.toThrow('official publisher');
 const result:any=await t.mutation(ref<'mutation'>('news:publishWeekly'),args);
 expect((await t.mutation(ref<'mutation'>('news:publishWeekly'),{...args,items:[{...args.items[0],summary:'Retry wording changed'}]}) as any).posts).toEqual(result.posts);
 const post:any=await t.query(ref<'query'>('chronicles:post'),{id:result.posts[0]});expect(post).toMatchObject({game:'Savage Worlds',kind:'Game news',author:{official:'bug'}});expect(post.body).toContain('https://peginc.com/');expect(post.body).not.toContain('Retry wording');
});
test('password changes verify the current credential, store only a hash, and revoke sessions',async()=>{
 const {t,people,users}=await fixture();
 const hash=await new Scrypt().hash('old-password-001');
 const accountId=await t.run(async ctx=>{
   const id=await ctx.db.insert('authAccounts',{userId:people[0].id,provider:'password',providerAccountId:'person0@test.example',secret:hash});
   await ctx.db.insert('authSessions',{userId:people[0].id,expirationTime:Date.now()+86400000});return id;
 });
 await expect(users[0].action(ref<'action'>('accountSettings:changePassword'),{currentPassword:'wrong-password',newPassword:'new-password-002'})).rejects.toThrow('could not be verified');
 expect((await t.run(ctx=>ctx.db.get(accountId)))?.secret).toBe(hash);
 await users[0].action(ref<'action'>('accountSettings:changePassword'),{currentPassword:'old-password-001',newPassword:'new-password-002'});
 const stored=await t.run(ctx=>ctx.db.get(accountId));expect(stored?.secret).not.toBe('new-password-002');expect(await new Scrypt().verify(stored!.secret!,'new-password-002')).toBe(true);
 expect(await t.run(ctx=>ctx.db.query('authSessions').collect())).toEqual([]);
});
