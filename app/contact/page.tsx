import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { LeadForm } from "@/components/LeadForm";
import { getLocale } from "@/lib/i18n";
import { Sparkles, Briefcase, Banknote } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: locale === "en" ? "Partner with us" : "合作" };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <>
      <Section
        eyebrow={en ? "Start a partnership" : "开始合作"}
        title={
          en
            ? "Pick your role — leave us a line and we'll reach out within 48 hours"
            : "选择你的身份 · 留个口子,我们 48 小时内联系你"
        }
        subtitle={
          en
            ? "Mira's three core partner types: mid-tier creators, short-drama / brand studios, and AIGC investors."
            : "Mira 的三类核心合作伙伴:中腰部创作者、短剧 / 品牌制作方、AIGC 投资人。"
        }
        align="center"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Intro
            icon={Sparkles}
            title={en ? "Creators" : "创作者"}
            desc={
              en
                ? "Turn your face into an asset and tap licensing across short drama, brands, and overseas markets."
                : "把你的脸资产化,接入短剧、品牌、出海等多种授权场景。"
            }
          />
          <Intro
            icon={Briefcase}
            title={en ? "Studios" : "制作方"}
            desc={
              en
                ? "Get compliant AI actors, flexible plans and a rights-cleared delivery package — ready for production."
                : "拿合规 AI 演员、灵活套餐与版权交付包,直接落地内容生产。"
            }
          />
          <Intro
            icon={Banknote}
            title={en ? "Investors" : "投资人"}
            desc={
              en
                ? "Seed round: ¥5M for 10% at a ¥50M post-money, proving the minimal loop in 12 months."
                : "种子轮 ¥500 万 · 10% · 投后 ¥5000 万,12 个月跑通最小闭环。"
            }
          />
        </div>
      </Section>

      <Section tone="raised">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          <LeadForm
            id="creator"
            kind="creator"
            accent="brand"
            locale={locale}
            title={en ? "I'm a creator" : "我是创作者"}
            subtitle={
              en
                ? "Leave your contact and Mira's team will walk you through credential review, data capture, and on-chain signing."
                : "留下联系方式,Mira 运营会带你走完资质审核、数据采集、签约上链流程。"
            }
            fields={{
              name: en ? "Your real name / stage name" : "你的真名 / 艺名",
              contact: en ? "WeChat ID / phone" : "微信号 / 手机",
              message: en ? "Optional: current following, content niche, exclusivity interest" : "可填:目前粉丝量、内容方向、独家意愿",
            }}
          />
          <LeadForm
            id="partner"
            kind="partner"
            accent="pink"
            locale={locale}
            title={en ? "I'm a studio" : "我是制作方"}
            subtitle={
              en
                ? "Short drama / motion comics / brand / overseas teams — tell us your project type and needs, and we'll send a face library plus a quote."
                : "短剧 / 漫剧 / 品牌 / 出海团队,告诉我们项目类型与需求,我们给一份脸库 + 报价。"
            }
            fields={{
              name: en ? "Company / team" : "公司 / 团队",
              contact: en ? "Point of contact's WeChat / email" : "对接人微信 / 邮箱",
              message: en ? "Optional: project type, number of faces needed, budget" : "可填:项目类型、需要的脸数与预算",
            }}
          />
          <LeadForm
            id="invest"
            kind="invest"
            accent="cyan"
            locale={locale}
            title={en ? "I'm an investor" : "我是投资人"}
            subtitle={
              en
                ? "Get the fundraising deck, business model walkthrough, and a data demo."
                : "拉通融资资料、跑通业务模型、数据 demo。"
            }
            fields={{
              name: en ? "You / your fund" : "你 / 机构",
              contact: en ? "Email (preferred)" : "邮箱(优先)",
              message: en ? "Optional: stage and focus areas" : "可填:关注阶段、关注方向",
            }}
          />
        </div>
      </Section>

      <Section align="center">
        <div className="glass rounded-[16px] p-8 md:p-10 text-center">
          <p className="text-[19px] md:text-[24px] font-semibold text-gradient mb-6">
            {en ? "Illuminate every story worth being seen" : "照亮每一处值得被看见的叙事"}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-2 text-[14.5px]">
            <div className="text-ink-2">
              {en ? (
                <>Contact: <span className="text-ink font-medium">Wen Yuhan</span></>
              ) : (
                <>联系人 <span className="text-ink font-medium">温雨涵</span></>
              )}
            </div>
            <div className="text-ink-2">
              {en ? (
                <>WeChat: <span className="text-ink font-medium">EulaWen2020</span></>
              ) : (
                <>微信 <span className="text-ink font-medium">EulaWen2020</span></>
              )}
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
