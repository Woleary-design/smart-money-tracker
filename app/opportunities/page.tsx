"use client";
import {useEffect,useState} from "react";
type Frame={status?:string;close?:number;rsi14?:number;atr14?:number;asOf?:string;patterns?:string[];error?:string};
type Market={symbol:string;technicalBias:string;frames:Record<string,Frame>;status:string;reason:string;whaleConfirmation:string;newsClearance:string;brokerSpread:string};
type Scan={status:string;decision:string;reason?:string;markets?:Market[];checkedAt?:string;warning?:string};
const strategies=[["XAU/USD","Trend continuation"],["XAU/USD","Support/resistance reversal"],["EUR/USD","Range breakout"],["GBP/USD","Trend pullback"],["USD/JPY","Momentum confirmation"]];
export default function Opportunities(){
 const [scan,setScan]=useState<Scan|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;fetch("/api/market-scan",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||"Unavailable");return j;}).then(j=>{if(active)setScan(j);}).catch(e=>{if(active)setScan({status:"UNAVAILABLE",decision:"NO_VALIDATED_TRADES",reason:String(e)});}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 return <main style={{maxWidth:1050,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/">← Dashboard</a><h1>Trade Opportunity Board</h1>
 <p>Independent gold and forex technical scans. TradingView charts are available separately; the scanner now attempts public historical candles automatically. Gold uses a futures proxy, not Octa spot prices.</p>
 <section style={{padding:18,border:"1px solid #64748b",borderRadius:12,marginBottom:22}}>
  <h2>{loading?"Checking market feeds…":scan?.decision??"NO VALIDATED TRADES"}</h2>
  <p>Data status: {scan?.status??"Loading"} · Last check: {scan?.checkedAt??"Not available"}</p>
  {scan?.reason&&<p>{scan.reason}</p>}
  <p>Planned account risk: $2 per trade (1% of $200), subject to Octa contract sizes, spread and slippage.</p>
 </section>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
 {strategies.map(([symbol,strategy],i)=>{const m=scan?.markets?.find(x=>x.symbol===symbol);const frame=m?.frames?.["15min"];
 return <article key={i} style={{padding:18,border:"1px solid #64748b",borderRadius:12}}>
  <h2>{symbol}</h2><p><strong>{strategy}</strong></p>
  <p>Technical bias: <strong>{m?.technicalBias??"UNAVAILABLE"}</strong></p>
  <p>15m indicative closed-candle price: {typeof frame?.close==="number"?frame.close:"—"} · RSI: {typeof frame?.rsi14==="number"?frame.rsi14.toFixed(1):"—"}</p>
  <p>15m data: {frame?.error??frame?.asOf??"Unavailable"}</p><p>Candle patterns: {frame?.patterns?.join(", ")||"—"}</p>
  <p>Whales: {m?.whaleConfirmation??"UNAVAILABLE"} · News: {m?.newsClearance??"UNAVAILABLE"}</p>
  <p>Entry / stop / target: Not validated</p>
  <p style={{fontSize:13,opacity:.8}}>{m?.reason??"Awaiting market feed configuration"}</p>
 </article>;})}
 </div>
 <p style={{marginTop:22}}>{scan?.warning??"Only validated evidence will be used to rank executable trade proposals."}</p>
 <p><a href="/api/public-price?symbol=XAU%2FUSD">Check indicative gold quote</a> · <a href="/paper-trade">Test a paper trade</a> · <a href="/tradingview">Open TradingView charts</a> · <a href="/api/market-scan">Inspect scan data</a></p>
 </main>;
}
