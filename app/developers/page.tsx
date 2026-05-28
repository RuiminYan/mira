import Link from "next/link";
import { Section } from "@/components/Section";

export const metadata = {
  title: "开发者文档",
  description: "Mira 镜界 公开 API · Webhook · 鉴权 · 速率限制 · 代码示例。",
};

const ENDPOINTS: { method: string; path: string; scope: string; desc: string }[] = [
  { method: "GET", path: "/api/v1/me", scope: "me:read", desc: "查询当前 API Key 所属用户的基础信息与已授权 scope" },
  { method: "GET", path: "/api/v1/talents", scope: "talents:read", desc: "列出形象,支持 ?status=live&tag=御姐&limit=20&offset=0" },
  { method: "GET", path: "/api/v1/talents/{id}", scope: "talents:read", desc: "形象详情(含 bio / 价格 / 分账)" },
  { method: "GET", path: "/api/v1/orders", scope: "orders:read", desc: "列出我的订单(按 Key 主人身份自动过滤 partner/creator)" },
  { method: "GET", path: "/api/v1/orders/{id}", scope: "orders:read", desc: "订单详情(含合同 / 交付包 ID)" },
  { method: "POST", path: "/api/v1/orders", scope: "orders:write", desc: "创建订单(仅 partner 角色) body: { talentId, projectName, scope }" },
  { method: "GET", path: "/api/v1/webhooks", scope: "webhooks:read", desc: "列出我订阅的 Webhook 与状态" },
];

const EVENTS: { name: string; desc: string }[] = [
  { name: "order.paid", desc: "订单完成支付,推送给买卖双方" },
  { name: "order.settled", desc: "订单结算入账" },
  { name: "order.refunded", desc: "订单退款 / 仲裁支持制作方" },
  { name: "talent.approved", desc: "形象通过审核进入选角广场" },
  { name: "review.created", desc: "新增评价" },
  { name: "verification.approved", desc: "用户完成实名" },
];

const SIGNATURE_NOTE =
  "Webhook 请求头中 X-Mira-Signature 是 hex(hmacSha256(secret, rawBody)) ;请用同样算法在服务端比对,不一致即视为伪造。";

const CURL_EXAMPLE = `curl -s "https://example/api/v1/talents?status=live&limit=5" \\
  -H "Authorization: Bearer mira_live_xxxxxxxx_${"x".repeat(32)}"`;

const NODE_EXAMPLE = `const res = await fetch("/api/v1/orders", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.MIRA_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ talentId: 1, projectName: "新品 TVC", scope: "全网授权 6 个月" }),
});
const json = await res.json();
console.log(json.data);`;

const PY_EXAMPLE = `import os, requests
r = requests.get(
  "https://example/api/v1/talents",
  headers={"Authorization": f"Bearer {os.environ['MIRA_KEY']}"},
  params={"status": "live", "limit": 20},
)
print(r.json()["data"])`;

const WEBHOOK_VERIFY = `import crypto, json
def verify(secret: str, raw_body: bytes, signature: str) -> bool:
    mac = crypto.hmac.new(secret.encode(), raw_body, "sha256").hexdigest()
    return crypto.compare_digest(mac, signature)`;

