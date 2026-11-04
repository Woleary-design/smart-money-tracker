import {NextResponse} from "next/server";
import {assessWhales} from "../../../lib/whale-confirmation";
export const dynamic="force-dynamic";
export async function GET(){
 const watchlist=[{symbol:"XAU/USD",direction:"BUY" as const},{symbol:"XAU/USD",direction:"SELL" as const},
 {symbol:"EUR/USD",direction:"BUY" as const},{symbol:"GBP/USD",direction:"BUY" as const},{symbol:"USD/JPY",direction:"SELL" as const}];
 // Do not infer a directional whale signal from market odds or unverified wallets.
 // Verified position deltas can be passed to assessWhales once live feeds are connected.
 return NextResponse.json({asOf:new Date().toISOString(),status:"AWAITING_VERIFIED_POSITIONING",
  assessments:watchlist.map(x=>({...x,...assessWhales(x.symbol,x.direction,[])})),
  note:"No live whale evidence is connected. Polymarket event bets and CFTC weekly futures positioning require separate interpretation."},
  {headers:{"Cache-Control":"no-store"}});
}
