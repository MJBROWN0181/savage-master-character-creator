import test from 'node:test';
import assert from 'node:assert/strict';
import { serveShare } from '../api/share.mjs';
import { serveCard } from '../api/post-card.mjs';
import { publicPost } from '../server/public-post.mjs';
const id='hd7ve93k8y1ctq6nxp3q2pkr0x8fkxm1';
const post={title:'A <script> & a triumph',body:'Our actual story.\nThe dragon fell!',game:'Savage Worlds',author:{name:'Ember & friends',handle:'ember'},public:true};
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};}
function stub(t,value){t.mock.method(globalThis,'fetch',async(_url,options)=>{assert.equal(JSON.parse(options.body).path,'chronicles:post');assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>({status:'success',value})};});}
test('public permalinks render the actual escaped post, source profile, canonical URL, and social metadata',async t=>{
 stub(t,post);const res=response();await serveShare({query:{post:id}},res);
 assert.equal(res.statusCode,200);assert.equal(res.headers['Cache-Control'],'no-store');
 assert.match(res.body,/Our actual story/);assert.match(res.body,/The dragon fell!/);assert.match(res.body,/A &lt;script&gt; &amp; a triumph/);
 assert.match(res.body,new RegExp(`https://smsheets.com/p/${id}`));assert.match(res.body,/og:image/);assert.match(res.body,/twitter:card/);assert.match(res.body,/profile\?user=ember/);assert.doesNotMatch(res.body,/<script> & a triumph/);
});
test('removed and private posts produce no public story or preview metadata',async t=>{
 for(const value of [null,{...post,public:false}]){stub(t,value);const res=response();await serveShare({query:{post:id}},res);assert.equal(res.statusCode,404);assert.doesNotMatch(res.body,/Our actual story|og:image/);const card=response();await serveCard({query:{post:id}},card);assert.equal(card.statusCode,404);assert.equal(card.headers['Cache-Control'],'no-store');}
});
test('preview cards are real 1200 by 630 PNGs, including lengthy titles and stories',async t=>{
 stub(t,{...post,title:'A very long headline '.repeat(5).slice(0,100),body:'A wonderful table memory. '.repeat(80)});const res=response();await serveCard({query:{post:id}},res);
 assert.equal(res.statusCode,200);assert.equal(res.headers['Content-Type'],'image/png');assert.ok(Buffer.isBuffer(res.body));assert.deepEqual([...res.body.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(res.body.readUInt32BE(16),1200);assert.equal(res.body.readUInt32BE(20),630);
});
test('malformed post IDs never reach the backend, and connection failures stay nonpublic',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Network failed');});assert.equal(await publicPost('../secrets'),null);assert.equal(fetch.mock.callCount(),0);const res=response();await serveShare({query:{post:id}},res);assert.equal(res.statusCode,503);assert.doesNotMatch(res.body,/Network failed/);
});
