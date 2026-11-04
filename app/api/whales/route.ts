import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const API="https://data-api.polymarket.com/v2";
const allowedPeriods=["day","week","month","all"];
const allowedCategories=["overall","finance","economics","crypto"];
const walletPattern=/^0x[a-fA-F0-9]{40}$/;
async function getJson(url:string){
 const response=await fetch(url,{next:{revalidate:120},signal:AbortSignal.timeout(9000),headers:{Accept:"application/json"}});
 if(!response.ok)throw new Error("Polymarket HTTP "+response.status);
 return response.json();
}
export async function GET(request:NextRequest){
 const p=request.nextUrl.searchParams;
 const period=allowedPeriods.includes(p.get("period")??"")?p.get("period")!:"week";
 const category=allowedCategories.includes(p.get("category")??"")?p.get("category")!:"finance";
 const wallet=p.get("wallet");
 try{
  if(wallet){
   if(!walletPattern.test(wallet))return NextResponse.json({error:"Invalid public wallet address"},{status:400});
   const u=new URL(API+"/positions");u.searchParams.set("user",wallet);u.searchParams.set("limit","30");
   const positions=await getJson(u.toString());
   return NextResponse.json({kind:"positions",wallet,source:u.toString(),fetchedAt:new Date().toISOString(),data:Array.isArray(positions.data)?positions.data:[],pagination:positions.pagination??null,warning:"Prediction-market holdings, not XAU/USD broker positions. Do not copy trades."});
  }
  const u=new URL(API+"/leaderboard");
  u.searchParams.set("time_period",period);u.searchParams.set("category",category);u.searchParams.set("sort_by","PNL");u.searchParams.set("limit","25");
  const result=await getJson(u.toString());
  if(!Array.isArray(result.data))throw new Error("Unexpected leaderboard response");
  const data=result.data.map((row:Record<string,unknown>)=>({
   rank:row.rank,user_id:row.user_id,user_name:row.user_name,pnl:row.pnl,volume:row.volume
  }));
  return NextResponse.json({kind:"leaderboard",period,category,source:u.toString(),fetchedAt:new Date().toISOString(),data,warning:"Leaderboard P&L is not risk-adjusted or evidence of future results; prediction-market trades are not spot-gold trades."});
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"Data unavailable",data:[],fetchedAt:new Date().toISOString()},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
