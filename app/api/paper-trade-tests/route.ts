import {NextResponse} from "next/server";
import {evaluatePaperTrade,type SimulatedTrade,type Observation} from "../../../lib/paper-trade-engine";
export const dynamic="force-dynamic";
export async function GET(){
 const openedAt="2026-01-01T12:00:00.000Z",expiresAt="2026-01-01T16:00:00.000Z";
 const trade:SimulatedTrade={side:"BUY",entry:100,stop:98,target:104,units:1,openedAt,expiresAt};
 const bar=(time:string,low:number,high:number):Observation=>({time,open:100,high,low,close:100});
 const at=new Date("2026-01-01T13:00:00.000Z");
 const stop=evaluatePaperTrade(trade,[bar("2026-01-01T12:15:00.000Z",97,105)],at);
 const target=evaluatePaperTrade(trade,[bar("2026-01-01T12:15:00.000Z",99,105)],at);
 const open=evaluatePaperTrade(trade,[bar("2026-01-01T12:15:00.000Z",99,103)],at);
 const expired=evaluatePaperTrade(trade,[],new Date("2026-01-01T17:00:00.000Z"));
 const tests=[
  {name:"Both levels hit: conservative stop-first",pass:stop.status==="STOP"&&stop.grossPnlUsd===-2},
  {name:"Target hit",pass:target.status==="TARGET"&&target.grossPnlUsd===4},
  {name:"Still open",pass:open.status==="OPEN"},
  {name:"Expiry without observed exit is not fabricated",pass:expired.status==="EXPIRED"&&expired.exitPrice===null},
  {name:"Invalid ordering rejected",pass:evaluatePaperTrade({...trade,stop:105},[],at).status==="INVALID"}
 ];
 return NextResponse.json({status:tests.every(t=>t.pass)?"PASS":"FAIL",scope:"DETERMINISTIC_SYNTHETIC_TESTS",tests,checkedAt:new Date().toISOString(),
 warning:"Synthetic unit tests only. Not live prices, not historical backtesting, and not a trade recommendation."},
 {status:tests.every(t=>t.pass)?200:503,headers:{"Cache-Control":"no-store"}});
}
