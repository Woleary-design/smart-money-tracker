"use client";
import {useEffect,useState} from "react";
type Trader={rank?:number;user_id?:string;user_name?:string;pnl?:number|string;volume?:number|string};
type ResponseData={data?:Trader[]|Record<string,unknown>[];error?:string;fetchedAt?:string;warning?:string;source?:string};
export default function Whales(){
 const [period,setPeriod]=useState("week"),[category,setCategory]=useState("finance"),[wallet,setWallet]=useState("");
 const [selected,setSelected]=useState(""),[result,setResult]=useState<ResponseData|null>(null),[loading,setLoading]=useState(false);
 useEffect(()=>{
  let active=true;setLoading(true);setResult(null);
  const q=new URLSearchParams(selected?{wallet:selected}:{period,category});
  fetch("/api/whales?"+q.toString(),{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||"Feed unavailable");return j;})
  .then(j=>{if(active)setResult(j);}).catch(e=>{if(active)setResult({error:String(e)});}).finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[period,category,selected]);
 const money=(value:unknown)=>{const n=Number(value);return value==null||!Number.isFinite(n)?"—":n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});};
 return <main style={{maxWidth:1040,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
  <a href="/">← Dashboard</a><h1>Polymarket whale tracker</h1>
  <p>Public prediction-market trader research. This is a sentiment and wallet-discovery tool, not a spot-gold copy-trading service.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"20px 0"}}>
   <label>Period <select value={period} onChange={e=>{setSelected("");setPeriod(e.target.value);}}>{["day","week","month","all"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
   <label>Category <select value={category} onChange={e=>{setSelected("");setCategory(e.target.value);}}>{["finance","economics","crypto","overall"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
  </div>
  <form onSubmit={e=>{e.preventDefault();setSelected(wallet.trim());}} style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
   <input aria-label="Public wallet address" placeholder="Public wallet 0x…" value={wallet} onChange={e=>setWallet(e.target.value)} style={{flex:1,minWidth:260,padding:10}}/>
   <button type="submit">Inspect wallet</button>
   {selected&&<button type="button" onClick={()=>{setSelected("");setWallet("");}}>Back to leaderboard</button>}
  </form>
  {loading&&<p role="status">Loading public Polymarket data…</p>}
  {result?.error&&<p role="alert" style={{color:"#f87171"}}>Feed unavailable: {result.error}</p>}
  {result&&!result.error&&<>
   <p style={{fontSize:13,opacity:.75}}>Fetched: {result.fetchedAt??"Unknown"} · <a href={result.source} target="_blank" rel="noreferrer">Source API</a></p>
   {selected?<><h2>Public positions: {selected.slice(0,9)}…</h2>
    <p>Returned positions: {result.data?.length??0}. Positions may be paginated and do not represent a full audited trading history.</p>
    <pre style={{overflowX:"auto",background:"#172337",padding:16,borderRadius:12,fontSize:12}}>{JSON.stringify(result.data?.slice(0,10)??[],null,2)}</pre>
   </>:<><h2>Top traders — {category} / {period}</h2>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
     <thead><tr><th>Rank</th><th>Trader</th><th>Reported P&L</th><th>Volume*</th><th>Research</th></tr></thead>
     <tbody>{(result.data as Trader[]??[]).map((t,i)=><tr key={t.user_id??i} style={{borderTop:"1px solid #64748b"}}>
      <td style={{padding:"12px 6px"}}>{t.rank??i+1}</td><td>{t.user_name||t.user_id?.slice(0,12)||"Unknown"}</td>
      <td>{money(t.pnl)}</td><td>{t.volume==null?"—":String(t.volume)}</td>
      <td>{t.user_id&&/^0x[a-fA-F0-9]{40}$/.test(t.user_id)&&<button onClick={()=>{setWallet(t.user_id!);setSelected(t.user_id!);}}>View positions</button>}</td>
     </tr>)}</tbody>
    </table></div>
    <p style={{fontSize:12}}>*Volume units depend on Polymarket's API definition; not assumed to be USD.</p>
   </>}
   <p style={{padding:14,border:"1px solid #64748b",borderRadius:10}}>{result.warning}</p>
  </>}
  <p>Read-only. No automatic copying, wallet connection, or trade execution. Large prediction-market positions are not evidence of institutional gold purchases.</p>
 </main>;
}
