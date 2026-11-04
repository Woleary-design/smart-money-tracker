"use client";
import {useState} from "react";
const symbols=["XAU/USD","EUR/USD","GBP/USD","USD/JPY"];
type Paper={symbol:string;direction:"BUY"|"SELL";entry:number;stop:number;target:number;units:number;openedAt:string;status:"OPEN"|"STOP"|"TARGET"|"CLOSED";exit?:number};
export default function PaperTrade(){
 const [symbol,setSymbol]=useState("XAU/USD"),[direction,setDirection]=useState<"BUY"|"SELL">("BUY");
 const [entry,setEntry]=useState(""),[stop,setStop]=useState(""),[target,setTarget]=useState("");
 const [balance,setBalance]=useState("200"),[riskPct,setRiskPct]=useState("1"),[unitsPerLot,setUnitsPerLot]=useState("100"),[minLot,setMinLot]=useState("0.01");
 const [spread,setSpread]=useState("0"),[exit,setExit]=useState(""),[paper,setPaper]=useState<Paper|null>(null);
 const e=Number(entry),s=Number(stop),t=Number(target),b=Number(balance),risk=Number(riskPct),contract=Number(unitsPerLot),minimum=Number(minLot),cost=Number(spread);
 const numeric=[e,s,t,b,risk,contract,minimum,cost].every(Number.isFinite)&&e>0&&s>0&&t>0&&b>0&&risk>0&&risk<=2&&contract>0&&minimum>0&&cost>=0;
 const ordered=direction==="BUY"?s<e&&t>e:s>e&&t<e;
 const distance=Math.abs(e-s),reward=Math.abs(t-e);
 const rr=distance>0?(reward-cost)/(distance+cost):0;
 // For XAU/USD, USD P&L per unit is a simple approximation. For other FX pairs,
 // quote currency conversions are needed and therefore lot size is not calculated.
 const gold=symbol==="XAU/USD";
 const budget=b*risk/100;
 const minLoss=minimum*contract*(distance+cost);
 const suggestedLots=gold&&distance+cost>0?Math.floor(budget/((distance+cost)*contract*minimum))*minimum:0;
 const valid=numeric&&ordered&&rr>=1.5&&gold&&suggestedLots>=minimum&&Number.isFinite(suggestedLots);
 const current=Number(exit),currentValid=Number.isFinite(current)&&current>0;
 const signed=(x:number)=>direction==="BUY"?x-e:e-x;
 const realised=paper&&currentValid?(paper.direction==="BUY"?current-paper.entry:paper.entry-current)*paper.units:null;
 return <main style={{maxWidth:850,margin:"35px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/opportunities">← Trade Opportunity Board</a><h1>Paper trade tester</h1>
 <p>Practice a trade using prices you verify in TradingView and Octa. This tool does not connect to a broker, retrieve live quotes or execute an order.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
 <label>Instrument<select value={symbol} onChange={x=>setSymbol(x.target.value)} style={{display:"block",width:"100%",padding:9}}>{symbols.map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Direction<select value={direction} onChange={x=>setDirection(x.target.value as "BUY"|"SELL")} style={{display:"block",width:"100%",padding:9}}><option>BUY</option><option>SELL</option></select></label>
 {([["Entry",entry,setEntry],["Stop loss",stop,setStop],["Take profit",target,setTarget],["Account USD",balance,setBalance],["Risk % (max 2)",riskPct,setRiskPct],["Contract units per lot",unitsPerLot,setUnitsPerLot],["Minimum lot",minLot,setMinLot],["Estimated spread in price units",spread,setSpread]] as const).map(([label,value,set])=><label key={label}>{label}<input type="number" step="any" value={value} onChange={x=>set(x.target.value)} style={{display:"block",width:"100%",padding:9,boxSizing:"border-box"}}/></label>)}
 </div>
 <section style={{padding:18,border:"1px solid #64748b",borderRadius:12,margin:"20px 0"}}>
 <h2>Risk check</h2><p>Planned maximum risk: {Number.isFinite(budget)?"$"+budget.toFixed(2):"—"}</p>
 <p>Reward / risk after estimated spread: {numeric&&ordered&&Number.isFinite(rr)?rr.toFixed(2)+":1":"—"}</p>
 <p>Estimated minimum-lot loss: {numeric&&ordered&&gold?"$"+minLoss.toFixed(2):"—"}</p>
 <p>Estimated lot size: {valid?suggestedLots.toFixed(3):"Unavailable"}</p>
 <p><strong>{valid?"Eligible for paper testing only":"Cannot size this paper trade safely with current inputs"}</strong></p>
 <p style={{fontSize:13}}>For XAU/USD, P&L assumes USD per ounce and your entered contract units per lot. Confirm Octa's exact contract size, minimum volume, spread, commissions, stop distance and execution price. This calculator does not account for slippage or gaps. Other FX pairs need currency conversion and are disabled for sizing.</p>
 <button disabled={!valid||!!paper} onClick={()=>setPaper({symbol,direction,entry:e,stop:s,target:t,units:suggestedLots*contract,openedAt:new Date().toISOString(),status:"OPEN"})}>Open simulated trade</button>
 </section>
 {paper&&<section style={{padding:18,border:"1px solid #64748b",borderRadius:12}}>
 <h2>Simulated position — {paper.status}</h2>
 <p>{paper.symbol} {paper.direction} · Entry {paper.entry} · Stop {paper.stop} · Target {paper.target}</p>
 <p>Opened: {paper.openedAt}</p>
 <label>Observed exit / current price <input type="number" step="any" value={exit} onChange={x=>setExit(x.target.value)} style={{display:"block",padding:9}}/></label>
 <p>Illustrative gross P&L at entered price: {realised===null?"—":"$"+realised.toFixed(2)} (excludes costs)</p>
 <button disabled={!currentValid||paper.status!=="OPEN"} onClick={()=>setPaper({...paper,status:"CLOSED",exit:current})}>Close simulated trade at entered price</button>
 <button onClick={()=>{setPaper(null);setExit("");}} style={{marginLeft:10}}>Reset test</button>
 <p style={{fontSize:13}}>The simulator does not monitor live prices or automatically trigger stops/targets. Results are local to this page and are not saved after refresh.</p>
 </section>}
 <p><a href="/tradingview">Check TradingView charts</a> · <a href="/api/market-scan">Market scanner status</a></p>
 </main>;
}
