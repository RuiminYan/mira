import type { Metadata } from "next";
import {
  TrendingUp,
  Megaphone,
  Layers,
  Sparkles,
  Building2,
  Scale,
  Zap,
  Users,
  ShieldAlert,
  Coins,
  ArrowUpRight,
  CheckCircle2,
  Star,
  Network,
  Crown,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { Section } from "@/components/Section";
import { FeatureCard, StatCard } from "@/components/Card";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Market analysis" : "市场分析" };
}

const SUPPLY = (en: boolean) => [
  { k: en ? "Following" : "粉丝量级", v: en ? "10K–100K mid-tier creators on RedNote / Douyin" : "1–10 万的小红书 / 抖音中腰部创作者" },
  { k: en ? "Cadence" : "更新频率", v: en ? "3+ posts a week, steadily producing recognizable face content" : "周更 ≥ 3 次,持续生产可识别面部内容" },
  { k: en ? "Content type" : "内容类型", v: en ? "Looks, lifestyle, scripted and emotional creators" : "颜值类、生活类、剧情类、情感类博主" },
  { k: en ? "Core motivation" : "核心动机", v: en ? "Passive income, IP exposure, low-barrier entry into film & TV" : "被动收入、IP 曝光、低门槛参与影视" },
  { k: en ? "Main concern" : "主要担忧", v: en ? "Likeness misuse, opaque splits → solved by compliance and on-chain attestation" : "形象滥用、分账不透明 → 由合规与链上存证打消" },
];

const DEMAND = (en: boolean) => [
  { k: en ? "Target customers" : "目标客户", v: en ? "Small studios producing 3–10 short dramas a month" : "月产 3–10 部短剧的小型工作室" },
  { k: en ? "Secondary customers" : "补充客户", v: en ? "AI video content agencies, new consumer brands (drama placement)" : "AI 视频内容代运营公司、新消费品牌(短剧植入)" },
  { k: en ? "Core pain points" : "核心痛点", v: en ? "High compliance risk, slow supporting-role casting, unlicensed AI content" : "合规风险高、配角选角效率低、AI 生成内容缺授权" },
  { k: en ? "Decision path" : "决策链路", v: en ? "Producer / content lead → owner signs off" : "制片人 / 内容负责人 → 老板拍板" },
];

const PEST = (en: boolean) => [
  {
    icon: Scale,
    title: en ? "Political" : "政策 Political",
    desc: en
      ? "China's Civil Code makes portrait rights licensable; the Generative AI rules require compliant labeling and traceability. Mira sits ahead of the compliance curve."
      : "《民法典》明确肖像权可授权;《生成式 AI 服务管理办法》要求合规标识与可追溯。Mira 站在合规曲线之上。",
  },
  {
    icon: Zap,
    title: en ? "Technological" : "技术 Technological",
    desc: en
      ? "Video generation costs are falling exponentially (¥500K → ¥100K); AI supporting actors with lip-sync and motion are already commercial-grade, lowering the barrier."
      : "视频生成成本指数级下降(50 万 → 10 万),AI 配角脸口型动作已可商用,门槛持续下移。",
  },
  {
    icon: Building2,
    title: en ? "Economic" : "产业 Economic",
    desc: en
      ? "A ¥120B micro-drama market and the rise of AI motion comics, plus platforms raising revenue shares — the content supply gap is widening structurally."
      : "微短剧 1200 亿、AI 漫剧爆发,平台加大分账,内容供应缺口在结构性扩大。",
  },
  {
    icon: Users,
    title: en ? "Social" : "用户 Social",
    desc: en
      ? "Over ten million KOCs with a single monetization channel. Demand for passive royalty income is badly underestimated."
      : "KOC 数量超千万,变现渠道单一。被动版税收入诉求被严重低估。",
  },
];

