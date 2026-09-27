# Production deployment and market-data configuration

## Provider status

No licensed market-data vendor or credentials are configured in this repository. Production market data must not be considered live until an approved adapter implementing the canonical `MarketDataProvider` has been registered, connected, and validated against the provider's licensed responses.

The adapter must support quotes/batch quotes, historical candles, option chains, instrument master and contract metadata, subscriptions, market status, and—when the vendor supplies them—institutional and global-market data. Provider-specific payload mapping belongs only in that adapter; it must emit canonical events through `MarketDataIngestionService`.

Required provider configuration:

- `MARKET_DATA_PROVIDER=upstox`: activates the one canonical future Upstox adapter
- `UPSTOX_ANALYTICS_TOKEN`: server-only, read-only Analytics Token

No provider is selected automatically. Never prefix the token with `NEXT_PUBLIC_`, return it from an API, log it, or persist it. The Upstox adapter isolates REST/feed payloads behind `MarketDataProvider`, loads actual NSE/BSE instrument files, and has a feed-transport boundary for the authorized V3 WebSocket/protobuf client. Live activation still requires the account entitlement, secure token, and validation of the feed transport against the active Upstox API.

For offline development only, `MARKET_DATA_PROVIDER=development` and `DEVELOPMENT_DATASET_PATH` may point to a locally supplied canonical JSON dataset whose provenance and usage permission have been reviewed. This provider is prohibited in production, performs no network access, labels every record `DEVELOPMENT_DATA`, reports the market closed, and cannot stream. The repository does not scrape NSE pages, download NSE data automatically, or depend on free/research-only data for production.

## Required environment

- `DATABASE_URL`: PostgreSQL connection URL
- `APP_URL`: exact public application origin; used for WebSocket origin validation
- `REDIS_URL`: optional but recommended for multi-instance realtime latest-state caching/fan-out
- Provider variables listed above
- `MARKET_DATA_MODE=MOCK` is allowed only in non-production development. Production ignores mock ticker mode.

Copy `.env.example` to a secret-managed deployment environment. Do not commit populated values.

## Database

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

PostgreSQL remains authoritative for instruments, contracts, bounded quote snapshots, candles, holidays, users, sessions, and institutional activity. Apply migrations in order. The Phase 9 migration adds active-contract rollover state, query indexing, and canonical quote fields used by real provider ingestion.

## Redis

Redis is temporary infrastructure only. It stores latest quote state with TTLs and may support fan-out/coordination. If it is absent, a bounded in-process cache is used for a single instance and readiness reports Redis as not configured. Redis loss must not delete durable PostgreSQL data.

## Startup and workers

```bash
npm run start
```

The custom server hosts Next.js and authenticated WebSockets at `/api/realtime`. Bind through a TLS-terminating reverse proxy that supports WebSocket upgrades. Run market ingestion and scheduled worker responsibilities in a separately supervised process using the canonical `MarketDataWorker`; do not run perpetual jobs in page requests.

## Health and readiness

- `GET /api/health`: process liveness
- `GET /api/health/db`: PostgreSQL health
- `GET /api/market/readiness`: authenticated database/provider readiness
- `GET /api/market/realtime/status`: authenticated protocol/provider/Redis configuration state
- WebSocket: `/api/realtime`, authenticated by the HTTP-only session cookie

A missing provider is a degraded—not live—state. Do not route production traffic as market-data-ready until provider connection and payload validation succeed.

## Logging and operations

Log provider lifecycle transitions, reconnect attempts, rate limits, validation failures, Redis state, worker failures, and WebSocket close codes without tokens, cookies, credentials, raw secrets, or full provider payloads. Configure external metrics and alerting for stale-feed duration, connection count, dropped/backpressured clients, ingestion failures, and database latency.

## Data integrity and retention

- Sync the licensed instrument master before subscriptions.
- Resolve ATM/ITM contracts only from active listed contracts.
- Deactivate expired/rolled contracts; never infer strike spacing, expiry, or lot size.
- Persist throttled snapshots and aggregated candles, not unlimited raw ticks.
- Do not backfill absent FII/DII or global-market records with estimates.
- Keep transaction-cost, timestamps, option prices, slippage inputs, and market-regime fields available for future evidence-based backtesting; do not publish performance claims without a validated methodology.
