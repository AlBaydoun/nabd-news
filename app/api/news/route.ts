import {getEdition} from '@/lib/feed-service';
import {type Lang} from '@/lib/news-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){const lang=(new URL(request.url).searchParams.get('lang')||'ar') as Lang;if(!['ar','en','ru','de'].includes(lang))return Response.json({error:'Unknown edition'},{status:400});return Response.json(await getEdition(lang,new URL(request.url).searchParams.get('refresh')==='1'),{headers:{'Cache-Control':'no-store'}})}
