"use client";
import {useEffect,useRef,useState} from "react";
const symbols=[["Gold · XAU/USD","OANDA:XAUUSD"],["EUR/USD","OANDA:EURUSD"],["GBP/USD","OANDA:GBPUSD"],["USD/JPY","OANDA:USDJPY"]] as const;
export default function TradingViewPage(){
 const [selected,setSelected]=useState<string>(symbols[0][1]);
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!host.current)return;
  const root=host.current;root.replaceChildren();
  const outer=document.createElement("div");outer.className="tradingview-widget-container";outer.style.height="100%";outer.style.width="100%";
  const chart=document.createElement("div");chart.className="tradingview-widget-container__widget";chart.style.height="calc(100% - 32px)";chart.style.width="100%";
  outer.appendChild(chart);
  const script=document.createElement("script");script.src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";script.type="text/javascript";script.async=true;
  script.text=JSON.stringify({autosize:true,symbol:selected,interval:"15",timezone:"Etc/UTC",theme:"dark",style:"1",locale:"en",allow_symbol_change:true,calendar:false,hide_side_toolbar:false,support_host:"https://www.tradingview.com"});
  outer.appendChild(script);root.appendChild(outer);
  return ()=>{root.replaceChildren();};
 },[selected]);
 return <main style={{maxWidth:1200,margin:"24px auto",padding:"0 16px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/">← Dashboard</a><h1>TradingView market charts</h1>
 <p>TradingView-sourced charting for gold and forex. Prices may be delayed, unavailable or differ from Octa executable bid/ask quotes. The chart is for research, not an executable quote.</p>
 <nav aria-label="Market symbols" style={{display:"flex",gap:10,flexWrap:"wrap",margin:"20px 0"}}>
 {symbols.map(([label,symbol])=><button key={symbol} onClick={()=>setSelected(symbol)} aria-pressed={selected===symbol} style={{padding:"10px 14px",borderRadius:8,border:"1px solid #64748b",background:selected===symbol?"#164e63":"transparent",color:"inherit",cursor:"pointer"}}>{label}</button>)}
 </nav>
 <div ref={host} style={{height:"min(74vh,740px)",minHeight:480,background:"#131722",borderRadius:12,overflow:"hidden"}} aria-label="TradingView advanced chart"/>
 <p>Chart provider: TradingView widget. Symbol feed: OANDA (not Octa). Availability and delay depend on TradingView and exchange/data-provider permissions.</p>
 <p><strong>Important:</strong> embedded charts do not supply programmatic OHLC data to our trade-scoring engine. Signals must arrive through a separately authorised price feed or configured TradingView webhook alerts. No automatic trading is enabled.</p>
 <p><a href="/opportunities">View trade opportunities</a></p>
 </main>;
}
