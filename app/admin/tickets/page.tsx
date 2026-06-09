import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle, StatTile } from "@/components/DashboardLayout";
import { ADMIN_NAV } from "@/lib/nav";
import {
  listAllTickets,
  ticketStats,
  categoryLabel,
  statusLabel,
  priorityLabel,
  TICKET_STATUS_LIST,
  TICKET_CATEGORIES,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from "@/lib/tickets";
import { batchUpdateTicketsAction, assignSelf, changeTicketStatus } from "@/app/actions/tickets";
import { createLoader, parseAsString } from "nuqs/server";

const loadSearch = createLoader({
  status: parseAsString,
  cat: parseAsString,
  pri: parseAsString,
  assign: parseAsString,
  sort: parseAsString,
  iu: parseAsString,
  ok: parseAsString,
});

const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-300",
  pending: "bg-sky-500/15 text-sky-300",
  resolved: "bg-emerald-500/15 text-emerald-300",
  closed: "bg-white/[0.08] text-ink-3",
  unverified: "bg-violet-500/15 text-violet-300",
};

const PRI_TONE: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-300",
  high: "bg-amber-500/15 text-amber-300",
  normal: "bg-white/[0.06] text-ink-3",
  low: "bg-white/[0.04] text-ink-4",
};

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export const metadata = { title: "工单管理" };

function buildHref(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v.length > 0) usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `/admin/tickets?${s}` : "/admin/tickets";
}

export default async function AdminTicketsList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?role=admin&next=/admin/tickets");
  if (me.role !== "admin") redirect("/");

  const sp = await loadSearch(searchParams);

  const statusFilter = (TICKET_STATUS_LIST as string[]).includes(sp.status || "")
    ? (sp.status as TicketStatus)
    : undefined;
  const catFilter = (TICKET_CATEGORIES as string[]).includes(sp.cat || "")
    ? (sp.cat as TicketCategory)
    : undefined;
  const priFilter = (PRIORITIES as string[]).includes(sp.pri || "")
    ? (sp.pri as TicketPriority)
    : undefined;
  const assignFilter =
    sp.assign === "self" || sp.assign === "unassigned" || sp.assign === "all"
      ? sp.assign
      : undefined;
  const sortKey =
    sp.sort === "priority_desc" || sp.sort === "createdAt_asc"
      ? sp.sort
      : "lastMessageAt_desc";
  const includeUnverified = sp.iu === "1";

  const rows = listAllTickets({
    status: statusFilter,
    includeUnverified,
    category: catFilter,
    priority: priFilter,
    assignedTo: assignFilter,
    sort: sortKey,
    selfId: me.id,
  });

  const stats = ticketStats();
  const now = Math.floor(Date.now() / 1000);

  return (
    <DashboardShell role="管理员 · 工单管理" nav={ADMIN_NAV}>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <StatTile label="累计" value={String(stats.total)} />
        <StatTile
          label="处理中"
          value={String(stats.open + stats.pending)}
          sub={`open ${stats.open} · pending ${stats.pending}`}
        />
        <StatTile label="已解决" value={String(stats.resolved + stats.closed)} />
        <StatTile label="平均解决" value={`${stats.avgResolveHours} h`} />
      </div>

      {sp.ok === "batch" && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[12.5px] text-emerald-200">
          批量操作已完成。
        </div>
      )}

      {/* 状态切换条 */}
      <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
        <FilterPill
          active={!statusFilter}
          href={buildHref({
            cat: catFilter,
            pri: priFilter,
            assign: assignFilter,
            sort: sortKey === "lastMessageAt_desc" ? undefined : sortKey,
            iu: includeUnverified ? "1" : undefined,
          })}
          label={`全部 ${stats.total}`}
        />
        {TICKET_STATUS_LIST.filter((s) => s !== "unverified").map((s) => (
          <FilterPill
            key={s}
            active={statusFilter === s}
            href={buildHref({
              status: s,
              cat: catFilter,
              pri: priFilter,
              assign: assignFilter,
              sort: sortKey === "lastMessageAt_desc" ? undefined : sortKey,
              iu: includeUnverified ? "1" : undefined,
            })}
            label={`${statusLabel(s)} ${
              s === "open"
                ? stats.open
                : s === "pending"
                  ? stats.pending
                  : s === "resolved"
                    ? stats.resolved
                    : stats.closed
            }`}
          />
        ))}
        <FilterPill
          active={includeUnverified}
          href={buildHref({
            status: statusFilter,
            cat: catFilter,
            pri: priFilter,
            assign: assignFilter,
            sort: sortKey === "lastMessageAt_desc" ? undefined : sortKey,
            iu: includeUnverified ? undefined : "1",
          })}
          label="显示未验证"
        />
      </div>

      {/* 二级过滤:类别 / 优先级 / 分派 / 排序 */}
      <div className="mb-5 grid gap-2 md:grid-cols-4">
        <Select
          label="类别"
          name="cat"
          current={catFilter || ""}
          searchKeys={["status", "pri", "assign", "sort", "iu"]}
          sp={sp}
          options={[
            { value: "", label: "全部类别" },
            ...TICKET_CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) })),
          ]}
        />
        <Select
          label="优先级"
          name="pri"
          current={priFilter || ""}
          searchKeys={["status", "cat", "assign", "sort", "iu"]}
          sp={sp}
          options={[
            { value: "", label: "全部优先级" },
            ...PRIORITIES.map((p) => ({ value: p, label: priorityLabel(p) })),
          ]}
        />
        <Select
          label="分派"
          name="assign"
          current={assignFilter || ""}
          searchKeys={["status", "cat", "pri", "sort", "iu"]}
          sp={sp}
          options={[
            { value: "", label: "全部分派" },
            { value: "self", label: "分配给我" },
            { value: "unassigned", label: "未分派" },
            { value: "all", label: "已分派" },
          ]}
        />
        <Select
          label="排序"
          name="sort"
          current={sortKey}
          searchKeys={["status", "cat", "pri", "assign", "iu"]}
          sp={sp}
          options={[
            { value: "lastMessageAt_desc", label: "最近活跃" },
            { value: "priority_desc", label: "优先级 ↓" },
            { value: "createdAt_asc", label: "创建时间 ↑" },
          ]}
        />
      </div>

      <PanelTitle hint={`${rows.length} 条`}>工单列表</PanelTitle>
      {rows.length === 0 ? (
        <div className="glass rounded-[14px] p-10 text-center text-ink-3">无匹配工单。</div>
      ) : (
        <form action={batchUpdateTicketsAction}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              name="op"
              value="assign_self"
              className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]"
            >
              批量分配给我
            </button>
            <button
              type="submit"
              name="op"
              value="resolve"
              className="rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-[13px] text-emerald-200"
            >
              批量标记已解决
            </button>
            <button
              type="submit"
              name="op"
              value="close"
              className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 text-[13px]"
            >
              批量关闭
            </button>
            <span className="text-[11.5px] text-ink-4 ml-1">勾选下方工单后点击</span>
          </div>
          <div className="glass rounded-[14px] overflow-hidden divide-y divide-line">
            {rows.map((t) => {
              const age = now - t.createdAt;
              const closedish = t.status === "resolved" || t.status === "closed";
              const slaTone =
                !closedish && age > 72 * 3600
                  ? "rose"
                  : !closedish && age > 24 * 3600
                    ? "amber"
                    : null;
              return (
                <div
                  key={t.id}
                  className="p-4 flex flex-wrap items-start gap-3 hover:bg-white/[0.04] transition"
                >
                  <label className="mt-1 inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="ids"
                      value={t.id}
                      className="h-4 w-4 accent-fuchsia-500"
                    />
                  </label>
                  <Link href={`/admin/tickets/${t.id}`} className="min-w-0 flex-1">
                    <div className="text-[12px] text-ink-3 mb-1 flex flex-wrap gap-2 items-center">
                      <span>#{t.id}</span>
                      <span>·</span>
                      <span>{categoryLabel(t.category)}</span>
                      <span>·</span>
                      <span>{t.contactEmail}</span>
                      {slaTone === "rose" && (
                        <span className="rounded-full px-2 py-0.5 text-[10.5px] bg-rose-500/15 text-rose-300">
                          SLA 超时
                        </span>
                      )}
                      {slaTone === "amber" && (
                        <span className="rounded-full px-2 py-0.5 text-[10.5px] bg-amber-500/15 text-amber-300">
                          SLA 临近
                        </span>
                      )}
                      {t.assignedTo && (
                        <span className="text-ink-4">
                          {t.assignedTo === me.id ? "(我)" : `(分派 #${t.assignedTo})`}
                        </span>
                      )}
                    </div>
                    <div className="text-[14.5px] text-ink font-medium leading-snug">
                      {t.subject}
                    </div>
                    <div className="mt-1 text-[11.5px] text-ink-4">
                      更新于 {new Date(t.lastMessageAt * 1000).toLocaleString("zh-CN")}
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 self-center flex-wrap justify-end">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] " + (PRI_TONE[t.priority] || "")
                      }
                    >
                      {priorityLabel(t.priority)}
                    </span>
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] " + STATUS_TONE[t.status]
                      }
                    >
                      {statusLabel(t.status)}
                    </span>
                    {t.assignedTo !== me.id && t.status !== "closed" && (
                      <InlineAction action={assignSelf} ticketId={t.id} label="分配给我" />
                    )}
                    {t.status !== "resolved" && t.status !== "closed" && (
                      <InlineStatus ticketId={t.id} status="resolved" label="解决" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </form>
      )}
    </DashboardShell>
  );
}

