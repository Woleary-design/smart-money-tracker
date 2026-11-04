import {identifyCandles,type Candle} from "./candles";
export type TechnicalReport={status:"WAIT"|"BULLISH_BIAS"|"BEARISH_BIAS";reason:string;close:number;ema20:number;ema50:number;ema200:number;rsi14:number;atr14:number;patterns:string[];asOf:string;source:string};
function ema(values:number[],period:number):number{
 if(values.length<period)throw Error("Insufficient EMA history");
 let avg=values.slice(0,period).reduce((a,b)=>a+b,0)/period;
 const alpha=2/(period+1);
 for(const v of values.slice(period))avg=v*alpha+avg*(1-alpha);
 return avg;
}
function rsi(closes:number[],period=14):number{
 if(closes.length<period+2)throw Error("Insufficient RSI history");
 const changes=closes.slice(1).map((v,i)=>v-closes[i]);
 let gain=0,loss=0;
 for(const v of changes.slice(0,period)){gain+=Math.max(v,0);loss+=Math.max(-v,0);}
 gain/=period;loss/=period;
 for(const v of changes.slice(period)){gain=(gain*(period-1)+Math.max(v,0))/period;loss=(loss*(period-1)+Math.max(-v,0))/period;}
 return loss===0?(gain===0?50:100):100-100/(1+gain/loss);
}
function atr(c:Candle[],period=14):number{
 if(c.length<period+1)throw Error("Insufficient ATR history");
 const tr=c.slice(1).map((v,i)=>Math.max(v.high-v.low,Math.abs(v.high-c[i].close),Math.abs(v.low-c[i].close)));
 let value=tr.slice(0,period).reduce((a,b)=>a+b,0)/period;
 for(const v of tr.slice(period))value=(value*(period-1)+v)/period;
 return value;
}
export function evaluateCandles(candles:Candle[],source:string):TechnicalReport{
 if(candles.length<210)throw Error("At least 210 closed candles required");
 const c=candles.slice().sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
 if(c.some((v,i)=>!Number.isFinite(Date.parse(v.time))||[v.open,v.high,v.low,v.close].some(x=>!Number.isFinite(x)||x<=0)||v.high<Math.max(v.open,v.close)||v.low>Math.min(v.open,v.close)||(i>0&&Date.parse(v.time)<=Date.parse(c[i-1].time))))throw Error("Invalid candle history");
 const closes=c.map(v=>v.close),last=c[c.length-1],e20=ema(closes,20),e50=ema(closes,50),e200=ema(closes,200),r=rsi(closes),a=atr(c);
 const bullish=last.close>e20&&e20>e50&&e50>e200&&r>50&&r<70;
 const bearish=last.close<e20&&e20<e50&&e50<e200&&r<50&&r>30;
 const status=bullish?"BULLISH_BIAS":bearish?"BEARISH_BIAS":"WAIT";
 return {status,reason:status==="WAIT"?"Trend and momentum do not align": "Trend and momentum align; not sufficient for a trade proposal",close:last.close,ema20:e20,ema50:e50,ema200:e200,rsi14:r,atr14:a,patterns:identifyCandles(c.slice(-3)).filter(p=>p.index===2).map(p=>p.name),asOf:last.time,source};
}
