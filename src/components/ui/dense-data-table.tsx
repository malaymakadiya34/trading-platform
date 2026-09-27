import type { ReactNode } from "react";

export type DenseTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type DenseTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
};

type DenseDataTableProps = {
  columns: DenseTableColumn[];
  rows: DenseTableRow[];
  emptyContent?: ReactNode;
  ariaLabel: string;
};

export function DenseDataTable({ ariaLabel, columns, emptyContent, rows }: DenseDataTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c1828]">
      <div className="overflow-x-auto">
        <table
          aria-label={ariaLabel}
          className="w-full min-w-[680px] border-collapse text-left text-sm"
        >
          <thead className="border-b border-slate-800 bg-[#0a1422] text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  className={`whitespace-nowrap px-4 py-3 font-semibold ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                  key={column.key}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {rows.map((row) => (
              <tr className="transition-colors hover:bg-slate-800/20" key={row.id}>
                {columns.map((column) => (
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                    key={column.key}
                  >
                    {row.cells[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && emptyContent ? (
        <div className="border-t border-slate-800 p-4">{emptyContent}</div>
      ) : null}
    </div>
  );
}
