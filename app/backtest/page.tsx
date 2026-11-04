"use client";
import {useEffect,useState} from "react";
type Trade={side:string;entry:number;stop:number;target:number;entryAt:string;exitAt:string;exit:number;result:string;r:number};
type Summary={trades:number;wins:number;winRatePct:number|null;totalR:number;averageR:number|null;maxDrawdownR:number};
type Report={dataQuality?:{gapsOver15Minutes:number;gapCrossingTrades:number;gapExcluded:Summary;gapAffected:Summary;note:string};riskDiagnostics?:{maxConsecutiveLosingTrades:number;equityCurve:{time:string;cumulativeR:number}[]};diagnostics?:{exits:{STOP:Summary;TARGET:Summary;TIME:Summary};payoff:{averageWinnerR:number|null;averageLoserR:number|null;breakEvenRoundTripCostR:number|null};directional:{BUY:Summary;SELL:Summary};chronological:{earlier70Pct:Summary;later30Pct:Summary;cutoff:string;warning:string};costSensitivity:{assumedRoundTripCostR:number;totalNetR:number;averageNetR:number|null}[];costWarning:string};status:string;symbol?:string;asset?:string;source?:string;sample?:{candles:number;first:string;last:string};strategy?:string;results?:{trades:number;wins:number;losses:number;winRatePct:number|null;totalR:number;averageR:number|null;maxDrawdownR:number};trades?:Trade[];limitations?:string;error?:string;whaleFilterApplied?:boolean;transactionCostsIncluded?:boolean};
export default function BacktestPage(){
 const [report,setReport]=useState<Report|null>(null),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 useEffect(()=>{let active=true;fetch("/api/historical-backtest",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error??"Backtest unavailable");return j;}).then(j=>{if(active)setReport(j);}).catch(e=>{if(active)setReport({status:"UNAVAILABLE",error:String(e)});}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[refresh]);
 const metrics=report?.results;
 return <main style={{maxWidth:1050,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/opportunities">← Opportunity Board</a><h1>Historical Gold Strategy Test</h1>
 <p><strong>Research only.</strong> Gold futures GC=F is not Octa spot XAU/USD. These are hypothetical historical results, not executable trade signals.</p>
 <button onClick={()=>{setLoading(true);setReport(null);setRefresh(x=>x+1);}}>Run test again</button>
 <section style={{border:"1px solid #64748b",borderRadius:12,padding:18,margin:"18px 0"}}>
 <h2>{loading?"Running historical test…":report?.status??"No results"}</h2>
 {report?.error&&<p>Data unavailable: {report.error}</p>}
 <p>{report?.strategy??"Awaiting historical data"}</p>
 {report?.sample&&<p>Sample: {report.sample.candles} candles · {report.sample.first} to {report.sample.last}</p>}
 </section>
 {metrics&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12}}>
 {([["Trades",metrics.trades],["Win rate",metrics.winRatePct===null?"—":metrics.winRatePct+"%"],["Total R",metrics.totalR],["Average R",metrics.averageR??"—"],["Max drawdown R",metrics.maxDrawdownR]] as [string,string|number][]).map(([name,value])=><section key={name} style={{border:"1px solid #64748b",borderRadius:10,padding:14}}><div style={{fontSize:13}}>{name}</div><strong style={{fontSize:23}}>{value}</strong></section>)}
 </div>}
 {report?.diagnostics&&<section style={{marginTop:24}}>
 <h2>BUY vs SELL performance</h2>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}>
 {(["BUY","SELL"] as const).map(side=>{const d=report.diagnostics!.directional[side];return <div key={side} style={{border:"1px solid #64748b",padding:14,borderRadius:10}}><strong>{side}</strong><p>{d.trades} trades · {d.winRatePct??"—"}% wins</p><p>Total {d.totalR}R · Drawdown {d.maxDrawdownR}R</p></div>;})}
 </div>
 <h2>Why trades closed</h2>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
 {(["STOP","TARGET","TIME"] as const).map(reason=>{const d=report.diagnostics!.exits[reason];return <div key={reason} style={{border:"1px solid #64748b",padding:14,borderRadius:10}}><strong>{reason}</strong><p>{d.trades} trades</p><p>{d.totalR}R combined</p></div>;})}
 </div>
 <p>Average winning trade: {report.diagnostics.payoff.averageWinnerR??"—"}R · Average losing trade: {report.diagnostics.payoff.averageLoserR??"—"}R</p>
 <p>Gross average per trade available to cover round-trip costs: {report.diagnostics.payoff.breakEvenRoundTripCostR??"—"}R. A negative figure means the strategy loses before costs.</p>
 <h2>Earlier vs later sample</h2><p>Cutoff: {report.diagnostics.chronological.cutoff}</p>
 <p>Earlier 70%: {report.diagnostics.chronological.earlier70Pct.trades} trades, {report.diagnostics.chronological.earlier70Pct.totalR}R</p>
 <p>Later 30%: {report.diagnostics.chronological.later30Pct.trades} trades, {report.diagnostics.chronological.later30Pct.totalR}R</p>
 <p><strong>{report.diagnostics.chronological.warning}</strong></p>
 <h2>Hypothetical trading-cost sensitivity</h2>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"left"}}><thead><tr><th>Round-trip cost (R)</th><th>Net total (R)</th><th>Net average (R)</th></tr></thead><tbody>
 {report.diagnostics.costSensitivity.map(c=><tr key={c.assumedRoundTripCostR}><td>{c.assumedRoundTripCostR}</td><td>{c.totalNetR}</td><td>{c.averageNetR??"—"}</td></tr>)}
 </tbody></table></div><p>{report.diagnostics.costWarning}</p>
 </section>}
 {report?.riskDiagnostics&&<section style={{marginTop:24}}>
 <h2>Equity curve (cumulative R, before costs)</h2>
 <div style={{border:"1px solid #64748b",borderRadius:12,padding:12,overflow:"hidden"}}>
 {(()=>{const pts=report.riskDiagnostics!.equityCurve;const values=pts.map(p=>p.cumulativeR);const low=Math.min(0,...values),high=Math.max(0,...values),range=high-low||1;
 const poly=pts.map((p,i)=>((i/Math.max(pts.length-1,1))*1000).toFixed(2)+","+((high-p.cumulativeR)/range*190+10).toFixed(2)).join(" ");
 const zeroY=(high/range*190+10).toFixed(2);
 return <svg viewBox="0 0 1000 210" role="img" aria-label="Historical cumulative risk units across completed trades" style={{width:"100%",height:"auto"}}>
 <line x1="0" y1={zeroY} x2="1000" y2={zeroY} stroke="#64748b" strokeDasharray="8 6"/>
 <polyline points={poly} fill="none" stroke="#38bdf8" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
 </svg>;})()}
 <p>Longest losing streak: <strong>{report.riskDiagnostics.maxConsecutiveLosingTrades} trades</strong></p>
 </div></section>}
 {report?.dataQuality&&<section style={{marginTop:20}}><h2>Historical data gaps</h2>
 <p>Gaps longer than 15 minutes: <strong>{report.dataQuality.gapsOver15Minutes}</strong> · Simulated trades spanning gaps: <strong>{report.dataQuality.gapCrossingTrades}</strong></p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
 <div style={{border:"1px solid #64748b",borderRadius:10,padding:14}}><strong>Trades without detected gaps</strong><p>{report.dataQuality.gapExcluded.trades} trades · {report.dataQuality.gapExcluded.totalR}R</p><p>Win rate: {report.dataQuality.gapExcluded.winRatePct??"—"}%</p></div>
 <div style={{border:"1px solid #64748b",borderRadius:10,padding:14}}><strong>Gap-affected trades</strong><p>{report.dataQuality.gapAffected.trades} trades · {report.dataQuality.gapAffected.totalR}R</p><p>Win rate: {report.dataQuality.gapAffected.winRatePct??"—"}%</p></div>
 </div><p>{report.dataQuality.note}</p></section>}
 {metrics?.trades===0&&<p>No qualifying trades in this sample. This is not evidence of profitability or safety.</p>}
 {report?.trades&&report.trades.length>0&&<section style={{overflowX:"auto",marginTop:24}}><h2>All simulated trades</h2>
 <table style={{borderCollapse:"collapse",width:"100%",fontSize:13}}><thead><tr>{["Entry time","Side","Entry","Stop","Target","Exit","Result","R"].map(x=><th key={x} style={{padding:8,textAlign:"left",borderBottom:"1px solid #64748b"}}>{x}</th>)}</tr></thead>
 <tbody>{report.trades.map((t,i)=><tr key={i}>{[t.entryAt,t.side,t.entry,t.stop,t.target,t.exit,t.result,t.r.toFixed(2)].map((v,j)=><td key={j} style={{padding:8,borderBottom:"1px solid #64748b"}}>{v}</td>)}</tr>)}</tbody></table></section>}
 <h2>What is missing</h2><p>Whale filter: {report?.whaleFilterApplied?"Applied":"Not applied"} · Trading costs: {report?.transactionCostsIncluded?"Included":"Not included"}</p>
 <p>{report?.limitations??"No performance claims until historical data can be verified."}</p>
 <p><a href="/api/historical-backtest">Inspect raw results</a> · <a href="/paper-trade">Paper-trade tester</a></p>
 </main>;
}
