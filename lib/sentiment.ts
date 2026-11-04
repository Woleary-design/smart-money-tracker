export type SentimentInput={longPct?:number|null;shortPct?:number|null;changePct24h?:number|null;source:string;observedAt:string};
export type SentimentResult={label:"bullish"|"bearish"|"mixed"|"unavailable";score:number|null;reason:string};
export function assessSentiment(s:SentimentInput,now=new Date()):SentimentResult{
 const unavailable=(reason:string):SentimentResult=>({label:"unavailable",score:null,reason});
 const age=now.getTime()-Date.parse(s.observedAt);
 if(!s.source||!Number.isFinite(age)||age<0||age>3600000)return unavailable("Missing or older-than-one-hour sourced positioning");
 const l=s.longPct,r=s.shortPct;
 if(l==null||r==null||![l,r].every(Number.isFinite)||l<0||r<0||Math.abs(l+r-100)>2)return unavailable("Valid long/short percentages required");
 // Crowd positioning is not itself a directional forecast.
 const skew=l-r;
 return {label:Math.abs(skew)<10?"mixed":skew>0?"bullish":"bearish",score:Math.round(skew),reason:"Positioning balance only; not a directional trade recommendation"};
}
