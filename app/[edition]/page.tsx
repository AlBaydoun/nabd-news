import News from '../news';
export default async function Page({params}:{params:Promise<{edition:string}>}){const {edition}=await params;return <News initialLang={['ar','en','ru','de'].includes(edition)?edition:'ar'}/>}
