import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractMedia,videoMedia,mediaUrl} from '../lib/media.ts';
import {feedImages} from '../lib/feed-images.ts';
import {extractArticle} from '../lib/article-extract.ts';
const base='https://www.nasa.gov/news/story/';
test('RSS keeps extensionless thumbnails, relative HTML images and alternate candidates',()=>{
 const images=feedImages({'media:group':{'media:thumbnail':{'@_url':'https://cdn.example.org/image?id=2'}},enclosure:{'@_url':'https://cdn.example.org/movie.mp4','@_type':'video/mp4'}},'<img data-src="/images/story.webp"><img src="https://cdn.example.org/image?id=2">',base);
 assert.deepEqual(images,['https://cdn.example.org/image?id=2','https://www.nasa.gov/images/story.webp']);
});
test('only recognized video providers become embeds; arbitrary iframe and script URLs are discarded',()=>{
 assert.equal(videoMedia('https://youtu.be/abcdefghijk?t=10',base)?.url,'https://www.youtube-nocookie.com/embed/abcdefghijk');
 assert.equal(videoMedia('https://www.youtube.com/shorts/abcdefghijk',base)?.type,'embed');
 assert.equal(videoMedia('https://vimeo.com/123456789/abc123',base)?.url,'https://player.vimeo.com/video/123456789?h=abc123');
 assert.equal(videoMedia('https://geo.dailymotion.com/player.html?video=x123abc',base)?.url,'https://www.dailymotion.com/embed/video/x123abc');
 assert.equal(videoMedia('/video/test.mp4?token=public',base)?.type,'video');
 for(const url of ['https://youtube.com.evil.test/embed/abcdefghijk','javascript:alert(1)','https://untrusted.example/player','https://127.0.0.1/movie.mp4'])assert.equal(videoMedia(url,base),null);
 assert.equal(mediaUrl('',base),'');assert.equal(mediaUrl('data:image/svg+xml,x',base),'');
});
test('extracts poster, lazy photos, structured videos and embeds without executing publisher HTML',()=>{
 const media=extractMedia('<html><head><meta property="og:image" content="/hero.jpg"><script type="application/ld+json">{"@type":"VideoObject","embedUrl":"https://youtube.com/watch?v=abcdefghijk"}</script></head><body><article><img data-src="/photo.webp" alt="The telescope"><iframe src="https://evil.test/player"></iframe><video src="/clip.webm" poster="/poster.jpg"></video></article></body></html>',base);
 assert.equal(media.filter(m=>m.type==='image').length,2);assert.equal(media.filter(m=>m.type==='embed').length,1);assert.equal(media.find(m=>m.type==='video').poster,'https://www.nasa.gov/poster.jpg');assert.ok(!JSON.stringify(media).includes('evil.test'));
});
test('video-only stories retain playable media without pretending to have complete text',()=>{
 const result=extractArticle('<html lang="en"><body><article><h1>Watch the launch</h1><iframe src="https://youtube.com/embed/abcdefghijk"></iframe></article></body></html>',base);
 assert.equal(result.status,'unavailable');assert.equal(result.media[0].type,'embed');
});
test('paywalls never expose extracted photos or videos',()=>{
 const result=extractArticle('<html><head><script type="application/ld+json">{"isAccessibleForFree":false}</script></head><body><article><iframe src="https://youtube.com/embed/abcdefghijk"></iframe></article></body></html>',base);
 assert.equal(result.reason,'restricted');assert.equal(result.media,undefined);
});
test('article reference links remain usable and unsafe hrefs are dropped',()=>{
 const text='This published research describes the observations and methods in detail. '.repeat(12);
 const r=extractArticle('<html><body><article><p>'+text+'<a href="/report.pdf">Read the report</a> and <a href="javascript:alert(1)">unsafe</a>.</p></article></body></html>',base);
 assert.equal(r.status,'ready');assert.ok(r.blocks[0].links.some(l=>l.url==='https://www.nasa.gov/report.pdf'));
 assert.ok(!r.blocks[0].links.some(l=>l.url?.startsWith('javascript:')));
});
