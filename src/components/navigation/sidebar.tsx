"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/src/components/auth/logout-button";
import { navigationGroups } from "@/src/components/navigation/navigation-items";

type SidebarProps = {
  userName: string | null;
  userEmail: string;
};

function isActive(pathname: string, href: string) {
  const path = href.split("#")[0];
  return pathname === path;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#091321] lg:sticky lg:top-0 lg:flex">
      <div className="border-b border-slate-800/80 px-5 py-5">
        <Link className="flex items-center gap-3" href="/dashboard">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 font-mono text-sm font-bold text-slate-950">
            TP
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-white">
              Trading Platform
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">Market intelligence</span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5"
      >
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-blue-500/12 font-medium text-blue-200"
                          : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <div className="rounded-lg bg-slate-900/60 p-3">
          <p className="truncate text-xs font-medium text-slate-200">
            {userName || "Signed-in user"}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{userEmail}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
