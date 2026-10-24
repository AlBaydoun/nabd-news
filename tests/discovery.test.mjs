import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deduplicateStories,withinDays,matchingText} from '../lib/discovery.ts';
import {backupSchema,mergeLibrary} from '../lib/library-backup.ts';
const story={id:'1',title:'A new discovery about the ocean and our planet',summary:'Details',source:'NASA',sourceLanguage:'en',category:'earth',url:'https://science.nasa.gov/story/',date:'2026-10-24T10:00:00Z',evidence:'unreviewed'};
test('duplicate tracking URLs and syndicated duplicates within a source collapse without losing other perspectives',()=>{
 const stories=[story,{...story,id:'2',url:story.url+'?utm_source=rss#top'},{...story,id:'3',url:'https://science.nasa.gov/other/'},{...story,id:'4',source:'BBC',url:'https://bbc.com/science/new'}];
 assert.deepEqual(deduplicateStories(stories).map(s=>s.id),['1','4']);
});
test('date windows exclude unknown and future dates while all-time retains reference articles',()=>{
 const now=Date.parse('2026-10-24T12:00:00Z');assert.equal(withinDays(story,1,now),true);assert.equal(withinDays({...story,date:''},1,now),false);assert.equal(withinDays({...story,date:'2026-10-25'},7,now),false);assert.equal(withinDays({...story,date:'2023-01-01'},0,now),true);
});
test('search handles Arabic diacritics, Latin accents and multiple terms',()=>{
 assert.equal(matchingText('أَبْحَاث جديدة في الفضاء','ابحاث فضاء'),true);assert.equal(matchingText('Neue Ideen für die Zukunft','fur zukunft'),true);assert.equal(matchingText('NASA space','space health'),false);
});
const empty=()=>backupSchema.parse({format:'nabd-library',version:1,createdAt:'2026-10-24',preferences:{},learning:[],vocabulary:[]});
test('backup merges stories and translations, preserving existing settings and vocabulary notes',()=>{
 const current=empty(),incoming=empty();current.preferences.theme='light';current.preferences.disabled=['space'];incoming.preferences.saved=['1'];incoming.preferences.savedStories=[story];incoming.preferences.theme='dark';
 current.learning=[{key:story.url,story,versions:{en:{title:'Original',summary:'Text'}}}];incoming.learning=[{key:story.url,story,versions:{ar:{title:'ترجمة',summary:'نص'}}}];
 current.vocabulary=[{id:'one',word:'Orbit',meaning:'my definition',language:'en',mastered:true}];incoming.vocabulary=[{id:'two',word:'orbit',meaning:'other definition',language:'en',mastered:false}];
 const result=mergeLibrary(current,incoming);assert.equal(result.preferences.theme,'light');assert.deepEqual(result.preferences.disabled,['space']);assert.equal(result.preferences.savedStories.length,1);assert.equal(result.learning.length,1);assert.ok(result.learning[0].versions.en&&result.learning[0].versions.ar);assert.equal(result.vocabulary.length,1);assert.equal(result.vocabulary[0].meaning,'my definition');assert.deepEqual(mergeLibrary(result,incoming),result);
});
test('backup rejects unsafe links, oversized entries and wrong file formats',()=>{
 for(const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.equal(backupSchema.safeParse({...empty(),preferences:{savedStories:[{...story,url}]}}).success,false);
 assert.equal(backupSchema.safeParse({...empty(),format:'another-app'}).success,false);assert.equal(backupSchema.safeParse({...empty(),vocabulary:[{id:'1',word:'a'.repeat(101),meaning:'word',language:'en',mastered:false}]}).success,false);
});
