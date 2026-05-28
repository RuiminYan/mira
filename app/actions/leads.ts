"use server";

import { db, schema } from "@/db";

export type LeadKind = "creator" | "partner" | "invest";

export async function submitLead(formData: FormData) {
  const kind = String(formData.get("kind") || "") as LeadKind;
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!["creator", "partner", "invest"].includes(kind)) {
    return { ok: false, error: "未知线索类型" } as const;
  }
  if (!name || !contact) {
    return { ok: false, error: "请填写姓名和联系方式" } as const;
  }
  if (name.length > 60 || contact.length > 120 || message.length > 1000) {
    return { ok: false, error: "字段长度超出限制" } as const;
  }

  db.insert(schema.leads)
    .values({
      kind,
      name,
      contact,
      message,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();

  return { ok: true } as const;
}
