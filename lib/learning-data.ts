import {curated,type Lang,type Story} from './news-data';
export const learningLanguages:Lang[]=['ar','en','ru','de'];
export type Versions=Partial<Record<Lang,{title:string;summary:string}>>;
export type LearningSave={key:string;story:Story;versions:Versions};
export function preparedVersions(story:Story):Versions {
 const versions:Versions={[story.sourceLanguage||'en']:{title:story.title,summary:story.summary}};
 for(const l of learningLanguages){const known=curated(l,true).find(s=>s.id===story.id&&s.url===story.url);if(known)versions[l]={title:known.title,summary:known.summary}}
 return versions;
}
export function mergeLearningSaves(input:unknown):LearningSave[]{
 if(!Array.isArray(input))return [];
 const result=new Map<string,LearningSave>();
 for(const old of input){if(!old?.story||typeof old.story.url!=='string'||typeof old.story.title!=='string')continue;
  const versions={...preparedVersions(old.story),...result.get(old.story.url)?.versions,...old.versions};
  if(learningLanguages.includes(old.to)&&old.translation?.title)versions[old.to as Lang]=old.translation;
  result.set(old.story.url,{key:old.story.url,story:old.story,versions});
 }
 return [...result.values()];
}
