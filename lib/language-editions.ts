import type {Lang,Story} from './news-data';

// Feed editions identify English/German; script checks catch mislabeled items.
// Publisher page language is checked separately before displaying article text.
export function matchesEditionText(text:string,lang:Lang):boolean {
 const ar=(text.match(/\p{Script=Arabic}/gu)||[]).length;
 const ru=(text.match(/\p{Script=Cyrillic}/gu)||[]).length;
 const latin=(text.match(/\p{Script=Latin}/gu)||[]).length;
 if(lang==='ar')return ar>0&&ar>ru&&ar>=latin*.4;
 if(lang==='ru')return ru>0&&ru>ar&&ru>=latin*.4;
 return latin>0&&latin>ar*2&&latin>ru*2;
}

export function storyMatchesEdition(story:Story & {edition?:Lang},lang:Lang):boolean {
 if(story.translated)return false;
 const source=story.sourceLanguage||story.edition;
 return source===lang&&matchesEditionText(story.title,lang);
}
