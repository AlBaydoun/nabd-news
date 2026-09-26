import {Readability} from '@mozilla/readability';
import {parseHTML} from 'linkedom';
export type ArticleBlock={type:'paragraph'|'heading'|'list'|'quote';text:string};
export type ArticleResult={status:'ready'|'partial'|'unavailable';blocks:ArticleBlock[];title?:string;byline?:string;language?:string;direction?:'rtl'|'ltr';sourceUrl:string;origin?:'page'|'feed';words?:number;minutes?:number;reason?:'language-mismatch'|'restricted'|'blocked'|'not-found'|'no-article'|'unresolved'|'unsupported'|'network';};
const normalize=(s:string)=>s.replace(/\s+/g,' ').trim();
export function extractArticle(html:string,url:string,fallbackLanguage='en'):ArticleResult{
 const empty=(reason:ArticleResult['reason']):ArticleResult=>({status:'unavailable',blocks:[],sourceUrl:url,reason});
 const {document}=parseHTML(html);
 if(document.querySelector('parsererror'))return empty('no-article');
 const title=document.querySelector('title')?.textContent||'';
 if(/just a moment|access denied|checking your browser|verify you are human|attention required|captcha/i.test(title))return empty('blocked');
 for(const script of document.querySelectorAll('script[type="application/ld+json"]')){
  if(/"isAccessibleForFree"\s*:\s*(?:false|"false")/i.test(script.textContent||''))return empty('restricted');
 }
 if(document.querySelector('[data-paywall="true"], [data-testid="paywall"], .paywall-content, .piano-paywall'))return empty('restricted');
 const language=(document.documentElement.lang||fallbackLanguage).split(/[-_]/)[0].toLowerCase();
 document.querySelectorAll('script,style,iframe,form,button,nav,footer,aside,[hidden],[aria-hidden="true"],.related-posts,.related-articles,.newsletter,.share-buttons,.social-share,.advertisement,.ad-container').forEach(n=>n.remove());
 // Set a trusted base for Readability without fetching any page resources.
 const base=document.createElement('base');base.setAttribute('href',url);document.head.insertBefore(base,document.head.firstChild);
 const result=new Readability(document as unknown as Document,{charThreshold:200,keepClasses:false,maxElemsToParse:25000}).parse();
 if(!result?.content)return empty('no-article');
 const {document:body}=parseHTML('<html><body>'+result.content+'</body></html>');
 const blocks:ArticleBlock[]=[];
 const seen=new Set<string>();
 for(const node of body.querySelectorAll('h2,h3,h4,p,li,blockquote,pre')){
  if(node.querySelector('p,li,blockquote'))continue;
  const text=normalize(node.textContent||'');
  if(!text||seen.has(text))continue;
  if(/^(read more|related articles|share this|subscribe|advertisement|اقرأ أيضا|شارك|اشترك|weiterlesen|mehr zum thema|поделиться)$/i.test(text))continue;
  seen.add(text);
  blocks.push({type:/^H/.test(node.tagName)?'heading':node.tagName==='LI'?'list':node.tagName==='BLOCKQUOTE'?'quote':'paragraph',text});
 }
 const length=blocks.reduce((n,b)=>n+b.text.length,0);
 if(length<350||!blocks.some(b=>b.type==='paragraph'&&b.text.length>100)||length>120000)return empty('no-article');
 const words=blocks.reduce((n,b)=>n+b.text.split(/\s+/).length,0);
 return {status:'ready',blocks,title:result.title||undefined,byline:result.byline||undefined,language,direction:['ar','fa','he','ur'].includes(language)?'rtl':'ltr',sourceUrl:url,origin:'page',words,minutes:Math.max(1,Math.ceil(words/210))};
}
// A conservative allowlist prevents this reader endpoint from becoming an open proxy.
const domains=['nasa.gov','fda.gov','deepmind.google','deepmind.google.com','improbable.com','germany4ukraine.de','aitnews.com','tech-wd.com','aljazeera.net','news.mit.edu','bbc.com','bbc.co.uk','heise.de','nplus1.ru','annahar.com','mtv.com.lb','elnashra.com','naharnet.com','nna-leb.gov.lb','almodon.com','al-akhbar.com','lebanondebate.com','skynewsarabia.com','alarabiya.net','dw.com','tagesschau.de','bundesregierung.de','bamf.de','bmi.bund.de','euronews.com','science.org','nature.com','esa.int','reuters.com','apnews.com','afp.com','youm7.com','emaratalyoum.com','albayan.ae','alkhaleej.ae','aawsat.com','alaraby.co.uk','arab48.com','alghad.com','alghad.tv','lebanon24.com','lebanonon.com','libnanews.com','alkalimaonline.com','sawtbeirut.com','lbcgroup.tv','scinexx.de','spektrum.de','wissenschaft.de','golem.de','futurezone.at','sciencealert.com','phys.org','sciencedaily.com','livescience.com','space.com','scientificamerican.com','naked-science.ru','indicator.ru','elementy.ru','tass.ru','ria.ru','3dnews.ru','ixbt.com'];
export function allowedArticleUrl(raw:string,google=false){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;const host=u.hostname.toLowerCase();return domains.some(d=>host===d||host.endsWith('.'+d))||(google&&['news.google.com','consent.google.com'].includes(host))}catch{return false}}
export function legacyGoogleLink(url:string){try{const id=new URL(url).pathname.split('/').pop()||'';const decoded=atob(id.replace(/-/g,'+').replace(/_/g,'/'));const link=decoded.match(/https:\/\/[^\s\x00-\x20\x7f-\xff]+/g)?.find(u=>allowedArticleUrl(u));return link||null}catch{return null}}
export async function fetchArticlePage(raw:string,fetcher:typeof fetch=fetch):Promise<{html:string;url:string}> {
 let url=raw;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),14000);
 try{for(let i=0;i<5;i++){
  if(!allowedArticleUrl(url,true))throw Error('unsupported');
  const response=await fetcher(url,{redirect:'manual',signal:controller.signal,headers:{'User-Agent':'NABD/1.0 Article Reader','Accept':'text/html,application/xhtml+xml'}});
  if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)throw Error('network');url=new URL(location,url).href;continue}
  if([401,402,403,429].includes(response.status))throw Error('blocked');
  if(response.status===404)throw Error('not-found');if(!response.ok)throw Error('network');
  if(!/text\/html|application\/xhtml/i.test(response.headers.get('content-type')||''))throw Error('no-article');
  if(Number(response.headers.get('content-length'))>3000000)throw Error('no-article');
  const reader=response.body?.getReader();if(!reader)throw Error('no-article');
  const decoder=new TextDecoder();let html='',bytes=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>3000000){await reader.cancel();throw Error('no-article')}html+=decoder.decode(value,{stream:true})}html+=decoder.decode()}finally{reader.releaseLock()}
  return {html,url};
 }throw Error('network')}finally{clearTimeout(timer)}
}
