# Octa MT5 read-only bridge

## Confirmed from user's Octa app screenshot
- Account platform: MT5 (real)
- Server: OctaFX-Real
- Leverage shown: 1:1000
- Swap-free: enabled

Do not commit account numbers, credentials, investor passwords or screenshots containing them.

## Recommended architecture
1. Run an official MetaTrader 5 terminal on a Windows machine/VPS, logged in with a **read-only investor password** (not a master trading password).
2. Run a small local MT5 Python collector using the official MetaTrader5 Python integration. Verify that the investor session permits required account_info, positions_get, symbol_info_tick, symbol_info and copy_rates_from_pos reads.
3. Collector sends only allowlisted account summary, symbol metadata, quote timestamps and OHLC bars to a server endpoint over TLS, using a revocable ingestion token stored in environment variables (never committed).
4. Server validates timestamps, symbols, account identity, schema and source before updating the opportunity engine. Never accept a price without a source timestamp.
5. Do not implement order_send or any trade execution path. Any proposals remain for manual review in Octa.

## Implementation prerequisites
- A secure endpoint with authentication, per-account isolation, replay protection and rate limits.
- User-approved hosting location and investor credentials entered directly on the Windows bridge, not in chat.
- Confirm Octa's supported MT5 investor-password provisioning and account login process.
- Broker-specific contract size, minimum volume, volume step, stop levels, margin, spread, tick size and tick value must be read from symbol_info and checked before position sizing.
- Start with demo or isolated read-only verification before production use.
- Do not claim live access until the collector is connected and its data is checked against the terminal.

## Important
The Octa mobile application is an account manager; the MT5 bridge connects to the MT5 broker server via the official desktop terminal, not by automating the mobile app.
