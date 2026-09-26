import {test} from 'node:test';
import assert from 'node:assert/strict';
import {translationSegments} from '../lib/translation.ts';
import {curated} from '../lib/news-data.ts';
test('translation chunks preserve multilingual text inside the provider byte limit',()=>{
 for(const text of ['خبر علمي جديد يساعدنا على فهم الفضاء '.repeat(40),'Новые научные открытия '.repeat(50),'Neue Erkenntnisse über die Erde '.repeat(50)]){
  const chunks=translationSegments(text);
  assert.ok(chunks.every(c=>new TextEncoder().encode(c).length<=480));
  assert.equal(chunks.join(' '),text.trim());
 }
});
test('learning translations are opt-in and do not leak into native editions',()=>{
 assert.equal(curated('ar').length,0);
 assert.equal(curated('ar',true).length,4);
 assert.ok(curated('ar',true).every(s=>s.translated&&s.sourceLanguage==='en'));
});
