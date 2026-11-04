export type WhaleSource="CFTC_COT"|"POLYMARKET"|"OTHER_VERIFIED";
export type WhaleEvidence={source:WhaleSource;symbol:string;direction:"BUY"|"SELL"|"NEUTRAL";asOf:string;verified:boolean;description:string;url:string;weight?:number};
export type WhaleAssessment={status:"CONFIRMED"|"DIVERGENT"|"MIXED"|"UNAVAILABLE";score:number|null;supporting:WhaleEvidence[];opposing:WhaleEvidence[];neutral:WhaleEvidence[];reason:string};
export function assessWhales(symbol:string,direction:"BUY"|"SELL",evidence:WhaleEvidence[],now=new Date()):WhaleAssessment{
 const maxAge:Record<WhaleSource,number>={CFTC_COT:10*86400000,POLYMARKET:3600000,OTHER_VERIFIED:86400000};
 const usable=evidence.filter(e=>e.symbol===symbol&&e.verified&&/^https:\/\//.test(e.url)&&
 Number.isFinite(Date.parse(e.asOf))&&now.getTime()>=Date.parse(e.asOf)&&
 now.getTime()-Date.parse(e.asOf)<=maxAge[e.source]);
 const supporting=usable.filter(e=>e.direction===direction);
 const opposing=usable.filter(e=>e.direction!=="NEUTRAL"&&e.direction!==direction);
 const neutral=usable.filter(e=>e.direction==="NEUTRAL");
 const weight=(e:WhaleEvidence)=>e.source==="POLYMARKET"?0.25:e.source==="CFTC_COT"?0.7:Math.min(1,Math.max(0,e.weight??0.5));
 const positive=supporting.reduce((s,e)=>s+weight(e),0),negative=opposing.reduce((s,e)=>s+weight(e),0);
 const score=positive+negative?Math.round(100*positive/(positive+negative)):null;
 const status:WhaleAssessment["status"]=!positive&&!negative?"UNAVAILABLE":positive&&negative?"MIXED":positive?"CONFIRMED":"DIVERGENT";
 return {status,score,supporting,opposing,neutral,
  reason:status==="UNAVAILABLE"?"No recent verified directional whale evidence":status==="MIXED"?"Verified large-trader evidence conflicts":status==="CONFIRMED"?"Available large-trader evidence aligns with proposed direction":"Available large-trader evidence opposes proposed direction"};
}
