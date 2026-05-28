import {
  ScanFace,
  Briefcase,
  Workflow,
  Upload,
  Settings2,
  FileCheck,
  Search,
  ShoppingCart,
  Sparkles,
  Receipt,
  ShieldCheck,
  Video,
  Ruler,
  Clapperboard,
  Coins,
  Layers,
  Wand2,
} from "lucide-react";
import { Section } from "@/components/Section";
import { FeatureCard } from "@/components/Card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "产品架构",
  description: "Mira 镜界 三端架构 · 创作者 / 制作方 / 结算系统 · 把雇佣变成授权 + 分账。",
  openGraph: {
    title: "产品架构",
    description: "Mira 镜界 三端架构 · 创作者 / 制作方 / 结算系统。",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image", title: "产品架构", images: ["/twitter-image"] },
};

const CREATOR_STEPS = [
  { icon: Upload, title: "上传授权数据", desc: "照片、4K 视频、3D 扫描多模态采集,符合采集标准入库即可。" },
  { icon: Settings2, title: "设定授权规则", desc: "按场景(短剧/广告/虚拟主播)、价位、独家与否、分成比例自由配置。" },
  { icon: FileCheck, title: "签署电子合同", desc: "段和段律所版肖像授权合同,自动存证、可追溯。" },
  { icon: Coins, title: "持续收取版税", desc: "一份「母带」反复授权,授权费 + 发行分账长期沉淀。" },
];

const PARTNER_STEPS = [
  { icon: Search, title: "搜素 AI 演员", desc: "按性别/年龄/风格/价位/独家维度筛选,S/A/B 级标签辅助决策。" },
  { icon: ShoppingCart, title: "在线下单授权", desc: "按部/按季度/按框架订单,套餐(闺蜜包/职场包/路人包)灵活组合。" },
  { icon: Wand2, title: "生成 AI 表演", desc: "对接外部生成 API(早期)→ 自研生成工具(规模化),按 Token 计费。" },
  { icon: Receipt, title: "结算与版权交付", desc: "自动出版权交付包,合规存证,平台一键完成分账。" },
];

const SETTLE_STEPS = [
  { icon: ShieldCheck, title: "合规确权", desc: "授权边界写入合同 + 链上存证,可被遗忘权、数据安全条款齐备。" },
  { icon: Coins, title: "智能合约分账", desc: "授权费 / 发行分账按比例自动到账,平台留存抽成。" },
  { icon: Layers, title: "数据资产沉淀", desc: "每个 KOC 的历史授权、复购、分账成为转移成本与定价依据。" },
  { icon: Sparkles, title: "AI 工具变现", desc: "外部 API 加价 10%–15% → 自研工具利润率 30%+,长期主力收入。" },
];

const COLLECT_REQ = [
  { label: "分辨率", value: "4K (3840×2160) 推荐 / 最低 1080P" },
  { label: "帧率", value: "25fps 或 30fps" },
  { label: "格式", value: "MP4 / MOV" },
  { label: "时长", value: "3–5 分钟有效片段" },
  { label: "构图", value: "16:9 横屏,人物面部占画面 1/2 – 2/3" },
  { label: "光线", value: "均匀柔和正面光,纯色背景或绿幕" },
  { label: "着装", value: "禁绿色 / 高反光 / 透明 / 细密条纹格子" },
];

const PRICE_STAGES = [
  {
    tag: "阶段一",
    time: "0–6 月 · MVP 验证",
    items: [
      { k: "单张脸每部一次性授权费", v: "¥100–300" },
      { k: "抽成", v: "暂不抽成,只收授权费佣金" },
      { k: "AI 工具", v: "制作方自行使用外部 API" },
    ],
  },
  {
    tag: "阶段二",
    time: "6–18 月 · 平台成长",
    items: [
      { k: "套餐化", v: "闺蜜包 ¥3000 / 职场包 ¥4000 / 路人包 ¥6000" },
      { k: "分账抽成", v: "3% – 5%" },
      { k: "AI API", v: "平台接入外部 API 加价 10%–15%" },
    ],
  },
  {
    tag: "阶段三",
    time: "18–36 月 · 规模化",
    items: [
      { k: "动态定价", v: "按粉丝量 / 历史分账" },
      { k: "独家溢价", v: "+50% – 100%" },
      { k: "抽成", v: "8% – 10%,自研工具利润率 30%+" },
    ],
  },
];

