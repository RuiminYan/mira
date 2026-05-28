import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Section } from "@/components/Section";
import { StatCard } from "@/components/Card";
import { ShieldCheck, FileCheck, Database, Users, Coins, Sparkles } from "lucide-react";
import { ticketStats } from "@/lib/tickets";

export const metadata: Metadata = {
  title: "透明度报告",
  description:
    "Mira 公开关键运营指标 ・ 合规快照 ・ SLA 表现 ・ 数据治理。所有数字来自 SQLite 实时统计。",
};

function count(table: { id: { name: string } } | unknown, where?: string): number {
  // simple helper via raw count
  void table;
  void where;
  return 0;
}

export default async function TransparencyPage() {
  const userCnt =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM users`)?.c ?? 0;
  const talentLive =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM talents WHERE status = 'live'`
    )?.c ?? 0;
  const settled =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM orders WHERE status = 'settled'`
    )?.c ?? 0;
  const totalGmv =
    db.get<{ s: number }>(
      sql`SELECT IFNULL(SUM(amount),0) as s FROM orders WHERE status IN ('paid','approved','delivered','settled')`
    )?.s ?? 0;
  const chainRecs =
    db.get<{ c: number }>(sql`SELECT COUNT(*) as c FROM chain_records`)?.c ?? 0;
  const takedownDone =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM takedowns WHERE status = 'approved'`
    )?.c ?? 0;
  const verifApproved =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM verifications WHERE status = 'approved'`
    )?.c ?? 0;
  const verifRejected =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM verifications WHERE status = 'rejected'`
    )?.c ?? 0;
  const tStats = ticketStats();
  const riskOpen =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM risk_flags WHERE status = 'open'`
    )?.c ?? 0;
  const refundCnt =
    db.get<{ c: number }>(
      sql`SELECT COUNT(*) as c FROM orders WHERE status = 'refunded'`
    )?.c ?? 0;
  void count;
  void schema;

  const yuanFmt = (n: number) => `¥${(n / 1).toLocaleString("zh-CN")}`;

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-14 md:py-20">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">
            Transparency Report
          </div>
          <h1 className="text-balance text-[34px] md:text-[48px] font-semibold leading-tight">
            把所有「<span className="text-gradient">不透明</span>」翻到台面上
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] md:text-[16px] text-ink-3 leading-7">
            我们相信信任 ≠ 合同。所有指标取自数据库实时统计,任何注册用户都能在 /admin/system 看到原始计数器。
          </p>
        </div>
      </section>

      <Section eyebrow="平台规模" title="核心指标">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard icon={Users} label="累计用户" value={String(userCnt)} hint="含创作者 / 制作方 / MCN / 管理员" />
          <StatCard icon={Sparkles} label="在架形象" value={String(talentLive)} hint="status = live" />
          <StatCard icon={Coins} label="已结订单" value={String(settled)} hint="status = settled" />
          <StatCard icon={Coins} label="累计 GMV" value={yuanFmt(totalGmv)} hint="orders.amount 求和" />
        </div>
      </Section>

      <Section tone="raised" eyebrow="合规 & 信任" title="可验证的执行力">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard icon={Database} label="链上记录" value={String(chainRecs)} hint="chain_records 表" />
          <StatCard icon={ShieldCheck} label="实名通过率" value={
            verifApproved + verifRejected === 0
              ? "—"
              : Math.round((verifApproved * 100) / (verifApproved + verifRejected)) + "%"
          } hint={`approved=${verifApproved} rejected=${verifRejected}`} />
          <StatCard icon={FileCheck} label="被遗忘权下架" value={String(takedownDone)} hint="所有事件链上留痕" />
          <StatCard icon={ShieldCheck} label="风险事件未结" value={String(riskOpen)} hint="open 状态" />
        </div>
      </Section>

      <Section eyebrow="工单 SLA" title="客服响应力">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="累计工单" value={String(tStats.total)} />
          <StatCard label="处理中" value={String(tStats.open + tStats.pending)} hint={`open ${tStats.open} · pending ${tStats.pending}`} />
          <StatCard label="已解决" value={String(tStats.resolved + tStats.closed)} />
          <StatCard label="平均解决时长" value={tStats.avgResolveHours + " h"} hint="(resolvedAt - createdAt) 平均" />
        </div>
      </Section>

      <Section tone="raised" eyebrow="数据治理" title="承诺清单">
        <div className="grid gap-3">
          <PromiseLine label="身份证号永不入库原文,只存 last4 + SHA256" />
          <PromiseLine label="训练素材下架后 90 天内从训练集物理删除" />
          <PromiseLine label="KYC 证据链按法律要求永久留存,但与训练数据隔离" />
          <PromiseLine label="所有支付凭证按《电子签名法》保留 10 年" />
          <PromiseLine label="一般行为日志保留 24 个月" />
          <PromiseLine label="所有跨境传输走 PIPL 标准合同(SCC),自动生成中英双语模板" />
          <PromiseLine label={`累计退款订单 ${refundCnt} 单,全部记录在案,可在 /admin/system 查阅`} />
        </div>
      </Section>

      <Section eyebrow="给监管 / 学界 / 媒体" title="数据查询接口" subtitle="任何研究者都可调用以下端点。所有响应为只读,无个人敏感字段。">
        <ul className="grid gap-2 text-[14px] text-ink-2">
          <li className="glass rounded-[12px] p-4">
            <code className="text-ink">GET /api/health</code> · 服务健康 + 数据库 ping
          </li>
          <li className="glass rounded-[12px] p-4">
            <code className="text-ink">GET /sitemap.xml</code> · 全站可索引页面
          </li>
          <li className="glass rounded-[12px] p-4">
            <code className="text-ink">GET /insights/rss.xml</code> · 洞察文章 RSS
          </li>
          <li className="glass rounded-[12px] p-4">
            <code className="text-ink">GET /api/v1/talents</code> · 公开形象列表(需要 API Key,scope: talent:read)
          </li>
        </ul>
      </Section>
    </>
  );
}

function PromiseLine({ label }: { label: string }) {
  return (
    <div className="glass rounded-[12px] p-4 flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]" />
      <span className="text-[14px] leading-7 text-ink-2">{label}</span>
    </div>
  );
}
