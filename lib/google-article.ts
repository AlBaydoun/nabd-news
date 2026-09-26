import {parseHTML} from 'linkedom';
import {allowedArticleUrl,fetchArticlePage} from './article-extract';
// Public Google News article-link lookup, as documented by the google_news_decoder
// project: https://github.com/dbernheisel/google_news_decoder . No CAPTCHA or rate-limit bypass.
export async function resolveGoogleArticle(url:string):Promise<string|null>{
 const page=await fetchArticlePage(url);
 if(new URL(page.url).hostname!=='news.google.com')return allowedArticleUrl(page.url)?page.url:null;
 const {document}=parseHTML(page.html);
 const params=document.querySelector('[data-n-a-sg][data-n-a-ts]');
 const signature=params?.getAttribute('data-n-a-sg'),timestamp=Number(params?.getAttribute('data-n-a-ts'));
 if(!signature||!timestamp)return null;
 const id=new URL(url).pathname.split('/').pop();
 const context=[['en-US','US',['FINANCE_TOP_INDICES','WEB_TEST_1_0_0'],null,null,1,1,'US:en',null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],'en-US','US',1,[2,3,4,8],1,0,'655000234',0,0,null,0];
 const payload=JSON.stringify([[['Fbv4je',JSON.stringify(['garturlreq',context,id,timestamp,signature]),null,'generic']]]);
 const response=await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(9000),headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams({'f.req':payload})});
 if(!response.ok)return null;
 const body=await response.text();if(body.length>1000000)return null;
 // The response is length-prefixed JSON records, not executable JavaScript.
 for(const line of body.split('\n')){try{const records=JSON.parse(line);if(!Array.isArray(records))continue;for(const record of records){if(!Array.isArray(record)||record[1]!=='Fbv4je'||typeof record[2]!=='string')continue;const result=JSON.parse(record[2]);if(result[0]==='garturlres'&&typeof result[1]==='string'&&allowedArticleUrl(result[1]))return result[1]}}catch{}}
 return null;
}
