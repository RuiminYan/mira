import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { ALL_SCOPES, SCOPE_LABEL, parseScopes } from "@/lib/apikey";
import { createApiKey, revokeApiKey } from "@/app/actions/apikeys";

export const metadata = { title: "我的 API Key" };

export default async function MyApiKeys({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; ok?: string; err?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/apikeys");
  const sp = await searchParams;

  const keys = db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, u.id))
    .orderBy(desc(schema.apiKeys.createdAt))
    .all();

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">开发者</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">我的 API Key</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        通过 API Key 调用公开 REST 接口。<strong className="text-ink">创建后只展示一次明文,丢失只能撤销重发。</strong>
        集成参考{" "}
        <a className="text-brand-2 underline underline-offset-2" href="/developers">
          开发者文档
        </a>
        。
      </p>

      {sp.new && (
        <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="text-[12px] uppercase tracking-widest text-amber-200 mb-2">新 KEY · 只展示一次</div>
          <code className="block break-all font-mono text-[13px] text-amber-100">{sp.new}</code>
          <div className="mt-2 text-[12px] text-amber-200/80">请立刻复制到安全位置。关闭此页后将无法再次获取明文。</div>
        </div>
      )}
      {sp.ok === "revoke" && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已撤销。
        </div>
      )}

      <div className="mt-8 rounded-[14px] border border-line bg-surface/40 p-5">
        <div className="text-[14px] font-medium mb-3">创建新 Key</div>
        <form action={createApiKey} className="grid gap-4 md:grid-cols-3">
          <label htmlFor="key-name" className="grid gap-1 md:col-span-1">
            <span className="text-[12px] text-ink-3">名称</span>
            <input
              id="key-name"
              name="name"
              required
              maxLength={60}
              placeholder="如 自动化机器人 / 数据同步"
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px]"
            />
          </label>
          <div className="md:col-span-2">
            <div className="text-[12px] text-ink-3 mb-1">授权范围 (scope)</div>
            <div className="flex flex-wrap gap-3">
              {ALL_SCOPES.map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                  <input type="checkbox" name="scope" value={s} defaultChecked={s !== "orders:write"} />
                  <span className="font-mono text-[12px]">{s}</span>
                  <span className="text-ink-4 text-[11.5px]">({SCOPE_LABEL[s]})</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13.5px] font-medium">
              生成 Key
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10">
        <div className="text-[13px] font-medium text-ink-2 mb-3">已创建的 Key ({keys.length})</div>
        {keys.length === 0 ? (
          <div className="rounded-md border border-dashed border-line px-4 py-10 text-center text-ink-3 text-[13px]">
            尚未创建任何 Key
          </div>
        ) : (
          <div className="rounded-md border border-line overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-white/[0.04] text-ink-3">
                <tr>
                  <th className="text-left px-3 py-2">名称</th>
                  <th className="text-left px-3 py-2">前缀</th>
                  <th className="text-left px-3 py-2">Scope</th>
                  <th className="text-left px-3 py-2">最近使用</th>
                  <th className="text-left px-3 py-2">状态</th>
                  <th className="text-left px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const scope = parseScopes(k.scope);
                  return (
                    <tr key={k.id} className="border-t border-line">
                      <td className="px-3 py-2 text-ink">{k.name}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-ink-3">mira_live_{k.prefix}_***</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {scope.map((s) => (
                            <span key={s} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono text-ink-3">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-ink-3">
                        {k.lastUsedAt ? new Date(k.lastUsedAt * 1000).toLocaleString("zh-CN") : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {k.revokedAt ? (
                          <span className="rounded-full bg-red-500/15 text-red-300 px-2 py-0.5 text-[11px]">已撤销</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[11px]">活跃</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {!k.revokedAt && (
                          <form action={revokeApiKey}>
                            <input type="hidden" name="id" value={k.id} />
                            <button className="text-[12.5px] text-ink-3 hover:text-red-300">撤销</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
