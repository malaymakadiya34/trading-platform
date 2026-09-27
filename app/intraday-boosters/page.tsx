import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function IntradayBoostersPage() {
  return (
    <AuthenticatedWorkspace nextPath="/intraday-boosters">
      <FutureModuleBoundary
        description="No mover threshold, ranking, option selection, or market signal is calculated in this UI-only phase."
        eyebrow="Scanners · intraday"
        flow="Up Stock → CE → ATM + ITM1 + ITM2 · Down Stock → PE → ATM + ITM1 + ITM2"
        title="Intraday Boosters"
      />
    </AuthenticatedWorkspace>
  );
}
