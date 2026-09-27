import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  MarketMovementHeader,
  MarketMovementUnavailable,
  SectorHeatmap,
  SectorStockTable,
} from "@/src/components/market/market-movement-workspace";
import {
  getMarketMovementOverview,
  getSectorStocks,
} from "@/src/server/market-data/repositories/market-movement-repository";

export default async function SectorHeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector } = await searchParams;
  return (
    <AuthenticatedWorkspace
      nextPath={sector ? `/sector-heatmap?sector=${encodeURIComponent(sector)}` : "/sector-heatmap"}
    >
      <SectorHeatmapContent sector={sector} />
    </AuthenticatedWorkspace>
  );
}

async function SectorHeatmapContent({ sector }: { sector?: string }) {
  let failed = false;
  let sectorData: Awaited<ReturnType<typeof getSectorStocks>> = null;
  let overview: Awaited<ReturnType<typeof getMarketMovementOverview>> | null = null;
  try {
    if (sector) sectorData = await getSectorStocks(sector);
    else overview = await getMarketMovementOverview();
  } catch {
    failed = true;
  }
  if (failed)
    return (
      <>
        <MarketMovementHeader
          title="Sector Heatmap"
          description="Normalized sector and constituent market context."
        />
        <MarketMovementUnavailable error />
      </>
    );
  if (sector)
    return (
      <div className="space-y-6">
        <MarketMovementHeader
          title="Sector Heatmap"
          description="Sector drill-down uses current instrument-master memberships; unavailable metrics remain visibly unavailable."
        />
        {sectorData ? <SectorStockTable data={sectorData} /> : <MarketMovementUnavailable />}
      </div>
    );
  return (
    <div className="space-y-6">
      <MarketMovementHeader
        title="Sector Heatmap"
        description="Accessible movement intensity, breadth and centrally configured activity sizing across normalized sectors."
      />
      <SectorHeatmap sectors={overview?.sectors ?? []} />
    </div>
  );
}
