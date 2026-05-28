import Link from "next/link";
import { Section } from "@/components/Section";
import { globalSearch, type SearchScope } from "@/lib/search";

export const metadata = { title: "搜索" };

const TABS: { key: string; label: string; scope?: SearchScope }[] = [
  { key: "all", label: "全部" },
  { key: "talents", label: "人才", scope: "talents" },
  { key: "orders", label: "订单", scope: "orders" },
  { key: "users", label: "用户", scope: "users" },
  { key: "notifications", label: "通知", scope: "notifications" },
  { key: "docs", label: "文档", scope: "docs" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const tab = sp.tab ?? "all";
  const scopes: SearchScope[] | undefined =
    tab === "all" ? undefined : TABS.find((t) => t.key === tab)?.scope ? [TABS.find((t) => t.key === tab)!.scope!] : undefined;

  const results = q ? globalSearch(q, scopes) : null;

  const totalForTab = (key: string): number => {
    if (!results) return 0;
    if (key === "all") {
      return results.talents.length + results.orders.length + results.users.length + results.notifications.length + results.docs.length;
    }
    const scope = TABS.find((t) => t.key === key)?.scope;
    if (!scope) return 0;
    return results[scope].length;
  };

  return (
    <Section eyebrow="SEARCH" title="全站搜索">
      <form method="get" action="/search" className="mb-6 flex gap-2">
        <label htmlFor="search-q" className="sr-only">关键词</label>
        <input
          id="search-q"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="输入人才名称、订单、通知关键词..."
          className="flex-1 rounded-md bg-bg/40 border border-line px-3 py-2 text-[14px] focus:border-brand outline-none"
          autoFocus
        />
        <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13.5px] font-medium">
          搜索
        </button>
      </form>

      {!q ? (
        <div className="rounded-md border border-dashed border-line px-4 py-12 text-center text-ink-3 text-[13.5px]">
          支持搜索 人才 / 订单 / 用户 / 通知 / 文档。快捷键 <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px]">Ctrl/⌘ K</kbd> 也可唤起。
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2 text-[13px]">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/search?q=${encodeURIComponent(q)}&tab=${t.key}`}
                className={
                  "rounded-md px-3 py-1.5 " +
                  (tab === t.key ? "bg-white/[0.08] text-ink" : "text-ink-3 hover:text-ink")
                }
              >
                {t.label}
                {totalForTab(t.key) > 0 && (
                  <span className="ml-1 text-ink-4">({totalForTab(t.key)})</span>
                )}
              </Link>
            ))}
          </div>
          {!results ? null : (
            <div className="grid gap-6">
              {(tab === "all" || tab === "talents") && (
                <ResultGroup title="人才" items={results.talents} />
              )}
              {(tab === "all" || tab === "orders") && (
                <ResultGroup title="订单" items={results.orders} />
              )}
              {(tab === "all" || tab === "users") && (
                <ResultGroup title="用户" items={results.users} />
              )}
              {(tab === "all" || tab === "notifications") && (
                <ResultGroup title="通知" items={results.notifications} />
              )}
              {(tab === "all" || tab === "docs") && (
                <ResultGroup title="文档 / 套餐 / 徽章" items={results.docs} />
              )}
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function ResultGroup({
  title,
  items,
}: {
  title: string;
  items: { id: number; name: string; sub: string; href: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">{title}</div>
      <div className="grid gap-2">
        {items.map((it) => (
          <Link
            key={title + "-" + it.id}
            href={it.href}
            className="rounded-md border border-line bg-surface/40 px-4 py-3 hover:border-line-2 hover:bg-white/[0.04]"
          >
            <div className="text-[14px] font-medium text-ink truncate">{it.name}</div>
            <div className="text-[12.5px] text-ink-3 truncate">{it.sub}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
