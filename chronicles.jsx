import React,{useState,useEffect,useRef,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {ConvexReactClient,useQuery} from 'convex/react';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {makeFunctionReference as ref} from 'convex/server';
import {PostCard,PostComposer,communityGames} from './community-ui.jsx';
import {Bazaar} from './bazaar.jsx';
import {Guilds} from './guilds.jsx';
import {BugMascot} from './bug-mascot.jsx';
import {mixedDeck} from './convex/campfireOrder';
import './community.css';
export function App(){
  const query=new URLSearchParams(location.search),sharedId=query.get('post');
  const [view,setView]=useState(()=>['guilds','bazaar'].includes(query.get('view'))?query.get('view'):'fire');
  const post=useQuery(ref('chronicles:post'),sharedId?{id:sharedId}:'skip');
  function changeView(next){setView(next);const url=new URL(location.href);url.searchParams.delete('post');if(next==='fire')url.searchParams.delete('view');else url.searchParams.set('view',next);window.history.replaceState(null,'',url.pathname+url.search);}
  return <div className="chronicles"><main><section className="chron-hero"><div><span className="chron-eyebrow">Gather around the storyteller's fire</span><h1>Around the Fire</h1><p>Every table has a tale. Bring your stories, meet your people, and find a spark for your next adventure.</p><a className="chron-hero-link" href="/profile">Visit my personal page</a></div><div className="chron-art" aria-hidden="true"><span className="chron-moon">☾</span><span className="chron-star">✧</span><svg viewBox="0 0 320 220">
              <path
                d="M25 180 Q110 130 160 155 Q240 135 295 180L285 200Q205 165 160 185Q85 160 35 200Z"
                fill="#1e373d"
                stroke="#d9b978"
                strokeWidth="3"
              />
              <path
                d="M160 155V185M40 187Q100 151 145 172M175 172Q230 155 280 188"
                fill="none"
                stroke="#a48b5c"
                strokeWidth="2"
              />
              <path
                d="M137 142Q105 103 142 80Q128 111 159 119Q178 100 170 64Q220 114 183 142Z"
                fill="#deae61"
              />
              <path
                d="M151 138Q137 117 163 100Q157 120 177 129L172 144Z"
                fill="#ffe7b3"
              />
              <path
                d="M95 210L145 193M180 193L230 210"
                stroke="#6d8b87"
                strokeWidth="3"
              />
              <path
                d="M75 50L80 36L85 50L98 55L85 60L80 74L75 60L62 55ZM244 70L247 61L250 70L259 73L250 76L247 85L244 76L235 73Z"
                fill="#d9b978"
              />
            </svg><span className="chron-art-caption">One spark becomes a legend</span></div></section>
    <nav className="chron-tabs" aria-label="Community sections">{[['fire','Around the Fire'],['guilds','Guilds'],['bazaar','Bazaar']].map(([id,label])=><button key={id} type="button" className={view===id?'':'quiet'} aria-pressed={view===id} onClick={()=>changeView(id)}>{label}</button>)}</nav>
    <div hidden={view!=='guilds'}><Guilds/></div><div hidden={view!=='bazaar'}><Bazaar/></div><div className="chron-layout" hidden={view!=='fire'}><div className="chron-feed">{sharedId?<section className="chron-panel"><a href="/chronicles">Back to Around the Fire</a>{post===undefined?<p>Opening this post…</p>:post?<PostCard post={post}/>:<><h2>Post unavailable</h2><p>This post is private, removed, or no longer available.</p></>}</section>:<><PostComposer/><CampfireFeed/></>}</div><aside className="chron-aside"><section className="chron-panel chron-bug-card"><BugMascot state="announce"/><h2>Bug's workshop</h2><p>Code fixes, helpful tips, and game news from the keeper of the tome.</p><a href="/profile?user=bug">Follow Bug's official profile</a><p className="campfire-status">Weekly game news · Mondays at 9 AM Central</p></section><section className="chron-panel"><h2>A welcoming fire</h2><p>Celebrate the players behind the heroes. Credit your companions and ask before sharing their stories.</p><a href="/settings">Settings & profile review</a></section><section className="chron-prompt"><h2>Need a spark?</h2><p>What was the moment your table cheered together?</p><a href="/campaigns?view=journal">Return to your journals</a></section></aside></div>
  </main><footer className="chron-bottom">Savage Master · Every adventure leaves a story.</footer></div>;
}
export function CampfireFeed(){
  const [seed,setSeed]=useState(()=>crypto.randomUUID()),[offsets,setOffsets]=useState([0]),[game,setGame]=useState('All games');
  const data=useQuery(ref('campfire:page'),{seed,game,offset:0});
  const more=useCallback(next=>setOffsets(previous=>previous.includes(next)?previous:[...previous,next]),[]);
  const sentinel=useRef(null),next=data?.available?offsets[offsets.length-1]+6:null;
  useEffect(()=>{if(!next||!sentinel.current||typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))more(next);},{rootMargin:'250px'});observer.observe(sentinel.current);return()=>observer.disconnect();},[next,more]);
  function stoke(){setSeed(crypto.randomUUID());setOffsets([0]);}
  return <section className="campfire-stream" aria-label="Public campfire feed"><div className="campfire-refresh"><h2 id="campfire-top">Stories around the fire</h2><button type="button" onClick={stoke}>Stoke the Fire</button><label>Game<select value={game} onChange={e=>{setGame(e.target.value);setOffsets([0]);setSeed(crypto.randomUUID());}}>{['All games',...communityGames].map(g=><option key={g}>{g}</option>)}</select></label></div><p className="campfire-status">Your followed storytellers lead the way: five followed stories and one public discovery whenever both are available.</p>{offsets.map((offset,i)=><CampfireBatch key={`${seed}:${game}:${offset}`} data={data} offset={offset} last={i===offsets.length-1} onMore={more}/>)}{next&&<div className="campfire-loader" ref={sentinel}><p className="campfire-status">{data.available<6?'Stories will cycle while the community grows.':'There is always another story by the fire.'}</p>{typeof IntersectionObserver==='undefined'&&<button type="button" className="quiet" onClick={()=>more(next)}>Keep the fire going</button>}</div>}<a href="#campfire-top">Back to the fire's beginning</a></section>;
}
function CampfireBatch({data,offset,last,onMore}){
  const posts=data?mixedDeck(data.following||[],data.discovery||[],offset):[];
  return data===undefined?<p role="status">Gathering sparks…</p>:<>{posts.map((post,i)=><PostCard key={`${offset}:${i}:${post._id}`} post={post}/>)}{last&&!posts.length&&<section className="chron-panel"><h3>The fire is waiting for its first story</h3><p>Share a tale or follow Bug to bring your community together.</p></section>}</>;
}
const url=import.meta.env.VITE_CONVEX_URL,host=typeof document!=='undefined'?document.getElementById('chroniclesRoot'):null;
const root=host?(import.meta.hot?.data.chronicleRoot||createRoot(host)):null;
if(import.meta.hot&&root)import.meta.hot.data.chronicleRoot=root;
root?.render(url?<ConvexAuthProvider client={new ConvexReactClient(url)}><App/></ConvexAuthProvider>:<p>Around the Fire is temporarily unavailable.</p>);
