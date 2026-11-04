import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(){
 return NextResponse.json({
  broker:"Octa",platform:"OctaTrader",mode:"READ_ONLY",connection:"NOT_CONNECTED",
  accountDataAvailable:false,liveBrokerQuotesAvailable:false,ordersEnabled:false,
  supportedNow:["Manual account context","Independent market-data research","Trade proposals requiring manual approval"],
  unsupportedUntilVerified:["Direct OctaTrader account balance sync","Open positions sync","OctaTrader live bid/ask sync","Broker order placement"],
  requirements:["Documented authorised read-only API or export mechanism","Permission and security review","Account-specific spread and contract specifications"],
  warning:"No official OctaTrader account API integration has been verified. Do not submit passwords, session cookies or tokens.",
  checkedAt:new Date().toISOString()
 },{headers:{"Cache-Control":"no-store"}});
}
