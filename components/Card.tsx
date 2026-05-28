import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  tone?: "default" | "brand";
};

export function FeatureCard({ icon: Icon, title, description, badge, tone = "default" }: FeatureCardProps) {
  return (
    <div
      className={
        "relative h-full rounded-[14px] p-6 transition " +
        (tone === "brand"
          ? "bg-gradient-to-br from-[#6E59F6] to-[#4F3DD8] text-white border border-white/10 glow-ring"
          : "glass hover:border-line-2 hover:bg-white/[0.06]")
      }
    >
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-ink-2">
          {badge}
        </span>
      )}
      {Icon && (
        <div
          className={
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md " +
            (tone === "brand" ? "bg-white/15 text-white" : "bg-brand-soft text-[#B9A8FF]")
          }
        >
          <Icon size={20} />
        </div>
      )}
      <div className={"text-[16px] font-semibold mb-2 " + (tone === "brand" ? "text-white" : "text-ink")}>
        {title}
      </div>
      <p className={"text-[14px] leading-6 " + (tone === "brand" ? "text-white/85" : "text-ink-3")}>
        {description}
      </p>
    </div>
  );
}

type StatCardProps = {
  icon?: LucideIcon;
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="glass rounded-[14px] p-6">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink-3 mb-4">
        {Icon && <Icon size={14} className="text-brand-2" />}
        <span>{label}</span>
      </div>
      <div className="text-[32px] md:text-[40px] font-semibold leading-none text-gradient">
        {value}
      </div>
      {hint && <div className="mt-3 text-[13px] leading-5 text-ink-3">{hint}</div>}
    </div>
  );
}

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return <div className={"glass rounded-[14px] " + className}>{children}</div>;
}
