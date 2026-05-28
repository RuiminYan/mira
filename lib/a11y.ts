import { cookies } from "next/headers";

export type A11yPrefs = {
  reduceMotion: boolean;
  highContrast: boolean;
  largeFont: boolean;
};

const COOKIE = "mira.a11y";

export const DEFAULT_A11Y: A11yPrefs = {
  reduceMotion: false,
  highContrast: false,
  largeFont: false,
};

export async function getA11y(): Promise<A11yPrefs> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return DEFAULT_A11Y;
  try {
    const parsed = JSON.parse(raw);
    return {
      reduceMotion: !!parsed.reduceMotion,
      highContrast: !!parsed.highContrast,
      largeFont: !!parsed.largeFont,
    };
  } catch {
    return DEFAULT_A11Y;
  }
}

export async function writeA11yPrefs(prefs: A11yPrefs): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, JSON.stringify(prefs), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function a11yDataAttrs(prefs: A11yPrefs): Record<string, string> {
  const out: Record<string, string> = {};
  if (prefs.reduceMotion) out["data-a11y-reduce-motion"] = "1";
  if (prefs.highContrast) out["data-a11y-high-contrast"] = "1";
  if (prefs.largeFont) out["data-a11y-large-font"] = "1";
  return out;
}
