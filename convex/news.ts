import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { publishAsBug } from './bug';
const games = ['Savage Worlds','Dungeons & Dragons 5e','Pathfinder 2e'];
const sources: Record<string,string[]> = {
  'Savage Worlds':['peginc.com','shop.peginc.com'],
  'Dungeons & Dragons 5e':['dndbeyond.com','dungeonsanddragons.com','dnd.wizards.com'],
  'Pathfinder 2e':['paizo.com'],
};
export const publishWeekly = internalMutation({
  args: { week: v.string(), items: v.array(v.object({ game:v.string(),title:v.string(),summary:v.string(),url:v.string(),publishedDate:v.optional(v.string()) })) },
  handler: async (ctx,a) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.week) || !Number.isFinite(Date.parse(a.week)) || a.items.length < 1 || a.items.length > 3 || new Set(a.items.map(i=>i.game)).size!==a.items.length) throw new Error('Publish at most one sourced roundup per game per week.');
    // Validate the entire roundup before creating any posts.
    for (const item of a.items) {
      if (!games.includes(item.game) || !item.title.trim() || item.title.length>100 || !item.summary.trim() || item.summary.length>1200 || item.url.length>500 || (item.publishedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedDate)||!Number.isFinite(Date.parse(item.publishedDate))))) throw new Error('Use a concise, dated publisher roundup.');
      const url=new URL(item.url),host=url.hostname.replace(/^www\./,'');
      if(url.protocol!=='https:'||url.username||url.password||!sources[item.game].includes(host)) throw new Error('Game news needs a link to the official publisher.');
    }
    const posts=[];
    for(const item of a.items){
      const key=`news-${a.week}-${games.indexOf(item.game)}`;
      const old=await ctx.db.query('chroniclePosts').withIndex('by_publication',q=>q.eq('publicationKey',key)).unique();
      if(old){posts.push(old._id);continue;}
      const body=`I've brought this week's ${item.game} spark to the fire.\n\n${item.summary.trim()}\n\n${item.publishedDate?'Publisher date: '+item.publishedDate+'\n':''}Source: ${item.url}\n\nBug's weekly roundup · week of ${a.week}`;
      posts.push(await publishAsBug(ctx,item.title,body,key,undefined,item.game,'Game news'));
    }
    return {week:a.week,posts};
  },
});
