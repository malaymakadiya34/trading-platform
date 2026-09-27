# Phase 10A data-source policy

## Integrated development data

No external NSE market dataset is bundled or fetched automatically. The only immediately usable development records are existing deterministic internal fixtures. They are synthetic calculation fixtures—not observations—and remain visibly isolated from production.

An offline `DevelopmentMarketDataProvider` can load a locally supplied canonical JSON file after its provenance and usage permission have been reviewed. It does not scrape or call NSE, is disabled in production, cannot stream, reports the market closed, and requires every market record to use source/status `DEVELOPMENT_DATA`. EOD/reference values must retain their original timestamps and must never be relabelled live.

This import boundary can validate normalization, database persistence, Market Movement, Sector Heatmap, Index Mover, BTST, Intraday Booster, 15-Min Breakout, FII/DII, and Global Markets only to the extent that the approved input file contains the necessary authentic fields. Missing fields and datasets remain unavailable; they are never inferred.

## Upstox activation

The canonical provider selector accepts `MARKET_DATA_PROVIDER=upstox`. `UPSTOX_ANALYTICS_TOKEN` is read only on the server. The adapter supports canonical batch/single quotes, historical candles, option-chain contract evidence, actual instrument/contract metadata, market status, and a decoded-feed transport boundary feeding the existing ingestion and WebSocket pipeline.

The default instrument loader retrieves Upstox's official NSE and BSE instrument JSON files. It does not retrieve NSE website pages. Provider-specific fields remain inside the adapter.

Before live activation:

1. Activate the required Upstox account and exchange segments.
2. Store the read-only Analytics Token in the deployment secret manager.
3. Configure and validate the Upstox V3 authorized WebSocket/protobuf feed transport.
4. Verify quote, OI, volume, depth, option Greeks/IV, instrument rollover, candles, market status, FII/DII, and entitled global-index payloads against current Upstox documentation.
5. Confirm rate/subscription limits, reconnect behavior, source timestamps, delayed flags, static-IP requirements, and redistribution terms.
6. Run end-to-end stale/disconnect/recovery tests before declaring data live.

Until these checks succeed, realtime and absent FII/DII/global data stay `UNAVAILABLE`, `DELAYED`, `STALE`, or `MARKET_CLOSED` as applicable.
