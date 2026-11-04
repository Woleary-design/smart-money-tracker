"use client";
import {useEffect,useState} from "react";
type Frame={status?:string;close?:number;rsi14?:number;atr14?:number;asOf?:string;patterns?:string[];error?:string};
type PaperSetup={status:string;side:string|null;entry:number|null;stop:number|null;target:number|null;rewardRisk:number|null;expiresAt:string|null;maxUnitsAt2UsdRisk:number|null;reason:string};
type Market={paperSetup?:PaperSetup;symbol:string;technicalBias:string;frames:Record<string,Frame>;status:string;reason:string;whaleConfirmation:string;newsClearance:string;brokerSpread:string};
type WhaleCheck={comparisons?:{symbol:string;whaleStatus:string;whaleAlignment:string;explanation:string;sampledPredictionMarketTrades:number}[];whaleFeedStatus?:string};
type Scan={status:string;decision:string;reason?:string;markets?:Market[];checkedAt?:string;warning?:string};
const strategies=[["XAU/USD","Trend continuation"],["XAU/USD","Support/resistance reversal"],["EUR/USD","Range breakout"],["GBP/USD","Trend pullback"],["USD/JPY","Momentum confirmation"]];
export default function Opportunities(){
 const [scan,setScan]=useState<Scan|null>(null),[whales,setWhales]=useState<WhaleCheck|null>(null),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 useEffect(()=>{let active=true;fetch("/api/market-scan",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||"Unavailable");return j;}).then(j=>{if(active)setScan(j);}).catch(e=>{if(active)setScan({status:"UNAVAILABLE",decision:"NO_VALIDATED_TRADES",reason:String(e)});}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[refresh]);
 useEffect(()=>{let active=true;fetch("/api/trade-whale-check",{cache:"no-store"}).then(r=>r.json()).then(j=>{if(active)setWhales(j);}).catch(()=>{});return()=>{active=false;};},[refresh]);
 return <main style={{maxWidth:1050,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/">← Dashboard</a><h1>Trade Opportunity Board</h1>
 <p>Independent gold and forex technical scans. TradingView charts are available separately; the scanner now attempts public historical candles automatically. Gold uses a futures proxy, not Octa spot prices.</p>
 <section style={{padding:18,border:"1px solid #64748b",borderRadius:12,marginBottom:22}}>
  <h2>{loading?"Checking market feeds…":scan?.decision??"NO VALIDATED TRADES"}</h2>
  <button type="button" onClick={()=>{setLoading(true);setRefresh(x=>x+1);}}>Refresh checks</button>
  <p>Data status: {scan?.status??"Loading"} · Last check: {scan?.checkedAt??"Not available"}</p>
  {scan?.reason&&<p>{scan.reason}</p>}
  <p>Whale feed status: {whales?.whaleFeedStatus??"UNAVAILABLE"} · No institutional spot flow is connected.</p>
  <p>Planned account risk: $2 per trade (1% of $200), subject to Octa contract sizes, spread and slippage.</p>
 </section>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
 {strategies.map(([symbol,strategy],i)=>{const m=scan?.markets?.find(x=>x.symbol===symbol);const frame=m?.frames?.["15min"];const w=whales?.comparisons?.find(x=>x.symbol===symbol);
 return <article key={i} style={{padding:18,border:"1px solid #64748b",borderRadius:12}}>
  <h2>{symbol}</h2><p><strong>{strategy}</strong></p>
  <p>Technical bias: <strong>{m?.technicalBias??"UNAVAILABLE"}</strong></p>
  <p>15m indicative closed-candle price: {typeof frame?.close==="number"?frame.close:"—"} · RSI: {typeof frame?.rsi14==="number"?frame.rsi14.toFixed(1):"—"}</p>
  <p>15m data: {frame?.error??frame?.asOf??"Unavailable"}</p><p>Candle patterns: {frame?.patterns?.join(", ")||"—"}</p>
  <p>Whale cross-check: <strong>{w?.whaleStatus??"UNAVAILABLE"}</strong> · Alignment: {w?.whaleAlignment??"UNKNOWN"}</p><p style={{fontSize:13}}>{w?.explanation??"Whale data is not yet verified"}</p><p>News: {m?.newsClearance??"UNAVAILABLE"}</p>
  <section style={{borderTop:"1px solid #64748b",marginTop:12,paddingTop:12}}>
  <strong>Hypothetical paper setup: {m?.paperSetup?.status??"UNAVAILABLE"}</strong>
  <p>Direction: {m?.paperSetup?.side??"WAIT"}</p>
  <p>Reference entry: {m?.paperSetup?.entry??"—"} · Stop: {m?.paperSetup?.stop??"—"} · Target: {m?.paperSetup?.target??"—"}</p>
  <p>Reward/risk: {m?.paperSetup?.rewardRisk??"—"} · Expiry: {m?.paperSetup?.expiresAt??"—"}</p>
  <p>Maximum hypothetical units at $2 risk: {m?.paperSetup?.maxUnitsAt2UsdRisk?.toFixed(4)??"—"} (not broker lots)</p>
  <p style={{fontSize:13}}>{m?.paperSetup?.reason??"No validated paper setup"}</p>
  <p style={{fontSize:12}}>Paper research only. No Octa bid/ask, contract size, spread, execution or whale confirmation. Never copy these prices directly into a live order.</p>
  </section>
  <p style={{fontSize:13,opacity:.8}}>{m?.reason??"Awaiting market feed configuration"}</p>
 </article>;})}
 </div>
 <p style={{marginTop:22}}>{scan?.warning??"Only validated evidence will be used to rank executable trade proposals."}</p>
 <p><a href="/api/trade-whale-check">Inspect whale cross-check</a> · <a href="/api/public-price?symbol=XAU%2FUSD">Check indicative gold quote</a> · <a href="/paper-trade">Test a paper trade</a> · <a href="/tradingview">Open TradingView charts</a> · <a href="/api/market-scan">Inspect scan data</a></p>
 </main>;
}
