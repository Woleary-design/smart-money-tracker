import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
type Result={name:string;status:"PASS"|"FAIL";detail:string};
export async function GET(){
 const results:Result[]=[];
 const check=(name:string,ok:boolean,detail:string)=>results.push({name,status:ok?"PASS":"FAIL",detail});
 const now=Date.now();
 const price=(value:unknown,time:unknown)=>{
  if(typeof value!=="number"||!Number.isFinite(value)||value<=0||typeof time!=="number"||!Number.isFinite(time))return null;
  if(time*1000>now+60000||now-time*1000>1200000)return null;
  return {value,time};
 };
 check("Reject missing price",price(null,now/1000)===null,"Null must not become a tradable price");
 check("Reject zero price",price(0,now/1000)===null,"Zero is invalid");
 check("Reject stale price",price(4000,(now-3600000)/1000)===null,"Older than 20 minutes");
 check("Reject future timestamp",price(4000,(now+300000)/1000)===null,"Future-dated price");
 check("Accept fresh numeric observation",price(4000,(now-60000)/1000)!==null,"Fresh price passes basic shape checks");
 check("No execution configured",!process.env.OCTA_TRADING_PASSWORD,"Trade execution must remain disabled");
 const passed=results.every(x=>x.status==="PASS");
 return NextResponse.json({status:passed?"PASS":"FAIL",scope:"STATIC_SAFETY_CHECKS_ONLY",results,checkedAt:new Date().toISOString(),
  warning:"These checks do not verify live providers, whale feeds, broker quotes or full end-to-end trade performance."},{status:passed?200:503,headers:{"Cache-Control":"no-store"}});
}
