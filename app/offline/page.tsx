import Link from "next/link";
import { getLocale, t } from "@/lib/i18n";

export const metadata = { title: "Offline" };

export default async function OfflinePage() {
  const locale = await getLocale();
  const tr = (k: string) => t(k, locale);
  return (
    <section className="container-page py-24 md:py-32 text-center">
      <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3">PWA</div>
      <h1 className="text-balance text-[36px] md:text-[48px] font-semibold leading-tight">
        <span className="text-gradient">{tr("pwa.offline.title")}</span>
      </h1>
      <p className="mt-4 max-w-xl mx-auto text-[15px] leading-7 text-ink-3">{tr("pwa.offline.body")}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-5 py-2.5 text-[14px] font-medium text-white hover:brightness-110"
        >
          {tr("pwa.offline.retry")}
        </Link>
      </div>
    </section>
  );
}
