"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { togglePin } from "@/lib/badges";

export async function pinBadge(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/badges");
  const id = Number(formData.get("id"));
  togglePin(id, u.id);
  redirect("/me/badges?ok=pin");
}
