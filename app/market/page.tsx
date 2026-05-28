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

export const metadata = { title: "市场分析" };

const SUPPLY = [
  { k: "粉丝量级", v: "1–10 万的小红书 / 抖音中腰部创作者" },
  { k: "更新频率", v: "周更 ≥ 3 次,持续生产可识别面部内容" },
  { k: "内容类型", v: "颜值类、生活类、剧情类、情感类博主" },
  { k: "核心动机", v: "被动收入、IP 曝光、低门槛参与影视" },
  { k: "主要担忧", v: "形象滥用、分账不透明 → 由合规与链上存证打消" },
];

const DEMAND = [
  { k: "目标客户", v: "月产 3–10 部短剧的小型工作室" },
  { k: "补充客户", v: "AI 视频内容代运营公司、新消费品牌(短剧植入)" },
  { k: "核心痛点", v: "合规风险高、配角选角效率低、AI 生成内容缺授权" },
  { k: "决策链路", v: "制片人 / 内容负责人 → 老板拍板" },
];

const PEST = [
  {
    icon: Scale,
    title: "政策 Political",
    desc: "《民法典》明确肖像权可授权;《生成式 AI 服务管理办法》要求合规标识与可追溯。Mira 站在合规曲线之上。",
  },
  {
    icon: Zap,
    title: "技术 Technological",
    desc: "视频生成成本指数级下降(50 万 → 10 万),AI 配角脸口型动作已可商用,门槛持续下移。",
  },
  {
    icon: Building2,
    title: "产业 Economic",
    desc: "微短剧 1200 亿、AI 漫剧爆发,平台加大分账,内容供应缺口在结构性扩大。",
  },
  {
    icon: Users,
    title: "用户 Social",
    desc: "KOC 数量超千万,变现渠道单一。被动版税收入诉求被严重低估。",
  },
];

const RISKS = [
  { title: "合规边界尚在演进", desc: "持续与律所、监管沟通,合同条款随政策同步更新,守住可被遗忘权与数据安全底线。" },
  { title: "传统艺人 / 影视抵制", desc: "通过分账模式、IP 反哺逻辑教育市场,与现有产业互补而非替代。" },
  { title: "KOC 签约教育成本", desc: "MCN 深度合作 + 返佣 15%–20%,以及独家签约计划提升留存。" },
  { title: "大厂下场", desc: "靠先发的双边网络效应、独家库与行业标准制定,构筑迁移成本。" },
];

const COMP = [
  { name: "爱奇艺纳逗 Pro", note: "传统艺人授权,流量价值远大于形象价值,艺人在产品里赚不到大钱。" },
  { name: "字节跳动", note: "大厂决策慢,核心精力在大模型;内部缺内容创作者视角。" },
  { name: "传统影视公司", note: "思维保守,缺跨界融合思维与轻资产撮合能力。" },
];

const TRACTION = [
  { name: "塑料叉", fans: "500 万+" },
  { name: "小鸣同学", fans: "800 万+" },
  { name: "蓝江律师", fans: "500 万+" },
  { name: "尤拉", fans: "100 万+" },
];

const SURVEY = [
  {
    title: "AI 制作公司粗放收集人脸素材",
    desc: "大量 AI 影视公司以「招募演员」「短剧演员招募」名义,未获授权收集人脸素材用于 AI 换脸短剧制作。",
  },
  {
    title: "艺人与网红被盗用人脸泛滥",
    desc: "大量艺人、网红人脸被 AI 换脸用于短剧等内容,未获授权,严重侵害肖像权并造成负面影响。",
  },
  {
    title: "网红 KOL 对授权参演兴趣昂然",
    desc: "调研 50 位百万粉以上 KOL,超 80% 愿意授权人脸出演短剧,合理授权与分账下合作意愿强烈。",
  },
];

