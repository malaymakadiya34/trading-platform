type ModuleCardProps = {
  description: string;
  name: string;
};

export function ModuleCard({ description, name }: ModuleCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-[#111f32] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10 text-blue-300">
          <span aria-hidden="true" className="text-lg">
            ·
          </span>
        </div>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500">
          Foundation
        </span>
      </div>
      <h2 className="text-base font-semibold text-slate-100">{name}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Not configured yet
      </div>
    </article>
  );
}
