import {getEdition} from '@/lib/feed-service';
import {curated,type Lang} from '@/lib/news-data';
import {translateText} from '@/lib/translation';
export const dynamic='force-dynamic';
const cache=new Map<string,{title:string;summary:string}>();
let running=0;
export async function POST(request:Request){
 let input;try{input=await request.json()}catch{return Response.json({error:'Invalid request'},{status:400})}
 const {url,from,to}=input as {url:string;from:Lang;to:Lang};
 if(!['ar','en','ru','de'].includes(from)||!['ar','en','ru','de'].includes(to)||from===to||typeof url!=='string'||url.length>4000)return Response.json({error:'Invalid language pair'},{status:400});
 const key=from+':'+to+':'+url;if(cache.has(key))return Response.json(cache.get(key));
 if(running>=2)return Response.json({error:'Translation busy; try again shortly'},{status:503});
 running++;
 try{
  const story=curated(from).find(s=>s.url===url)||(await getEdition(from)).articles.find(s=>s.url===url);
  if(!story)return Response.json({error:'Story no longer in feed'},{status:404});
  const known=curated(to,true).find(s=>s.id===story.id);
  const result=known?{title:known.title,summary:known.summary}:{title:await translateText(story.title.slice(0,400),from,to),summary:await translateText(story.summary.slice(0,230),from,to)};
  if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(key,result);
  return Response.json(result);
 }catch{return Response.json({error:'Translation service unavailable or daily allowance reached'},{status:503})}finally{running--}
}