const MOAT = [
  { n: "01", icon: Network, title: "双边网络效应", desc: "KOC 越多 → 制作方选择越多 → 用得越多 → 更多 KOC 加入,正循环自我强化。" },
  { n: "02", icon: Layers, title: "分账数据沉淀", desc: "KOC 历史分账记录形成转移成本,换平台等于放弃已积累的收益证明。" },
  { n: "03", icon: Crown, title: "独家授权锁定", desc: "对高频分账 KOC 提供独家签约,从供给侧切断竞品。" },
  { n: "04", icon: FileCheck, title: "行业标准先发", desc: "联合律所发布《AI 人脸授权行业标准》,成为事实上的规则制定者。" },
  { n: "05", icon: ShieldCheck, title: "合规深度", desc: "授权边界、数据安全、被遗忘权全链路合规设计,大厂难以短期复制。" },
];

const FUND_USE = [
  { use: "技术开发(轻量平台)", pct: "30–40%", note: "Web 展示页 + KOC 自助上传 + 分账记录后台" },
  { use: "KOC 签约激励", pct: "20–30%", note: "支付首批 500 个 KOC 授权费(每人 ¥100–300)" },
  { use: "运营与市场", pct: "20–25%", note: "1–2 人运营团队、制作方拓展、KOC 社群维护" },
  { use: "法务合规", pct: "10–15%", note: "授权协议模板、律师咨询、软著申请、公司注册" },
  { use: "备用金", pct: "5–10%", note: "应急或突发机会" },
];

const GROWTH_PHASES = [
  {
    icon: Sparkles,
    tag: "冷启动期",
    span: "0–3 个月",
    points: [
      "签约 KOC 50 → 500 人",
      "合作制作方 1 → 20 家",
      "月平台交易 ¥1 万 → ¥10 万",
      "完成 ≥ 1 个标杆成功案例",
    ],
  },
  {
    icon: TrendingUp,
    tag: "增长期",
    span: "3–12 个月",
    points: [
      "签约 KOC 500 → 2,000(独家 ≥ 200)",
      "合作制作方 20 → 100 家",
      "月交易额 ¥10 万 → ¥100 万",
      "接入 ≥ 1 家大厂生态(红果 / 抖音)",
    ],
  },
  {
    icon: Crown,
    tag: "规模化期",
    span: "12–36 个月",
    points: [
      "签约 KOC 2,000 → 10,000+(独家 ≥ 1,000)",
      "合作制作方 100 → 500 家",
      "年交易额 ¥1,000 万 → ¥1 亿+",
      "平台抽成后年收入 ¥200 万 → ¥2,000 万+",
    ],
  },
];

const CHANNELS = [
  { name: "小红书 / 抖音私信", how: "筛选 10 万级生活 / 颜值 / 剧情类博主,定向私信邀约", cvr: "5–10%", cost: "极低(人工)" },
  { name: "现有粉丝矩阵转化", how: "盘活自有 5,000 万粉丝矩阵(创小鸣 / 感阅等 KOC)", cvr: "10–20%", cost: "极低" },
  { name: "MCN 合作", how: "与中小 MCN(主营短剧 KOC)签分成协议,批量签约", cvr: "批量", cost: "分成模式" },
  { name: "社群裂变", how: "已签约 KOC 推荐新 KOC,双方各得 ¥50 奖励", cvr: "15–25%", cost: "¥50 / 新用户" },
];

const SCENES = [
  { icon: Megaphone, title: "品牌 TVC / 信息流广告", desc: "与 4A 广告公司、品牌方直接合作,提供「品牌 AI 代言脸」服务。", inc: "SAM +15–30 亿" },
  { icon: Star, title: "虚拟主播 / 直播", desc: "与直播公会合作,提供「AI 虚拟脸 + 直播脚本」方案。", inc: "新增长曲线" },
  { icon: Zap, title: "游戏 NPC", desc: "与中小游戏工作室合作,提供可复用的角色脸模。", inc: "探索期" },
  { icon: Network, title: "出海(东南亚短剧)", desc: "复制国内模式,签约东南亚 KOC,服务当地短剧制作方。", inc: "长期战略" },
];

