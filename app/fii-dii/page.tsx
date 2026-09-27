import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  InstitutionalFilters,
  InstitutionalHeader,
  InstitutionalTable,
  InstitutionalUnavailable,
} from "@/src/components/market/institutional-activity-workspace";
import type { InstitutionalPreset } from "@/src/domain/institutional-activity/ranges.mjs";
import { getInstitutionalActivity } from "@/src/server/institutional-activity/repository";
const presets = ["10D", "1M", "3M", "6M", "CUSTOM"] as const;
export default async function FiiDiiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const preset: InstitutionalPreset = presets.find((item) => item === query.range) ?? "10D";
  return (
    <AuthenticatedWorkspace nextPath="/fii-dii">
      <div className="space-y-6">
        <InstitutionalHeader />
        <InstitutionalFilters preset={preset} from={query.from} to={query.to} />
        <InstitutionalContent preset={preset} from={query.from} to={query.to} />
      </div>
    </AuthenticatedWorkspace>
  );
}
async function InstitutionalContent({
  preset,
  from,
  to,
}: {
  preset: InstitutionalPreset;
  from?: string;
  to?: string;
}) {
  if (preset === "CUSTOM" && (!from || !to || from > to))
    return <InstitutionalUnavailable invalid />;
  let data: Awaited<ReturnType<typeof getInstitutionalActivity>> | null = null;
  try {
    data = await getInstitutionalActivity({ preset, from, to });
  } catch {
    /* canonical unavailable state */
  }
  return data ? <InstitutionalTable data={data} /> : <InstitutionalUnavailable />;
}
