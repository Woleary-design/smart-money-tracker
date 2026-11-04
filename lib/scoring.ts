/** Transparent research-only scoring. Never score missing or unverified data. */
export type Evidence = {
  verification: "verified" | "unverified" | "self_reported";
  sourceUrl: string | null;
  tradesCount: number | null;
  periodDays: number | null;
  winRatePct: number | null;
  maxDrawdownPct: number | null;
  riskAdjustedReturn: number | null;
  returnPct: number | null;
  avgHoldMinutes: number | null;
  measuredAt: string | null;
};
export type ScoreResult = {eligible:boolean;score:number|null;reason:string;methodologyVersion:"v1"};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function scoreTrader(e:Evidence, now=new Date()):ScoreResult {
  const reject=(reason:string):ScoreResult=>({eligible:false,score:null,reason,methodologyVersion:"v1"});
  if(e.verification!=="verified"||!e.sourceUrl?.startsWith("https://")) return reject("Independent, linked evidence required");
  if(!e.measuredAt||!Number.isFinite(Date.parse(e.measuredAt))||now.getTime()-Date.parse(e.measuredAt)>30*86400000||Date.parse(e.measuredAt)>now.getTime()) return reject("Recent dated evidence required");
  if(e.tradesCount===null||e.tradesCount<30||e.periodDays===null||e.periodDays<30) return reject("At least 30 trades over 30 days required");
  if(e.winRatePct===null||e.maxDrawdownPct===null||e.riskAdjustedReturn===null||e.returnPct===null||e.avgHoldMinutes===null) return reject("Complete performance and holding-time metrics required");
  if(![e.winRatePct,e.maxDrawdownPct,e.riskAdjustedReturn,e.returnPct,e.avgHoldMinutes].every(Number.isFinite)) return reject("Invalid performance metrics");
  if(e.winRatePct<0||e.winRatePct>100||e.maxDrawdownPct<0||e.avgHoldMinutes<=0) return reject("Invalid metric range");
  if(e.avgHoldMinutes>1440) return reject("Average holding period exceeds short-term focus");
  // Heuristic sub-scores, not investment predictions.
  const consistency=clamp(e.winRatePct);
  const drawdown=clamp(100-e.maxDrawdownPct*4);
  const riskAdjusted=clamp(50+e.riskAdjustedReturn*20);
  const verifiedHistory=clamp((e.periodDays/180)*100);
  const shortTerm=clamp(100-e.avgHoldMinutes/14.4);
  const recent=clamp(50+e.returnPct*2);
  const score=Math.round((consistency*.25+drawdown*.25+riskAdjusted*.20+verifiedHistory*.15+shortTerm*.10+recent*.05)*10)/10;
  return {eligible:true,score,reason:"Source-backed provisional research score",methodologyVersion:"v1"};
}
