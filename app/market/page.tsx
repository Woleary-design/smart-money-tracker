export const dynamic = "force-dynamic";

type Quote = { symbol: string; mid?: number; bid?: number; ask?: number; marketState?: string; stale?: boolean; quoteAgeSeconds?: number; dayDiffPercent?: number; error?: string };
const symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"];
async function quote(symbol: string): Promise<Quote> {
  try {
    const res = await fetch(`https://biquote.io/api/${symbol}`, {next:{revalidate:60}, signal:AbortSignal.timeout(7000)});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const v = data?.data && typeof data.data === "object" ? data.data : data;
    const mid = Number(v.mid), bid = Number(v.bid), ask = Number(v.ask);
    const age = Number(v.quoteAgeSeconds);
    return {symbol, mid:Number.isFinite(mid)&&mid>0?mid:undefined,
      bid:Number.isFinite(bid)&&bid>0?bid:undefined,ask:Number.isFinite(ask)&&ask>0?ask:undefined,
      marketState:typeof v.marketState==="string"?v.marketState:undefined,
      stale:v.stale===true,quoteAgeSeconds:Number.isFinite(age)&&age>=0?age:undefined,
      dayDiffPercent:Number.isFinite(Number(v.dayDiffPercent))?Number(v.dayDiffPercent):undefined};
  } catch (e) {return {symbol,error:e instanceof Error?e.message:"Feed unavailable"};}
}
export default async function Market() {
  const quotes = await Promise.all(symbols.map(quote));
  const gold = quotes[0];
  const fresh = !!gold.mid && gold.stale===false && gold.marketState!=="closed" &&
    gold.quoteAgeSeconds!==undefined && gold.quoteAgeSeconds<=120;
  const decision = fresh ? "WAIT — price available, but a validated multi-timeframe setup is not yet available." :
    "NO TRADE — gold quote is unavailable, stale, closed or not sufficiently validated.";
  return <main style={{maxWidth:1000,margin:"40px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
    <a href="/">← Smart Money Tracker</a>
    <h1>Market intelligence</h1>
    <p>Automatic, read-only gold and forex monitoring. Quotes are indicative CFD prices, not executable broker offers.</p>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16}}>
      {quotes.map(q=><article key={q.symbol} style={{padding:20,border:"1px solid #475569",borderRadius:12}}>
        <h2>{q.symbol}</h2>
        <div style={{fontSize:28,fontWeight:700}}>{q.mid?.toLocaleString("en-US",{maximumFractionDigits:5})??"Unavailable"}</div>
        <p>Market: {q.marketState??"Unknown"}</p>
        <p>Quote age: {q.quoteAgeSeconds===undefined?"Unknown":q.quoteAgeSeconds+" seconds"}</p>
        <p>Feed: {q.error??(q.stale?"Stale":"Indicative")}</p>
      </article>)}
    </section>
    <section style={{marginTop:28,padding:24,border:"1px solid #64748b",borderRadius:12}}>
      <h2>Gold trade proposal</h2>
      <p><strong>{decision}</strong></p>
      <p>No entry, stop-loss, take-profit or confidence score is invented from a single quote. A future proposal must require historical candles, multiple timeframe confirmation, event risk checks, spread/slippage allowance and a defined risk budget.</p>
    </section>
    <p style={{marginTop:24}}>Market-data source: <a href="https://biquote.io">Biquote</a> (indicative MT5 broker feed). Provider availability, latency and licensing must be validated before production reliance.</p>
    <p>Execution is disabled. This page does not use MQL5 account credentials or place orders.</p>
  </main>;
}
