"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { issueKey, revokeKey, ALL_SCOPES, type Scope } from "@/lib/apikey";

export async function createApiKey(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/apikeys");
  const name = String(formData.get("name") || "").trim();
  const scopes = formData.getAll("scope").map(String).filter((s) => (ALL_SCOPES as string[]).includes(s)) as Scope[];
  if (!name) redirect("/me/apikeys?err=name");
  const { key } = issueKey(u.id, name, scopes);
  // Show one-time key via querystring (URL-encoded). It is shown only once.
  redirect(`/me/apikeys?new=${encodeURIComponent(key)}`);
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/me/apikeys");
  const id = Number(formData.get("id"));
  if (!id) redirect("/me/apikeys?err=id");
  revokeKey(id, u.id);
  redirect("/me/apikeys?ok=revoke");
}
