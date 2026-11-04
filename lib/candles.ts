export type Candle={time:string;open:number;high:number;low:number;close:number};
export type Pattern={name:string;direction:"bullish"|"bearish"|"neutral";index:number;explanation:string};
export function identifyCandles(candles:Candle[]):Pattern[]{
 const out:Pattern[]=[];
 const valid=(c:Candle)=>[c.open,c.high,c.low,c.close].every(Number.isFinite)&&c.high>=Math.max(c.open,c.close)&&c.low<=Math.min(c.open,c.close)&&c.high>c.low;
 candles.forEach((c,i)=>{
  if(!valid(c))return;
  const range=c.high-c.low,body=Math.abs(c.close-c.open),upper=c.high-Math.max(c.open,c.close),lower=Math.min(c.open,c.close)-c.low;
  const bull=c.close>c.open,bear=c.close<c.open;
  const add=(name:string,direction:Pattern["direction"],explanation:string)=>out.push({name,direction,index:i,explanation});
  if(body/range<=.1)add("Doji","neutral","Small real body relative to total candle range");
  if(lower>=2*body&&upper<=Math.max(body,range*.1)&&body/range<=.4)add("Hammer-shaped rejection",bull?"bullish":"neutral","Long lower wick; trend context required");
  if(upper>=2*body&&lower<=Math.max(body,range*.1)&&body/range<=.4)add("Shooting-star-shaped rejection",bear?"bearish":"neutral","Long upper wick; trend context required");
  if(i===0||!valid(candles[i-1]))return;
  const p=candles[i-1],pbull=p.close>p.open,pbear=p.close<p.open;
  if(bull&&pbear&&c.open<=p.close&&c.close>=p.open&&body>0)add("Bullish engulfing","bullish","Current real body engulfs preceding bearish real body");
  if(bear&&pbull&&c.open>=p.close&&c.close<=p.open&&body>0)add("Bearish engulfing","bearish","Current real body engulfs preceding bullish real body");
  if(c.high<p.high&&c.low>p.low)add("Inside bar","neutral","Range contained within prior candle; breakout direction unconfirmed");
 });
 return out;
}
