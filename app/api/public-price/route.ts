import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const tickers:Record<string,string>={"XAU/USD":"GC=F","EUR/USD":"EURUSD=X","GBP/USD":"GBPUSD=X","USD/JPY":"JPY=X"};
export async function GET(request:NextRequest){
 const symbol=request.nextUrl.searchParams.get("symbol")??"XAU/USD";
 const ticker=tickers[symbol];
 if(!ticker)return NextResponse.json({error:"Unsupported symbol"},{status:400});
 try{
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(ticker)+"?interval=5m&range=1d";
  const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(7000),headers:{"User-Agent":"Mozilla/5.0"}});
  if(!response.ok)throw Error("Quote provider HTTP "+response.status);
  const body=await response.json();
  const result=body?.chart?.result?.[0],quote=result?.indicators?.quote?.[0];
  if(!Array.isArray(result?.timestamp)||!Array.isArray(quote?.close))throw Error("No price observations");
  const points=result.timestamp.map((time:number,i:number)=>({time,price:Number(quote.close[i])})).filter((p:{time:number;price:number})=>Number.isFinite(p.price)&&p.price>0&&Number.isFinite(p.time));
  const last=points.at(-1);if(!last)throw Error("No valid prices");
  const asOf=new Date(last.time*1000).toISOString(),ageMs=Date.now()-last.time*1000;
  const fresh=ageMs>=0&&ageMs<=20*60*1000;
  return NextResponse.json({symbol,indicativePrice:last.price,asOf,fresh,status:fresh?"INDICATIVE_ONLY":"STALE",
   source:"Yahoo Finance public chart",providerSymbol:ticker,
   warning:symbol==="XAU/USD"?"GC=F is gold futures, NOT spot XAU/USD or Octa executable bid/ask. Do not use for trade entry.":"Unofficial indicative FX feed, not Octa executable bid/ask. May be delayed or unavailable."},
   {headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({symbol,status:"UNAVAILABLE",error:e instanceof Error?e.message:"Unavailable",indicativePrice:null},{status:503,headers:{"Cache-Control":"no-store"}});}
}
