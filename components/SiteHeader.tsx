"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Menu, X, ChevronDown, Bell, Globe } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export type HeaderUser = {
  id: number;
  nickname: string;
  role: "creator" | "partner" | "admin" | "mcn";
  unread?: number;
  walletBalance?: number;
};

export type HeaderLabels = {
  navProduct: string;
  navMarket: string;
  navMarketplace: string;
  navInsights: string;
  navStudio: string;
  navTeam: string;
  navContact: string;
  navHelp: string;
  signIn: string;
  ctaStart: string;
  openDashboard: string;
  signOut: string;
  identity: string;
  myOrders: string;
  myRevenue: string;
  myNfts: string;
  myWallet: string;
  myProfile: string;
  myInvite: string;
  bell: string;
  language: string;
  roleCreator: string;
  rolePartner: string;
  roleAdmin: string;
  roleMcn: string;
};

export function SiteHeader({
  user,
  locale,
  labels,
  switchAction,
}: {
  user: HeaderUser | null;
  locale: "zh" | "en";
  labels: HeaderLabels;
  switchAction: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NAV = [
    { href: "/product", label: labels.navProduct },
    { href: "/marketplace", label: labels.navMarketplace },
    { href: "/studio", label: labels.navStudio },
    { href: "/insights", label: labels.navInsights },
    { href: "/team", label: labels.navTeam },
    { href: "/contact", label: labels.navContact },
    { href: "/help", label: labels.navHelp },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
          <Logo />
          <span className="text-[15px] tracking-wide">
            Mira <span className="text-ink-3 font-normal">镜界</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-[13.5px]">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "rounded-md px-3 py-1.5 transition " +
                  (active
                    ? "bg-white/[0.08] text-ink"
                    : "text-ink-3 hover:text-ink hover:bg-white/[0.04]")
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-2">
          <LangSwitcher
            locale={locale}
            pathname={pathname || "/"}
            action={switchAction}
            label={labels.language}
          />
          <ThemeToggle />
          {user && <BellLink unread={user.unread ?? 0} label={labels.bell} />}
          {user ? (
            <UserMenu user={user} labels={labels} />
          ) : (
            <>
              <Link
                href={`/login?next=${encodeURIComponent(pathname || "/")}`}
                className="rounded-md px-3 py-1.5 text-[14px] text-ink-3 hover:text-ink"
              >
                {labels.signIn}
              </Link>
              <Link
                href="/login?role=creator"
                className="rounded-md px-4 py-1.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition shadow-[0_8px_24px_-12px_rgba(110,89,246,0.55)]"
              >
                {labels.ctaStart}
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto md:hidden flex items-center gap-1">
          <LangSwitcher
            locale={locale}
            pathname={pathname || "/"}
            action={switchAction}
            label={labels.language}
            compact
          />
          <ThemeToggle />
          {user && <BellLink unread={user.unread ?? 0} label={labels.bell} />}
          <button
            aria-label={open ? "Close" : "Menu"}
            className="rounded-md p-2 text-ink-2 hover:bg-white/[0.06]"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-bg/95 backdrop-blur-xl">
          <div className="container-page py-3 flex flex-col">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={
                    "rounded-md px-3 py-2 text-[15px] " +
                    (active ? "text-ink" : "text-ink-3")
                  }
                >
                  {n.label}
                </Link>
              );
            })}
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <Link
                    href={
                      user.role === "creator"
                        ? "/creator"
                        : user.role === "partner"
                          ? "/partner"
                          : user.role === "mcn"
                            ? "/mcn"
                            : "/admin"
                    }
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md bg-white/[0.06] px-3 py-2 text-center text-[14px] text-ink"
                  >
                    {labels.openDashboard}
                  </Link>
                  <MobileLogout label={labels.signOut} onDone={() => setOpen(false)} />
                </>
              ) : (
                <>
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname || "/")}`}
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border border-line-2 px-3 py-2 text-center text-[14px] text-ink-2"
                  >
                    {labels.signIn}
                  </Link>
                  <Link
                    href="/login?role=creator"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-3 py-2 text-center text-[14px] text-white"
                  >
                    {labels.ctaStart}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function LangSwitcher({
  locale,
  pathname,
  action,
  label,
  compact,
}: {
  locale: "zh" | "en";
  pathname: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  compact?: boolean;
}) {
  const target = locale === "zh" ? "en" : "zh";
  const display = locale === "zh" ? "EN" : "中";
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => action(fd))}
      className="inline-flex"
      aria-label={label}
    >
      <input type="hidden" name="locale" value={target} />
      <input type="hidden" name="back" value={pathname} />
      <button
        type="submit"
        disabled={pending}
        className={
          "inline-flex items-center gap-1 rounded-md " +
          (compact ? "px-2 py-2" : "px-2.5 py-1.5") +
          " text-[13px] text-ink-3 hover:text-ink hover:bg-white/[0.06] disabled:opacity-50"
        }
        title={label}
      >
        <Globe size={14} />
        {!compact && <span className="font-medium">{display}</span>}
      </button>
    </form>
  );
}

function UserMenu({ user, labels }: { user: HeaderUser; labels: HeaderLabels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.refresh();
    // allow-button-nav: 登出是 POST mutation,fetch 后程序化重定向回首页,非链接
    router.push("/");
  }

  const dashHref =
    user.role === "creator"
      ? "/creator"
      : user.role === "partner"
        ? "/partner"
        : user.role === "mcn"
          ? "/mcn"
          : "/admin";

  const roleLabel =
    user.role === "creator"
      ? labels.roleCreator
      : user.role === "partner"
        ? labels.rolePartner
        : user.role === "mcn"
          ? labels.roleMcn
          : labels.roleAdmin;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[14px] text-ink-2 hover:text-ink hover:bg-white/[0.06] transition"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] text-[11px] font-medium text-white">
          {user.nickname.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[8em] truncate">{user.nickname}</span>
        <ChevronDown size={14} className="text-ink-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-md border border-line-2 bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden z-40">
          <div className="px-3 py-2 text-[11px] text-ink-4 uppercase tracking-wider border-b border-line">
            {labels.identity} · {roleLabel}
          </div>
          <Link
            href={dashHref}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
          >
            {labels.openDashboard}
          </Link>
          {(user.role === "creator" || user.role === "partner") && (
            <Link
              href={user.role === "creator" ? `/u/${user.id}` : `/p/${user.id}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
            >
              {labels.myProfile} →
            </Link>
          )}
          <Link
            href="/wallet"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
          >
            <span>{labels.myWallet}</span>
            {typeof user.walletBalance === "number" && user.walletBalance > 0 && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            )}
          </Link>
          <Link
            href="/me/invite"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
          >
            {labels.myInvite}
          </Link>
          {user.role === "partner" && (
            <Link
              href="/partner/orders"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
            >
              {labels.myOrders}
            </Link>
          )}
          {user.role === "creator" && (
            <>
              <Link
                href="/creator/revenue"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
              >
                {labels.myRevenue}
              </Link>
              <Link
                href="/creator/nfts"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-white/[0.06] hover:text-ink"
              >
                {labels.myNfts}
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={logout}
            className="block w-full text-left px-3 py-2 text-[13px] text-ink-3 hover:bg-white/[0.06] hover:text-ink border-t border-line"
          >
            {labels.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

function BellLink({ unread, label }: { unread: number; label: string }) {
  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-md p-2 text-ink-2 hover:bg-white/[0.06] hover:text-ink"
      aria-label={unread > 0 ? `${label} ${unread}` : label}
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-1 text-center text-[10px] font-medium leading-[16px] text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

function MobileLogout({ onDone, label }: { onDone: () => void; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        onDone();
        router.refresh();
        // allow-button-nav: 登出是 POST mutation,fetch 后程序化重定向回首页,非链接
        router.push("/");
      }}
      className="flex-1 rounded-md border border-line-2 px-3 py-2 text-[14px] text-ink-3"
    >
      {label}
    </button>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="m-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6E59F6" />
          <stop offset="100%" stopColor="#FF6FB4" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#m-logo-g)" opacity="0.18" />
      <path
        d="M9 22V10l7 8 7-8v12"
        stroke="url(#m-logo-g)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
