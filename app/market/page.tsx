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
  { name: "爱奇艺纳豆 Pro", note: "传统艺人授权,流量价值远大于形象价值,艺人在产品里赚不到大钱。" },
  { name: "字节跳动", note: "大厂决策慢,核心精力在大模型;内部缺内容创作者视角。" },
  { name: "传统影视公司", note: "思维保守,缺跨界融合思维与轻资产撮合能力。" },
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
      </Section>

      <Section
        tone="raised"
        eyebrow="融资规划"
        title={<>种子轮 ¥300 万 · 出让 10% · <span className="text-gradient">投后估值 ¥3,000 万</span></>}
        subtitle="MVP 验证成功后 3 个月内打满闭环,跑通供需双端节奏。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard icon={Coins} title="资金周期" description="资金使用周期 3 个月(4–6 月),完成种子里程碑。" />
          <FeatureCard
            icon={TrendingUp}
            title="种子里程碑"
            description="KOC ≥ 500(独家 50)/ 制作方 ≥ 20(复购 5+)/ 月交易 ≥ 10 万 / 平台月收入 ≥ 2 万。"
          />
          <FeatureCard icon={Layers} title="生态联动" description="Web V1.0 上线 + 与 ≥ 1 家大厂(红果 / 抖音)建立合作接触。" />
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
