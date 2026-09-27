'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
export default function StoryImage({src,alternatives=[],alt='',className='',fallback,priority=false,storyUrl,language='en'}:{src?:string;alternatives?:string[];alt?:string;className?:string;fallback?:ReactNode;priority?:boolean;storyUrl?:string;language?:string}){
 const [failed,setFailed]=useState<string[]>([]);
 const [recovered,setRecovered]=useState<string[]>([]);
 const container=useRef<HTMLDivElement>(null);
 const attempted=useRef('');
 const candidates=[src,...alternatives,...recovered].filter((s):s is string=>!!s&&!failed.includes(s));
 const current=candidates[0];
 useEffect(()=>{
  if(current||!storyUrl||attempted.current===storyUrl)return;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const recover=async(attempt=0)=>{try{
   const response=await fetch('/api/article?'+new URLSearchParams({url:storyUrl,lang:language}),{signal:controller.signal});
   if(response.status===503&&attempt<2){timer=setTimeout(()=>recover(attempt+1),1500*(attempt+1));return}
   if(!response.ok)return;
   const data=await response.json();if(!controller.signal.aborted)setRecovered((data.media||[]).filter((m:{type:string})=>m.type==='image').map((m:{url:string})=>m.url));
  }catch{/* The labeled fallback remains visible when the publisher cannot be reached. */}};
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();attempted.current=storyUrl;void recover()}},{rootMargin:'100px'});
  if(container.current)observer.observe(container.current);
  return()=>{observer.disconnect();controller.abort();clearTimeout(timer)};
 },[current,storyUrl,language]);
 return <div ref={container} className={'story-image '+className}>{current?<img key={current} src={current} alt={alt} loading={priority?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(p=>[...p,current])}/>:<div className="image-fallback">{fallback||<span aria-hidden="true">NABD · نبض</span>}</div>}</div>;
}
