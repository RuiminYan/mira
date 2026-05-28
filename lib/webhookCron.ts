import { processWebhookQueue, type QueueTickResult } from "@/lib/webhookQueue";

export async function runWebhookTick(): Promise<QueueTickResult> {
  return processWebhookQueue(100);
}
