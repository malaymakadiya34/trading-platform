import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function MarketMovementPage() {
  return (
    <AuthenticatedWorkspace nextPath="/market-movement">
      <FutureModuleBoundary
        description="Market intelligence will progress from an index view to sectors, constituents, and stock details after approved market-data and analytics work is available."
        eyebrow="Market · movement"
        flow="Market → Index → Sector → Stock → Stock Details"
        title="Market Movement"
      />
    </AuthenticatedWorkspace>
  );
}
