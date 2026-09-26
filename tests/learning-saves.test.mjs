import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {curated} from '../lib/news-data.ts';
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='./news-data'&&context.parentURL?.endsWith('/lib/learning-data.ts'))return nextResolve(new URL('./news-data.ts',context.parentURL).href,context);
 return nextResolve(specifier,context);
}});
const {preparedVersions,mergeLearningSaves}=await import('../lib/learning-data.ts');
test('each reference story has four versions of the same article',()=>{
 for(const story of curated('en')){
  const versions=preparedVersions(story);
  assert.deepEqual(Object.keys(versions).sort(),['ar','de','en','ru']);
  for(const language of ['ar','en','ru','de'])assert.equal(versions[language].title,curated(language,true).find(s=>s.url===story.url).title);
 }
});
test('legacy bilingual saves merge by story and retain their translations on reload',()=>{
 const story={...curated('en')[0],id:'legacy',url:'https://example.com/legacy'};
 const input=[{key:'one',story,to:'de',translation:{title:'Deutsch',summary:'Text'}},{key:'two',story,to:'ru',translation:{title:'Русский',summary:'Текст'}}];
 const saved=mergeLearningSaves(input);
 assert.equal(saved.length,1);
 assert.equal(saved[0].versions.de.title,'Deutsch');
 assert.equal(saved[0].versions.ru.title,'Русский');
 assert.equal(saved[0].versions.en.title,story.title);
 assert.deepEqual(mergeLearningSaves(JSON.parse(JSON.stringify(saved))),saved);
});
