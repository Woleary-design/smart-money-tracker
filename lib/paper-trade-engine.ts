export type TradeSide="BUY"|"SELL";
export type SimulatedTrade={side:TradeSide;entry:number;stop:number;target:number;openedAt:string;expiresAt:string;units:number};
export type Observation={time:string;open:number;high:number;low:number;close:number};
export type Outcome={status:"OPEN"|"STOP"|"TARGET"|"EXPIRED"|"INVALID";exitPrice:number|null;exitAt:string|null;grossPnlUsd:number|null;reason:string};
export function evaluatePaperTrade(trade:SimulatedTrade,observations:Observation[],now=new Date()):Outcome{
 const invalid=(reason:string):Outcome=>({status:"INVALID",exitPrice:null,exitAt:null,grossPnlUsd:null,reason});
 const times=[trade.openedAt,trade.expiresAt].map(Date.parse);
 if(!times.every(Number.isFinite)||times[1]<=times[0]||!Number.isFinite(trade.units)||trade.units<=0||
 ![trade.entry,trade.stop,trade.target].every(x=>Number.isFinite(x)&&x>0))return invalid("Invalid trade parameters");
 if(trade.side==="BUY"?! (trade.stop<trade.entry&&trade.entry<trade.target):!(trade.target<trade.entry&&trade.entry<trade.stop))return invalid("Stop/target ordering invalid");
 const bars=observations.slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 let previous=Number.NEGATIVE_INFINITY;
 for(const bar of bars){
  const time=Date.parse(bar.time);
  if(!Number.isFinite(time)||time<=previous||![bar.open,bar.high,bar.low,bar.close].every(x=>Number.isFinite(x)&&x>0)||
   bar.low>Math.min(bar.open,bar.close)||bar.high<Math.max(bar.open,bar.close))return invalid("Invalid OHLC observation");
  previous=time;
  if(time<times[0]||time>Math.min(now.getTime(),times[1]))continue;
  const stop=trade.side==="BUY"?bar.low<=trade.stop:bar.high>=trade.stop;
  const target=trade.side==="BUY"?bar.high>=trade.target:bar.low<=trade.target;
  // Stop first if both touched within one candle: conservative assumption.
  if(stop||target){
   const exit=stop?trade.stop:trade.target;
   const pnl=(trade.side==="BUY"?exit-trade.entry:trade.entry-exit)*trade.units;
   return {status:stop?"STOP":"TARGET",exitPrice:exit,exitAt:bar.time,grossPnlUsd:pnl,
    reason:stop&&target?"Both touched in same candle; stop assumed first":stop?"Stop touched":"Target touched"};
  }
 }
 if(now.getTime()>=times[1])return {status:"EXPIRED",exitPrice:null,exitAt:null,grossPnlUsd:null,reason:"Expiry reached; no verified exit quote available"};
 return {status:"OPEN",exitPrice:null,exitAt:null,grossPnlUsd:null,reason:"Neither stop nor target touched in supplied observations"};
}
