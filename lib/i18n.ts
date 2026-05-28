import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import zh from "./i18n/zh";
import en from "./i18n/en";

export type Locale = "zh" | "en";
export const LOCALES: Locale[] = ["zh", "en"];
export const DEFAULT_LOCALE: Locale = "zh";
export type Dict = Record<string, string>;

const DICTS: Record<Locale, Dict> = { zh, en };
const COOKIE = "mira.locale";
const COOKIE_MAX = 60 * 60 * 24 * 365;

function isLocale(v: string | undefined): v is Locale {
  return v === "zh" || v === "en";
}

export function t(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>
): string {
  const dict = DICTS[locale] || DICTS[DEFAULT_LOCALE];
  let s = dict[key];
  if (s === undefined) {
    const fallback = DICTS[DEFAULT_LOCALE][key];
    s = fallback ?? key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function setLocale(loc: Locale): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, loc, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX,
  });
}

export async function setLocaleAction(formData: FormData): Promise<void> {
  "use server";
  const raw = String(formData.get("locale") || "");
  const loc: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const back = String(formData.get("back") || "/");
  await setLocale(loc);
  revalidatePath("/", "layout");
  redirect(back);
}

export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

export function localeLabel(locale: Locale): string {
  return locale === "en" ? "English" : "中文";
}