export default function DevelopersPage() {
  return (
    <>
      <Section
        eyebrow="DEVELOPERS"
        title={<><span className="text-gradient">公开 API</span> · Webhook · 一目了然</>}
        subtitle="所有公开数据都可以通过简洁的 REST 调用拿到;关键业务事件也可通过 Webhook 实时推送到你的服务。"
      >
        <div className="grid gap-3 md:grid-cols-3 mb-10">
          <Stat label="API 端点" value="7" />
          <Stat label="Webhook 事件" value="6" />
          <Stat label="速率限制" value="按套餐" />
        </div>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <Link
            href="/me/apikeys"
            className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 font-medium"
          >
            创建我的 API Key
          </Link>
          <Link
            href="/me/webhooks"
            className="rounded-md border border-line-2 px-4 py-2 text-ink-2"
          >
            管理 Webhook
          </Link>
          <Link href="/pricing" className="rounded-md px-4 py-2 text-ink-3 hover:text-ink">
            了解套餐 →
          </Link>
        </div>
      </Section>

      <Section eyebrow="AUTHENTICATION" title="鉴权">
        <p className="text-[14px] text-ink-2 leading-7 max-w-2xl">
          所有 API 请求都必须携带{" "}
          <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[12.5px]">Authorization: Bearer mira_live_&lt;prefix&gt;_&lt;secret&gt;</code>
          。Key 由系统在创建时一次性返回,后续不再展示;丢失只能撤销重发。
        </p>
        <pre className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-bg/40 p-4 text-[12.5px] leading-6">{CURL_EXAMPLE}</pre>
      </Section>

      <Section eyebrow="ENDPOINTS" title="端点速查表">
        <div className="rounded-[14px] border border-line overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-white/[0.04] text-ink-3 text-[11.5px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3 font-medium">方法</th>
                <th className="text-left px-4 py-3 font-medium">路径</th>
                <th className="text-left px-4 py-3 font-medium">所需 scope</th>
                <th className="text-left px-4 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={e.method + e.path} className="border-t border-line">
                  <td className="px-4 py-3">
                    <span className={
                      "inline-block rounded px-2 py-0.5 text-[11px] font-mono " +
                      (e.method === "GET" ? "bg-cyan-500/20 text-cyan-200" : "bg-pink-500/20 text-pink-200")
                    }>
                      {e.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-ink">{e.path}</td>
                  <td className="px-4 py-3 text-ink-3 font-mono text-[12px]">{e.scope}</td>
                  <td className="px-4 py-3 text-ink-2">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="CODE SAMPLES" title="代码示例">
        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock title="Node.js (POST 创建订单)">{NODE_EXAMPLE}</CodeBlock>
          <CodeBlock title="Python (GET 形象列表)">{PY_EXAMPLE}</CodeBlock>
        </div>
      </Section>

      <Section eyebrow="WEBHOOKS" title="Webhook 事件">
        <p className="text-[14px] text-ink-2 leading-7 max-w-2xl">
          在{" "}
          <Link href="/me/webhooks" className="text-brand-2 underline underline-offset-2">/me/webhooks</Link>{" "}
          配置回调地址 + 关注事件,系统将以 JSON POST 推送;5 次失败后自动暂停。
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {EVENTS.map((e) => (
            <div key={e.name} className="rounded-[12px] border border-line bg-surface/40 p-4">
              <div className="font-mono text-[13px] text-brand-2">{e.name}</div>
              <div className="mt-1 text-[12.5px] text-ink-3">{e.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-md bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-[13px] text-amber-200">
          {SIGNATURE_NOTE}
        </div>
        <CodeBlock title="校验签名 (Python)" className="mt-4">{WEBHOOK_VERIFY}</CodeBlock>
      </Section>

      <Section eyebrow="ERRORS" title="错误约定">
        <div className="rounded-[14px] border border-line overflow-x-auto">
          <table className="w-full min-w-[440px] text-[13px]">
            <thead className="bg-white/[0.04] text-ink-3 text-[12px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3 font-medium">HTTP</th>
                <th className="text-left px-4 py-3 font-medium">含义</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["400", "请求体或参数缺失 / 不合法"],
                ["401", "未携带 Authorization 或 Key 无效 / 已撤销"],
                ["403", "Key 缺少所需 scope"],
                ["404", "资源不存在"],
                ["413", "上传过大"],
                ["500", "服务器内部错误"],
              ].map(([code, label]) => (
                <tr key={code} className="border-t border-line">
                  <td className="px-4 py-3 font-mono">{code}</td>
                  <td className="px-4 py-3 text-ink-2">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function CodeBlock({ children, title, className = "" }: { children: string; title: string; className?: string }) {
  return (
    <div className={"rounded-[12px] border border-line bg-surface/40 overflow-hidden " + className}>
      <div className="border-b border-line px-4 py-2 text-[12px] text-ink-3">{title}</div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-6">{children}</pre>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-[14px] p-5">
      <div className="text-[11px] uppercase tracking-widest text-ink-3 mb-3">{label}</div>
      <div className="text-[26px] font-semibold text-gradient leading-none">{value}</div>
    </div>
  );
}