function FilterPill({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full px-3 py-1.5 border transition " +
        (active
          ? "border-brand bg-brand-soft text-ink"
          : "border-line text-ink-3 hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}

function Select({
  label,
  name,
  current,
  options,
  searchKeys,
  sp,
}: {
  label: string;
  name: string;
  current: string;
  options: { value: string; label: string }[];
  searchKeys: string[];
  sp: Record<string, string | null | undefined>;
}) {
  return (
    <form className="flex items-center gap-2">
      {searchKeys.map((k) =>
        sp[k] ? <input key={k} type="hidden" name={k} value={sp[k]!} /> : null
      )}
      <span className="text-[11.5px] text-ink-4 w-12 shrink-0">{label}</span>
      <select
        name={name}
        defaultValue={current}
        className="w-full rounded-md border border-line bg-bg/40 px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand/70"
      >
        {options.map((o) => (
          <option key={o.value || "__all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1.5 text-[12px]"
      >
        筛选
      </button>
    </form>
  );
}

function InlineAction({
  action,
  ticketId,
  label,
}: {
  action: (fd: FormData) => Promise<void>;
  ticketId: number;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <button
        type="submit"
        className="rounded-md bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1 text-[11.5px]"
      >
        {label}
      </button>
    </form>
  );
}

function InlineStatus({
  ticketId,
  status,
  label,
}: {
  ticketId: number;
  status: TicketStatus;
  label: string;
}) {
  return (
    <form action={changeTicketStatus}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 text-[11.5px] text-emerald-200"
      >
        {label}
      </button>
    </form>
  );
}
