import Link from "next/link";

type ModuleCardProps = {
  description: string;
  href: string;
  name: string;
  status: "UI BOUNDARY" | "NOT CONFIGURED";
  icon: string;
};

export function ModuleCard({ description, href, icon, name, status }: ModuleCardProps) {
  return (
    <article className="group flex min-h-[218px] flex-col rounded-xl border border-slate-800 bg-[#0c1828] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition-colors hover:border-blue-500/35">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 font-mono text-sm font-semibold text-blue-200">
          {icon}
        </span>
        <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {status}
        </span>
      </div>
      <h2 className="mt-5 text-base font-semibold text-slate-100">{name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <span className="text-[10px] text-slate-500">Data: not configured</span>
        <Link
          className="text-xs font-semibold text-blue-300 transition-colors hover:text-blue-200"
          href={href}
        >
          Open module <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
