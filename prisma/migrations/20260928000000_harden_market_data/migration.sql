ALTER TABLE "contracts" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "contracts_active_expiry_idx" ON "contracts"("active", "expiry");
ALTER TABLE "market_quotes"
  ADD COLUMN "previous_close" DECIMAL(24,8),
  ADD COLUMN "day_open" DECIMAL(24,8),
  ADD COLUMN "day_high" DECIMAL(24,8),
  ADD COLUMN "day_low" DECIMAL(24,8),
  ADD COLUMN "open_interest_change" DECIMAL(30,8),
  ADD COLUMN "bid" DECIMAL(24,8),
  ADD COLUMN "ask" DECIMAL(24,8),
  ADD COLUMN "implied_volatility" DECIMAL(12,6);
