-- CreateEnum
CREATE TYPE "ExchangeCode" AS ENUM ('NSE', 'BSE', 'NFO', 'GLOBAL');
CREATE TYPE "InstrumentKind" AS ENUM ('STOCK', 'INDEX', 'SECTOR');
CREATE TYPE "ContractKind" AS ENUM ('FUTURE', 'OPTION');
CREATE TYPE "OptionType" AS ENUM ('CE', 'PE');
CREATE TYPE "CandleTimeframe" AS ENUM ('MINUTE_1', 'MINUTE_5', 'MINUTE_15', 'DAILY');

CREATE TABLE "exchanges" (
  "id" TEXT NOT NULL,
  "code" "ExchangeCode" NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "market_open" TEXT NOT NULL,
  "market_close" TEXT NOT NULL,
  CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exchanges_code_key" ON "exchanges"("code");

CREATE TABLE "instruments" (
  "id" TEXT NOT NULL,
  "exchange_id" TEXT NOT NULL,
  "kind" "InstrumentKind" NOT NULL,
  "symbol" TEXT NOT NULL,
  "normalized_symbol" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "isin" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "is_fno_eligible" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "instruments_exchange_id_normalized_symbol_key" ON "instruments"("exchange_id", "normalized_symbol");
CREATE INDEX "instruments_kind_active_idx" ON "instruments"("kind", "active");
CREATE INDEX "instruments_normalized_symbol_idx" ON "instruments"("normalized_symbol");

CREATE TABLE "instrument_memberships" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "child_id" TEXT NOT NULL,
  "weight" DECIMAL(12,6),
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  CONSTRAINT "instrument_memberships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "instrument_memberships_parent_id_child_id_effective_from_key" ON "instrument_memberships"("parent_id", "child_id", "effective_from");
CREATE INDEX "instrument_memberships_child_id_idx" ON "instrument_memberships"("child_id");

CREATE TABLE "contracts" (
  "id" TEXT NOT NULL,
  "exchange_id" TEXT NOT NULL,
  "underlying_id" TEXT NOT NULL,
  "kind" "ContractKind" NOT NULL,
  "option_type" "OptionType",
  "contract_symbol" TEXT NOT NULL,
  "normalized_symbol" TEXT NOT NULL,
  "expiry" TIMESTAMP(3) NOT NULL,
  "strike" DECIMAL(24,8),
  "lot_size" INTEGER,
  "tick_size" DECIMAL(12,8),
  "metadata" JSONB,
  CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "contracts_exchange_id_normalized_symbol_key" ON "contracts"("exchange_id", "normalized_symbol");
CREATE INDEX "contracts_underlying_id_expiry_kind_idx" ON "contracts"("underlying_id", "expiry", "kind");
CREATE INDEX "contracts_expiry_strike_option_type_idx" ON "contracts"("expiry", "strike", "option_type");

CREATE TABLE "market_quotes" (
  "id" TEXT NOT NULL,
  "instrument_id" TEXT,
  "contract_id" TEXT,
  "last_price" DECIMAL(24,8) NOT NULL,
  "change" DECIMAL(24,8),
  "change_pct" DECIMAL(12,6),
  "volume" DECIMAL(30,8),
  "open_interest" DECIMAL(30,8),
  "as_of" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL,
  "is_delayed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "market_quotes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "market_quotes_instrument_id_as_of_idx" ON "market_quotes"("instrument_id", "as_of");
CREATE INDEX "market_quotes_contract_id_as_of_idx" ON "market_quotes"("contract_id", "as_of");
CREATE INDEX "market_quotes_as_of_idx" ON "market_quotes"("as_of");

CREATE TABLE "historical_candles" (
  "id" TEXT NOT NULL,
  "instrument_id" TEXT,
  "contract_id" TEXT,
  "timeframe" "CandleTimeframe" NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "open" DECIMAL(24,8) NOT NULL,
  "high" DECIMAL(24,8) NOT NULL,
  "low" DECIMAL(24,8) NOT NULL,
  "close" DECIMAL(24,8) NOT NULL,
  "volume" DECIMAL(30,8),
  "open_interest" DECIMAL(30,8),
  "source" TEXT NOT NULL,
  CONSTRAINT "historical_candles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "historical_candles_instrument_id_contract_id_timeframe_starts_at_key" ON "historical_candles"("instrument_id", "contract_id", "timeframe", "starts_at");
CREATE INDEX "historical_candles_instrument_id_timeframe_starts_at_idx" ON "historical_candles"("instrument_id", "timeframe", "starts_at");
CREATE INDEX "historical_candles_contract_id_timeframe_starts_at_idx" ON "historical_candles"("contract_id", "timeframe", "starts_at");

CREATE TABLE "market_holidays" (
  "id" TEXT NOT NULL,
  "exchange_id" TEXT NOT NULL,
  "trading_date" DATE NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "market_holidays_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "market_holidays_exchange_id_trading_date_key" ON "market_holidays"("exchange_id", "trading_date");

ALTER TABLE "instruments" ADD CONSTRAINT "instruments_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instrument_memberships" ADD CONSTRAINT "instrument_memberships_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instrument_memberships" ADD CONSTRAINT "instrument_memberships_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_underlying_id_fkey" FOREIGN KEY ("underlying_id") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "market_quotes" ADD CONSTRAINT "market_quotes_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_quotes" ADD CONSTRAINT "market_quotes_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historical_candles" ADD CONSTRAINT "historical_candles_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historical_candles" ADD CONSTRAINT "historical_candles_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_holidays" ADD CONSTRAINT "market_holidays_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
