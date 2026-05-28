import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getA11y } from "@/lib/a11y";
import { saveA11yAction } from "@/app/actions/a11y";

export const metadata = { title: "无障碍设置" };

export default async function AccessibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/accessibility");
  const sp = await searchParams;
  const prefs = await getA11y();

  return (
    <section className="container-page py-10 md:py-14">
      <div className="text-[12px] uppercase tracking-widest text-ink-3">账户</div>
      <h1 className="mt-2 text-[26px] md:text-[32px] font-semibold">无障碍设置</h1>
      <p className="mt-2 text-[13.5px] text-ink-3 max-w-prose">
        Mira 致力于让每位用户都能高效使用平台。以下偏好将保存在 cookie,并在所有设备同步可访问性 CSS。
      </p>

      {sp.ok && (
        <div className="mt-4 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-[13px] text-emerald-300">
          已保存。
        </div>
      )}

      <form action={saveA11yAction} className="mt-8 grid gap-4 max-w-xl">
        <Pref
          id="a11y-reduce-motion"
          name="reduceMotion"
          defaultChecked={prefs.reduceMotion}
          title="减弱动效"
          desc="禁用 marquee 滚动、浮动与脉冲动画。系统级 prefers-reduced-motion 也会自动生效。"
        />
        <Pref
          id="a11y-high-contrast"
          name="highContrast"
          defaultChecked={prefs.highContrast}
          title="高对比度"
          desc="提高文字与背景对比,强化边框与焦点环。"
        />
        <Pref
          id="a11y-large-font"
          name="largeFont"
          defaultChecked={prefs.largeFont}
          title="大号字体"
          desc="将正文与表格字号提升 12.5%,行距相应放宽。"
        />
        <div>
          <button className="rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] text-white px-4 py-2 text-[13.5px] font-medium">
            保存设置
          </button>
        </div>
      </form>

      <div className="mt-12 rounded-[12px] border border-line bg-surface/40 p-5 max-w-2xl">
        <div className="text-[13px] font-medium text-ink mb-2">键盘快捷键</div>
        <ul className="text-[13px] text-ink-2 space-y-1.5">
          <li>
            <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono">Ctrl/⌘ K</kbd> 唤起全站搜索
          </li>
          <li>
            <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono">Tab</kbd> 在交互元素间循环;
            <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono">Shift+Tab</kbd> 反向
          </li>
          <li>
            <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono">Esc</kbd> 关闭浮层 / 对话框
          </li>
        </ul>
      </div>
    </section>
  );
}

function Pref({
  id,
  name,
  defaultChecked,
  title,
  desc,
}: {
  id: string;
  name: string;
  defaultChecked: boolean;
  title: string;
  desc: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-[12px] border border-line bg-surface/40 p-4 cursor-pointer hover:border-line-2">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <div className="mt-1 text-[12.5px] text-ink-3 leading-5">{desc}</div>
      </div>
    </label>
  );
}
