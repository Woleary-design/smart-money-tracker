export const dynamic="force-dynamic";
type Trade={wallet:string|null;side:string|null;estimatedNotional:number|null;timestamp:string|null;transactionHash:string|null};
type Item={market:{question?:string;conditionId?:string;url?:string|null};trades:Trade[];error?:string;source?:string};
type Feed={status:string;markets:Item[];scanned?:number;asOf?:string;error?:string;limitations?:string;reason?:string};
async function getFeed():Promise<Feed>{
 try{
  const origin=process.env.VERCEL_URL?"https://"+process.env.VERCEL_URL:"http://localhost:3000";
  const response=await fetch(origin+"/api/gold-whales",{cache:"no-store",signal:AbortSignal.timeout(29000)});
  if(!response.ok)throw Error("Gold whale feed unavailable ("+response.status+")");
  return response.json();
 }catch(e){return {status:"unavailable",markets:[],error:e instanceof Error?e.message:"Unavailable"};}
}
export default async function GoldWhales(){
 const feed=await getFeed();
 return <main style={{maxWidth:980,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
  <a href="/">← Dashboard</a><h1>Gold-related whale activity</h1>
  <p>Read-only sampling of large public trades on Polymarket gold-related prediction contracts. This is <strong>not</strong> a view of institutional XAU/USD positions.</p>
  <p><strong>Spot-gold trade proposal: NO TRADE</strong> — prediction-market activity alone cannot justify an entry.</p>
  <p>Status: {feed.status} · Markets sampled: {feed.scanned??"unknown"} · Checked: {feed.asOf??"unknown"}</p>
  {feed.error&&<p role="alert">{feed.error}</p>}
  {feed.markets.map((m,i)=><section key={m.market.conditionId??i} style={{border:"1px solid #64748b",borderRadius:12,padding:18,margin:"16px 0"}}>
   <h2>{m.market.question}</h2>
   {m.market.url&&<p><a href={m.market.url} target="_blank" rel="noreferrer">Open source market</a></p>}
   {m.error?<p>Recent trade data unavailable: {m.error}</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"left"}}>
    <thead><tr><th>Wallet</th><th>Side</th><th>Est. notional</th><th>Time (UTC)</th></tr></thead>
    <tbody>{m.trades.map((t,j)=><tr key={(t.transactionHash??"")+"-"+j}>
     <td style={{padding:"10px 6px"}}>{t.wallet?.slice(0,10)??"Unknown"}…</td>
     <td>{t.side}</td><td>{t.estimatedNotional==null?"—":"$"+t.estimatedNotional.toLocaleString("en-US")}</td>
     <td>{t.timestamp??"Unknown"}</td>
    </tr>)}</tbody>
   </table>{!m.trades.length&&<p>No usable recent trades in the sample.</p>}</div>}
   {m.source&&<p><a href={m.source} target="_blank" rel="noreferrer">Raw source data</a></p>}
  </section>)}
  {!feed.markets.length&&<p>No relevant gold contracts discovered in the sampled markets.</p>}
  <p>{feed.limitations}</p><p>{feed.reason}</p>
 </main>;
}
