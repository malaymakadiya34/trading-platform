import { EmptyState } from "@/src/components/ui/data-states";

type FutureModuleBoundaryProps = {
  description: string;
  flow: string;
  eyebrow: string;
  title: string;
};

export function FutureModuleBoundary({
  description,
  eyebrow,
  flow,
  title,
}: FutureModuleBoundaryProps) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      </header>
      <section
        aria-label={`${title} future workflow`}
        className="rounded-xl border border-slate-800 bg-[#0c1828] p-5"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Planned interaction boundary
        </p>
        <p className="mt-3 font-mono text-sm leading-7 text-blue-200">{flow}</p>
      </section>
      <EmptyState
        description="This module has a presentation and navigation boundary only. Its data source and business logic are intentionally not implemented in Phase 4."
        title="No module data is available"
      />
    </div>
  );
}
