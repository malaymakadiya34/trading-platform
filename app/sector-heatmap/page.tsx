import { FutureModuleBoundary } from "@/src/components/dashboard/future-module-boundary";
import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";

export default function SectorHeatmapPage() {
  return (
    <AuthenticatedWorkspace nextPath="/sector-heatmap">
      <FutureModuleBoundary
        description="The heatmap surface will consume normalized instrument membership and approved sector-strength calculations. No intensity, ranking, or stock outcome is fabricated here."
        eyebrow="Market · sector heatmap"
        flow="Market → Index → Sector → Stock → Stock Details"
        title="Sector Heatmap"
      />
    </AuthenticatedWorkspace>
  );
}