const RISKS = (en: boolean) => [
  { title: en ? "Compliance boundaries still evolving" : "合规边界尚在演进", desc: en ? "Ongoing dialogue with law firms and regulators; contract terms update with policy, holding the line on the right to be forgotten and data security." : "持续与律所、监管沟通,合同条款随政策同步更新,守住可被遗忘权与数据安全底线。" },
  { title: en ? "Pushback from traditional talent / studios" : "传统艺人 / 影视抵制", desc: en ? "Educate the market via the revenue-split model and IP feedback loop — complementing the existing industry rather than replacing it." : "通过分账模式、IP 反哺逻辑教育市场,与现有产业互补而非替代。" },
  { title: en ? "Cost of educating KOCs to sign" : "KOC 签约教育成本", desc: en ? "Deep MCN partnerships with 15%–20% rebates, plus an exclusive signing program to boost retention." : "MCN 深度合作 + 返佣 15%–20%,以及独家签约计划提升留存。" },
  { title: en ? "Big tech entering the space" : "大厂下场", desc: en ? "Build switching costs through first-mover two-sided network effects, an exclusive library and setting the industry standard." : "靠先发的双边网络效应、独家库与行业标准制定,构筑迁移成本。" },
];

const COMP = (en: boolean) => [
  { name: en ? "iQIYI Nadou Pro" : "爱奇艺纳逗 Pro", note: en ? "Licenses traditional talent; traffic value far outweighs likeness value, so talent can't earn much inside the product." : "传统艺人授权,流量价值远大于形象价值,艺人在产品里赚不到大钱。" },
  { name: en ? "ByteDance" : "字节跳动", note: en ? "Slow big-company decisions, core focus on large models; lacks an internal creator's perspective." : "大厂决策慢,核心精力在大模型;内部缺内容创作者视角。" },
  { name: en ? "Traditional film & TV companies" : "传统影视公司", note: en ? "Conservative mindset, lacking cross-industry thinking and asset-light matchmaking capability." : "思维保守,缺跨界融合思维与轻资产撮合能力。" },
];

// 社媒账号名,中英保持原样
const TRACTION = [
  { name: "塑料叉", fans: "500 万+", fansEn: "5M+" },
  { name: "小鸣同学", fans: "800 万+", fansEn: "8M+" },
  { name: "蓝江律师", fans: "500 万+", fansEn: "5M+" },
  { name: "尤拉", fans: "100 万+", fansEn: "1M+" },
];

const SURVEY = (en: boolean) => [
  {
    title: en ? "AI studios harvest faces indiscriminately" : "AI 制作公司粗放收集人脸素材",
    desc: en
      ? "Many AI film companies, under the guise of 'recruiting actors' or 'casting for short dramas,' collect facial assets without authorization for AI face-swap drama production."
      : "大量 AI 影视公司以「招募演员」「短剧演员招募」名义,未获授权收集人脸素材用于 AI 换脸短剧制作。",
  },
  {
    title: en ? "Rampant misuse of celebrity and influencer faces" : "艺人与网红被盗用人脸泛滥",
    desc: en
      ? "Many celebrities' and influencers' faces are AI-swapped into short dramas and other content without authorization, seriously infringing portrait rights and causing harm."
      : "大量艺人、网红人脸被 AI 换脸用于短剧等内容,未获授权,严重侵害肖像权并造成负面影响。",
  },
  {
    title: en ? "Influencer KOLs are eager to license and star" : "网红 KOL 对授权参演兴趣昂然",
    desc: en
      ? "Of 50 surveyed million-follower KOLs, over 80% are willing to license their face for short dramas; with fair licensing and revenue split, collaboration intent is strong."
      : "调研 50 位百万粉以上 KOL,超 80% 愿意授权人脸出演短剧,合理授权与分账下合作意愿强烈。",
  },
];

