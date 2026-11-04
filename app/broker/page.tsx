export const dynamic="force-dynamic";
export default function Broker(){
 return <main style={{maxWidth:850,margin:"40px auto",padding:"0 20px",fontFamily:"system-ui,sans-serif"}}>
 <a href="/">← Dashboard</a><h1>OctaTrader connection</h1>
 <section style={{border:"1px solid #64748b",borderRadius:12,padding:20}}>
 <h2>Connection status: Not connected</h2>
 <p><strong>Mode:</strong> Read-only research. <strong>Order execution:</strong> Disabled.</p>
 <p>OctaTrader does not have a verified public read-only account API in our integration. Smart Money Tracker cannot currently retrieve your actual account balance, positions or Octa bid/ask prices.</p>
 </section>
 <h2>What works independently</h2>
 <p>The app can research gold and forex opportunities using separately sourced market data, and propose trades for you to review manually in OctaTrader once verified feeds are available.</p>
 <h2>Secure connection requirements</h2>
 <ol><li>Confirm an officially supported OctaTrader read-only data access or export method with Octa support.</li>
 <li>Use only documented, revocable permissions. Never paste your password or session cookie into Smart Money Tracker.</li>
 <li>Validate the account's symbol specifications, spread, lot minimum and contract size before sizing any trade.</li>
 <li>Keep all order placement disabled unless you explicitly request a separately reviewed execution workflow.</li></ol>
 <p>Octa's official help pages describe viewing account details and order history in your profile, but that is not evidence of third-party API access.</p>
 <p><a href="https://www.octabroker.com/education/faq/category/personal-information-and-access-data/" target="_blank" rel="noreferrer">Octa account help</a></p>
 <p><a href="/api/broker/octa">Machine-readable connection status</a></p>
 </main>;
}
