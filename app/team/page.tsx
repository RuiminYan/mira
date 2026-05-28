import {
  Crown,
  Code2,
  TrendingUp,
  Scale,
  Briefcase,
  Star,
  Building2,
  Users,
  Megaphone,
} from "lucide-react";
import { Section } from "@/components/Section";
import { FeatureCard } from "@/components/Card";

export const metadata = { title: "团队 & 顾问" };

const TEAM = [
  {
    role: "创始人 / CEO",
    name: "温雨涵",
    icon: Crown,
    tag: "97 年 · 上海财大国际商务硕士",
    desc: "6 年自媒体 IP / MCN 经验,百万粉丝博主,孵化与签约达人粉丝矩阵 5,000 万。",
    accent: "from-[#6E59F6] to-[#FF6FB4]",
  },
  {
    role: "CTO / 算法",
    name: "王雨城",
    icon: Code2,
    tag: "97 年 · 中科院硕士",
    desc: "算法工程师,「最强大脑」12 强,小红书 8 万粉丝,擅长生成式 AI 工程化落地。",
    accent: "from-[#22D3EE] to-[#6E59F6]",
  },
  {
    role: "COO / 运营",
    name: "孙楚婷",
    icon: TrendingUp,
    tag: "02 年 · 中央财大金融学硕士",
    desc: "26 届毕业生,负责供需双边运营节奏与平台增长打法。",
    accent: "from-[#FF6FB4] to-[#FBBF24]",
  },
  {
    role: "商务 / BD",
    name: "陈凯",
    icon: Briefcase,
    tag: "前百度云销售经理",
    desc: "大客户销售背景,负责制作方 KA 客户开拓与生态合作。",
    accent: "from-[#0EA5E9] to-[#6E59F6]",
  },
];

const ADVISORS = [
  {
    icon: Scale,
    title: "段和段律所",
    role: "版权与合规顾问",
    desc: "起草《AI 肖像授权合同》及行业白皮书框架,确保平台业务始终在合规曲线之上。",
  },
  {
    icon: Star,
    title: "江传荣",
    role: "影视行业顾问",
    desc: "上海开圣影视创始人,曾任上海市影视制作行业协会技术专委主任。",
  },
];

const ASSETS = [
  {
    icon: Megaphone,
    title: "东方星链",
    desc: "自有 AIGC 行业媒体覆盖 7,000+ B 端用户、5,000+ AIGC / 漫剧社群,平台天然带流量。",
  },
  {
    icon: Users,
    title: "5,000 万粉丝矩阵",
    desc: "前身上海感阅文化深耕短视频 / IP 达人运营 6 年,种子供给已就位。",
  },
  {
    icon: Building2,
    title: "政府资源",
    desc: "首批落地上海市浦东新区金桥镇微短剧产业基地,已办市级 2,000+ 人 AIGC 大会。",
  },
];

export default function TeamPage() {
  return (
    <>
      <Section
        eyebrow="关于我们"
        title="上海浦光星奕文化科技有限公司"
        subtitle="2025-12-26 成立,首批落地上海市浦东新区金桥镇微短剧产业基地。前身上海感阅文化深耕短视频 / IP 达人运营 6 年,覆盖 5,000 万粉丝矩阵。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {ASSETS.map((a) => (
            <FeatureCard key={a.title} icon={a.icon} title={a.title} description={a.desc} />
          ))}
        </div>
      </Section>

      <Section tone="raised" eyebrow="核心团队" title="互补的供给 / 技术 / 增长 / 商务铁三角">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.name} className="glass rounded-[16px] p-6 relative overflow-hidden">
                <div
                  className={
                    "absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-25 blur-2xl bg-gradient-to-br " +
                    m.accent
                  }
                />
                <div
                  className={
                    "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md text-white bg-gradient-to-br " +
                    m.accent
                  }
                >
                  <Icon size={20} />
                </div>
                <div className="text-[12px] text-ink-3 mb-1 uppercase tracking-widest">{m.role}</div>
                <div className="text-[20px] font-semibold text-ink leading-tight mb-1">{m.name}</div>
                <div className="text-[12px] text-ink-3 mb-3">{m.tag}</div>
                <p className="text-[13.5px] leading-6 text-ink-3">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section eyebrow="行业顾问" title="律师 + 影视一线 = 商业模式护城河">
        <div className="grid gap-4 md:grid-cols-2">
          {ADVISORS.map((a) => (
            <div key={a.title} className="glass rounded-[16px] p-6 md:p-8 flex gap-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                <a.icon size={20} />
              </div>
              <div>
                <div className="text-[18px] font-semibold text-ink mb-1">{a.title}</div>
                <div className="text-[12px] text-ink-3 mb-3 uppercase tracking-widest">{a.role}</div>
                <p className="text-[14px] leading-6 text-ink-3">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