const MOAT = (en: boolean) => [
  { n: "01", icon: Network, title: en ? "Two-sided network effects" : "双边网络效应", desc: en ? "More KOCs → more choice for studios → more usage → more KOCs join; a self-reinforcing virtuous cycle." : "KOC 越多 → 制作方选择越多 → 用得越多 → 更多 KOC 加入,正循环自我强化。" },
  { n: "02", icon: Layers, title: en ? "Accumulated split data" : "分账数据沉淀", desc: en ? "A KOC's revenue-split history creates switching costs — leaving means abandoning proof of earnings already built up." : "KOC 历史分账记录形成转移成本,换平台等于放弃已积累的收益证明。" },
  { n: "03", icon: Crown, title: en ? "Exclusive licensing lock-in" : "独家授权锁定", desc: en ? "Offer exclusive signings to high-frequency, high-split KOCs, cutting competitors off at the supply side." : "对高频分账 KOC 提供独家签约,从供给侧切断竞品。" },
  { n: "04", icon: FileCheck, title: en ? "First-mover on the standard" : "行业标准先发", desc: en ? "Publish an 'AI Face Licensing Industry Standard' with a law firm, becoming the de facto rule-setter." : "联合律所发布《AI 人脸授权行业标准》,成为事实上的规则制定者。" },
  { n: "05", icon: ShieldCheck, title: en ? "Depth of compliance" : "合规深度", desc: en ? "End-to-end compliance for licensing scope, data security and the right to be forgotten — hard for big tech to copy quickly." : "授权边界、数据安全、被遗忘权全链路合规设计,大厂难以短期复制。" },
];

const FUND_USE = (en: boolean) => [
  { use: en ? "Tech development (lightweight platform)" : "技术开发(轻量平台)", pct: "30–40%", note: en ? "Web showcase + KOC self-upload + revenue-split records console" : "Web 展示页 + KOC 自助上传 + 分账记录后台" },
  { use: en ? "KOC signing incentives" : "KOC 签约激励", pct: "20–30%", note: en ? "Pay licensing fees for the first 500 KOCs (¥100–300 each)" : "支付首批 500 个 KOC 授权费(每人 ¥100–300)" },
  { use: en ? "Operations and marketing" : "运营与市场", pct: "20–25%", note: en ? "A 1–2 person ops team, studio outreach, KOC community management" : "1–2 人运营团队、制作方拓展、KOC 社群维护" },
  { use: en ? "Legal and compliance" : "法务合规", pct: "10–15%", note: en ? "Licensing templates, legal counsel, copyright filings, company registration" : "授权协议模板、律师咨询、软著申请、公司注册" },
  { use: en ? "Reserve" : "备用金", pct: "5–10%", note: en ? "Contingencies or sudden opportunities" : "应急或突发机会" },
];

const GROWTH_PHASES = (en: boolean) => [
  {
    icon: Sparkles,
    tag: en ? "Cold start" : "冷启动期",
    span: en ? "0–3 months" : "0–3 个月",
    points: en
      ? [
          "Sign 50 → 500 KOCs",
          "Partner studios 1 → 20",
          "Monthly platform GMV ¥10K → ¥100K",
          "Land 1+ flagship success case",
        ]
      : [
          "签约 KOC 50 → 500 人",
          "合作制作方 1 → 20 家",
          "月平台交易 ¥1 万 → ¥10 万",
          "完成 ≥ 1 个标杆成功案例",
        ],
  },
  {
    icon: TrendingUp,
    tag: en ? "Growth" : "增长期",
    span: en ? "3–12 months" : "3–12 个月",
    points: en
      ? [
          "Sign 500 → 2,000 KOCs (200+ exclusive)",
          "Partner studios 20 → 100",
          "Monthly GMV ¥100K → ¥1M",
          "Plug into 1+ major ecosystem (RedFruit / Douyin)",
        ]
      : [
          "签约 KOC 500 → 2,000(独家 ≥ 200)",
          "合作制作方 20 → 100 家",
          "月交易额 ¥10 万 → ¥100 万",
          "接入 ≥ 1 家大厂生态(红果 / 抖音)",
        ],
  },
  {
    icon: Crown,
    tag: en ? "Scale" : "规模化期",
    span: en ? "12–36 months" : "12–36 个月",
    points: en
      ? [
          "Sign 2,000 → 10,000+ KOCs (1,000+ exclusive)",
          "Partner studios 100 → 500",
          "Annual GMV ¥10M → ¥100M+",
          "Annual net revenue ¥2M → ¥20M+",
        ]
      : [
          "签约 KOC 2,000 → 10,000+(独家 ≥ 1,000)",
          "合作制作方 100 → 500 家",
          "年交易额 ¥1,000 万 → ¥1 亿+",
          "平台抽成后年收入 ¥200 万 → ¥2,000 万+",
        ],
  },
];

