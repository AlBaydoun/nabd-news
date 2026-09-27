import {extractMedia,mediaUrl} from './media.ts';

// RSS thumbnails commonly use extensionless CDN URLs, nested groups or relative paths.
export function feedImages(item:Record<string,any>,html:string,base:string):string[]{
 const result:string[]=[];
 const add=(raw:string)=>{const url=mediaUrl(raw,base);if(url&&!result.includes(url))result.push(url)};
 const visit=(value:any,kind:string)=>{
  if(Array.isArray(value)){value.forEach(v=>visit(v,kind));return}
  if(!value||typeof value!=='object')return;
  const type=String(value['@_type']||''),medium=value['@_medium'];
  const raw=value['@_url']||value['@_href']||'';
  if(raw&&!/video|audio/i.test(type)&&medium!=='video'&&medium!=='audio'&&(kind==='media:thumbnail'||kind==='media:content'&&!type||medium==='image'||type.startsWith('image/')||/\.(jpe?g|png|webp|avif|gif)(?:[?#]|$)/i.test(raw)))add(raw);
  for(const key of ['media:group','media:content','media:thumbnail'])visit(value[key],key);
 };
 for(const key of ['media:group','media:content','media:thumbnail','enclosure'])visit(item[key],key);
 extractMedia('<html><body><article>'+html+'</article></body></html>',base).filter(m=>m.type==='image').forEach(m=>add(m.url));
 return result.slice(0,5);
}
