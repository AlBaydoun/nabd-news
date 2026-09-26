import {test} from 'node:test';
import assert from 'node:assert/strict';
import {curated} from '../lib/news-data.ts';
import {matchesEditionText,storyMatchesEdition} from '../lib/language-editions.ts';
test('English references and German residence guide stay in their own editions',()=>{
 assert.deepEqual(curated('ar'),[]);assert.deepEqual(curated('ru'),[]);
 assert.ok(curated('en').length===4&&curated('en').every(s=>s.sourceLanguage==='en'));
 assert.ok(curated('de').length===1&&curated('de')[0].id==='section24');
});
test('legacy translated saves cannot reintroduce an English story in Arabic',()=>{
 const story={...curated('en')[0],title:'خبر عن اكتشاف علمي جديد',translated:true,edition:'ar'};
 assert.equal(storyMatchesEdition(story,'ar'),false);
 assert.equal(storyMatchesEdition(curated('en')[0],'de'),false);
 assert.equal(storyMatchesEdition(curated('en')[0],'en'),true);
});
test('wrong-script news is filtered but native headlines can include product names',()=>{
 assert.equal(matchesEditionText('English science headline','ar'),false);
 assert.equal(matchesEditionText('Новые открытия в науке','de'),false);
 assert.equal(matchesEditionText('جوجل تطلق أداة جديدة للذكاء الاصطناعي AI','ar'),true);
 assert.equal(matchesEditionText('Новая модель OpenAI для науки','ru'),true);
});
