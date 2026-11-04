import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
type Market={id?:string;question?:string;slug?:string;conditionId?:string;outcomes?:string|string[];outcomePrices?:string|string[];volumeNum?:number;liquidityNum?:number;active?:boolean;closed?:boolean;endDate?:string};
function list(value:unknown):string[]{
 if(Array.isArray(value))return value.map(String);
 if(typeof value!=="string")return [];
 try{const v=JSON.parse(value);return Array.isArray(v)?v.map(String):[];}catch{return [];}
}
function relevant(q:string):boolean{
 const s=q.toLowerCase();
 return /\b(gold|xau|bullion)\b/.test(s)&&/\b(price|ounce|oz|above|below|reach|hit|trade|close|end|high|low)\b/.test(s);
}
export async function GET(){
 try{
  // Discover market metadata only. Do not equate market odds with spot-gold positioning.
  const collected:Market[]=[];
  for(const offset of [0,100,200]){
   const url=new URL("https://gamma-api.polymarket.com/markets");
   url.searchParams.set("active","true");url.searchParams.set("closed","false");
   url.searchParams.set("limit","100");url.searchParams.set("offset",String(offset));
   url.searchParams.set("order","volumeNum");url.searchParams.set("ascending","false");
   const response=await fetch(url.toString(),{next:{revalidate:300},signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error("Gamma API HTTP "+response.status);
   const data=await response.json();
   if(!Array.isArray(data))throw Error("Unexpected Gamma market response");
   collected.push(...data);
   if(data.length<100)break;
  }
  const markets=collected.filter(m=>m.active!==false&&!m.closed&&relevant(m.question??""))
   .map(m=>{const outcomes=list(m.outcomes),prices=list(m.outcomePrices).map(Number);
    return {id:m.id,question:m.question,slug:m.slug,conditionId:m.conditionId,
     outcomes:outcomes.map((label,i)=>({label,probability:Number.isFinite(prices[i])&&prices[i]>=0&&prices[i]<=1?prices[i]:null})),
     volume:Number.isFinite(Number(m.volumeNum))?Number(m.volumeNum):null,
     liquidity:Number.isFinite(Number(m.liquidityNum))?Number(m.liquidityNum):null,endDate:m.endDate,
     url:m.slug?"https://polymarket.com/event/"+encodeURIComponent(m.slug):null};
   }).slice(0,30);
  return NextResponse.json({status:markets.length?"markets_found":"no_relevant_markets_in_sample",markets,scanned:collected.length,
   sampled:true,source:"https://gamma-api.polymarket.com/markets",fetchedAt:new Date().toISOString(),
   assessment:"UNAVAILABLE",reason:"Prediction-market prices alone do not measure directional gold trader positioning; no automatic gold buy/sell signal is inferred.",
   caveat:"Sampled top-volume active markets only; absence does not imply no gold markets exist."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({status:"unavailable",markets:[],assessment:"UNAVAILABLE",error:e instanceof Error?e.message:"Feed unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
