// MyMemory accepts a maximum of 500 UTF-8 bytes per segment.
export function translationSegments(text:string,maxBytes=480):string[]{
 const encoder=new TextEncoder(),parts:string[]=[];let part='';
 for(const word of text.split(/\s+/).filter(Boolean)){
  if(encoder.encode(part+(part?' ':'')+word).length<=maxBytes){part+=(part?' ':'')+word;continue}
  if(part){parts.push(part);part=''}
  for(const char of word){if(encoder.encode(part+char).length>maxBytes){parts.push(part);part=''}part+=char}
 }
 if(part)parts.push(part);return parts;
}
export async function translateText(text:string,from:string,to:string){
 const result:string[]=[];
 for(const q of translationSegments(text)){
  const response=await fetch('https://api.mymemory.translated.net/get?'+new URLSearchParams({q,langpair:from+'|'+to}),{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('translation-unavailable');
  const data=await response.json() as {responseStatus?:number;quotaFinished?:boolean;responseData?:{translatedText?:string}};
  if(data.quotaFinished||Number(data.responseStatus)!==200||!data.responseData?.translatedText)throw Error('translation-unavailable');
  result.push(data.responseData.translatedText);
 }
 return result.join(' ');
}
