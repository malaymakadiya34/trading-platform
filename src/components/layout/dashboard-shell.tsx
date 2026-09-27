import type { ReactNode } from "react";

import { MarketSessionStatus } from "@/src/components/market/market-session-status";
import { MarketTicker, type MarketTickerItemData } from "@/src/components/market/market-ticker";
import { MobileNavigation } from "@/src/components/navigation/mobile-header";
import { RealtimeBridge, RealtimeProvider } from "@/src/components/realtime/realtime-provider";
import { Sidebar } from "@/src/components/navigation/sidebar";
import { mockGlobalTickerItems, mockIndianTickerItems } from "@/src/demo/market-ticker";
import { getIndiaMarketSession } from "@/src/server/market-session/service";

type WorkspaceUser = {
  email: string;
  name: string | null;
};

type DashboardShellProps = {
  children: ReactNode;
  user: WorkspaceUser;
};

const unavailableTicker = (
  names: string[],
  currency: "INR" | "USD" = "INR",
): MarketTickerItemData[] =>
  names.map((name) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    value: null,
    absoluteChange: null,
    percentageChange: null,
    currency,
    positive: null,
    marketStatus: "UNKNOWN",
    freshness: "UNKNOWN",
    source: "NOT_CONFIGURED",
  }));
export function DashboardShell({ children, user }: DashboardShellProps) {
  const session = getIndiaMarketSession();
  const demoMode = process.env.MARKET_DATA_MODE === "MOCK" && process.env.NODE_ENV !== "production";
  const indianBase = demoMode
    ? mockIndianTickerItems
    : unavailableTicker([
        "NIFTY 50",
        "BANK NIFTY",
        "FINNIFTY",
        "NIFTY MIDCAP",
        "NIFTY SMALLCAP",
        "NIFTY IT",
        "NIFTY AUTO",
        "NIFTY PHARMA",
        "NIFTY FMCG",
        "BTC/USD",
      ]);
  const indianItems = indianBase.map((item) => ({ ...item, marketStatus: session.state }));
  const globalItems = demoMode
    ? mockGlobalTickerItems
    : unavailableTicker(
        [
          "DOW JONES",
          "S&P 500",
          "NASDAQ",
          "FTSE LONDON",
          "DAX",
          "GIFT NIFTY",
          "NIKKEI 225",
          "HANG SENG",
        ],
        "USD",
      );

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-[#06101c] text-slate-100">
        <MobileNavigation userName={user.name} />
        <div className="flex min-h-screen">
          <Sidebar userEmail={user.email} userName={user.name} />
          <main className="min-w-0 flex-1">
            <div className="border-b border-blue-500/20 bg-blue-500/[0.07] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-200 sm:px-5">
              {demoMode
                ? "Development ticker fixtures are labeled MOCK and never enter the production path"
                : "Licensed market provider not configured · unavailable values are not fabricated"}
            </div>
            <RealtimeBridge />
            <MarketTicker
              description={demoMode ? "Development fixture" : "Provider unavailable"}
              items={indianItems}
              label="Indian markets"
            />
            <MarketTicker
              description={demoMode ? "Development fixture" : "Provider unavailable"}
              items={globalItems}
              label="Global markets"
            />
            <div className="border-b border-slate-800/80 bg-[#081321] px-4 py-3 sm:px-6">
              <div className="mx-auto max-w-[1600px]">
                <MarketSessionStatus session={session} />
              </div>
            </div>
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
