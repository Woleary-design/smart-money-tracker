import {NextResponse} from "next/server";
import {evaluateCandles,type TechnicalReport} from "../../../lib/technicals";
import type {Candle} from "../../../lib/candles";
export const dynamic="force-dynamic";
const intervals=["5min","15min","1h"] as const;
async function getInterval(interval:typeof intervals[number],key:string):Promise<TechnicalReport>{
 const params=new URLSearchParams({symbol:"XAU/USD",interval,outputsize:"240",timezone:"UTC",apikey:key});
 const response=await fetch("https://api.twelvedata.com/time_series?"+params.toString(),{next:{revalidate:90},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error("Market provider HTTP "+response.status);
 const body=await response.json();
 if(body.status!=="ok"||!Array.isArray(body.values))throw Error("Provider unavailable: "+String(body.message??body.code??"invalid response"));
 // Provider returns newest-first; exclude latest possibly unfinished candle.
 const candles:Candle[]=body.values.slice(1).map((v:Record<string,string>)=>({
  time:v.datetime.replace(" ","T")+"Z",open:Number(v.open),high:Number(v.high),low:Number(v.low),close:Number(v.close)
 })).reverse();
 const report=evaluateCandles(candles,"Twelve Data /time_series");
 const age=Date.now()-Date.parse(report.asOf);
 const allowedAge=interval==="1h"?2*3600000:interval==="15min"?40*60000:20*60000;
 if(!Number.isFinite(age)||age<0||age>allowedAge)throw Error("Historical candles are stale");
 return report;
}
export async function GET(){
 const key=process.env.TWELVE_DATA_API_KEY;
 if(!key)return NextResponse.json({symbol:"XAU/USD",decision:"NO_TRADE",reason:"Historical candle provider not configured",intervals:{}},{status:200,headers:{"Cache-Control":"no-store"}});
 const results=await Promise.allSettled(intervals.map(interval=>getInterval(interval,key)));
 const reports:Record<string,TechnicalReport|{error:string}>={};
 intervals.forEach((interval,i)=>{const result=results[i];reports[interval]=result.status==="fulfilled"?result.value:{error:result.reason instanceof Error?result.reason.message:"Data unavailable"};});
 const complete=intervals.every(i=>!("error" in reports[i]));
 const matching=complete&&intervals.every(i=>(reports[i] as TechnicalReport).status==="BULLISH_BIAS")?"BULLISH_BIAS":complete&&intervals.every(i=>(reports[i] as TechnicalReport).status==="BEARISH_BIAS")?"BEARISH_BIAS":"WAIT";
 return NextResponse.json({symbol:"XAU/USD",decision:"NO_TRADE",technicalBias:matching,reason:complete?"Technical evidence alone is insufficient: sentiment, news and executable spread checks are not connected.":"Incomplete or stale timeframe data",intervals:reports,checkedAt:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
}
