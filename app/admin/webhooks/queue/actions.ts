"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { runWebhookTick } from "@/lib/webhookCron";

export async function triggerWebhookTick(): Promise<void> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    redirect("/login?role=admin&next=/admin/webhooks/queue");
  }
  await runWebhookTick();
  revalidatePath("/admin/webhooks/queue");
  redirect("/admin/webhooks/queue?ok=tick");
}
