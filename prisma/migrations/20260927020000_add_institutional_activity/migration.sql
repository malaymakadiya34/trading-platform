CREATE TABLE "institutional_activity" (
  "id" TEXT NOT NULL,
  "trading_date" DATE NOT NULL,
  "fii_buy" DECIMAL(24,4) NOT NULL,
  "fii_sell" DECIMAL(24,4) NOT NULL,
  "fii_net" DECIMAL(24,4) NOT NULL,
  "in_market" DECIMAL(24,4) NOT NULL,
  "dii_net" DECIMAL(24,4) NOT NULL,
  "dii_buy" DECIMAL(24,4) NOT NULL,
  "dii_sell" DECIMAL(24,4) NOT NULL,
  "source" TEXT NOT NULL,
  "as_of" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "institutional_activity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "institutional_activity_trading_date_key" ON "institutional_activity"("trading_date");
CREATE INDEX "institutional_activity_trading_date_idx" ON "institutional_activity"("trading_date");
