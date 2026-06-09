import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  ALL_WEBHOOK_EVENTS,
  EVENT_LABEL,
  parseHookEvents,
} from "@/lib/webhooks";
import { createWebhook, deleteWebhook, pauseWebhook, testWebhook } from "@/app/actions/webhooks";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "我的 Webhook" };

const loadSearch = createLoader({ ok: parseAsString, err: parseAsString });

export default async function MyWebhooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/webhooks");
  const sp = await loadSearch(searchParams);

  const hooks = db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.userId, u.id))
    .orderBy(desc(schema.webhooks.createdAt))
    .all();

  const hookIds = hooks.map((h) => h.id);
  const recentDeliveries = hookIds.length
    ? db
        .select()
        .from(schema.webhookDeliveries)
        .orderBy(desc(schema.webhookDeliveries.createdAt))
        .limit(50)
        .all()
        .filter((d) => hookIds.includes(d.webhookId))
    : [];

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">开发者</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">我的 Webhook</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        订阅业务事件,系统将以 POST 推送 JSON 到你的回调地址。失败 5 次后自动暂停;签名校验详见{" "}
        <a className="text-brand-2 underline underline-offset-2" href="/developers">开发者文档</a>。
      </p>

      {sp.ok && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          {sp.ok === "create" ? "已创建 Webhook" : sp.ok === "toggle" ? "状态已切换" : sp.ok === "delete" ? "已删除" : "测试事件已发出"}
        </div>
      )}
      {sp.err && (
        <div className="mt-4 rounded-md bg-red-500/10 border border-red-500/25 px-3 py-2 text-[13px] text-red-300">
          {sp.err === "url" ? "请填写有效的 http(s) 回调地址" : sp.err === "events" ? "请至少选择一个事件" : "操作失败"}
        </div>
      )}

      <div className="mt-8 rounded-[14px] border border-line bg-surface/40 p-5">
        <div className="text-[14px] font-medium mb-3">创建 Webhook</div>
        <form action={createWebhook} className="grid gap-4">
          <label htmlFor="wh-url" className="grid gap-1">
            <span className="text-[12px] text-ink-3">回调 URL</span>
            <input
              id="wh-url"
              name="url"
              required
              placeholder="https://your-server.example/webhook"
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px] font-mono"
            />
          </label>
          <div>
            <div className="text-[12px] text-ink-3 mb-1">订阅事件</div>
            <div className="flex flex-wrap gap-3">
              {ALL_WEBHOOK_EVENTS.map((e) => (
                <label key={e} className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                  <input type="checkbox" name="event" value={e} defaultChecked={e === "order.paid" || e === "order.settled"} />
                  <span className="font-mono text-[12px]">{e}</span>
                  <span className="text-ink-4 text-[11.5px]">({EVENT_LABEL[e]})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13.5px] font-medium">
              创建
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <div className="text-[13px] font-medium text-ink-2 mb-3">已订阅 ({hooks.length})</div>
        {hooks.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            尚未创建 Webhook
          </div>
        ) : (
          <div className="grid gap-3">
            {hooks.map((h) => {
              const events = parseHookEvents(h.event);
              const recent = recentDeliveries.filter((d) => d.webhookId === h.id).slice(0, 5);
              return (
                <div key={h.id} className="rounded-[12px] border border-line bg-surface/40 p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[13px] text-ink truncate">{h.url}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {events.map((e) => (
                          <span key={e} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono text-ink-3">
                            {e}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[11.5px] text-ink-4">
                        signature key prefix: <code className="font-mono">{h.secret.slice(0, 6)}…</code>
                      </div>
                    </div>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] " +
                        (h.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : h.status === "paused"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-red-500/15 text-red-300")
                      }
                    >
                      {h.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <form action={testWebhook} className="inline-flex items-center gap-2">
                      <input type="hidden" name="id" value={h.id} />
                      <select
                        name="event"
                        className="rounded-md bg-bg/40 border border-line px-2 py-1 text-[12px]"
                        defaultValue="order.paid"
                        aria-label="测试事件"
                      >
                        {ALL_WEBHOOK_EVENTS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <button className="rounded-md bg-white/[0.06] px-3 py-1 text-[12.5px]">测试发送</button>
                    </form>
                    <form action={pauseWebhook} className="inline">
                      <input type="hidden" name="id" value={h.id} />
                      <button className="rounded-md border border-line-2 px-3 py-1 text-[12.5px] text-ink-2">
                        {h.status === "paused" ? "恢复" : "暂停"}
                      </button>
                    </form>
                    <form action={deleteWebhook} className="inline">
                      <input type="hidden" name="id" value={h.id} />
                      <button className="rounded-md px-3 py-1 text-[12.5px] text-ink-3 hover:text-red-300">删除</button>
                    </form>
                    <span className="ml-auto text-[11.5px] text-ink-4">
                      失败 {h.failCount} 次 · 上次 {h.lastDeliveredAt ? new Date(h.lastDeliveredAt * 1000).toLocaleString("zh-CN") : "—"}
                    </span>
                  </div>

                  {recent.length > 0 && (
                    <div className="mt-4 rounded-md border border-line overflow-x-auto">
                      <table className="w-full min-w-[480px] text-[12.5px]">
                        <thead className="bg-white/[0.04] text-ink-3">
                          <tr>
                            <th className="text-left px-3 py-2">时间</th>
                            <th className="text-left px-3 py-2">事件</th>
                            <th className="text-left px-3 py-2">HTTP</th>
                            <th className="text-left px-3 py-2">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recent.map((d) => (
                            <tr key={d.id} className="border-t border-line">
                              <td className="px-3 py-2 text-ink-3">
                                {new Date(d.createdAt * 1000).toLocaleString("zh-CN")}
                              </td>
                              <td className="px-3 py-2 font-mono">{d.event}</td>
                              <td className="px-3 py-2">{d.httpCode ?? "—"}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={
                                    "rounded px-1.5 py-0.5 text-[11px] " +
                                    (d.status === "ok"
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : "bg-red-500/15 text-red-300")
                                  }
                                >
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