const CHANNELS = (en: boolean) => [
  { name: en ? "RedNote / Douyin DMs" : "小红书 / 抖音私信", how: en ? "Filter 100K-level lifestyle / looks / scripted creators and DM targeted invites" : "筛选 10 万级生活 / 颜值 / 剧情类博主,定向私信邀约", cvr: "5–10%", cost: en ? "Very low (manual)" : "极低(人工)" },
  { name: en ? "Convert existing fan matrix" : "现有粉丝矩阵转化", how: en ? "Activate our own 50M-fan matrix (KOCs like Xiao Ming, Gan Yue)" : "盘活自有 5,000 万粉丝矩阵(创小鸣 / 感阅等 KOC)", cvr: "10–20%", cost: en ? "Very low" : "极低" },
  { name: en ? "MCN partnerships" : "MCN 合作", how: en ? "Sign revenue-share deals with small/mid MCNs (focused on short-drama KOCs) for bulk signing" : "与中小 MCN(主营短剧 KOC)签分成协议,批量签约", cvr: en ? "Bulk" : "批量", cost: en ? "Revenue share" : "分成模式" },
  { name: en ? "Community referrals" : "社群裂变", how: en ? "Signed KOCs refer new KOCs; both sides get a ¥50 reward" : "已签约 KOC 推荐新 KOC,双方各得 ¥50 奖励", cvr: "15–25%", cost: en ? "¥50 / new user" : "¥50 / 新用户" },
];

const SCENES = (en: boolean) => [
  { icon: Megaphone, title: en ? "Brand TVC / in-feed ads" : "品牌 TVC / 信息流广告", desc: en ? "Work directly with 4A agencies and brands to offer a 'brand AI spokesface' service." : "与 4A 广告公司、品牌方直接合作,提供「品牌 AI 代言脸」服务。", inc: en ? "SAM +¥1.5–3B" : "SAM +15–30 亿" },
  { icon: Star, title: en ? "Virtual hosts / livestreaming" : "虚拟主播 / 直播", desc: en ? "Partner with livestream guilds to offer 'AI virtual face + stream script' packages." : "与直播公会合作,提供「AI 虚拟脸 + 直播脚本」方案。", inc: en ? "New growth curve" : "新增长曲线" },
  { icon: Zap, title: en ? "Game NPCs" : "游戏 NPC", desc: en ? "Partner with small/mid game studios to provide reusable character face models." : "与中小游戏工作室合作,提供可复用的角色脸模。", inc: en ? "Exploratory" : "探索期" },
  { icon: Network, title: en ? "Overseas (SE Asia short drama)" : "出海(东南亚短剧)", desc: en ? "Replicate the domestic model, sign SE Asia KOCs, and serve local short-drama studios." : "复制国内模式,签约东南亚 KOC,服务当地短剧制作方。", inc: en ? "Long-term strategy" : "长期战略" },
];

