import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {test,expect,beforeEach,vi} from 'vitest';
const state=vi.hoisted(()=>({authenticated:false,profile:null,account:{email:'synthetic@test.example',verified:true}}));
vi.mock('convex/react',()=>({ConvexReactClient:class{},useConvexAuth:()=>({isAuthenticated:state.authenticated,isLoading:false}),useQuery:(reference,args)=>{
 if(args==='skip')return undefined;
 switch(reference[Symbol.for('functionName')]){case 'profiles:mine':return state.profile;case 'accountSettings:mine':return state.account;case 'chronicles:following':return {handles:[],allowFollowers:true};case 'chronicles:eligibility':return state.authenticated&&state.profile?.reviewStatus==='approved';case 'bazaar:list':return {rows:[],next:null};case 'guilds:list':return [];case 'campfire:page':return {posts:[],next:null};default:return [];}
},useMutation:()=>vi.fn(),useAction:()=>vi.fn(),useConvex:()=>({})}));
vi.mock('@convex-dev/auth/react',()=>({ConvexAuthProvider:({children})=>children,useAuthActions:()=>({signIn:vi.fn(),signOut:vi.fn()})}));
beforeEach(()=>{state.authenticated=false;state.profile=null;state.account={email:'synthetic@test.example',verified:true};vi.stubGlobal('window',{location:new URL('https://smsheets.com'),smAppearance:{getPreference:()=> 'auto'}});vi.stubGlobal('location',new URL('https://smsheets.com/chronicles'));vi.stubGlobal('document',{getElementById:()=>null});});
test('settings keep appearance available for guests and gate private account controls',async()=>{
 const {SettingsPage}=await import('../settings-page.jsx');const html=renderToStaticMarkup(<SettingsPage/>);expect(html).toContain('Follow device');expect(html).toContain('Sign in for account settings');expect(html).not.toContain('Delete my profile');expect(html).not.toContain('Current password');
});
test('pending settings cannot create duplicate review requests and require exact-handle deletion',async()=>{
 state.authenticated=true;state.profile={handle:'ember',reviewStatus:'pending'};const {SettingsPage}=await import('../settings-page.jsx');const html=renderToStaticMarkup(<SettingsPage/>);expect(html).toContain('Awaiting review');expect(html).not.toContain('>Request profile review</button>');expect(html).toContain('Type @ember');expect(html).toMatch(/disabled="">Delete my profile/);expect(html).toContain('characters, campaigns, and private journals remain');
});
test('rejected members can accept community rules and request another review from Settings',async()=>{
 state.authenticated=true;state.profile={handle:'ember',reviewStatus:'rejected',reviewNote:'Credit your art.'};const {SettingsPage}=await import('../settings-page.jsx');const html=renderToStaticMarkup(<SettingsPage/>);expect(html).toContain('Credit your art.');expect(html).toMatch(/disabled="">Request profile review/);expect(html).toContain('Edit my profile');
});
test('the fire retains its illustrated hero and has Guilds and Bazaar without a Following tab',async()=>{
 const {App}=await import('../chronicles.jsx');const html=renderToStaticMarkup(<App/>);expect(html).toContain('class="chron-art"');expect(html).toContain('One spark becomes a legend');expect(html).toContain('Stoke the Fire');expect(html).toContain('>Guilds</button>');expect(html).toContain('>Bazaar</button>');expect(html).not.toContain('>Following</button>');expect(html).toContain('five followed stories and one public discovery');
});
test('Bazaar and Guild pages show their categories and founding/privacy rules',async()=>{
 const {Bazaar}=await import('../bazaar.jsx'),{Guilds}=await import('../guilds.jsx');const bazaar=renderToStaticMarkup(<Bazaar/>),guilds=renderToStaticMarkup(<Guilds/>);for(const category of ['Custom Art','Game Master Hires','Campaigns','One Shots'])expect(bazaar).toContain(category);expect(bazaar).not.toContain('Publish ad');expect(guilds).toContain('four people accept');expect(guilds).toContain('all chat stays with members');expect(guilds).not.toContain('Send founding invitations');
});
