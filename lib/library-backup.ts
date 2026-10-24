import {z} from 'zod';
const languages=z.enum(['ar','en','ru','de']);
const text=z.string().max(10000);
const safeUrl=z.string().max(5000).refine(value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}});
const story=z.object({id:text,title:text,summary:text,category:z.string().max(40),source:z.string().max(200),url:safeUrl,date:z.string().max(100),image:safeUrl.optional(),imageFallbacks:z.array(safeUrl).max(20).optional(),evidence:z.enum(['official','research','unreviewed']),sourceLanguage:languages.optional(),edition:languages.optional(),kind:text.optional(),credit:text.optional(),creditUrl:safeUrl.optional(),translated:z.boolean().optional()});
const version=z.object({title:text,summary:text});
const versions=z.object({ar:version.optional(),en:version.optional(),ru:version.optional(),de:version.optional()});
export const preferencesSchema=z.object({disabled:z.array(z.string().max(40)).max(50).default([]),read:z.array(text).max(20000).default([]),saved:z.array(text).max(5000).default([]),theme:z.enum(['dark','light']).default('dark'),motion:z.boolean().default(true),savedStories:z.array(story).max(5000).default([]),groups:z.array(z.object({name:z.string().max(40),topics:z.array(z.string().max(40)).max(50),enabled:z.boolean().optional()})).max(100).default([])});
const learning=z.array(z.object({key:text,story,versions})).max(2000);
const vocabulary=z.array(z.object({id:z.string().max(100),word:z.string().max(100),meaning:z.string().max(300),language:languages,mastered:z.boolean()})).max(1000);
export const backupSchema=z.object({format:z.literal('nabd-library'),version:z.literal(1),createdAt:z.string(),preferences:preferencesSchema,learning,vocabulary});
export type LibraryBackup=z.infer<typeof backupSchema>;
export function mergeLibrary(current:LibraryBackup,incoming:LibraryBackup):LibraryBackup{
 const p=current.preferences,q=incoming.preferences;
 const unique=<T,>(items:T[],key:(v:T)=>string)=>[...new Map(items.map(v=>[key(v),v])).values()];
 return backupSchema.parse({...current,preferences:{...p,read:[...new Set([...q.read,...p.read])],saved:[...new Set([...q.saved,...p.saved])],savedStories:unique([...q.savedStories,...p.savedStories],s=>s.id),groups:unique([...q.groups,...p.groups],g=>g.name)},learning:unique([...incoming.learning,...current.learning],s=>s.story.url).map(s=>{const imported=incoming.learning.find(x=>x.story.url===s.story.url);return {...s,versions:{...imported?.versions,...s.versions}}}),vocabulary:unique([...incoming.vocabulary,...current.vocabulary],v=>v.language+':'+v.word.toLowerCase())});
}
