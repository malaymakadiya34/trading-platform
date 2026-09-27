import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import { ScannerOptionsPage } from "@/src/components/scanners/scanner-options-page";
export default async function BtstOptionsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ direction?: string }>;
}) {
  const { symbol } = await params;
  const direction = (await searchParams).direction === "DOWN" ? "DOWN" : "UP";
  return (
    <AuthenticatedWorkspace nextPath={`/btst-scanner/options/${encodeURIComponent(symbol)}`}>
      <ScannerOptionsPage symbol={symbol} direction={direction} returnHref="/btst-scanner" />
    </AuthenticatedWorkspace>
  );
}
