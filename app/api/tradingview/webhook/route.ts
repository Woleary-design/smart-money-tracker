import {NextRequest,NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const symbols=new Set(["XAUUSD","EURUSD","GBPUSD","USDJPY"]);
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export async function POST(request:NextRequest){
 const secret=process.env.TRADINGVIEW_WEBHOOK_SECRET;
 if(!secret||secret.length<24)return NextResponse.json({error:"Webhook not configured"},{status:503});
 const supplied=request.headers.get("x-webhook-secret")??"";
 // TradingView alerts cannot set custom headers: use a secret in the JSON body.
 let payload:unknown;
 try{const raw=await request.text();if(raw.length>4096)throw Error("oversized");payload=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!payload||typeof payload!=="object"||Array.isArray(payload))return NextResponse.json({error:"Invalid payload"},{status:400});
 const data=payload as Record<string,unknown>;
 const token=typeof data.secret==="string"?data.secret:supplied;
 if(!equal(token,secret))return NextResponse.json({error:"Unauthorized"},{status:401});
 const symbol=typeof data.symbol==="string"?data.symbol.replace(/[^A-Z]/g,""):"";
 const action=data.action;
 const price=data.price;
 const timestamp=data.timestamp;
 if(!symbols.has(symbol)||!["BUY","SELL","EXIT"].includes(String(action))||typeof price!=="number"||!Number.isFinite(price)||price<=0||typeof timestamp!=="number"||!Number.isFinite(timestamp)||Math.abs(Date.now()-timestamp)>120000)
  return NextResponse.json({error:"Invalid or stale signal"},{status:422});
 // No persistent storage configured; explicitly reject rather than falsely acknowledge.
 return NextResponse.json({status:"NOT_STORED",message:"Authenticated signal validated, but persistence and alert delivery are not configured. No trading action taken."},{status:503,headers:{"Cache-Control":"no-store"}});
}
