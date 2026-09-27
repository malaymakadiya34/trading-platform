import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function BtstScannerPage() {
  return (
    <AuthenticatedWorkspace nextPath="/btst-scanner">
      <FutureModuleBoundary
        description="The F&O-only BTST module will be connected to deterministic screening, option-chain records, and configurable evaluation rules in a future phase."
        eyebrow="Scanners · BTST"
        flow="Setup → Stock → CE/PE → ATM + ITM1 + ITM2 → Option Details"
        title="BTST Scanner"
      />
    </AuthenticatedWorkspace>
  );
}
