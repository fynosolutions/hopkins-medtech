/** Exact legacy query matching; search takes precedence over category navigation. */
export function legacyDestination(input, map) {
 const url = new URL(input, 'http://www.hopkinsmedtech.com');
 const path = url.pathname.toLowerCase();
 const query = new Map([...url.searchParams].map(([k,v])=>[k.toLowerCase(),v]));
 if(path==='/news.aspx' && query.has('q')) return '/search?q='+encodeURIComponent(query.get('q'));
 const hit=map.find(row=>{
  const old=new URL(row.sourceUrl);
  return old.pathname.toLowerCase()===path && [...old.searchParams].every(([k,v])=>query.get(k.toLowerCase())===v);
 });
 if(!hit || path==='/')return null;
 const target=new URL(hit.targetRoute,'https://destination.invalid');
 for(const [k,v] of url.searchParams)if(!['classid','id'].includes(k.toLowerCase()))target.searchParams.append(k,v);
 return target.pathname+target.search;
}