export default function MarketPage() {
  return (
    <>
      <Section
        eyebrow="市场规模"
        title={<>千亿短剧时代 · 数十亿 <span className="text-gradient">人脸授权</span> SAM</>}
        subtitle="TAM 万亿级,核心相关细分市场数千亿级;Mira 锁定的核心 SAM 为 18–50 亿元/年。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={TrendingUp} label="短剧人脸授权 SAM" value="¥8–30 亿/年" hint="15,000 部 × 5 张/部 × ¥1,000" />
          <StatCard icon={Megaphone} label="品牌广告 SAM" value="¥15–30 亿/年" hint="视频广告 300–500 亿 × 200 万张次 × ¥1500" />
          <StatCard icon={Layers} label="综合(含出海)" value="¥18–50 亿/年" hint="叠加虚拟主播、游戏 NPC、出海短剧" />
        </div>

        <div className="mt-6 glass rounded-[14px] p-6 md:p-8">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">核心洞察</div>
          <p className="text-[15px] md:text-[16px] leading-7 text-ink-2 max-w-3xl">
            视频生成成本指数级下降 → 传统影视公司组织瓦解 → AI 肖像授权问题爆发。
            <span className="text-ink">行业基础设施缺位是天然窗口,Mira 把 IP 流通做成「合规 + 分账 + 数据」的版权交易所。</span>
          </p>
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow="供需画像"
        title="供给端 / 需求端 同步起跑"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Picture title="供给端 · KOC 授权方" rows={SUPPLY} accent="brand" />
          <Picture title="需求端 · 制作方" rows={DEMAND} accent="pink" />
        </div>
      </Section>

      <Section
        eyebrow="市场验证"
        title={<>4 位头部达人内测 · <span className="text-gradient">5,000 万粉丝矩阵</span> 整齐待发</>}
        subtitle="不是 PPT 概念 —— 真实头部达人已参与内测,在真实场景里验证产品价值并持续打磨。"
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
              <div className="mt-1 text-[13px] text-ink-3">粉丝 {p.fans}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="头部达人参与" value="4 位" />
          <StatCard icon={Sparkles} label="粉丝矩阵规模" value="5000万+" />
          <StatCard icon={TrendingUp} label="内测内容创作" value="200+ 条" />
          <StatCard icon={Star} label="平均互动率提升" value="+60%" />
        </div>
      </Section>

      <Section
        tone="raised"
        eyebrow="市场调研"
        title="真实痛点已被一线验证"
        subtitle="通过社群、招募平台、短剧制作方广告等渠道,收集分析超 200 条招募信息,并访谈 50 位百万粉 KOL。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {SURVEY.map((s, i) => (
            <div key={s.title} className="glass rounded-[14px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-soft text-[12px] font-semibold text-brand">
                  {i + 1}
                </span>
                <span className="text-[12px] uppercase tracking-widest text-ink-3">结论 {i + 1}</span>
              </div>
              <div className="text-[15px] font-semibold text-ink mb-2">{s.title}</div>
              <p className="text-[13.5px] leading-6 text-ink-3">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 glass rounded-[14px] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-[40px] md:text-[48px] font-semibold text-gradient leading-none shrink-0">80%+</div>
          <p className="text-[14px] md:text-[15px] leading-7 text-ink-2">
            受访的 50 位百万粉以上 KOL 中,<span className="text-ink font-medium">超 80% 表示愿意授权人脸出演短剧</span>,
            在合理授权与收益分成的前提下合作意愿强烈,看好 AI 短剧的市场潜力与长期收益。
          </p>
        </div>
      </Section>

      <Section
        eyebrow="驱动力 · PEST"
        title="政策 / 技术 / 产业 / 用户 同向加速"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PEST.map((p) => (
            <FeatureCard key={p.title} icon={p.icon} title={p.title} description={p.desc} />
          ))}
        </div>
      </Section>

      <Section tone="raised" eyebrow="风险与应对" title="提前识别每一个潜在阻力">
        <div className="grid gap-3">
          {RISKS.map((r) => (
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
        eyebrow="运营规划"
        title="先供给后需求 · 三阶段把闭环跑大"
        subtitle="核心原则:先供给后需求,先人工后系统,先私域后公域,先配角后主角。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {GROWTH_PHASES.map((p) => (
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
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">三阶段渠道策略</div>
          <div className="overflow-x-auto glass rounded-[14px]">
            <table className="w-full min-w-[600px] text-[14px]">
              <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-medium">渠道</th>
                  <th className="px-5 py-3 font-medium">方法</th>
                  <th className="px-5 py-3 font-medium">预估转化</th>
                  <th className="px-5 py-3 font-medium">成本</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((c) => (
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
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1">多场景拓展</div>
          <p className="text-[13.5px] leading-6 text-ink-3 mb-4">
            从「短剧授权」走向「全场景 AI 人脸授权服务平台」。
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCENES.map((s) => (
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
        eyebrow="竞争分析"
        title="结构性创新 · 重组现有要素"
      >
        <div className="overflow-x-auto glass rounded-[14px]">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead className="text-left text-ink-3 text-[12px] uppercase tracking-widest">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">维度</th>
                <th className="px-5 py-3 font-medium">传统演员</th>
                <th className="px-5 py-3 font-medium">AI 演员 (Mira 模式)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { k: "核心技能", a: "形象 + 演技 + 流量影响力", b: "形象 + IP 运作能力" },
                { k: "时间约束", a: "一周只能演一部", b: "不受时空限制,可同时出现在百部剧" },
                { k: "成本结构", a: "片酬刚性 + 经纪刚性", b: "授权 + 分账,边际成本趋近 0" },
                { k: "职业来源", a: "专业艺术院校", b: "KOL / KOC / 短视频 IP 网红" },
                { k: "IP 反哺", a: "几乎无,作品归制作方", b: "作品反哺创作者 IP 业务" },
              ].map((row) => (
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
          {COMP.map((c) => (
            <div key={c.name} className="glass rounded-[14px] p-6">
              <div className="flex items-center gap-2 mb-3 text-ink-3 text-[12px] uppercase tracking-widest">
                <ArrowUpRight size={14} className="text-brand-2" /> 潜在竞争
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
              <span className="text-ink font-medium">结论:</span>
              Mira 不是直接竞品,而是填补「合规 AI 人脸授权 + 发行分账」的基础设施空白,
              本质是建立一个让「人脸 IP」像「音乐版权」一样自由流通的市场。
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-4">商业模式护城河</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOAT.map((m) => (
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
        eyebrow="融资规划"
        title={<>种子轮 ¥500 万 · 出让 10% · <span className="text-gradient">投后估值 ¥5,000 万</span></>}
        subtitle="MVP 验证成功后启动,12 个月资金周期内跑通供需双端、打满最小闭环。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard icon={Coins} title="资金周期" description="资金使用周期 12 个月,完成种子里程碑。" />
          <FeatureCard
            icon={TrendingUp}
            title="种子里程碑"
            description="KOC ≥ 500(独家 50)/ 制作方 ≥ 20(复购 5+)/ 月交易 ≥ 10 万 / 平台月收入 ≥ 2 万。"
          />
          <FeatureCard icon={Layers} title="生态联动" description="Web V1.0 上线 + 与 ≥ 1 家大厂(红果 / 抖音)建立合作接触。" />
        </div>

        <div className="mt-6 glass rounded-[14px] overflow-hidden">
          <div className="px-5 md:px-6 py-3 border-b border-line text-[12px] uppercase tracking-widest text-ink-3">
            资金用途明细
          </div>
          <div className="divide-y divide-line">
            {FUND_USE.map((f) => (
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
