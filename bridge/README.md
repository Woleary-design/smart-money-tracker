# Octa MT5 Windows VPS bridge — stage 1

This is a **local read-only diagnostic collector**, not a cloud-connected bridge yet. It does not submit orders or transmit account data to Smart Money Tracker.

## VPS prerequisites
- Windows Server VPS with desktop access, MT5 terminal installed and adequate memory/disk for 24/7 operation.
- Use an Octa MT5 investor password for the terminal, if supported and confirmed by Octa. **Never provide your main password or investor password in ChatGPT or GitHub.**
- Install a supported 64-bit Python and the official MetaTrader5 Python package.

## Run
1. Log into MT5 using the read-only investor credential. Confirm the server and broker match the intended account.
2. Open PowerShell in the bridge directory.
3. Run `py -m pip install -r requirements.txt`.
4. Run `py collector.py`. The script prints redacted account summary and broker quotes every 60 seconds.
5. Check symbol names: Octa may use suffixes or alternative naming. Set `MT5_SYMBOLS` to the exact names shown in Market Watch. Do not assume XAUUSD is available under that exact name.
6. Verify quote timestamps, contract size, spread and volume constraints against MT5.

## Security / rollout
- The script deliberately has **no network uploader** or server credentials. The next stage requires authenticated ingestion, TLS, per-account isolation, replay protection, and no public account endpoints.
- The Python MT5 package generally interacts with a locally installed Windows MT5 terminal. It is not a direct API to Octa's mobile app.
- Run on a demo or investor login first. Confirm investor restrictions; never implement `order_send`.
- Store any eventual ingestion secrets in the Windows credential store or environment, never in the repo.
- Windows VPS uptime, patching, secure RDP and auto-restart require separate configuration.
- The script is diagnostic and has not been executed against the user's Octa account.
