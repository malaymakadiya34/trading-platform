import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function Breakout15mPage() {
  return (
    <AuthenticatedWorkspace nextPath="/breakout-15m">
      <FutureModuleBoundary
        description="The future scanner must evaluate completed fifteen-minute candles, confirmation, and invalidation rules. No breakout result is emitted from this Phase 4 boundary."
        eyebrow="Scanners · 15-minute"
        flow="Confirmed Upside → CE → ATM + ITM1 + ITM2 · Confirmed Downside → PE → ATM + ITM1 + ITM2"
        title="15-Min Breakout"
      />
    </AuthenticatedWorkspace>
  );
}
