import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import { IndexMoverBoundary } from "@/src/components/market/index-mover-boundary";

export default function IndexMoverPage() {
  return (
    <AuthenticatedWorkspace nextPath="/index-mover">
      <IndexMoverBoundary />
    </AuthenticatedWorkspace>
  );
}
