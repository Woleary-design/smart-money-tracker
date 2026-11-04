"use client";

import { useState } from "react";
import { parseMql5HistoryCsv, type ImportSummary } from "../../lib/mql5-import";

export default function ImportPage() {
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  async function readFile(file: File | undefined) {
    setResult(null); setError("");
    if (!file) return;
    setFileName(file.name);
    if (file.size > 5_000_000) { setError("CSV must be smaller than 5 MB."); return; }
    try {
      const csv = await file.text();
      setResult(parseMql5HistoryCsv(csv));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    }
  }
  const fmt = (n: number | null, suffix = "") => n === null ? "Not available" : n.toFixed(2) + suffix;
  return (
    <main style={{maxWidth: 850, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif"}}>
      <a href="/">← Dashboard</a>
      <h1>MQL5 trading-history analyser</h1>
      <p>Analyse an exported MQL5 Signals history CSV locally in your browser. The file is not uploaded or saved.</p>
      <p><strong>Research only.</strong> This does not copy trades or authenticate the trader's track record.</p>
      <label htmlFor="csv-file"><strong>Choose a history CSV</strong></label>
      <div style={{margin: "12px 0 24px"}}>
        <input id="csv-file" type="file" accept=".csv,text/csv,text/plain" onChange={e => void readFile(e.target.files?.[0])}/>
      </div>
      {error && <p role="alert" style={{color: "crimson"}}>{error}</p>}
      {result && <>
        <h2>{fileName}: closed-trade summary</h2>
        <dl style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16}}>
          <div><dt>Trades</dt><dd><strong>{result.count}</strong></dd></div>
          <div><dt>Win rate</dt><dd><strong>{fmt(result.winRatePct,"%")}</strong></dd></div>
          <div><dt>Average holding time</dt><dd><strong>{fmt(result.averageHoldMinutes," min")}</strong></dd></div>
          <div><dt>Net profit (account currency)</dt><dd><strong>{fmt(result.netProfit)}</strong></dd></div>
        </dl>
        <h3>Instruments</h3>
        <p>{result.symbols.join(", ") || "None found"}</p>
        <h3>Data quality and limitations</h3>
        <ul>{result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        <p><strong>Status:</strong> Unverified user export — not eligible for a verified leaderboard without further evidence.</p>
      </>}
    </main>
  );
}
