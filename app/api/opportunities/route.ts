import {NextResponse} from "next/server";
import {rankOpportunities} from "../../../lib/opportunities";
export const dynamic="force-dynamic";
const watchlist=[
 {symbol:"XAU/USD",strategy:"Trend continuation",horizon:"1–4 hours"},
 {symbol:"XAU/USD",strategy:"Support/resistance reversal",horizon:"1–4 hours"},
 {symbol:"EUR/USD",strategy:"Range breakout",horizon:"1–4 hours"},
 {symbol:"GBP/USD",strategy:"Trend pullback",horizon:"1–4 hours"},
 {symbol:"USD/JPY",strategy:"Momentum confirmation",horizon:"1–4 hours"}
];
export async function GET(){
 // Never manufacture a trade from a quote or unsourced example.
 const ranked=rankOpportunities([]);
 return NextResponse.json({status:"MONITORING",decision:"NO_VALIDATED_TRADES",accountUsd:200,maxRiskPerIdeaUsd:2,
  watchlist:watchlist.map(w=>({...w,status:"AWAITING_VERIFIED_FEEDS",direction:null,entry:null,stop:null,target:null,reason:"Multi-market candles, economic-event checks, spread and independent sentiment feeds not all connected"})),
  opportunities:ranked,asOf:new Date().toISOString(),
  requirements:["Recent closed candles","Pattern and trend confirmation","Economic calendar clearance","Spread validation","Sourced sentiment","Minimum 1.5 reward/risk"],
  note:"Rankings will only appear after independent data and execution-cost gates pass. Research only; no automatic orders."},{headers:{"Cache-Control":"no-store"}});
}
