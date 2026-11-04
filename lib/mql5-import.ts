/**
 * Offline, read-only parser for an MQL5 Signals history CSV exported by the user.
 * No network calls, broker credentials, trading, or implied marketplace API access.
 * Import output is unverified until reconciled to a source profile.
 */
export type ClosedTrade = {
  symbol: string;
  side: "buy" | "sell";
  openedAt: string;
  closedAt: string;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  commission: number;
  swap: number;
  holdMinutes: number;
};

export type ImportSummary = {
  trades: ClosedTrade[];
  count: number;
  winRatePct: number | null;
  averageHoldMinutes: number | null;
  netProfit: number;
  symbols: string[];
  warnings: string[];
  verification: "unverified_user_export";
};

function parseDelimited(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function numberValue(raw: string): number {
  const value = Number(raw.replace(/\s/g, "").replace(/,/g, ""));
  return raw.trim() && Number.isFinite(value) ? value : NaN;
}

function dateValue(raw: string): Date {
  const normalized = raw.trim().replace(/\./g, "-").replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : normalized + "Z");
}

export function parseMql5HistoryCsv(csv: string): ImportSummary {
  const warnings: string[] = [];
  const firstLine = csv.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length >= firstLine.split(",").length ? ";" : ",";
  const rows = parseDelimited(csv.replace(/^\uFEFF/, ""), delimiter);
  const headerIndex = rows.findIndex(row =>
    row.some(v => /^symbol$/i.test(v)) && row.filter(v => /^time$/i.test(v)).length >= 2
  );
  if (headerIndex < 0) throw new Error("MQL5 trade-history header not found. Expected Time, Type, Volume, Symbol, Price, Time, Price, Commission, Swap, Profit.");
  const header = rows[headerIndex].map(v => v.toLowerCase());
  const indices = (name: string) => header.flatMap((v, i) => v === name ? [i] : []);
  const times = indices("time"), prices = indices("price");
  const type = indices("type")[0], symbol = indices("symbol")[0];
  const profit = indices("profit")[0], commission = indices("commission")[0], swap = indices("swap")[0];
  if (times.length < 2 || prices.length < 2 || [type, symbol, profit].some(v => v === undefined))
    throw new Error("Missing required trade-history columns.");
  const trades: ClosedTrade[] = [];
  let skipped = 0;
  for (const row of rows.slice(headerIndex + 1)) {
    const side = (row[type] ?? "").toLowerCase();
    if (side !== "buy" && side !== "sell") continue; // Ignore balance and non-trade rows.
    const opened = dateValue(row[times[0]] ?? ""), closed = dateValue(row[times[1]] ?? "");
    const entry = numberValue(row[prices[0]] ?? ""), exit = numberValue(row[prices[1]] ?? "");
    const pnl = numberValue(row[profit] ?? "");
    const minutes = (closed.getTime() - opened.getTime()) / 60000;
    if (!row[symbol] || !Number.isFinite(minutes) || minutes < 0 ||
        ![entry, exit, pnl].every(Number.isFinite)) { skipped++; continue; }
    const fee = commission === undefined ? 0 : numberValue(row[commission] ?? "0");
    const carry = swap === undefined ? 0 : numberValue(row[swap] ?? "0");
    if (!Number.isFinite(fee) || !Number.isFinite(carry)) { skipped++; continue; }
    trades.push({
      symbol: row[symbol], side, openedAt: opened.toISOString(), closedAt: closed.toISOString(),
      entryPrice: entry, exitPrice: exit, profit: pnl, commission: fee, swap: carry, holdMinutes: minutes
    });
  }
  if (skipped) warnings.push(`${skipped} malformed trade rows were skipped.`);
  warnings.push("A CSV export is not independently authenticated; verify its source before ranking.");
  warnings.push("Closed-trade data cannot establish intratrade or floating-equity drawdown.");
  warnings.push("CSV profit units depend on the source account currency; no currency conversion applied.");
  const net = (t: ClosedTrade) => t.profit + t.commission + t.swap;
  return {
    trades, count: trades.length,
    winRatePct: trades.length ? 100 * trades.filter(t => net(t) > 0).length / trades.length : null,
    averageHoldMinutes: trades.length ? trades.reduce((sum, t) => sum + t.holdMinutes, 0) / trades.length : null,
    netProfit: trades.reduce((sum, t) => sum + net(t), 0),
    symbols: [...new Set(trades.map(t => t.symbol))].sort(),
    warnings, verification: "unverified_user_export"
  };
}
