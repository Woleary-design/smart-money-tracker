import {NextResponse} from "next/server";
import {evaluateCandles,type TechnicalReport} from "../../../lib/technicals";
import type {Candle} from "../../../lib/candles";
export const dynamic="force-dynamic";
const symbols=["XAU/USD","EUR/USD","GBP/USD","USD/JPY"] as const;
const intervals=["5min","15min","1h"] as const;
type Frame=TechnicalReport|{error:string};
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
 if(!key)return NextResponse.json({status:"UNCONFIGURED",decision:"NO_VALIDATED_TRADES",reason:"TWELVE_DATA_API_KEY not configured",markets:[],checkedAt:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
 const markets=await Promise.all(symbols.map(async symbol=>{
  const outcomes=await Promise.allSettled(intervals.map(interval=>fetchFrame(symbol,interval,key)));
  const frames:Record<string,Frame>={};
  intervals.forEach((interval,i)=>{const r=outcomes[i];frames[interval]=r.status==="fulfilled"?r.value:{error:r.reason instanceof Error?r.reason.message:"Unavailable"};});
  const complete=intervals.every(i=>!("error" in frames[i]));
  const bias=complete&&intervals.every(i=>(frames[i] as TechnicalReport).status==="BULLISH_BIAS")?"BUY":
   complete&&intervals.every(i=>(frames[i] as TechnicalReport).status==="BEARISH_BIAS")?"SELL":"WAIT";
  return {symbol,technicalBias:bias,frames,status:complete?"TECHNICALS_READY":"INCOMPLETE",tradeEligible:false,
   whaleConfirmation:"UNAVAILABLE",newsClearance:"UNAVAILABLE",brokerSpread:"UNAVAILABLE",
   reason:"Technical bias is not a validated trade; whale, event and broker-cost evidence is missing"};
 }));
 return NextResponse.json({status:"RESEARCH_ONLY",decision:"NO_VALIDATED_TRADES",markets,checkedAt:new Date().toISOString(),
  source:"Twelve Data OHLC; TradingView charts are separate and not programmatic feed",
  warning:"Twelve Data plan/rate limits may prevent 12 interval requests; missing or stale candles fail closed. No Octa order execution."},
  {headers:{"Cache-Control":"no-store"}});
}
