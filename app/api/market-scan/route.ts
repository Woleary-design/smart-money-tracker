import {NextResponse} from "next/server";
import {evaluateCandles,type TechnicalReport} from "../../../lib/technicals";
import type {Candle} from "../../../lib/candles";
export const dynamic="force-dynamic";
const symbols=["XAU/USD","EUR/USD","GBP/USD","USD/JPY"] as const;
const intervals=["5min","15min","1h"] as const;
type Frame=TechnicalReport|{error:string};
async function fetchPublicFrame(symbol:string,interval:typeof intervals[number]):Promise<TechnicalReport>{
 const tickers:Record<string,string>={"XAU/USD":"GC=F","EUR/USD":"EURUSD=X","GBP/USD":"GBPUSD=X","USD/JPY":"JPY=X"};
 const ticker=tickers[symbol],period=interval==="1h"?"60m":interval;
 const range=interval==="1h"?"1mo":interval==="15min"?"1mo":"5d";
 const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(ticker)+"?"+new URLSearchParams({interval:period,range});
 const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(8000),headers:{"User-Agent":"Mozilla/5.0"}});
 if(!response.ok)throw Error("Public provider HTTP "+response.status);
 const body=await response.json();
 const result=body?.chart?.result?.[0],q=result?.indicators?.quote?.[0];
 if(!Array.isArray(result?.timestamp)||!q)throw Error("Public candles unavailable");
 const seconds=interval==="1h"?3600:interval==="15min"?900:300,now=Date.now();
 const candles:Candle[]=result.timestamp.flatMap((ts:number,i:number)=>{
  const values=[q.open?.[i],q.high?.[i],q.low?.[i],q.close?.[i]];
  if(!Number.isFinite(ts)||values.some(v=>typeof v!=="number"||!Number.isFinite(v)||v<=0)||ts*1000+seconds*1000>now)return [];
  return [{time:new Date(ts*1000).toISOString(),open:values[0],high:values[1],low:values[2],close:values[3]}];
 });
 const report=evaluateCandles(candles,"Yahoo Finance public chart: "+ticker+(symbol==="XAU/USD"?" (futures proxy, not spot)":" (indicative)"));
 const age=now-Date.parse(report.asOf)-seconds*1000;
 const maxAge=interval==="1h"?2*3600000:interval==="15min"?40*60000:20*60000;
 if(!Number.isFinite(age)||age<0||age>maxAge)throw Error("Stale public candles");
 return report;
}
async function fetchFrame(symbol:string,interval:typeof intervals[number],key:string):Promise<TechnicalReport>{
 const p=new URLSearchParams({symbol,interval,outputsize:"240",timezone:"UTC",apikey:key});
 const response=await fetch("https://api.twelvedata.com/time_series?"+p,{cache:"no-store",signal:AbortSignal.timeout(8500)});
 if(!response.ok)throw Error("Market provider HTTP "+response.status);
 const body=await response.json();
 if(body.status!=="ok"||!Array.isArray(body.values))throw Error("Provider: "+String(body.message??body.code??"invalid response"));
 const candles:Candle[]=body.values.slice(1).map((v:Record<string,string>)=>({
  time:/Z$|[+-]\d\d:\d\d$/.test(v.datetime)?v.datetime:v.datetime.replace(" ","T")+"Z",
  open:Number(v.open),high:Number(v.high),low:Number(v.low),close:Number(v.close)
 })).reverse();
 const report=evaluateCandles(candles,"Twelve Data historical OHLC");
 const age=Date.now()-Date.parse(report.asOf);
 const maxAge=interval==="1h"?2*3600000:interval==="15min"?40*60000:20*60000;
 if(!Number.isFinite(age)||age<0||age>maxAge)throw Error("Stale candle history");
 return report;
}
export async function GET(){
 const key=process.env.TWELVE_DATA_API_KEY;

 const markets=await Promise.all(symbols.map(async symbol=>{
  const outcomes=await Promise.allSettled(intervals.map(interval=>key?fetchFrame(symbol,interval,key):fetchPublicFrame(symbol,interval)));
  const frames:Record<string,Frame>={};
  intervals.forEach((interval,i)=>{const r=outcomes[i];frames[interval]=r.status==="fulfilled"?r.value:{error:r.reason instanceof Error?r.reason.message:"Unavailable"};});
  const complete=intervals.every(i=>!("error" in frames[i]));
  const bias=complete&&intervals.every(i=>(frames[i] as TechnicalReport).status==="BULLISH_BIAS")?"BUY":
   complete&&intervals.every(i=>(frames[i] as TechnicalReport).status==="BEARISH_BIAS")?"SELL":"WAIT";
  return {symbol,technicalBias:bias,frames,status:complete?"TECHNICALS_READY":"INCOMPLETE",tradeEligible:false,
   whaleConfirmation:"UNAVAILABLE",newsClearance:"UNAVAILABLE",brokerSpread:"UNAVAILABLE",
   reason:"Technical bias is not a validated trade; whale, event and broker-cost evidence is missing"};
 }));
 return NextResponse.json({status:key?"RESEARCH_ONLY":"PUBLIC_INDICATIVE_RESEARCH",decision:"NO_VALIDATED_TRADES",markets,checkedAt:new Date().toISOString(),
  source:key?"Twelve Data OHLC":"Yahoo Finance unofficial public candles; gold uses GC=F futures proxy, NOT spot XAU/USD",
  warning:key?"Twelve Data plan/rate limits may prevent 12 interval requests; missing or stale candles fail closed. No Octa order execution.":"Public candles may be blocked, delayed, stale or rate-limited. GC=F is futures, not Octa spot. Technical bias is research only; no executable entries or automatic orders."},
  {headers:{"Cache-Control":"no-store"}});
}
