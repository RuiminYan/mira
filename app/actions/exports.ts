"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createExportJob } from "@/lib/exporter";

type ExportKind = "gdpr_all" | "orders_csv" | "revenues_csv" | "invoices_pdf" | "wallet_csv";

const ALLOWED: ExportKind[] = ["gdpr_all", "orders_csv", "revenues_csv", "invoices_pdf", "wallet_csv"];

export async function createExport(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/exports");
  const kindRaw = String(formData.get("kind") || "orders_csv");
  if (!(ALLOWED as string[]).includes(kindRaw)) redirect("/me/exports?err=kind");
  const job = createExportJob(u.id, kindRaw as ExportKind);
  redirect(`/me/exports?ok=${job.id}`);
}
