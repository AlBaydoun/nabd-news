import {parseHTML} from 'linkedom';

export type ArticleMedia={type:'image'|'video'|'embed';url:string;alt?:string;poster?:string};
// Media is loaded by the browser, never fetched through an unrestricted server proxy.
export function mediaUrl(raw:string,base:string){
 if(!raw.trim())return '';
 try{const u=new URL(raw.replace(/&amp;/g,'&'),base);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';if(u.protocol==='http:')u.protocol='https:';if(u.port||u.hostname==='localhost'||u.hostname.endsWith('.local')||/^[\d.]+$|:/.test(u.hostname))return '';return u.href}catch{return ''}
}
export function videoMedia(raw:string,base:string):ArticleMedia|null{
 const url=mediaUrl(raw,base);if(!url)return null;const u=new URL(url),host=u.hostname.replace(/^www\./,'');
 let id='';
 if(['youtube.com','m.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)){
  id=host==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1]||'';
  if(/^[\w-]{11}$/.test(id))return {type:'embed',url:'https://www.youtube-nocookie.com/embed/'+id};
 }
 if(['vimeo.com','player.vimeo.com'].includes(host)){
  id=u.pathname.match(/\/(?:video\/)?(\d+)(?:\/|$)/)?.[1]||'';
  if(id){const hash=u.searchParams.get('h')||u.pathname.match(/\/\d+\/([a-f0-9]+)/)?.[1];return {type:'embed',url:'https://player.vimeo.com/video/'+id+(hash&&/^[a-f0-9]+$/.test(hash)?'?h='+hash:'')}}
 }
 if(['dailymotion.com','geo.dailymotion.com','dai.ly'].includes(host)){
  id=host==='dai.ly'?u.pathname.slice(1):u.searchParams.get('video')||u.pathname.match(/\/(?:embed\/)?video\/([a-zA-Z0-9]+)/)?.[1]||'';
  if(/^[a-zA-Z0-9]+$/.test(id))return {type:'embed',url:'https://www.dailymotion.com/embed/video/'+id};
 }
 if(/\.(mp4|webm|ogv)$/i.test(u.pathname))return {type:'video',url};
 return null;
}
export function extractMedia(html:string,base:string):ArticleMedia[]{
 const {document}=parseHTML(html);const items:ArticleMedia[]=[];
 const add=(item:ArticleMedia|null)=>{if(item&&!items.some(x=>x.url===item.url)&&items.filter(x=>x.type===item.type).length<8)items.push(item)};
 const image=(raw:string,alt='')=>{const url=mediaUrl(raw,base);if(url)add({type:'image',url,alt})};
 const root=document.querySelector('article')||document.querySelector('main')||document.body;
 for(const node of document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]'))image(node.getAttribute('content')||'');
 for(const node of root.querySelectorAll('img')){
  if(node.closest('nav,aside,footer,.related-posts,.related-articles'))continue;
  const width=Number(node.getAttribute('width')),height=Number(node.getAttribute('height'));
  if((width&&width<120)||(height&&height<80))continue;
  const src=node.getAttribute('data-src')||node.getAttribute('data-lazy-src')||node.getAttribute('src')||node.getAttribute('srcset')?.split(',')[0].trim().split(/\s+/)[0]||'';
  image(src,node.getAttribute('alt')||'');
 }
 for(const node of root.querySelectorAll('iframe,video,video source,a[href]')){
  if(node.closest('nav,aside,footer'))continue;
  const item=videoMedia(node.getAttribute('src')||node.getAttribute('data-src')||node.getAttribute('href')||'',base);
  if(item&&node.tagName==='VIDEO')item.poster=mediaUrl(node.getAttribute('poster')||'',base)||undefined;
  add(item);
 }
 for(const node of document.querySelectorAll('meta[property="og:video"],meta[property="og:video:url"],meta[property="og:video:secure_url"]'))add(videoMedia(node.getAttribute('content')||'',base));
 const walk=(value:unknown,depth=0)=>{
  if(depth>12||!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.slice(0,50).forEach(v=>walk(v,depth+1));return}
  const obj=value as Record<string,unknown>;
  if([obj['@type']].flat().includes('VideoObject'))for(const key of ['embedUrl','contentUrl'])if(typeof obj[key]==='string')add(videoMedia(obj[key],base));
  Object.values(obj).forEach(v=>walk(v,depth+1));
 };
 for(const script of document.querySelectorAll('script[type="application/ld+json"]'))try{walk(JSON.parse(script.textContent||''))}catch{}
 return items;
}
