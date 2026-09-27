import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import { GlobalMarketsBoundary } from "@/src/components/market/global-markets-boundary";

export default function GlobalMarketsPage() {
  return (
    <AuthenticatedWorkspace nextPath="/global-markets">
      <GlobalMarketsBoundary />
    </AuthenticatedWorkspace>
  );
}