export default async function MarketPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <>
      <Section
        eyebrow={en ? "Market size" : "市场规模"}
        title={
          en ? (
            <>The ¥100B short-drama era · a billions-scale <span className="text-gradient">face licensing</span> SAM</>
          ) : (
            <>千亿短剧时代 · 数十亿 <span className="text-gradient">人脸授权</span> SAM</>
          )
        }
        subtitle={
          en
            ? "A trillion-scale TAM with hundreds-of-billions in core adjacent segments; Mira's core SAM is ¥1.8–5B per year."
            : "TAM 万亿级,核心相关细分市场数千亿级;Mira 锁定的核心 SAM 为 18–50 亿元/年。"
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={TrendingUp} label={en ? "Short-drama face SAM" : "短剧人脸授权 SAM"} value="¥8–30 亿/年" hint={en ? "15,000 dramas × 5 faces each × ¥1,000" : "15,000 部 × 5 张/部 × ¥1,000"} />
          <StatCard icon={Megaphone} label={en ? "Brand ad SAM" : "品牌广告 SAM"} value="¥15–30 亿/年" hint={en ? "Video ads ¥30–50B × 2M shots × ¥1,500" : "视频广告 300–500 亿 × 200 万张次 × ¥1500"} />
          <StatCard icon={Layers} label={en ? "Combined (incl. overseas)" : "综合(含出海)"} value="¥18–50 亿/年" hint={en ? "Plus VTubers, game NPCs, overseas short drama" : "叠加虚拟主播、游戏 NPC、出海短剧"} />
        </div>

        <div className="mt-6 glass rounded-[14px] p-6 md:p-8">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">{en ? "Core insight" : "核心洞察"}</div>
          <p className="text-[15px] md:text-[16px] leading-7 text-ink-2 max-w-3xl">
            {en
              ? "Video generation costs are collapsing → traditional film organizations are unbundling → AI portrait licensing issues are erupting. "
              : "视频生成成本指数级下降 → 传统影视公司组织瓦解 → AI 肖像授权问题爆发。"}
            <span className="text-ink">
              {en
                ? "The missing infrastructure is a natural opening: Mira turns IP circulation into a rights exchange built on compliance, revenue split and data."
                : "行业基础设施缺位是天然窗口,Mira 把 IP 流通做成「合规 + 分账 + 数据」的版权交易所。"}
            </span>
          </p>
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow={en ? "Supply & demand profile" : "供需画像"}
        title={en ? "Supply and demand start together" : "供给端 / 需求端 同步起跑"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Picture title={en ? "Supply · KOC licensors" : "供给端 · KOC 授权方"} rows={SUPPLY(en)} accent="brand" />
          <Picture title={en ? "Demand · studios" : "需求端 · 制作方"} rows={DEMAND(en)} accent="pink" />
        </div>
      </Section>

      <Section
        eyebrow={en ? "Market validation" : "市场验证"}
        title={
          en ? (
            <>4 top creators in beta · a <span className="text-gradient">50M-fan matrix</span> ready to launch</>
          ) : (
            <>4 位头部达人内测 · <span className="text-gradient">5,000 万粉丝矩阵</span> 整齐待发</>
          )
        }
        subtitle={
          en
            ? "Not a slide deck — real top creators are already in the beta, validating product value and refining it in real scenarios."
            : "不是 PPT 概念 —— 真实头部达人已参与内测,在真实场景里验证产品价值并持续打磨。"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRACTION.map((p) => (
            <div key={p.name} className="glass rounded-[14px] p-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full text-white text-[20px] font-semibold bg-gradient-to-br from-[#6E59F6] to-[#FF6FB4]">
                {p.name.slice(0, 1)}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[16px] font-semibold text-ink">
                {p.name}
                <CheckCircle2 size={15} className="text-brand-2" />
              </div>
              <div className="mt-1 text-[13px] text-ink-3">{en ? `${p.fansEn} fans` : `粉丝 ${p.fans}`}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label={en ? "Top creators in beta" : "头部达人参与"} value={en ? "4" : "4 位"} />
          <StatCard icon={Sparkles} label={en ? "Fan reach" : "粉丝矩阵规模"} value="5000万+" />
          <StatCard icon={TrendingUp} label={en ? "Beta content created" : "内测内容创作"} value={en ? "200+" : "200+ 条"} />
          <StatCard icon={Star} label={en ? "Avg. engagement lift" : "平均互动率提升"} value="+60%" />
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow={en ? "Market research" : "市场调研"}
        title={en ? "Real pain points, verified on the front line" : "真实痛点已被一线验证"}
        subtitle={
          en
            ? "Across communities, recruiting platforms and studio ads, we collected and analyzed 200+ recruitment posts and interviewed 50 million-follower KOLs."
            : "通过社群、招募平台、短剧制作方广告等渠道,收集分析超 200 条招募信息,并访谈 50 位百万粉 KOL。"
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {SURVEY(en).map((s, i) => (
            <div key={s.title} className="glass rounded-[14px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-soft text-[12px] font-semibold text-brand">
                  {i + 1}
                </span>
                <span className="text-[12px] uppercase tracking-widest text-ink-3">{en ? `Finding ${i + 1}` : `结论 ${i + 1}`}</span>
              </div>
              <div className="text-[15px] font-semibold text-ink mb-2">{s.title}</div>
              <p className="text-[13.5px] leading-6 text-ink-3">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 glass rounded-[14px] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-[40px] md:text-[48px] font-semibold text-gradient leading-none shrink-0">80%+</div>
          <p className="text-[14px] md:text-[15px] leading-7 text-ink-2">
            {en ? (
              <>
                Among the 50 million-follower KOLs surveyed, <span className="text-ink font-medium">over 80% said they'd license their face to star in short dramas</span>; given fair licensing and revenue share, collaboration intent is strong and they're bullish on the market potential and long-term returns of AI short drama.
              </>
            ) : (
              <>
                受访的 50 位百万粉以上 KOL 中,<span className="text-ink font-medium">超 80% 表示愿意授权人脸出演短剧</span>,
                在合理授权与收益分成的前提下合作意愿强烈,看好 AI 短剧的市场潜力与长期收益。
              </>
            )}
          </p>
        </div>
      </Section>

      <Section
        eyebrow={en ? "Drivers · PEST" : "驱动力 · PEST"}
        title={en ? "Policy / tech / industry / users accelerating in sync" : "政策 / 技术 / 产业 / 用户 同向加速"}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PEST(en).map((p) => (
            <FeatureCard key={p.title} icon={p.icon} title={p.title} description={p.desc} />
          ))}
        </div>
      </Section>

      <Section tone="raised" eyebrow={en ? "Risks & mitigations" : "风险与应对"} title={en ? "Identify every potential headwind early" : "提前识别每一个潜在阻力"}>
        <div className="grid gap-3">
          {RISKS(en).map((r) => (
            <div key={r.title} className="glass rounded-[14px] p-5 md:p-6 flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                <ShieldAlert size={18} />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-ink mb-1">{r.title}</div>
                <p className="text-[13.5px] leading-6 text-ink-3">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={en ? "Operating plan" : "运营规划"}
        title={en ? "Supply first, then demand · scale the loop in three phases" : "先供给后需求 · 三阶段把闭环跑大"}
        subtitle={
          en
            ? "Core principle: supply before demand, manual before systems, private before public domains, supporting roles before leads."
            : "核心原则:先供给后需求,先人工后系统,先私域后公域,先配角后主角。"
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {GROWTH_PHASES(en).map((p) => (
            <div key={p.tag} className="glass rounded-[14px] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <p.icon size={18} />
                </span>
                <span className="text-[12px] text-ink-3">{p.span}</span>
              </div>
              <div className="text-[16px] font-semibold text-ink mb-3">{p.tag}</div>
              <ul className="grid gap-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2 text-[13px] leading-6 text-ink-2">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brand-2" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">{en ? "Three-phase channel strategy" : "三阶段渠道策略"}</div>
          <div className="overflow-x-auto glass rounded-[14px]">
            <table className="w-full min-w-[600px] text-[14px]">
              <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">{en ? "Channel" : "渠道"}</th>
                  <th className="px-5 py-3 font-medium">{en ? "Method" : "方法"}</th>
                  <th className="px-5 py-3 font-medium">{en ? "Est. conversion" : "预估转化"}</th>
                  <th className="px-5 py-3 font-medium">{en ? "Cost" : "成本"}</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS(en).map((c) => (
                  <tr key={c.name} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink whitespace-nowrap">{c.name}</td>
                    <td className="px-5 py-3 text-ink-2">{c.how}</td>
                    <td className="px-5 py-3 text-ink-2 whitespace-nowrap">{c.cvr}</td>
                    <td className="px-5 py-3 text-ink-3 whitespace-nowrap">{c.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1">{en ? "Multi-scenario expansion" : "多场景拓展"}</div>
          <p className="text-[13.5px] leading-6 text-ink-3 mb-4">
            {en
              ? "From 'short-drama licensing' to an 'all-scenario AI face licensing platform.'"
              : "从「短剧授权」走向「全场景 AI 人脸授权服务平台」。"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCENES(en).map((s) => (
              <div key={s.title} className="glass rounded-[14px] p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <s.icon size={18} />
                </div>
                <div className="text-[14.5px] font-semibold text-ink mb-1.5">{s.title}</div>
                <p className="text-[13px] leading-6 text-ink-3 mb-3">{s.desc}</p>
                <span className="inline-block rounded-md bg-brand-soft px-2 py-0.5 text-[12px] text-brand">
                  {s.inc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow={en ? "Competitive analysis" : "竞争分析"}
        title={en ? "Structural innovation · recombining existing elements" : "结构性创新 · 重组现有要素"}
      >
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">{en ? "Dimension" : "维度"}</th>
                <th className="px-5 py-3 font-medium">{en ? "Traditional actor" : "传统演员"}</th>
                <th className="px-5 py-3 font-medium">{en ? "AI actor (Mira model)" : "AI 演员 (Mira 模式)"}</th>
              </tr>
            </thead>
            <tbody>
              {(en
                ? [
                    { k: "Core skill", a: "Looks + acting + traffic influence", b: "Looks + IP operations" },
                    { k: "Time constraint", a: "Can only shoot one show a week", b: "No time/space limits, can appear in hundreds of shows at once" },
                    { k: "Cost structure", a: "Rigid fees + rigid agency cut", b: "Licensing + revenue split, marginal cost near zero" },
                    { k: "Talent source", a: "Professional drama schools", b: "KOLs / KOCs / short-video IP influencers" },
                    { k: "IP feedback", a: "Almost none; the work belongs to the studio", b: "The work feeds back into the creator's IP business" },
                  ]
                : [
                    { k: "核心技能", a: "形象 + 演技 + 流量影响力", b: "形象 + IP 运作能力" },
                    { k: "时间约束", a: "一周只能演一部", b: "不受时空限制,可同时出现在百部剧" },
                    { k: "成本结构", a: "片酬刚性 + 经纪刚性", b: "授权 + 分账,边际成本趋近 0" },
                    { k: "职业来源", a: "专业艺术院校", b: "KOL / KOC / 短视频 IP 网红" },
                    { k: "IP 反哺", a: "几乎无,作品归制作方", b: "作品反哺创作者 IP 业务" },
                  ]
              ).map((row) => (
                <tr key={row.k} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink-3">{row.k}</td>
                  <td className="px-5 py-3 text-ink-2">{row.a}</td>
                  <td className="px-5 py-3 text-ink">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {COMP(en).map((c) => (
            <div key={c.name} className="glass rounded-[14px] p-6">
              <div className="flex items-center gap-2 mb-3 text-ink-3 text-[12px] uppercase tracking-widest">
                <ArrowUpRight size={14} className="text-brand-2" /> {en ? "Potential competitor" : "潜在竞争"}
              </div>
              <div className="text-[15px] font-semibold text-ink mb-2">{c.name}</div>
              <p className="text-[13.5px] leading-6 text-ink-3">{c.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 glass rounded-[14px] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-brand-2 shrink-0 mt-1" />
            <p className="text-[14px] md:text-[15px] leading-7 text-ink-2">
              <span className="text-ink font-medium">{en ? "Conclusion: " : "结论:"}</span>
              {en
                ? "Mira is not a direct competitor but fills the infrastructure gap for 'compliant AI face licensing + distribution and revenue split' — essentially building a market where 'face IP' circulates as freely as music rights."
                : "Mira 不是直接竞品,而是填补「合规 AI 人脸授权 + 发行分账」的基础设施空白,本质是建立一个让「人脸 IP」像「音乐版权」一样自由流通的市场。"}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">{en ? "Business-model moat" : "商业模式护城河"}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOAT(en).map((m) => (
              <div key={m.n} className="glass rounded-[14px] p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-brand">
                    <m.icon size={18} />
                  </span>
                  <span className="text-[18px] font-semibold text-gradient leading-none">{m.n}</span>
                </div>
                <div className="text-[15px] font-semibold text-ink mb-1.5">{m.title}</div>
                <p className="text-[13px] leading-6 text-ink-3">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow={en ? "Fundraising plan" : "融资规划"}
        title={
          en ? (
            <>Seed round ¥5M · 10% equity · <span className="text-gradient">¥50M post-money</span></>
          ) : (
            <>种子轮 ¥500 万 · 出让 10% · <span className="text-gradient">投后估值 ¥5,000 万</span></>
          )
        }
        subtitle={
          en
            ? "Kicks off after a successful MVP; within a 12-month runway, prove both supply and demand and fully close the minimal loop."
            : "MVP 验证成功后启动,12 个月资金周期内跑通供需双端、打满最小闭环。"
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard icon={Coins} title={en ? "Funding runway" : "资金周期"} description={en ? "A 12-month runway to hit the seed milestones." : "资金使用周期 12 个月,完成种子里程碑。"} />
          <FeatureCard
            icon={TrendingUp}
            title={en ? "Seed milestones" : "种子里程碑"}
            description={en ? "KOCs ≥ 500 (50 exclusive) / studios ≥ 20 (5+ repeat) / monthly GMV ≥ ¥100K / monthly net revenue ≥ ¥20K." : "KOC ≥ 500(独家 50)/ 制作方 ≥ 20(复购 5+)/ 月交易 ≥ 10 万 / 平台月收入 ≥ 2 万。"}
          />
          <FeatureCard icon={Layers} title={en ? "Ecosystem links" : "生态联动"} description={en ? "Launch Web V1.0 and establish contact with 1+ major player (RedFruit / Douyin)." : "Web V1.0 上线 + 与 ≥ 1 家大厂(红果 / 抖音)建立合作接触。"} />
        </div>

        <div className="mt-6 glass rounded-[14px] overflow-hidden">
          <div className="px-5 md:px-6 py-3 border-b border-line text-[12px] uppercase tracking-widest text-ink-3">
            {en ? "Use of funds" : "资金用途明细"}
          </div>
          <div className="divide-y divide-line">
            {FUND_USE(en).map((f) => (
              <div key={f.use} className="grid grid-cols-[1fr_auto] gap-3 px-5 md:px-6 py-3 items-center">
                <div>
                  <div className="text-[14px] text-ink">{f.use}</div>
                  <div className="text-[12.5px] text-ink-3 mt-0.5">{f.note}</div>
                </div>
                <div className="text-[15px] font-semibold text-gradient whitespace-nowrap">{f.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

function Picture({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: { k: string; v: string }[];
  accent: "brand" | "pink";
}) {
  return (
    <div className="glass rounded-[16px] p-6 md:p-7">
      <div className="flex items-center gap-2 mb-5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: accent === "brand" ? "#6E59F6" : "#FF6FB4" }}
        />
        <span className="text-[12px] uppercase tracking-widest text-ink-3">
          {accent === "brand" ? "Supply" : "Demand"}
        </span>
      </div>
      <div className="text-[18px] font-semibold text-ink mb-5">{title}</div>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div
            key={r.k}
            className="grid grid-cols-[88px_1fr] gap-3 text-[14px] py-2 border-b border-line last:border-0"
          >
            <div className="text-ink-3">{r.k}</div>
            <div className="text-ink leading-6">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
