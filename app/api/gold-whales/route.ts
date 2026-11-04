import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
type Market={id?:string;question?:string;slug?:string;conditionId?:string;volumeNum?:number;liquidityNum?:number;closed?:boolean};
type Trade={proxyWallet?:string;side?:string;size?:number|string;price?:number|string;timestamp?:number|string;conditionId?:string;title?:string;transactionHash?:string};
const goldRelevant=(s:string)=>/\b(gold|xau|bullion)\b/i.test(s)&&/\b(price|ounce|oz|above|below|reach|hit|trade|close|end|high|low)\b/i.test(s);
async function json(url:string):Promise<unknown>{
 const r=await fetch(url,{next:{revalidate:120},signal:AbortSignal.timeout(8000),headers:{Accept:"application/json"}});
 if(!r.ok)throw Error("Provider HTTP "+r.status);
 return r.json();
}
export async function GET(){
 try{
  const found:Market[]=[];
  for(const offset of [0,100,200]){
   const url=new URL("https://gamma-api.polymarket.com/markets");
   url.searchParams.set("active","true");url.searchParams.set("closed","false");
   url.searchParams.set("limit","100");url.searchParams.set("offset",String(offset));
   url.searchParams.set("order","volumeNum");url.searchParams.set("ascending","false");
   const data=await json(url.toString());
   if(!Array.isArray(data))throw Error("Invalid market response");
   found.push(...data as Market[]);
   if(data.length<100)break;
  }
  const matches=found.filter(m=>m.conditionId&&goldRelevant(m.question??"")).slice(0,5);
  const results=await Promise.all(matches.map(async market=>{
   const url=new URL("https://data-api.polymarket.com/trades");
   url.searchParams.set("market",market.conditionId!);url.searchParams.set("limit","100");
   try{
    const data=await json(url.toString());
    if(!Array.isArray(data))throw Error("Unexpected trade response");
    const trades=(data as Trade[]).map(t=>{
     const size=Number(t.size),price=Number(t.price),timestamp=Number(t.timestamp);
     return {wallet:typeof t.proxyWallet==="string"?t.proxyWallet:null,side:t.side==="BUY"||t.side==="SELL"?t.side:null,
      size:Number.isFinite(size)&&size>0?size:null,price:Number.isFinite(price)&&price>=0&&price<=1?price:null,
      estimatedNotional:Number.isFinite(size*price)&&size>0&&price>=0&&price<=1?Math.round(size*price*100)/100:null,
      timestamp:Number.isFinite(timestamp)?new Date(timestamp*1000).toISOString():null,
      transactionHash:typeof t.transactionHash==="string"?t.transactionHash:null};
    }).filter(t=>t.wallet&&t.side&&t.estimatedNotional!==null)
      .sort((a,b)=>(b.estimatedNotional??0)-(a.estimatedNotional??0)).slice(0,15);
    return {market:{question:market.question,conditionId:market.conditionId,url:market.slug?"https://polymarket.com/event/"+market.slug:null},
      trades,source:url.toString(),sampled:true};
   }catch(e){return {market:{question:market.question,conditionId:market.conditionId},trades:[],error:e instanceof Error?e.message:"Unavailable",sampled:true};}
  }));
  return NextResponse.json({status:matches.length?"sampled":"no_matches_in_sample",scanned:found.length,markets:results,
   asOf:new Date().toISOString(),decision:"NO_TRADE",reason:"Prediction-market trades are not spot-gold orders. Sampled activity cannot establish wallet profitability, full positioning or an executable XAU/USD edge.",
   limitations:"Only a sample of active markets and up to 100 recent trades per matching market; not exhaustive. Estimated notional assumes share size times price."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({status:"unavailable",markets:[],decision:"NO_TRADE",error:e instanceof Error?e.message:"Unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
