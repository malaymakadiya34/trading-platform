import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  IndexGrid,
  MarketMovementHeader,
  MarketMovementUnavailable,
  SectorHeatmap,
  StrengthDistribution,
} from "@/src/components/market/market-movement-workspace";
import { getMarketMovementOverview } from "@/src/server/market-data/repositories/market-movement-repository";

export default function MarketMovementPage() {
  return (
    <AuthenticatedWorkspace nextPath="/market-movement">
      <MarketMovementContent />
    </AuthenticatedWorkspace>
  );
}

async function MarketMovementContent() {
  let overview;
  try {
    overview = await getMarketMovementOverview();
  } catch {
    return (
      <>
        <MarketMovementHeader
          title="Market Movement"
          description="Index, sector and breadth context from the normalized market-data layer."
        />
        <MarketMovementUnavailable error />
      </>
    );
  }
  const empty = !overview.indices.length && !overview.sectors.length;
  return (
    <div className="space-y-6">
      <MarketMovementHeader
        title="Market Movement"
        description="Track index context, breadth and zero-centered sector strength before drilling into normalized constituent data."
      />
      {empty ? (
        <MarketMovementUnavailable />
      ) : (
        <>
          <IndexGrid indices={overview.indices} />
          <StrengthDistribution sectors={overview.sectors} />
          <SectorHeatmap sectors={overview.sectors} />
        </>
      )}
    </div>
  );
}
