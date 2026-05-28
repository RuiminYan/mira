import Link from "next/link";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Fingerprint,
  Link2,
  Camera,
  ScanFace,
  MessageCircle,
  Briefcase,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Coins,
  Megaphone,
  Boxes,
  Users,
  Workflow,
  Layers,
  TrendingUp,
  Globe,
  Monitor,
  FileCheck,
  Wallet,
  Network,
  Sparkles,
  Crown,
  Bell,
} from "lucide-react";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { FeatureCard, StatCard } from "@/components/Card";

export const metadata: Metadata = {
  title: "建设成果汇报 — Mira 镜界",
  description:
    "用图文向您汇报 Mira 镜界 目前做了什么:从创作者上传形象,到制作方选角下单、平台结算分账、全程区块链留痕的完整闭环,以及前端体验与后端能力的整体建设成果。",
};

const OVERVIEW = [
  { icon: Users, label: "用户角色端", value: "4 类", hint: "创作者 / 制作方 / 经纪机构 / 平台管理,各有完整工作台" },
  { icon: Workflow, label: "业务闭环", value: "12 步", hint: "从实名上链到结算分账,一笔订单全程跑通" },
  { icon: Layers, label: "业务模块", value: "20+", hint: "选角、合同、支付、分账、分发、确权等成体系" },
  { icon: ShieldCheck, label: "可追溯", value: "全程", hint: "每一步自动留底,随时回查、可验真" },
];

const LOOP: { n: string; icon: LucideIcon; title: string; desc: string }[] = [
  { n: "01", icon: Fingerprint, title: "实名认证", desc: "创作者提交资质,平台审核通过" },
  { n: "02", icon: Link2, title: "上链确权", desc: "身份与形象指纹写入区块链" },
  { n: "03", icon: Camera, title: "上架形象", desc: "设定风格、价格与授权范围" },
  { n: "04", icon: ScanFace, title: "选角浏览", desc: "制作方按需求筛选,支持图搜脸" },
  { n: "05", icon: MessageCircle, title: "在线议价", desc: "双方就价格与分成往返协商" },
  { n: "06", icon: Briefcase, title: "生成订单", desc: "议价达成,一键转成正式订单" },
  { n: "07", icon: Banknote, title: "安全支付", desc: "微信 / 支付宝 / 余额完成付款" },
  { n: "08", icon: ShieldCheck, title: "平台审批", desc: "合规复核,确认授权边界" },
  { n: "09", icon: CheckCircle2, title: "交付确认", desc: "制作方确认成片交付" },
  { n: "10", icon: Coins, title: "结算分账", desc: "按约定自动把收益分给创作者" },
  { n: "11", icon: Megaphone, title: "内容分发", desc: "推送至短剧 / 短视频渠道" },
  { n: "12", icon: Boxes, title: "资产确权", desc: "形象铸成数字藏品,流转可查" },
];

const FRONTEND = [
  { icon: Users, title: "四端独立工作台", description: "创作者、制作方、经纪机构、平台管理各有专属后台,功能互不打架,上手即用。" },
  { icon: ScanFace, title: "选角广场与图搜脸", description: "多维筛选心仪形象,还能上传一张参考图,由平台推荐相似人选。" },
  { icon: TrendingUp, title: "数据驾驶舱", description: "创作者可视化看收益趋势、形象热度、场景分布,经营一目了然。" },
  { icon: Globe, title: "中英双语", description: "一键中英切换,公开展示页全面双语,为出海与对外汇报做好准备。" },
  { icon: Monitor, title: "深浅双主题", description: "深色 / 浅色 / 跟随系统三态自由切换,任何环境下都清晰好看。" },
  { icon: Bell, title: "手机可用可安装", description: "完整适配手机窄屏,可像 App 一样装到桌面,断网也有兜底页。" },
];

