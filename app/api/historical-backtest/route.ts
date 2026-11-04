import {NextResponse} from "next/server";
import {evaluateCandles} from "../../../lib/technicals";
import type {Candle} from "../../../lib/candles";
export const dynamic="force-dynamic";
type Trade={side:"BUY"|"SELL";entry:number;stop:number;target:number;entryAt:string;exitAt:string;exit:number;result:"STOP"|"TARGET"|"TIME";r:number};
export async function GET(){
 try{
  const ticker="GC=F";
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(ticker)+"?interval=15m&range=1mo";
  const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(10000),headers:{"User-Agent":"Mozilla/5.0"}});
  if(!response.ok)throw Error("Historical feed HTTP "+response.status);
  const data=await response.json(),item=data?.chart?.result?.[0],q=item?.indicators?.quote?.[0];
  if(!Array.isArray(item?.timestamp)||!q)throw Error("No historical candles");
  const now=Date.now(),duration=900000;
  const candles:Candle[]=item.timestamp.flatMap((ts:number,i:number)=>{
   const values=[q.open?.[i],q.high?.[i],q.low?.[i],q.close?.[i]];
   if(!Number.isFinite(ts)||ts*1000+duration>now||values.some(v=>typeof v!=="number"||!Number.isFinite(v)||v<=0))return [];
   const [open,high,low,close]=values;
   if(high<Math.max(open,close)||low>Math.min(open,close))return [];
   return [{time:new Date(ts*1000).toISOString(),open,high,low,close}];
  }).sort((a:Candle,b:Candle)=>Date.parse(a.time)-Date.parse(b.time));
  if(candles.length<250)throw Error("Insufficient closed history");
  if(candles.some((c,i)=>i>0&&Date.parse(c.time)<=Date.parse(candles[i-1].time)))throw Error("Nonunique historical timestamps");
  const trades:Trade[]=[];
  let nextEligible=210;
  for(let i=210;i+16<candles.length;i++){
   if(i<nextEligible)continue;
   const report=evaluateCandles(candles.slice(0,i),"GC=F historical 15m candles");
   if(report.status==="WAIT"||!Number.isFinite(report.atr14)||report.atr14<=0)continue;
   const side=report.status==="BULLISH_BIAS"?"BUY":"SELL";
   // Signal uses only bars strictly before entry. Entry occurs at next candle open.
   const entry=candles[i].open,atr=report.atr14;
   const stop=side==="BUY"?entry-atr*1.5:entry+atr*1.5;
   const target=side==="BUY"?entry+atr*3:entry-atr*3;
   if(stop<=0||target<=0)continue;
   let exit=NaN,result:Trade["result"]="TIME",exitAt="",exitIndex=i+16;
   for(let j=i;j<=i+16;j++){
    const c=candles[j];
    // If price gaps through a stop, assume worse open. Targets are not improved by gaps.
    const gapStop=side==="BUY"?c.open<=stop:c.open>=stop;
    const hitStop=side==="BUY"?c.low<=stop:c.high>=stop;
    const hitTarget=side==="BUY"?c.high>=target:c.low<=target;
    if(gapStop||hitStop){exit=gapStop?c.open:stop;result="STOP";exitAt=c.time;exitIndex=j;break;}
    if(hitTarget){exit=target;result="TARGET";exitAt=c.time;exitIndex=j;break;}
    if(j===i+16){exit=c.close;exitAt=c.time;}
   }
   if(!Number.isFinite(exit))continue;
   const r=(side==="BUY"?exit-entry:entry-exit)/Math.abs(entry-stop);
   trades.push({side,entry,stop,target,entryAt:candles[i].time,exitAt,exit,result,r});
   // Re-entry only after the exit candle has completed; no overlapping positions.
   nextEligible=exitIndex+1;
  }
  const totalR=trades.reduce((s,t)=>s+t.r,0);
  let equity=0,peak=0,maxDrawdownR=0;
  for(const t of trades){equity+=t.r;peak=Math.max(peak,equity);maxDrawdownR=Math.max(maxDrawdownR,peak-equity);}
  const wins=trades.filter(t=>t.r>0).length;
  // Chronological diagnostic split only; strategy was already inspected on this sample.
  const cutoff=Date.parse(candles[Math.floor(candles.length*0.7)].time);
  const summarize=(subset:Trade[])=>{
   const count=subset.length,net=subset.reduce((sum,t)=>sum+t.r,0);
   const winning=subset.filter(t=>t.r>0).length;
   let balance=0,peak=0,drawdown=0;
   for(const t of subset){balance+=t.r;peak=Math.max(peak,balance);drawdown=Math.max(drawdown,peak-balance);}
   return {trades:count,wins:winning,winRatePct:count?+(100*winning/count).toFixed(2):null,totalR:+net.toFixed(3),averageR:count?+(net/count).toFixed(3):null,maxDrawdownR:+drawdown.toFixed(3)};
  };
  const directional={BUY:summarize(trades.filter(t=>t.side==="BUY")),SELL:summarize(trades.filter(t=>t.side==="SELL"))};
  const chronological={earlier70Pct:summarize(trades.filter(t=>Date.parse(t.entryAt)<cutoff)),
   later30Pct:summarize(trades.filter(t=>Date.parse(t.entryAt)>=cutoff)),cutoff:new Date(cutoff).toISOString(),
   warning:"Diagnostic split, NOT untouched out-of-sample validation: this historical sample was already examined."};
  const costs=[0,0.05,0.1,0.2,0.3].map(costR=>({
   assumedRoundTripCostR:costR,
   totalNetR:+(totalR-costR*trades.length).toFixed(3),
   averageNetR:trades.length?+((totalR-costR*trades.length)/trades.length).toFixed(3):null
  }));
  return NextResponse.json({status:"HISTORICAL_RESEARCH_ONLY",symbol:"GC=F",asset:"COMEX gold futures proxy, not Octa XAU/USD",source:"Yahoo Finance public chart 15m",sample:{candles:candles.length,first:candles[0].time,last:candles.at(-1)?.time},
   strategy:"15m EMA20/50/200 plus RSI directional bias; next-bar open entry; 1.5 ATR stop, 3 ATR target, 17 bars maximum, re-entry only after the exit candle",
   results:{trades:trades.length,wins,losses:trades.length-wins,winRatePct:trades.length?Math.round(wins/trades.length*10000)/100:null,
    totalR:Math.round(totalR*100)/100,averageR:trades.length?Math.round(totalR/trades.length*1000)/1000:null,maxDrawdownR:Math.round(maxDrawdownR*100)/100},
   diagnostics:{directional,chronological,costSensitivity:costs,costWarning:"Hypothetical costs in R, not measured Octa spreads, commissions or slippage. Do not treat these as verified broker costs."},
   trades:trades.slice(-30),whaleFilterApplied:false,transactionCostsIncluded:false,
   decision:"NOT_VALIDATED_FOR_LIVE_TRADING",
   limitations:"Entry at bar open and intrabar stops are hypothetical; re-entry starts after the exit bar. Short, nonrandom historical sample; no spread, commission, slippage, broker contract rules, news or institutional flow. Same-candle stop wins; gaps through stop use open. Candles may contain market gaps. Results are hypothetical and not predictive."},
   {headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({status:"UNAVAILABLE",decision:"NO_BACKTEST_RESULTS",error:e instanceof Error?e.message:"Unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
