import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  BreakoutControls,
  BreakoutTable,
  ScannerHeader,
  ScannerUnavailable,
} from "@/src/components/scanners/intraday-scanner-workspace";
import { getBreakoutScanner } from "@/src/server/scanners/intraday-scanner-repository";

const allowed = [0.1, 0.25, 0.5, 1];
export default async function Breakout15mPage({
  searchParams,
}: {
  searchParams: Promise<{ near?: string }>;
}) {
  const parsed = Number((await searchParams).near);
  const near = allowed.includes(parsed) ? parsed : 0.25;
  return (
    <AuthenticatedWorkspace nextPath="/breakout-15m">
      <div className="space-y-6">
        <ScannerHeader
          title="15-Min Breakout"
          description="Compares the developing price with the immediately previous completed standard 15-minute candle. A touch is never treated as confirmation."
        />
        <BreakoutControls threshold={near} />
        <BreakoutContent near={near} />
      </div>
    </AuthenticatedWorkspace>
  );
}
async function BreakoutContent({ near }: { near: number }) {
  let data: Awaited<ReturnType<typeof getBreakoutScanner>> | null = null;
  try {
    data = await getBreakoutScanner(near);
  } catch {
    // The canonical empty/error state is rendered below.
  }
  return data ? <BreakoutTable data={data} /> : <ScannerUnavailable error />;
}
