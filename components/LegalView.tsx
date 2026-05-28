import { getLocale } from "@/lib/i18n";
import type { LegalDoc } from "@/lib/legal";

export async function LegalView({ doc }: { doc: LegalDoc }) {
  const locale = await getLocale();
  const isEn = locale === "en";
  const title = isEn ? doc.titleEn : doc.titleZh;
  const sections = isEn ? doc.sectionsEn : doc.sectionsZh;
  return (
    <section className="container-page py-12 md:py-16">
      <div className="max-w-[760px]">
        <div className="text-[12px] uppercase tracking-widest text-ink-3">
          Mira · {isEn ? "Legal" : "法律"}
        </div>
        <h1 className="mt-2 text-[28px] md:text-[36px] font-semibold">{title}</h1>
        <div className="mt-2 text-[12.5px] text-ink-4">
          {isEn ? "Last updated" : "最近更新"}: {doc.updatedAt}
        </div>

        <div className="mt-8 grid gap-7">
          {sections.map((s, i) => (
            <article key={i}>
              <h2 className="text-[15.5px] font-medium text-ink mb-2">{s.h}</h2>
              <p className="text-[14px] leading-7 text-ink-2 whitespace-pre-line">{s.p}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
