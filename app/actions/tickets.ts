"use server";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addMessage,
  assignTicket,
  batchUpdateTickets,
  createTicket,
  setTicketStatus,
  verifyAnonymousTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";
import { notifyAdmins } from "@/lib/notify";
import { getCurrentUser } from "@/lib/auth";
import { recordHelpVote } from "@/lib/help";

const CATEGORIES: TicketCategory[] = [
  "account",
  "kyc",
  "order",
  "payout",
  "legal",
  "tech",
  "other",
];

const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export async function submitTicket(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  const email = String(formData.get("email") || "").trim();
  const contactName = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const category = String(formData.get("category") || "other") as TicketCategory;
  const priority = String(formData.get("priority") || "normal") as TicketPriority;
  const cat = CATEGORIES.includes(category) ? category : "other";
  const pri = PRIORITIES.includes(priority) ? priority : "normal";

  if (!email || !subject || subject.length > 200) {
    redirect("/help/contact?err=invalid");
  }
  if (!body || body.length < 5) {
    redirect("/help/contact?err=body");
  }
  if (body.length > 5000 || contactName.length > 80) {
    redirect("/help/contact?err=length");
  }

  const verifyToken = me ? null : crypto.randomBytes(16).toString("hex");

  const t = createTicket({
    userId: me?.id ?? null,
    contactEmail: email,
    contactName,
    category: cat,
    subject,
    body,
    priority: pri,
    verifyToken,
  });
  revalidatePath("/help/tickets");
  revalidatePath("/admin/tickets");
  if (me) {
    redirect(`/help/tickets/${t.id}`);
  }
  // 匿名 → 给链接让用户确认。不真发邮件,直接 redirect 到详情 + 显示验证链接
  redirect(`/help/tickets/${t.id}?token=${verifyToken}`);
}

export async function verifyTicketAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("ticketId"));
  const token = String(formData.get("token") || "");
  if (!id || !token) redirect("/help/contact?err=token");
  const ok = verifyAnonymousTicket(id, token);
  if (!ok) redirect(`/help/tickets/${id}?token=${token}&err=token`);
  notifyAdmins(
    "system",
    "tickets",
    id,
    "匿名工单已验证",
    `工单 #${id} 已通过邮箱链接验证,进入处理队列。`
  );
  revalidatePath(`/admin/tickets`);
  revalidatePath(`/help/tickets/${id}`);
  redirect(`/help/tickets/${id}?ok=verified`);
}

export async function batchUpdateTicketsAction(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/login");
  const ids = (formData.getAll("ids") as string[])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  const op = String(formData.get("op") || "");
  if (ids.length === 0) redirect("/admin/tickets?err=ids");

  if (op === "assign_self") {
    batchUpdateTickets(ids, { kind: "assign", userId: me.id });
  } else if (op === "resolve" || op === "close" || op === "open" || op === "pending") {
    batchUpdateTickets(ids, { kind: "status", status: op === "resolve" ? "resolved" : (op as TicketStatus) });
  }
  revalidatePath("/admin/tickets");
  redirect("/admin/tickets?ok=batch");
}

export async function replyTicket(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const ticketId = Number(formData.get("ticketId"));
  const body = String(formData.get("body") || "").trim();
  if (!ticketId || !body) {
    redirect(me.role === "admin" ? `/admin/tickets/${ticketId}` : `/help/tickets/${ticketId}`);
  }
  const role = me.role === "admin" ? "admin" : "user";
  addMessage(ticketId, me.id, role, body);
  revalidatePath(`/help/tickets/${ticketId}`);
  revalidatePath(`/admin/tickets/${ticketId}`);
  if (me.role === "admin") redirect(`/admin/tickets/${ticketId}`);
  redirect(`/help/tickets/${ticketId}`);
}

export async function changeTicketStatus(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/login");
  const ticketId = Number(formData.get("ticketId"));
  const status = String(formData.get("status") || "") as TicketStatus;
  if (!ticketId || !status) redirect("/admin/tickets");
  setTicketStatus(ticketId, status);
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticketId}`);
}

export async function assignSelf(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") redirect("/login");
  const ticketId = Number(formData.get("ticketId"));
  if (!ticketId) redirect("/admin/tickets");
  assignTicket(ticketId, me.id);
  revalidatePath(`/admin/tickets/${ticketId}`);
  redirect(`/admin/tickets/${ticketId}`);
}

const HELP_VOTE_COOKIE = "mira.helpvote.sid";

export async function voteHelpArticle(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  const slug = String(formData.get("slug") || "").trim();
  const vote = String(formData.get("vote") || "") as "up" | "down";
  if (!slug || (vote !== "up" && vote !== "down")) {
    redirect("/help");
  }

  // server-side fingerprint:sid cookie + IP + UA → sha256 32hex
  const cookieJar = await cookies();
  let sid = cookieJar.get(HELP_VOTE_COOKIE)?.value;
  if (!sid) {
    sid = crypto.randomBytes(8).toString("hex");
    cookieJar.set(HELP_VOTE_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  const ua = h.get("user-agent") || "ua";
  const raw = `${sid}|${ip}|${ua}`;
  const fingerprint = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);

  try {
    recordHelpVote(slug, fingerprint, vote, me?.id ?? null);
  } catch {
    revalidatePath(`/help/${slug}`);
    redirect(`/help/${slug}?err=already_voted`);
  }
  revalidatePath(`/help/${slug}`);
  redirect(`/help/${slug}?voted=${vote}`);
}
