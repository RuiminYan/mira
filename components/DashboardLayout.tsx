import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardShell({
  role,
  nav,
  children,
}: {
  role: string;
  nav: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <section className="container-page py-10 md:py-14">
      <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">{role}</div>
          <h1 className="text-[28px] md:text-[34px] font-semibold leading-tight">
            <span className="text-gradient">Mira</span> 后台
          </h1>
        </div>
        <nav className="hidden md:flex gap-1 text-[13px]">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-white/[0.06] transition"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="md:hidden mb-6 flex gap-1 overflow-x-auto text-[13px]">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-white/[0.06] transition"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-[14px] p-5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-3">{label}</div>
      <div className="text-[26px] font-semibold text-gradient leading-none">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-ink-3">{sub}</div>}
    </div>
  );
}

export function PanelTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div className="text-[15px] font-semibold text-ink">{children}</div>
      {hint && <div className="text-[12px] text-ink-3">{hint}</div>}
    </div>
  );
}
