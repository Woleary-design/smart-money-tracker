export type Direction="BUY"|"SELL";
export type Opportunity={
 id:string;symbol:string;strategy:string;direction:Direction;
 entry:number;stop:number;target:number;asOf:string;
 evidence:{technical:boolean;sentiment:boolean;calendarClear:boolean;spreadChecked:boolean;fresh:boolean};
};
export type RankedOpportunity=Opportunity&{rewardRisk:number;score:number;eligible:boolean;reason:string;riskUsd:number};
export function rankOpportunities(items:Opportunity[],accountUsd=200,riskPct=1,now=new Date()):RankedOpportunity[]{
 return items.map(o=>{
  const distance=Math.abs(o.entry-o.stop),reward=Math.abs(o.target-o.entry);
  const directionValid=o.direction==="BUY"?o.stop<o.entry&&o.target>o.entry:o.stop>o.entry&&o.target<o.entry;
  const numbers=[o.entry,o.stop,o.target].every(n=>Number.isFinite(n)&&n>0);
  const rr=distance>0?reward/distance:0;
  const age=now.getTime()-Date.parse(o.asOf);
  const current=Number.isFinite(age)&&age>=0&&age<=15*60000;
  const checks=Object.values(o.evidence).filter(Boolean).length;
  const eligible=numbers&&directionValid&&rr>=1.5&&current&&Object.values(o.evidence).every(Boolean);
  const reason=!numbers||!directionValid?"Invalid entry, stop or target":!current?"Stale or missing data":rr<1.5?"Reward/risk below 1.5":!Object.values(o.evidence).every(Boolean)?"Missing technical, sentiment, calendar, spread or freshness confirmation":"All preliminary research gates passed; not an execution instruction";
  return {...o,rewardRisk:Number(rr.toFixed(2)),score:Math.round((checks/5*70+Math.min(rr,3)/3*30)*10)/10,eligible,reason,riskUsd:Number((accountUsd*riskPct/100).toFixed(2))};
 }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score);
}
