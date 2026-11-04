export const dynamic="force-dynamic";
const watchlist=[
 ["XAU/USD","Trend continuation"],["XAU/USD","Support/resistance reversal"],
 ["EUR/USD","Range breakout"],["GBP/USD","Trend pullback"],["USD/JPY","Momentum confirmation"]
];
export default function Opportunities(){
 return <main style={{maxWidth:980,margin:"36px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/">← Dashboard</a><h1>Trade Opportunity Board</h1>
 <p>Gold and forex opportunities, designed for 1–4 hour holding periods. Multiple setups are monitored independently.</p>
 <section style={{padding:20,border:"1px solid #64748b",borderRadius:12,marginBottom:24}}>
  <h2>Current decision: NO VALIDATED TRADES</h2>
  <p>Live multi-market candles, event risk, executable spreads and independent sentiment must be connected before this board can issue ranked trade proposals.</p>
  <p>Illustrative account: $200 · Maximum planned loss per idea at 1%: $2. Actual position sizing must account for broker contract size and costs.</p>
 </section>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
 {watchlist.map(([symbol,strategy],i)=><article key={i} style={{padding:20,border:"1px solid #64748b",borderRadius:12}}>
  <h2>{symbol}</h2><p><strong>{strategy}</strong></p>
  <p>Status: Awaiting verified market feeds</p><p>Direction: —</p><p>Entry / Stop / Target: —</p>
  <p>Evidence: incomplete</p>
 </article>)}
 </div>
 <p style={{marginTop:28}}>A high rank will require fresh candles, a confirmed setup, news clearance, spread checks, sourced sentiment and a reward/risk ratio of at least 1.5. The app will not fill missing values with guesses.</p>
 <p><a href="/api/opportunities">View machine-readable opportunity status</a></p>
 </main>;
}