const BACKEND = [
  { icon: Fingerprint, title: "实名认证与审核", description: "敏感证件信息加密留存,平台人工复核,确保人和资质真实可信。" },
  { icon: FileCheck, title: "电子合同与存证", description: "每次授权自动生成电子合同,关键内容写入区块链,可随时验真。" },
  { icon: Banknote, title: "支付与自动分账", description: "收款后按约定比例自动把收益分给创作者与平台,账目清清楚楚。" },
  { icon: Wallet, title: "钱包 发票 提现", description: "余额钱包、增值税发票、提现到账一条龙,满足真实经营所需。" },
  { icon: ShieldCheck, title: "争议仲裁与风控", description: "纠纷可在线申诉、平台仲裁退款;异常行为自动告警、人工复核。" },
  { icon: Sparkles, title: "AI 工坊与数字藏品", description: "对已授权形象做二次创作,并把形象铸成数字藏品确权流转。" },
  { icon: Megaphone, title: "内容分发对接", description: "成片可一键推送到短剧、短视频等渠道,跟踪上线状态。" },
  { icon: Network, title: "开放平台与对接", description: "为合作伙伴预留对接能力,支持订阅套餐与企业级协作。" },
];

const HIGHLIGHTS = [
  { icon: Link2, title: "区块链存证", desc: "确权、合同、结算全程盖上时间戳,事后无法抵赖。" },
  { icon: Coins, title: "智能合约分账", desc: "收益自动按比例分配,不用人工对账,透明到账。" },
  { icon: ShieldCheck, title: "合规可追溯", desc: "实名、授权、审计层层把关,每一步都查得到。" },
  { icon: Globe, title: "一键出海双语", desc: "中英双语就绪,面向海外市场与投资人同样能讲清楚。" },
  { icon: Sparkles, title: "AI 二次创作", desc: "授权范围内做图、视频、配音,放大单张形象的价值。" },
  { icon: Boxes, title: "资产 NFT 化", desc: "把人脸 IP 做成可流通的数字资产,沉淀长期价值。" },
];

const MILESTONES = [
  { stage: "阶段一", title: "跑通真实闭环", text: "实名认证、电子合同与存证、真实支付与自动分账,完整业务链路一次性打通。" },
  { stage: "阶段二", title: "提升成交效率", text: "AI 演员预览片、套餐选购、图搜脸、在线议价、消息中心,让交易更快达成。" },
  { stage: "阶段三", title: "商业深化", text: "创作者数据驾驶舱、经纪机构后台、行业洞察专栏、内容分发对接陆续落地。" },
  { stage: "阶段四", title: "平台化与出海", text: "钱包提现、订阅定价、开放对接、中英双语、资产 NFT 化,迈向成熟产品。" },
  { stage: "阶段五", title: "运营与公开", text: "帮助中心、工单系统、透明度报告、无障碍与可安装,具备对外公开发布条件。" },
];

const TRACTION = [
  { icon: Crown, label: "头部达人内测", value: "4 位", hint: "塑料叉 / 小鸣同学 / 蓝江律师 / 尤拉" },
  { icon: Users, label: "粉丝矩阵规模", value: "5000万+", hint: "真实场景验证产品价值" },
  { icon: Sparkles, label: "内测内容创作", value: "200+ 条", hint: "平均互动率提升 60%+" },
  { icon: TrendingUp, label: "KOL 授权意愿", value: "80%+", hint: "50 位百万粉 KOL 调研结果" },
];

const TODO_REAL = [
  { title: "真实支付与对账", desc: "接入微信 / 支付宝商户,替换当前的模拟支付通道。" },
  { title: "真实链上存证", desc: "对接可信存证服务,替换模拟区块链。" },
  { title: "真实 AI 生成", desc: "接入业界 AI 生成能力,替换模拟 AI 工坊。" },
  { title: "真实渠道分发", desc: "打通短剧 / 短视频平台接口,实现真实素材投递。" },
  { title: "强实名核验", desc: "三要素核验 + 活体检测 + 短信验证,替换演示登录。" },
];

const TODO_SCALE = [
  { title: "移动端 App / 小程序", desc: "把创作者与制作方的高频操作搬到移动端。" },
  { title: "规模化签约", desc: "首批 500 位 KOC 放量,建立独家形象库。" },
  { title: "行业标准落地", desc: "联合律所发布《AI 人脸授权行业标准》白皮书。" },
  { title: "安全与合规加固", desc: "压力测试、数据备份、隐私与等保合规审计。" },
];

