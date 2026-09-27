import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  BtstHeader,
  BtstTable,
  BtstTabs,
  BtstUnavailable,
} from "@/src/components/scanners/btst-workspace";
import { getBtstScanner } from "@/src/server/scanners/btst-scanner-repository";
const setups = [
  "TOP",
  "BULLISH_REVERSAL",
  "BULLISH_MOMENTUM",
  "BEARISH_REVERSAL",
  "BEARISH_MOMENTUM",
] as const;
type Setup = (typeof setups)[number];
export default async function BtstScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const value = (await searchParams).setup;
  const setup: Setup = setups.find((item) => item === value) ?? "TOP";
  return (
    <AuthenticatedWorkspace nextPath="/btst-scanner">
      <div className="space-y-6">
        <BtstHeader />
        <BtstTabs active={setup} />
        <BtstContent setup={setup} />
      </div>
    </AuthenticatedWorkspace>
  );
}
async function BtstContent({ setup }: { setup: Setup }) {
  let data: Awaited<ReturnType<typeof getBtstScanner>> | null = null;
  try {
    data = await getBtstScanner();
  } catch {
    /* canonical error state */
  }
  return data ? <BtstTable data={data} setup={setup} /> : <BtstUnavailable />;
}
