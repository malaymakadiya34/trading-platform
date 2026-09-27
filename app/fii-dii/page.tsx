import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function FiiDiiPage() {
  return (
    <AuthenticatedWorkspace nextPath="/fii-dii">
      <FutureModuleBoundary
        description="Institutional activity calculations and date-range fetching are intentionally deferred. This boundary establishes the required trading-day filter journey without inventing records."
        eyebrow="Markets · institutional activity"
        flow="Default → Latest 10 Trading Days · Filters → 1 Month / 3 Months / 6 Months / Custom"
        title="FII / DII"
      />
    </AuthenticatedWorkspace>
  );
}
