import type {TechnicalReport} from "./technicals";
export type PaperSetup={status:"PAPER_ONLY"|"WAIT";side:"BUY"|"SELL"|null;entry:number|null;stop:number|null;target:number|null;riskDistance:number|null;rewardRisk:number|null;expiresAt:string|null;maxUnitsAt2UsdRisk:number|null;reason:string;source:string};
export function makePaperSetup(frames:Record<string,TechnicalReport|{error:string}>,now=new Date()):PaperSetup{
 const wait=(reason:string):PaperSetup=>({status:"WAIT",side:null,entry:null,stop:null,target:null,riskDistance:null,rewardRisk:null,expiresAt:null,maxUnitsAt2UsdRisk:null,reason,source:"INDICATIVE_ONLY"});
 const required=["5min","15min","1h"];
 if(required.some(k=>!frames[k]||"error" in frames[k]))return wait("Incomplete multi-timeframe data");
 const f=frames["15min"] as TechnicalReport;
 const statuses=required.map(k=>(frames[k] as TechnicalReport).status);
 const bullish=statuses.every(s=>s==="BULLISH_BIAS"),bearish=statuses.every(s=>s==="BEARISH_BIAS");
 if(!bullish&&!bearish)return wait("Timeframes do not agree");
 const age=now.getTime()-Date.parse(f.asOf);
 if(!Number.isFinite(age)||age<0||age>40*60000)return wait("15-minute observation is stale");
 if(!Number.isFinite(f.close)||f.close<=0||!Number.isFinite(f.atr14)||f.atr14<=0)return wait("Invalid indicative price or ATR");
 const side=bullish?"BUY":"SELL",entry=f.close,distance=1.5*f.atr14,targetDistance=3*f.atr14;
 const stop=side==="BUY"?entry-distance:entry+distance,target=side==="BUY"?entry+targetDistance:entry-targetDistance;
 if(stop<=0||target<=0)return wait("Invalid stop or target");
 return {status:"PAPER_ONLY",side,entry,stop,target,riskDistance:distance,rewardRisk:2,
 expiresAt:new Date(now.getTime()+4*3600000).toISOString(),maxUnitsAt2UsdRisk:2/distance,
 reason:"Hypothetical levels based on last closed 15m candle and ATR; not a market fill, not an Octa quote. Position units assume USD per $1 price move and exclude costs.",
 source:f.source};
}
