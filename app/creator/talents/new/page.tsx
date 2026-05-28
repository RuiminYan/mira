import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Upload, FileCheck, Video } from "lucide-react";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { TalentNewForm } from "@/components/TalentNewForm";

export const metadata = { title: "上传形象数据" };

export default async function NewTalentPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator&next=/creator/talents/new");
  if (u.role !== "creator" && u.role !== "admin") redirect("/");

  if (u.role === "creator" && !u.verified) {
    const v = db
      .select()
      .from(schema.verifications)
      .where(eq(schema.verifications.userId, u.id))
      .get();
    if (!v || v.status !== "approved") {
      redirect("/creator/verify?next=/creator/talents/new");
    }
  }

  return (
    <section className="container-page py-12 md:py-16">
      <Link href="/creator" className="text-[13px] text-ink-3 hover:text-ink">
        ← 返回后台
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">上传形象</div>
          <h1 className="text-[30px] md:text-[36px] font-semibold leading-tight">
            把你的脸,变成<span className="text-gradient">可分账的数字资产</span>
          </h1>
          <p className="mt-4 text-ink-3 text-[15px] leading-7 max-w-md">
            原型阶段:填写形象基础信息、上传头像与样片,签署电子合同后进入审核。
            通过后形象在选角广场上架,任何下单都会生成订单合同并写入 mira-chain。
          </p>

          <div className="mt-8 grid gap-3">
            <Step icon={Video} title="高质素材采集" desc="4K(3840×2160)推荐,纯色背景或绿幕,光线均匀" />
            <Step icon={FileCheck} title="电子合同与存证" desc="实名通过即自动生成 KYC 合同,下单时签订单合同" />
            <Step icon={Upload} title="技术初审 + 品控终审" desc="技术团队预检后,运营品控终审入库" />
          </div>
        </div>

        <TalentNewForm />
      </div>
    </section>
  );
}

function Step({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Upload;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-[12px] p-4 flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <div className="text-[12.5px] text-ink-3 leading-5 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
