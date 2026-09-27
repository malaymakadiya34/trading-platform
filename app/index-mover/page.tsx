import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import { IndexMoverBoundary } from "@/src/components/market/index-mover-boundary";
export default async function IndexMoverPage({
  searchParams,
}: {
  searchParams: Promise<{ index?: string }>;
}) {
  const requested = (await searchParams).index?.trim().toUpperCase();
  const indexSymbol = requested && /^[A-Z0-9_-]{1,32}$/.test(requested) ? requested : "NIFTY50";
  return (
    <AuthenticatedWorkspace nextPath="/index-mover">
      <IndexMoverBoundary indexSymbol={indexSymbol} />
    </AuthenticatedWorkspace>
  );
}