const DELIVERED: { phase: string; tag: string; items: string[] }[] = [
  {
    phase: "跑通真实闭环",
    tag: "P0",
    items: ["实名认证 + 形象上传", "电子合同 + 链上存证", "支付 + 自动对账"],
  },
  {
    phase: "提升成交效率",
    tag: "P1",
    items: ["AI 演员预览片", "套餐 SKU + 在线议价", "图搜脸 / 标签近似", "消息中心"],
  },
  {
    phase: "商业深化",
    tag: "P2",
    items: ["创作者数据驾驶舱", "MCN / 经纪人后台", "行业洞察专栏 /insights", "大厂渠道分发"],
  },
  {
    phase: "平台化与出海",
    tag: "P3",
    items: ["中英双语", "形象资产 NFT 化", "AI 生成工坊入口"],
  },
];

export default function ProgressPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10 grid-bg opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />
        <div className="container-page py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[12px] font-medium text-ink-2 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
            建设成果汇报
          </div>
          <h1 className="text-[32px] md:text-[56px] font-semibold leading-[1.08] text-balance text-ink max-w-4xl">
            我们把“人脸成为数字资产”
            <br />
            做成了一个<span className="text-gradient">能跑通的平台</span>
          </h1>
          <p className="mt-6 text-[15px] md:text-[18px] leading-8 text-ink-3 max-w-2xl">
            从创作者上传形象,到制作方选角下单、平台结算分账,全程区块链留痕。下面用图文向您汇报 Mira 镜界
            目前做了什么 —— 前端用户能看到的体验,以及后端在背后支撑的能力。
          </p>
          <div className="mt-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {OVERVIEW.map((s) => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} hint={s.hint} />
            ))}
          </div>
        </div>
      </section>

      {/* 一图看懂:三方市场 */}
      <Section
        eyebrow="一图看懂"
        title={
          <>
            Mira 连接三方,自己做<span className="text-gradient">结算与确权</span>
          </>
        }
        subtitle="创作者把脸变成可授权的资产,制作方按需选用,平台负责合同、收款、分账与上链留痕,三方各取所需。"
      >
        <ThreeSidedDiagram />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { t: "创作者", d: "上传形象、设定授权与价格,坐收分账" },
            { t: "Mira 平台", d: "选角、合同、支付、分账、风控、存证一站式" },
            { t: "制作方", d: "合规选角、在线下单、二次创作即拍即用" },
          ].map((c) => (
            <div key={c.t} className="glass rounded-[14px] p-5">
              <div className="text-[15px] font-semibold text-ink mb-1.5">{c.t}</div>
              <p className="text-[13.5px] leading-6 text-ink-3">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 一笔订单怎么跑通 */}
      <Section
        tone="raised"
        eyebrow="完整闭环"
        title="一笔订单是怎么跑通的"
        subtitle="这 12 步是平台已经实现的真实业务流,每一步都会自动留底,随时可回查、可验真。"
      >
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {LOOP.map((s) => (
            <div key={s.n} className="glass rounded-[14px] p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-[#B9A8FF]">
                  <s.icon size={18} />
                </span>
                <span className="text-[20px] font-semibold text-gradient leading-none">{s.n}</span>
              </div>
              <div className="text-[15px] font-semibold text-ink mb-1">{s.title}</div>
              <p className="text-[12.5px] leading-5 text-ink-3">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 前端:用户能看到、能用的 */}
      <Section
        eyebrow="前端 用户能看到、能用的"
        title={
          <>
            为四类用户,做了<span className="text-gradient">好用的工作台</span>
          </>
        }
        subtitle="不登录也能浏览展示与选角;登录后每类用户都有完整、清晰、好上手的专属后台。"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="grid gap-4 sm:grid-cols-2">
            {FRONTEND.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </div>
          <DashboardMock />
        </div>
      </Section>

      {/* 后端:看不见但在支撑的 */}
      <Section
        tone="raised"
        eyebrow="后端 看不见但在支撑的"
        title={
          <>
            每一笔交易都<span className="text-gradient">合规、可信、可追溯</span>
          </>
        }
        subtitle="这些能力在背后默默运转,保证平台不只是好看,而是真正能承载交易与监管。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BACKEND.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
        <TraceabilityStrip />
      </Section>

      {/* 关键亮点 */}
      <Section eyebrow="关键亮点" title="让 Mira 与众不同的地方">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="glass rounded-[14px] p-6 flex gap-4">
              <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] text-white">
                <h.icon size={20} />
              </span>
              <div>
                <div className="text-[16px] font-semibold text-ink mb-1.5">{h.title}</div>
                <p className="text-[13.5px] leading-6 text-ink-3">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 市场验证 */}
      <Section
        eyebrow="市场验证"
        title={
          <>
            不止是 demo,<span className="text-gradient">市场已经在验证</span>
          </>
        }
        subtitle="4 位头部达人参与内测,50 位百万粉 KOL 接受调研 —— 真实需求与合作意愿都已得到印证。"
      >
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {TRACTION.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} hint={s.hint} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/market" className="text-[13.5px] text-brand hover:underline">
            查看完整市场分析 →
          </Link>
        </div>
      </Section>

      {/* 里程碑 */}
      <Section
        tone="raised"
        eyebrow="一步步搭起来"
        title="我们的建设进度"
        subtitle="从打通最核心的业务闭环,到具备对外公开发布的条件,平台是分阶段、踏实搭起来的。"
      >
        <Timeline />
      </Section>

      {/* 路线图交付清单:P0–P3 */}
      <Section
        eyebrow="路线图交付"
        title={
          <>
            规划的 P0–P3,<span className="text-gradient">已全部落地</span>
          </>
        }
        subtitle="从跑通闭环到平台化出海,四个阶段共 14 项核心能力均已实现,并可在线逐一体验。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DELIVERED.map((g) => (
            <div key={g.tag} className="glass rounded-[14px] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center rounded-md bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">
                  {g.tag}
                </span>
                <span className="text-[14px] font-semibold text-ink">{g.phase}</span>
              </div>
              <ul className="space-y-2.5">
                {g.items.map((it) => (
                  <li key={it} className="flex gap-2 text-[13px] leading-6 text-ink-2">
                    <CheckCircle2 size={15} className="text-brand-2 shrink-0 mt-1" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 下一步:还需要做什么 */}
      <Section
        eyebrow="下一步"
        title={
          <>
            还需要做什么:<span className="text-gradient">从能跑通,到能规模化</span>
          </>
        }
        subtitle="当前外部系统(支付 / 区块链 / AI 生成 / 渠道分发)均为平台内置的模拟实现,已跑通完整流程。下一步是把它们接成真实服务,并走向规模。"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-[16px] p-6 md:p-7">
            <div className="text-[13px] uppercase tracking-[0.18em] text-ink-3 mb-5">把"模拟"接成"真实"</div>
            <ul className="space-y-4">
              {TODO_REAL.map((t) => (
                <li key={t.title} className="flex gap-3">
                  <span
                    className="mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
                  >
                    现为模拟
                  </span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-ink">{t.title}</div>
                    <p className="text-[13px] leading-6 text-ink-3 mt-0.5">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-[16px] p-6 md:p-7">
            <div className="text-[13px] uppercase tracking-[0.18em] text-ink-3 mb-5">走向规模与生态</div>
            <ul className="space-y-4">
              {TODO_SCALE.map((t) => (
                <li key={t.title} className="flex gap-3">
                  <span className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
                  <div>
                    <div className="text-[14.5px] font-semibold text-ink">{t.title}</div>
                    <p className="text-[13px] leading-6 text-ink-3 mt-0.5">{t.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 结语 CTA */}
      <section className="py-20 md:py-24">
        <div className="container-page">
          <div className="relative rounded-[24px] p-10 md:p-16 overflow-hidden glass glow-ring">
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(50% 80% at 0% 100%, rgba(110,89,246,0.25), transparent 60%), radial-gradient(40% 60% at 100% 0%, rgba(255,111,180,0.20), transparent 60%)",
              }}
            />
            <div className="max-w-2xl">
              <div className="text-[12px] uppercase tracking-[0.18em] text-ink-3 mb-3">现在就能体验</div>
              <h2 className="text-balance text-[26px] md:text-[38px] font-semibold leading-tight text-ink">
                以上都不是概念稿,<span className="text-gradient">点开即可亲自跑一遍</span>
              </h2>
              <p className="mt-4 text-ink-3 text-[15px] leading-7">
                平台已经在线运行,数据会真实保存。建议从选角广场开始,体验一次完整的下单与分账。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/" size="lg">
                  回到首页 <ArrowRight size={16} />
                </Button>
                <Button href="/marketplace" size="lg" variant="secondary">
                  进入选角广场
                </Button>
                <Button href="/contact" size="lg" variant="ghost">
                  联系我们
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- 自绘图示(无外部图片) ---------- */

function ThreeSidedDiagram() {
  return (
    <div className="glass rounded-[18px] p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-3">
        <SideNode
          icon={Crown}
          title="创作者"
          lines={["上传形象", "设定授权与价格"]}
          tone="creator"
        />
        <FlowConnector labelTop="形象上架" labelBottom="收益分账" />
        <div className="flex-1 min-w-0">
          <div className="h-full rounded-[16px] p-5 md:p-6 bg-gradient-to-br from-[#6E59F6] to-[#4F3DD8] text-white border border-white/10 glow-ring">
            <div className="flex items-center gap-2 text-[15px] font-semibold mb-3">
              <Sparkles size={18} /> Mira 平台
            </div>
            <div className="flex flex-wrap gap-2">
              {["选角广场", "电子合同", "区块链存证", "结算分账", "风控审计"].map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-white/15 px-3 py-1 text-[12.5px] text-white/95"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] leading-6 text-white/80">
              连接供需两端,负责合同、收款、分账与上链留痕,做交易的撮合方与清算方。
            </p>
          </div>
        </div>
        <FlowConnector labelTop="选角下单" labelBottom="授权交付" />
        <SideNode
          icon={Briefcase}
          title="制作方"
          lines={["合规选角", "二次创作即用"]}
          tone="partner"
        />
      </div>
      <div className="mt-5 rounded-[12px] border border-dashed border-line-2 px-4 py-3 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-soft text-[#B9A8FF] shrink-0">
          <Link2 size={16} />
        </span>
        <div className="flex items-center gap-1.5 flex-wrap text-[12px] text-ink-3">
          <span className="text-ink-2 font-medium mr-1">区块链存证层</span>
          {["确权", "合同", "下单", "结算", "分发"].map((b, i) => (
            <span key={b} className="inline-flex items-center gap-1.5">
              <span className="rounded bg-surface-2 px-2 py-0.5 text-[11.5px] text-ink-2">{b}</span>
              {i < 4 && <span className="text-ink-4">—</span>}
            </span>
          ))}
          <span className="ml-1">全程留痕,可查可验</span>
        </div>
      </div>
    </div>
  );
}

function SideNode({
  icon: Icon,
  title,
  lines,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  lines: string[];
  tone: "creator" | "partner";
}) {
  return (
    <div className="md:w-[180px] shrink-0 rounded-[16px] p-5 bg-surface-2/60 border border-line">
      <span
        className={
          "inline-flex h-10 w-10 items-center justify-center rounded-md mb-3 " +
          (tone === "creator"
            ? "bg-gradient-to-br from-[#FF6FB4]/30 to-[#FF6FB4]/5 text-[#FF6FB4]"
            : "bg-gradient-to-br from-[#6E59F6]/30 to-[#6E59F6]/5 text-[#B9A8FF]")
        }
      >
        <Icon size={20} />
      </span>
      <div className="text-[16px] font-semibold text-ink mb-1.5">{title}</div>
      <ul className="space-y-1 text-[12.5px] text-ink-3">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function FlowConnector({ labelTop, labelBottom }: { labelTop: string; labelBottom: string }) {
  return (
    <div className="flex md:flex-col items-center justify-center gap-1 px-1 md:py-4">
      <span className="text-[11px] text-ink-3 whitespace-nowrap">{labelTop}</span>
      <ArrowRight size={16} className="text-brand-2 rotate-90 md:rotate-0" />
      <ArrowRight size={16} className="text-ink-4 -rotate-90 md:rotate-180" />
      <span className="text-[11px] text-ink-3 whitespace-nowrap">{labelBottom}</span>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="glass rounded-[16px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF6FB4]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]/70" />
        <span className="ml-3 rounded-full bg-surface-2 px-3 py-1 text-[11.5px] text-ink-3">
          创作者 / 数据驾驶舱
        </span>
      </div>
      <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr]">
        <div className="border-r border-line p-3 space-y-2">
          {["概览", "我的形象", "收益", "合同", "钱包"].map((m, i) => (
            <div
              key={m}
              className={
                "rounded-md px-2 py-1.5 text-[11.5px] " +
                (i === 0 ? "bg-brand-soft text-[#B9A8FF]" : "text-ink-3")
              }
            >
              {m}
            </div>
          ))}
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "本月收益", v: "¥ 24,800" },
              { k: "在架形象", v: "6" },
              { k: "成交订单", v: "18" },
            ].map((s) => (
              <div key={s.k} className="rounded-md bg-surface-2 px-2.5 py-2">
                <div className="text-[10.5px] text-ink-4">{s.k}</div>
                <div className="text-[13.5px] font-semibold text-ink mt-0.5">{s.v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-line p-3">
            <div className="text-[11px] text-ink-4 mb-2">近 30 天收益趋势</div>
            <MiniAreaChart />
          </div>
          <div className="space-y-1.5">
            {["温雨涵 YUHAN — 已结算 ¥6,800", "夏屿 SUMMER — 交付中", "林晚 WAN — 议价中"].map((r) => (
              <div
                key={r}
                className="flex items-center justify-between rounded-md bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-ink-2"
              >
                <span className="truncate">{r}</span>
                <ArrowRight size={12} className="text-ink-4 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniAreaChart() {
  const pts = [18, 26, 22, 34, 30, 44, 40, 56, 50, 66, 72, 88];
  const w = 320;
  const h = 72;
  const max = 96;
  const step = w / (pts.length - 1);
  const line = pts.map((p, i) => `${i * step},${h - (p / max) * h}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[72px]" role="img" aria-label="收益趋势示意图">
      <defs>
        <linearGradient id="mira-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6E59F6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6E59F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mira-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6E59F6" />
          <stop offset="100%" stopColor="#FF6FB4" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#mira-area)" />
      <polyline points={line} fill="none" stroke="url(#mira-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TraceabilityStrip() {
  const steps = [
    { t: "发生关键动作", d: "下单 / 结算 / 下架" },
    { t: "生成电子合同", d: "固化授权条款" },
    { t: "计算内容指纹", d: "唯一不可篡改" },
    { t: "写入区块链", d: "盖上时间戳" },
    { t: "永久可查验", d: "随时回溯验真" },
  ];
  return (
    <div className="mt-6 glass rounded-[16px] p-6">
      <div className="text-[13px] uppercase tracking-[0.18em] text-ink-3 mb-5">可追溯链路</div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2">
        {steps.map((s, i) => (
          <div key={s.t} className="flex md:flex-1 items-center gap-3 md:gap-2">
            <div className="flex-1 rounded-[12px] bg-surface-2/70 border border-line px-4 py-3">
              <div className="text-[13.5px] font-semibold text-ink">{s.t}</div>
              <div className="text-[12px] text-ink-3 mt-0.5">{s.d}</div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={16} className="text-brand-2 shrink-0 rotate-90 md:rotate-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline() {
  return (
    <div className="relative pl-6 md:pl-8">
      <div className="absolute left-[7px] md:left-[9px] top-1 bottom-1 w-px bg-line-2" aria-hidden />
      <div className="space-y-6">
        {MILESTONES.map((m) => (
          <div key={m.stage} className="relative">
            <span
              className="absolute -left-6 md:-left-8 top-1.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4] ring-4 ring-bg"
              aria-hidden
            />
            <div className="glass rounded-[14px] p-5 md:p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
                <span className="text-[12px] uppercase tracking-[0.18em] text-ink-3">{m.stage}</span>
                <span className="text-[17px] font-semibold text-ink">{m.title}</span>
              </div>
              <p className="text-[13.5px] leading-7 text-ink-3 max-w-3xl">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
