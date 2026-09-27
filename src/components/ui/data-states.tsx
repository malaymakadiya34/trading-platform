import type { ReactNode } from "react";

type StatePanelProps = {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

function StatePanel({ action, compact = false, description, title }: StatePanelProps) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-[#0c1828] ${compact ? "p-4" : "p-6"}`}>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: StatePanelProps) {
  return <StatePanel {...props} />;
}

export function LoadingState({
  description = "The workspace is preparing this view.",
  title = "Loading",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c1828] p-6">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        <div>
          <p className="text-sm font-medium text-slate-200">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  action,
  description = "Please try again. No market result is shown while this view is unavailable.",
  title = "This view could not be loaded",
}: StatePanelProps) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6">
      <p className="text-sm font-medium text-red-200">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StaleDataState({
  description = "Older values are retained only for context and must not be treated as current market data.",
  title = "Data may be stale",
}: {
  description?: string;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4">
      <p className="text-sm font-medium text-amber-200">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
