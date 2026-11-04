import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(){
 return NextResponse.json({
  broker:"Octa",platform:"MT5 via Octa mobile app",mode:"MANUAL_EXECUTION_ONLY",
  connection:"NOT_CONNECTED",accountDataAvailable:false,liveBrokerQuotesAvailable:false,
  ordersEnabled:false,vpsRequired:false,credentialsRequired:false,
  strategy:"Cloud-based market intelligence. Research and rank independently sourced gold/forex opportunities; user places any chosen trade manually in Octa.",
  risk:{illustrativeAccountUsd:200,defaultRiskPct:1,maxPlannedLossUsd:2,warning:"Actual lot size and risk depend on broker contract specifications, spread and slippage."},
  note:"Independent market data may differ from Octa executable quotes. No automated account access or execution is planned.",
  checkedAt:new Date().toISOString()
 },{headers:{"Cache-Control":"no-store"}});
}
