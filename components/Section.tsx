import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "raised";
  children: ReactNode;
};

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "default",
  children,
}: Props) {
  return (
    <section
      id={id}
      className={
        "relative py-20 md:py-28 " +
        (tone === "raised"
          ? "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-line-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-line"
          : "")
      }
    >
      <div className="container-page relative">
        {(eyebrow || title || subtitle) && (
          <header className={"mb-12 md:mb-16 " + (align === "center" ? "text-center" : "")}>
            {eyebrow && (
              <div className="inline-flex items-center gap-2 text-[12px] font-medium text-ink-2 mb-4 tracking-[0.18em] uppercase">
                <span className="h-1 w-1 rounded-full bg-brand-2" />
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-balance text-[30px] md:text-[44px] font-semibold text-ink leading-[1.1]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className={
                  "mt-4 text-[15px] md:text-[17px] text-ink-3 leading-relaxed " +
                  (align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")
                }
              >
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
