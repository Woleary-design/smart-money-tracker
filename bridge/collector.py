"""Read-only Octa MT5 diagnostic collector. Runs on Windows with MT5 installed.
Never uses order_send, stores no passwords and makes no outbound uploads.
Launch MT5 and log in using an investor password before running this script.
"""
import json
import os
import time
from datetime import datetime, timezone
import MetaTrader5 as mt5

SYMBOLS = [s.strip() for s in os.getenv("MT5_SYMBOLS", "XAUUSD,EURUSD,GBPUSD,USDJPY").split(",") if s.strip()]
INTERVAL = max(30, int(os.getenv("MT5_POLL_SECONDS", "60")))

def utc_now():
    return datetime.now(timezone.utc).isoformat()

def collect():
    info = mt5.account_info()
    if info is None:
        raise RuntimeError("MT5 account not connected: " + str(mt5.last_error()))
    results = []
    for requested in SYMBOLS:
        # Do not silently substitute an unrelated instrument.
        if not mt5.symbol_select(requested, True):
            results.append({"requested": requested, "status": "SYMBOL_UNAVAILABLE"})
            continue
        spec = mt5.symbol_info(requested)
        tick = mt5.symbol_info_tick(requested)
        if spec is None or tick is None:
            results.append({"requested": requested, "status": "QUOTE_UNAVAILABLE"})
            continue
        results.append({
            "symbol": requested, "status": "OK",
            "bid": tick.bid, "ask": tick.ask,
            "quote_time_utc": datetime.fromtimestamp(tick.time, timezone.utc).isoformat(),
            "contract_size": spec.trade_contract_size,
            "volume_min": spec.volume_min, "volume_step": spec.volume_step,
            "volume_max": spec.volume_max,
            "tick_size": spec.trade_tick_size, "tick_value": spec.trade_tick_value,
            "stops_level_points": spec.trade_stops_level,
            "digits": spec.digits,
        })
    positions = mt5.positions_get()
    if positions is None:
        raise RuntimeError("Unable to read open positions: " + str(mt5.last_error()))
    # Do not print account login number or order ticket identifiers.
    return {
        "collected_at_utc": utc_now(),
        "mode": "READ_ONLY", "account_connected": True,
        "currency": info.currency, "balance": info.balance,
        "equity": info.equity, "margin": info.margin,
        "free_margin": info.margin_free, "open_positions_count": len(positions),
        "symbols": results,
    }

def main():
    if not mt5.initialize():
        raise RuntimeError("MT5 terminal initialization failed: " + str(mt5.last_error()))
    try:
        while True:
            try:
                print(json.dumps(collect(), separators=(",", ":")), flush=True)
            except Exception as exc:
                print(json.dumps({"status": "READ_ERROR", "time": utc_now(), "error": str(exc)}), flush=True)
            time.sleep(INTERVAL)
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    main()
