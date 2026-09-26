import {matchesEditionText} from '@/lib/language-editions';
import {resolveGoogleArticle} from '@/lib/google-article';
import {curated,type Lang} from '@/lib/news-data';
import {getEdition,getFeedContent} from '@/lib/feed-service';
import {extractArticle,allowedArticleUrl,legacyGoogleLink,fetchArticlePage,type ArticleResult} from '@/lib/article-extract';
import {parseHTML} from 'linkedom';
export const dynamic='force-dynamic';
const cache=new Map<string,{time:number;result:ArticleResult}>();
const pending=new Map<string,Promise<ArticleResult>>();
async function read(url:string,lang:Lang):Promise<ArticleResult>{
 const feed=getFeedContent(url);
 let original=url;
 try{
  if(new URL(url).hostname==='news.google.com'){original=legacyGoogleLink(url)||await resolveGoogleArticle(url)||'';if(!original)throw Error('unresolved')}
  let page=await fetchArticlePage(original);
  if(new URL(page.url).hostname==='news.google.com'){
   const {document}=parseHTML(page.html);
   const publisher=feed?.publisherUrl?new URL(feed.publisherUrl).hostname.replace(/^www\./,''):'';
   const candidates=[...document.querySelectorAll('a[href],link[rel="canonical"],meta[property="og:url"]')].map(n=>n.getAttribute('href')||n.getAttribute('content')||'');
   const resolved=candidates.find(u=>{try{const p=new URL(u);return allowedArticleUrl(u)&&p.pathname!=='/'&&!!publisher&&(p.hostname===publisher||p.hostname.endsWith('.'+publisher))}catch{return false}});
   if(!resolved)throw Error('unresolved');
   page=await fetchArticlePage(resolved);
  }
  const result=extractArticle(page.html,page.url,feed?.lang||(['webb-life','alphagenome','casgevy','ig-nobel'].some(id=>curated(lang).some(s=>s.id===id&&s.url===url))?'en':lang));
  if(result.status==='ready'&&(result.language!==lang||!matchesEditionText(result.blocks.map(b=>b.text).join(' '),lang)))return {status:'unavailable',blocks:[],sourceUrl:result.sourceUrl,reason:'language-mismatch',language:result.language};
  if(result.status==='ready'||result.reason==='restricted')return result;
  throw Error(result.reason||'no-article');
 }catch(error){
  const reason=error instanceof Error?error.message:'network';
  // Never turn a blocked or paywalled page into an alleged complete article.
  if(feed?.html&&reason!=='restricted'){
   const result=extractArticle('<html lang="'+feed.lang+'"><body><article>'+feed.html+'</article></body></html>',url,feed.lang);
   if(result.status==='ready'&&result.language===lang&&matchesEditionText(result.blocks.map(b=>b.text).join(' '),lang))return {...result,status:'partial',origin:'feed'};
  }
  return {status:'unavailable',blocks:[],sourceUrl:url,reason:['blocked','restricted','not-found','no-article','unresolved','unsupported'].includes(reason)?reason as ArticleResult['reason']:'network'};
 }
}
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const url=params.get('url')||'';const lang=(params.get('lang')||'ar') as Lang;
 if(!['ar','en','ru','de'].includes(lang)||!allowedArticleUrl(url,true))return Response.json({status:'unavailable',blocks:[],sourceUrl:'',reason:'unsupported'} satisfies ArticleResult,{status:400});
 const key=lang+':'+url;const found=cache.get(key);if(found&&Date.now()-found.time<1800000)return Response.json(found.result);
 if(!curated(lang).some(s=>s.url===url)&&!getFeedContent(url))await getEdition(lang);
 // Direct publisher URLs are constrained above. Google links must be a current feed item.
 if(new URL(url).hostname==='news.google.com'&&!getFeedContent(url))return Response.json({status:'unavailable',blocks:[],sourceUrl:url,reason:'unresolved'} satisfies ArticleResult);
 let job=pending.get(key);if(!job&&pending.size>=3)return Response.json({status:'unavailable',blocks:[],sourceUrl:url,reason:'network'} satisfies ArticleResult,{status:503});if(!job){job=read(url,lang);pending.set(key,job)}
 const result=await job;pending.delete(key);
 if(result.status!=='unavailable'){if(cache.size>=50)cache.delete(cache.keys().next().value!);cache.set(key,{time:Date.now(),result})}
 return Response.json(result,{headers:{'Cache-Control':'private, max-age=300'}});
}
