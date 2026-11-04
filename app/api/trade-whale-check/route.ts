import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
type Frame={status?:string;close?:number;asOf?:string;error?:string};
type Market={symbol:string;technicalBias:"BUY"|"SELL"|"WAIT";status:string;frames:Record<string,Frame>};
async function load(url:string){
 const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error("Source HTTP "+r.status);
 return r.json();
}
export async function GET(request:NextRequest){
 const base=request.nextUrl.origin;
 const [scan,whales]=await Promise.allSettled([
  load(base+"/api/market-scan"),load(base+"/api/gold-whales")
 ]);
 const scanData=scan.status==="fulfilled"?scan.value:null;
 const whaleData=whales.status==="fulfilled"?whales.value:null;
 const markets:Market[]=Array.isArray(scanData?.markets)?scanData.markets:[];
 const comparisons=markets.map(m=>{
  const gold=m.symbol==="XAU/USD";
  const sampledMarkets=gold&&Array.isArray(whaleData?.markets)?whaleData.markets.length:0;
  const sampledTrades=gold&&Array.isArray(whaleData?.markets)?whaleData.markets.reduce((n:number,x:{trades?:unknown[]})=>n+(Array.isArray(x.trades)?x.trades.length:0),0):0;
  return {symbol:m.symbol,technicalBias:m.technicalBias,technicalStatus:m.status,
   whaleStatus:"UNVERIFIED",whaleAlignment:"UNKNOWN",tradeDecision:"WAIT",
   sampledPredictionMarkets:sampledMarkets,sampledPredictionMarketTrades:sampledTrades,
   explanation:gold?"Polymarket gold-related event bets are NOT verified spot/futures institutional positioning. Trade direction cannot be inferred from BUY/SELL event shares.":"No verified large-trader positioning feed is connected for this currency pair.",
   evidenceSource:gold?"Polymarket public prediction-market trade sample":null,
   dataAsOf:gold&&typeof whaleData?.asOf==="string"?whaleData.asOf:null};
 });
 return NextResponse.json({status:"RESEARCH_ONLY",decision:"NO_WHALE_CONFIRMED_TRADES",checkedAt:new Date().toISOString(),
  technicalScanStatus:scan.status==="fulfilled"?scanData?.status:"UNAVAILABLE",
  whaleFeedStatus:whales.status==="fulfilled"?whaleData?.status:"UNAVAILABLE",
  comparisons,
  warning:"Prediction-market wallet trades are not institutional gold or FX whale flow. CFTC positioning is delayed and cannot confirm a 1–4 hour entry. No trade is whale-confirmed."},
  {headers:{"Cache-Control":"no-store"}});
}