const REVENUE_MIX = [
  { tag: "L1", title: "交易佣金", pct: "40%", desc: "每笔人脸授权交易抽取 10–20%;品牌定制 / 场景 IP 授权抽成 15%。", payer: "制作方 / 品牌方" },
  { tag: "L2", title: "发行分账", pct: "35%", desc: "授权脸的短剧上线后,从制作方的发行分账收入中抽取 5–10%。", payer: "制作方" },
  { tag: "L3", title: "Token 消耗", pct: "25%", desc: "制作方调用 AI 生成(配角表演),按生成时长或 Token 量付费。", payer: "制作方" },
];

export default function ProductPage() {
  return (
    <>
      <Section
        eyebrow="产品架构"
        title={<>三端联动 · 一张脸,<span className="text-gradient">一辈子的版税</span></>}
        subtitle="创作者把脸资产化,制作方把选角平台化,智能合约把分账自动化。Mira 是整套基础设施。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            tone="brand"
            icon={ScanFace}
            title="创作者端"
            description="把每张脸变成可重复授权的数字资产,被动收入持续滚出。"
          />
          <FeatureCard
            icon={Briefcase}
            title="制作方端"
            description="选角广场 + 一键下单 + 合规交付包,合规配角库即拍即用。"
          />
          <FeatureCard
            icon={Workflow}
            title="结算系统"
            description="智能合约自动分账、版权保护、合规存证,每一笔都透明可追溯。"
          />
        </div>
      </Section>

      <Section tone="raised" eyebrow="创作者端" title="把脸变成资产 · 四步上链">
        <StepRow steps={CREATOR_STEPS} accent="brand" />
      </Section>

      <Section eyebrow="制作方端" title="选角 → 授权 → 生成 → 交付">
        <StepRow steps={PARTNER_STEPS} accent="pink" />
      </Section>

      <Section tone="raised" eyebrow="结算系统" title="让每一笔分账可被追溯">
        <StepRow steps={SETTLE_STEPS} accent="brand" />
      </Section>

      <Section
        id="workflow"
        eyebrow="采集与品控"
        title={<>4K 高质素材入库 · <span className="text-gradient">五步法</span> 资质审核</>}
        subtitle="意愿确认 → 资质审核与尽职调查 → 签法律文件与采集 → 技术初审 → 品控终审。"
      >
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] items-start">
          <div className="glass rounded-[16px] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5 text-ink-3 text-[12px] uppercase tracking-widest">
              <Video size={14} /> 视频采集标准
            </div>
            <div className="grid gap-2">
              {COLLECT_REQ.map((r) => (
                <div key={r.label} className="grid grid-cols-[88px_1fr] gap-3 text-[14px] py-2 border-b border-line last:border-0">
                  <div className="text-ink-3">{r.label}</div>
                  <div className="text-ink">{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-[16px] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5 text-ink-3 text-[12px] uppercase tracking-widest">
              <Ruler size={14} /> 五步法资质审核
            </div>
            <ol className="space-y-4">
              {[
                "意愿确认 + 初步筛选",
                "资质审核与尽职调查(实名验证、肖像权核查)",
                "签署《AI 肖像授权合同》(段和段律所版)",
                "高质量面部数据采集,技术初审",
                "制作团队品控 → 艺人终审 → 入库",
              ].map((line, idx) => (
                <li key={line} className="flex gap-3">
                  <div className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-brand-soft text-[12px] font-medium text-brand">
                    {idx + 1}
                  </div>
                  <div className="pt-0.5 text-[14px] leading-6 text-ink-2">{line}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow="商业模式"
        title="三层漏斗模型 · 三阶段定价演进"
        subtitle="授权费佣金 → 发行分账抽成 → AI 工具/Token 消耗,收入结构逐级上扬。"
      >
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">成熟期收入结构占比</div>
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {REVENUE_MIX.map((r) => (
            <div key={r.tag} className="glass rounded-[16px] p-6">
              <div className="flex items-baseline justify-between mb-3">
                <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">{r.tag}</span>
                <span className="text-[28px] font-semibold text-gradient leading-none">{r.pct}</span>
              </div>
              <div className="text-[16px] font-semibold text-ink mb-1.5">{r.title}</div>
              <p className="text-[13px] leading-6 text-ink-3">{r.desc}</p>
              <div className="mt-3 text-[12px] text-ink-4">收费对象:{r.payer}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">三阶段定价演进</div>
        <div className="grid gap-4 md:grid-cols-3">
          {PRICE_STAGES.map((s, i) => (
            <div key={s.tag} className="glass rounded-[16px] p-6 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-30 blur-2xl"
                style={{
                  background:
                    i === 0
                      ? "radial-gradient(circle,#6E59F6 0%,transparent 70%)"
                      : i === 1
                      ? "radial-gradient(circle,#FF6FB4 0%,transparent 70%)"
                      : "radial-gradient(circle,#22D3EE 0%,transparent 70%)",
                }}
              />
              <div className="text-[12px] uppercase tracking-widest text-ink-3">{s.tag}</div>
              <div className="text-[17px] font-semibold text-ink mt-2 mb-5">{s.time}</div>
              <div className="space-y-3">
                {s.items.map((it) => (
                  <div key={it.k} className="text-[13.5px] leading-6">
                    <div className="text-ink-3">{it.k}</div>
                    <div className="text-ink mt-0.5">{it.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={Clapperboard}
            title="发行联动"
            description="自有「东方星链」覆盖 7000+ B 端、5000+ AIGC 社群,平台天然带流量。"
          />
          <FeatureCard
            icon={Layers}
            title="素材分级"
            description="S/A/B 三级标签 · 粉丝量、复购率、分账历史多维定价。"
          />
          <FeatureCard
            icon={Sparkles}
            title="自研工具"
            description="规模化期自研 AI 生成工具,利润率 30%+,成为最大单笔收入来源。"
          />
        </div>
      </Section>
    </>
  );
}

function StepRow({
  steps,
  accent,
}: {
  steps: { icon: typeof ScanFace; title: string; desc: string }[];
  accent: "brand" | "pink";
}) {
  const dotColor = accent === "brand" ? "#6E59F6" : "#FF6FB4";
  return (
    <ol className="grid gap-4 md:grid-cols-4 relative">
      <div
        aria-hidden
        className="hidden md:block absolute top-12 left-12 right-12 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${dotColor}55, transparent)` }}
      />
      {steps.map((s, idx) => {
        const Icon = s.icon;
        return (
          <li key={s.title} className="glass rounded-[14px] p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="grid h-9 w-9 place-items-center rounded-md text-white"
                style={{
                  background: `linear-gradient(135deg, ${dotColor}, ${
                    accent === "brand" ? "#FF6FB4" : "#6E59F6"
                  })`,
                }}
              >
                <Icon size={18} />
              </div>
              <div className="text-[11px] font-medium text-ink-3 tracking-widest">
                STEP {String(idx + 1).padStart(2, "0")}
              </div>
            </div>
            <div className="text-[16px] font-semibold text-ink mb-2">{s.title}</div>
            <p className="text-[13.5px] leading-6 text-ink-3">{s.desc}</p>
          </li>
        );
      })}
    </ol>
  );
}
