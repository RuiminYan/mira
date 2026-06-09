import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { submitVerification } from "@/app/actions/verifications";
import { CREATOR_NAV as NAV } from "@/lib/nav";
import { createLoader, parseAsString } from "nuqs/server";

export const metadata = { title: "实名认证" };

const loadSearch = createLoader({
  ok: parseAsString,
  err: parseAsString,
  next: parseAsString,
});

const ERR_MAP: Record<string, string> = {
  name: "姓名长度需在 2 到 30 个字符之间",
  idcard: "身份证号格式不正确(15 或 18 位)",
  phone: "手机号需为 11 位数字",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await loadSearch(searchParams);
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/verify");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  const v = db
    .select()
    .from(schema.verifications)
    .where(eq(schema.verifications.userId, u.id))
    .get();

  return (
    <DashboardShell role={`创作者 · ${u.nickname}`} nav={NAV}>
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">合规与信任</div>
          <h1 className="text-[28px] md:text-[34px] font-semibold leading-tight">
            完成<span className="text-gradient">实名认证</span>
          </h1>
          <p className="mt-4 text-ink-3 text-[15px] leading-7 max-w-md">
            上传形象、签发分账合同、被遗忘权下架,都需要实名身份。
            身份证号在客户端被 SHA256 哈希后入库,平台不存原文。
          </p>

          <div className="mt-6 grid gap-3">
            <Info title="数据安全" desc="身份证号哈希存储,仅展示后 4 位用于核对" />
            <Info title="审核时长" desc="人工 24 小时内审完,通过后自动生成 KYC 授权合同并上链" />
            <Info title="信任徽章" desc="审核通过后所有形象与合同会标记『已实名』" />
          </div>
        </div>

        <div>
          <PanelTitle hint={statusHint(v?.status)}>认证表单</PanelTitle>

          {sp.ok && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-[13px] text-emerald-300">
              <ShieldCheck size={14} /> 材料已提交,等待平台审核
            </div>
          )}
          {sp.err && ERR_MAP[sp.err] && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-[13px] text-amber-300">
              <AlertTriangle size={14} /> {ERR_MAP[sp.err]}
            </div>
          )}

          {v?.status === "approved" ? (
            <div className="glass rounded-[14px] p-6">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-emerald-500/15 text-emerald-300 text-[12px] mb-4">
                <ShieldCheck size={14} /> 已实名
              </div>
              <div className="text-[14px] text-ink-2 leading-7">
                姓名 {v.realName} · 证件号尾 4 位 {v.idCardLast4} · 手机 {maskPhone(v.phone)}
              </div>
              <Link
                href="/creator/contracts"
                className="mt-5 inline-flex items-center justify-center rounded-md px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4]"
              >
                查看我的合同
              </Link>
            </div>
          ) : (
            <>
              {v?.status === "rejected" && (
                <div className="mb-4 glass rounded-[14px] p-4 border border-amber-500/30">
                  <div className="text-[13px] text-amber-300 mb-1">上一次审核被驳回</div>
                  <div className="text-[13px] text-ink-2 leading-6">{v.reason || "请检查证件信息后重新提交"}</div>
                </div>
              )}

              <form action={submitVerification} className="glass rounded-[14px] p-6 grid gap-4">
                <Field label="真实姓名" name="realName" placeholder="与身份证一致" required defaultValue={v?.realName} />
                <Field
                  label="身份证号"
                  name="idCard"
                  placeholder="15 或 18 位"
                  required
                  pattern="^\d{15}$|^\d{17}[\dXx]$"
                  type="text"
                />
                <Field
                  label="手机号"
                  name="phone"
                  placeholder="11 位手机号"
                  required
                  pattern="^\d{11}$"
                  type="tel"
                  defaultValue={v?.phone}
                />
                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 transition"
                >
                  {v?.status === "rejected" ? "重新提交审核" : "提交实名认证"}
                </button>
                <p className="text-[12px] text-ink-4">
                  提交即视为同意《Mira 实名认证与隐私协议》,身份证号将以 SHA256 哈希入库。
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function statusHint(s: string | undefined): string {
  if (!s) return "尚未提交";
  if (s === "submitted") return "审核中";
  if (s === "approved") return "已通过";
  if (s === "rejected") return "已驳回";
  return s;
}

function maskPhone(p: string): string {
  if (p.length !== 11) return p;
  return p.slice(0, 3) + "****" + p.slice(-4);
}

function Info({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass rounded-[12px] p-4">
      <div className="text-[14px] font-medium text-ink mb-1">{title}</div>
      <div className="text-[12.5px] text-ink-3 leading-5">{desc}</div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  pattern,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-ink-3 uppercase tracking-widest">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        pattern={pattern}
        defaultValue={defaultValue}
        className="rounded-md bg-bg/40 border border-line focus:border-brand/70 outline-none transition px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-4"
      />
    </label>
  );
}
