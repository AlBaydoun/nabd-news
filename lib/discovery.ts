import type {Story} from './news-data.ts';

export function canonicalStoryUrl(value:string){
 try{const u=new URL(value);u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid|ref|source)$/i.test(key))u.searchParams.delete(key);u.searchParams.sort();return u.href.replace(/\/$/,'')}catch{return value}
}
export function deduplicateStories(stories:Story[]){
 const urls=new Set<string>(),titles=new Set<string>();
 return stories.filter(story=>{const url=canonicalStoryUrl(story.url);const title=story.title.normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu,' ').trim();const key=(story.sourceLanguage||'')+':'+story.source.toLowerCase()+':'+title;if(urls.has(url)||(title.length>25&&titles.has(key)))return false;urls.add(url);titles.add(key);return true});
}
export function withinDays(story:Story,days:number,now=Date.now()){
 if(!days)return true;const time=Date.parse(story.date);return Number.isFinite(time)&&time<=now&&time>=now-days*86400000;
}
export function matchingText(value:string,query:string){
 const normalize=(text:string)=>text.normalize('NFKD').replace(/\p{M}/gu,'').replace(/[أإآ]/g,'ا').toLocaleLowerCase();
 const text=normalize(value);return normalize(query).trim().split(/\s+/).every(word=>text.includes(word));
}
