"use server";

import { redirect } from "next/navigation";
import { writeA11yPrefs } from "@/lib/a11y";

export async function saveA11yAction(formData: FormData): Promise<void> {
  await writeA11yPrefs({
    reduceMotion: formData.get("reduceMotion") === "on",
    highContrast: formData.get("highContrast") === "on",
    largeFont: formData.get("largeFont") === "on",
  });
  redirect("/me/accessibility?ok=1");
}
