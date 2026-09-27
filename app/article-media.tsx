'use client';
import {useState} from 'react';
import {Play,ExternalLink} from 'lucide-react';
import type {ArticleMedia} from '@/lib/media';
import {pick,type Lang} from '@/lib/news-data';
import StoryImage from './story-image';
function Player({media,lang,source}:{media:ArticleMedia;lang:Lang;source:string}){
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const t=(...v:string[])=>pick(v,lang);
 return <figure className="article-video"><div className="video-frame">{!playing?<button className="video-start" onClick={()=>setPlaying(true)}><Play size={36}/><span>{t('تشغيل الفيديو هنا','Play video here','Смотреть здесь','Video hier abspielen')}</span></button>:media.type==='embed'?<iframe src={media.url+(media.url.includes('?')?'&':'?')+'playsinline=1&autoplay=1'} title={t('فيديو المقال','Article video','Видео статьи','Artikelvideo')} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video controls autoPlay playsInline preload="metadata" poster={media.poster} onError={()=>setFailed(true)}><source src={media.url}/></video>}</div><figcaption>{failed?t('تعذّر تشغيل الفيديو.','Video could not play.','Не удалось воспроизвести видео.','Video konnte nicht abgespielt werden.'):t('إذا منع الناشر التشغيل هنا، يمكنك فتح المصدر.','If the publisher blocks playback here, open the source.','Если издатель запрещает просмотр здесь, откройте источник.','Falls der Anbieter die Wiedergabe hier sperrt, öffne die Quelle.')} <a href={source} target="_blank" rel="noopener noreferrer">{t('المصدر','Source','Источник','Quelle')}<ExternalLink size={13}/></a></figcaption></figure>;
}
export default function ArticleMediaGallery({media=[],lang,source,image}:{media?:ArticleMedia[];lang:Lang;source:string;image?:string}){
 const photos=media.filter(m=>m.type==='image'&&m.url!==image);
 const videos=media.filter(m=>m.type!=='image');
 return <div className="article-media">{(image||photos.length>0)&&<StoryImage src={photos[0]?.url||image} alternatives={[...photos.slice(1).map(m=>m.url),...(image?[image]:[])]} alt={photos[0]?.alt||''} className="reader-photo" priority/>}{videos.map(m=><Player key={m.url} media={m} lang={lang} source={source}/>)}</div>;
}
