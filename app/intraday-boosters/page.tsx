import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  BoosterControls,
  BoosterTable,
  ScannerHeader,
  ScannerUnavailable,
} from "@/src/components/scanners/intraday-scanner-workspace";
import { getIntradayBoosters } from "@/src/server/scanners/intraday-scanner-repository";

const allowedThresholds = [3, 4, 5];
const allowedSorts = ["MOVEMENT", "EXTREME_DISTANCE", "RELATIVE_VOLUME"] as const;
const allowedDistances = [0.5, 1, 2];
export default async function IntradayBoostersPage({
  searchParams,
}: {
  searchParams: Promise<{
    threshold?: string;
    direction?: string;
    sort?: string;
    distance?: string;
  }>;
}) {
  const query = await searchParams;
  const parsed = Number(query.threshold);
  const threshold = allowedThresholds.includes(parsed) ? parsed : 3;
  const direction = query.direction === "DOWN" ? "DOWN" : "UP";
  const sortBy = allowedSorts.find((item) => item === query.sort) ?? "MOVEMENT";
  const parsedDistance = Number(query.distance);
  const maxDistancePct = allowedDistances.includes(parsedDistance) ? parsedDistance : undefined;
  return (
    <AuthenticatedWorkspace nextPath="/intraday-boosters">
      <div className="space-y-6">
        <ScannerHeader
          title="Intraday Boosters"
          description="F&O stocks crossing configurable ±3%, ±4% or ±5% movement thresholds, with distance from the relevant day extreme and available volume context."
        />
        <BoosterControls
          threshold={threshold}
          direction={direction}
          sortBy={sortBy}
          maxDistance={maxDistancePct?.toString() ?? ""}
        />
        <BoosterContent
          threshold={threshold}
          direction={direction}
          sortBy={sortBy}
          maxDistancePct={maxDistancePct}
        />
      </div>
    </AuthenticatedWorkspace>
  );
}
async function BoosterContent({
  threshold,
  direction,
  sortBy,
  maxDistancePct,
}: {
  threshold: number;
  direction: "UP" | "DOWN";
  sortBy: "MOVEMENT" | "EXTREME_DISTANCE" | "RELATIVE_VOLUME";
  maxDistancePct?: number;
}) {
  let data: Awaited<ReturnType<typeof getIntradayBoosters>> | null = null;
  try {
    data = await getIntradayBoosters({ threshold, direction, sortBy, maxDistancePct });
  } catch {
    /* Canonical error state below. */
  }
  return data ? <BoosterTable data={data} /> : <ScannerUnavailable error />;
}
