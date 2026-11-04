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
  for(let i=210;i<candles.length-17;i++){
   if(i<nextEligible)continue;
   const report=evaluateCandles(candles.slice(0,i),"GC=F historical 15m candles");
   if(report.status==="WAIT"||!Number.isFinite(report.atr14)||report.atr14<=0)continue;
   const side=report.status==="BULLISH_BIAS"?"BUY":"SELL";
   // Signal uses only bars strictly before entry. Entry occurs at next candle open.
   const entry=candles[i].open,atr=report.atr14;
   const stop=side==="BUY"?entry-atr*1.5:entry+atr*1.5;
   const target=side==="BUY"?entry+atr*3:entry-atr*3;
   if(stop<=0||target<=0)continue;
   let exit=NaN,result:Trade["result"]="TIME",exitAt="";
   for(let j=i;j<=i+16;j++){
    const c=candles[j];
    // If price gaps through a stop, assume worse open. Targets are not improved by gaps.
    const gapStop=side==="BUY"?c.open<=stop:c.open>=stop;
    const hitStop=side==="BUY"?c.low<=stop:c.high>=stop;
    const hitTarget=side==="BUY"?c.high>=target:c.low<=target;
    if(gapStop||hitStop){exit=gapStop?c.open:stop;result="STOP";exitAt=c.time;break;}
    if(hitTarget){exit=target;result="TARGET";exitAt=c.time;break;}
    if(j===i+16){exit=c.close;exitAt=c.time;}
   }
   if(!Number.isFinite(exit))continue;
   const r=(side==="BUY"?exit-entry:entry-exit)/Math.abs(entry-stop);
   trades.push({side,entry,stop,target,entryAt:candles[i].time,exitAt,exit,result,r});
   nextEligible=i+17;
  }
  const totalR=trades.reduce((s,t)=>s+t.r,0);
  let equity=0,peak=0,maxDrawdownR=0;
  for(const t of trades){equity+=t.r;peak=Math.max(peak,equity);maxDrawdownR=Math.max(maxDrawdownR,peak-equity);}
  const wins=trades.filter(t=>t.r>0).length;
  return NextResponse.json({status:"HISTORICAL_RESEARCH_ONLY",symbol:"GC=F",asset:"COMEX gold futures proxy, not Octa XAU/USD",source:"Yahoo Finance public chart 15m",sample:{candles:candles.length,first:candles[0].time,last:candles.at(-1)?.time},
   strategy:"15m EMA20/50/200 plus RSI directional bias; next-bar open entry; 1.5 ATR stop, 3 ATR target, 17 bars maximum, one position at a time",
   results:{trades:trades.length,wins,losses:trades.length-wins,winRatePct:trades.length?Math.round(wins/trades.length*10000)/100:null,
    totalR:Math.round(totalR*100)/100,averageR:trades.length?Math.round(totalR/trades.length*1000)/1000:null,maxDrawdownR:Math.round(maxDrawdownR*100)/100},
   trades:trades.slice(-30),whaleFilterApplied:false,transactionCostsIncluded:false,
   decision:"NOT_VALIDATED_FOR_LIVE_TRADING",
   limitations:"Short, nonrandom historical sample; no spread, commission, slippage, broker contract rules, news or institutional flow. Same-candle stop wins; gaps through stop use open. Candles may contain market gaps. Results are hypothetical and not predictive."},
   {headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({status:"UNAVAILABLE",decision:"NO_BACKTEST_RESULTS",error:e instanceof Error?e.message:"Unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
