"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/src/components/auth/logout-button";
import { navigationGroups } from "@/src/components/navigation/navigation-items";

type MobileNavigationProps = {
  userName: string | null;
};

export function MobileNavigation({ userName }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#091321]/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <Link className="flex items-center gap-2" href="/dashboard" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 font-mono text-xs font-bold text-slate-950">
            TP
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">Trading Platform</span>
            <span className="block text-[10px] text-slate-500">Market intelligence</span>
          </span>
        </Link>
        <button
          aria-controls="mobile-navigation"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav
          aria-label="Mobile navigation"
          className="max-h-[calc(100vh-60px)] overflow-y-auto border-t border-slate-800 px-4 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href.split("#")[0];
                    return (
                      <li key={item.href}>
                        <Link
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-md px-3 py-2 text-sm ${
                            active
                              ? "bg-blue-500/12 text-blue-200"
                              : "text-slate-300 hover:bg-slate-800/70"
                          }`}
                          href={item.href}
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500">{userName || "Signed-in user"}</p>
            <LogoutButton />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
