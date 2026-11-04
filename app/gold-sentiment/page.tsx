export const dynamic="force-dynamic";
type Market={id?:string;question?:string;url?:string|null;outcomes?:{label:string;probability:number|null}[];volume:number|null;liquidity:number|null};
type Result={status:string;markets:Market[];scanned?:number;sampled?:boolean;reason?:string;error?:string;fetchedAt?:string};
async function load():Promise<Result>{
 try{const origin=process.env.VERCEL_URL?"https://"+process.env.VERCEL_URL:"http://localhost:3000";
  const res=await fetch(origin+"/api/gold-sentiment",{cache:"no-store",signal:AbortSignal.timeout(28000)});
  if(!res.ok)throw Error("Data feed returned "+res.status);
  return res.json();
 }catch(e){return {status:"unavailable",markets:[],error:e instanceof Error?e.message:"Unavailable"};}
}
export default async function Page(){
 const result=await load();
 return <main style={{maxWidth:900,margin:"40px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
  <a href="/">← Dashboard</a><h1>Gold prediction-market sentiment</h1>
  <p>Discover gold-related prediction markets using Polymarket's public market catalogue. Market odds reflect event-contract pricing, not a direct XAU/USD long/short ratio.</p>
  <p><strong>Trading interpretation: NO TRADE SIGNAL</strong> — this feed alone cannot justify a spot-gold position.</p>
  <p>Markets sampled: {result.scanned??"Unknown"} · Relevant matches: {result.markets.length} · Status: {result.status}</p>
  {result.error&&<p role="alert">Data unavailable: {result.error}</p>}
  {result.markets.map((m,i)=><article key={m.id??i} style={{border:"1px solid #64748b",borderRadius:12,padding:18,marginBottom:14}}>
   <h2 style={{fontSize:19}}>{m.question}</h2>
   <p>{m.outcomes?.map(o=>o.label+": "+(o.probability===null?"N/A":(o.probability*100).toFixed(1)+"%")).join(" · ")}</p>
   <p>Reported volume: {m.volume??"Unknown"} · Liquidity: {m.liquidity??"Unknown"}</p>
   {m.url&&<a href={m.url} target="_blank" rel="noreferrer">View source market</a>}
  </article>)}
  {result.markets.length===0&&<p>No matching markets found in this sampled catalogue. This does not mean no gold markets exist.</p>}
  <p>Discovery is limited to a sample of active high-volume markets; no historical whale performance or market-to-gold correlation is implied.</p>
 </main>;
}
