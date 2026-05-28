import { Section } from "@/components/Section";
import { LeadForm } from "@/components/LeadForm";
import { Sparkles, Briefcase, Banknote } from "lucide-react";

export const metadata = { title: "合作" };

export default function ContactPage() {
  return (
    <>
      <Section
        eyebrow="开始合作"
        title="选择你的身份 · 留个口子,我们 48 小时内联系你"
        subtitle="Mira 的三类核心合作伙伴:中腰部创作者、短剧 / 品牌制作方、AIGC 投资人。"
        align="center"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Intro icon={Sparkles} title="创作者" desc="把你的脸资产化,接入短剧、品牌、出海等多种授权场景。" />
          <Intro icon={Briefcase} title="制作方" desc="拿合规 AI 演员、灵活套餐与版权交付包,直接落地内容生产。" />
          <Intro icon={Banknote} title="投资人" desc="种子轮 ¥500 万 · 10% · 投后 ¥5000 万,12 个月跑通最小闭环。" />
        </div>
      </Section>

      <Section tone="raised">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          <LeadForm
            id="creator"
            kind="creator"
            accent="brand"
            title="我是创作者"
            subtitle="留下联系方式,Mira 运营会带你走完资质审核、数据采集、签约上链流程。"
            fields={{
              name: "你的真名 / 艺名",
              contact: "微信号 / 手机",
              message: "可填:目前粉丝量、内容方向、独家意愿",
            }}
          />
          <LeadForm
            id="partner"
            kind="partner"
            accent="pink"
            title="我是制作方"
            subtitle="短剧 / 漫剧 / 品牌 / 出海团队,告诉我们项目类型与需求,我们给一份脸库 + 报价。"
            fields={{
              name: "公司 / 团队",
              contact: "对接人微信 / 邮箱",
              message: "可填:项目类型、需要的脸数与预算",
            }}
          />
          <LeadForm
            id="invest"
            kind="invest"
            accent="cyan"
            title="我是投资人"
            subtitle="拉通融资资料、跑通业务模型、数据 demo。"
            fields={{
              name: "你 / 机构",
              contact: "邮箱(优先)",
              message: "可填:关注阶段、关注方向",
            }}
          />
        </div>
      </Section>

      <Section align="center">
        <div className="glass rounded-[16px] p-8 md:p-10 text-center">
          <p className="text-[19px] md:text-[24px] font-semibold text-gradient mb-6">
            照亮每一处值得被看见的叙事
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-2 text-[14.5px]">
            <div className="text-ink-2">
              联系人 <span className="text-ink font-medium">温雨涵</span>
            </div>
            <div className="text-ink-2">
              微信 <span className="text-ink font-medium">EulaWen2020</span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Intro({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-[14px] p-6 text-left">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
        <Icon size={20} />
      </div>
      <div className="text-[16px] font-semibold text-ink mb-2">{title}</div>
      <p className="text-[13.5px] leading-6 text-ink-3">{desc}</p>
    </div>
  );
}
