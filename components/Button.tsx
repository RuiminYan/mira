import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] hover:brightness-110 shadow-[0_10px_30px_-10px_rgba(110,89,246,0.55)]",
  secondary: "border border-line-2 bg-white/[0.04] text-ink hover:bg-white/[0.08]",
  ghost: "text-ink-2 hover:text-ink hover:bg-white/[0.06]",
};

type Props = {
  href: string;
  variant?: Variant;
  size?: "md" | "lg";
  children: ReactNode;
  className?: string;
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  children,
  className = "",
}: Props) {
  const sizeCls = size === "lg" ? "px-6 py-3 text-[15px]" : "px-4 py-2 text-[14px]";
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition " +
        sizeCls + " " + VARIANTS[variant] + " " + className
      }
    >
      {children}
    </Link>
  );
}
