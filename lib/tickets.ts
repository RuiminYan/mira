import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Ticket, TicketMessage } from "@/db/schema";

export type TicketCategory =
  | "account"
  | "kyc"
  | "order"
  | "payout"
  | "legal"
  | "tech"
  | "other";

export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "pending" | "resolved" | "closed" | "unverified";

export const TICKET_CATEGORIES: TicketCategory[] = [
  "account",
  "kyc",
  "order",
  "payout",
  "legal",
  "tech",
  "other",
];

export const TICKET_STATUS_LIST: TicketStatus[] = [
  "open",
  "pending",
  "resolved",
  "closed",
  "unverified",
];

export const TICKET_STATUS_LIST_VISIBLE: TicketStatus[] = [
  "open",
  "pending",
  "resolved",
  "closed",
];

export function categoryLabel(c: TicketCategory): string {
  return (
    {
      account: "账号问题",
      kyc: "实名认证",
      order: "订单纠纷",
      payout: "结算 / 提现",
      legal: "法律 / 版权",
      tech: "技术 / API",
      other: "其它",
    } as const
  )[c];
}

export function statusLabel(s: TicketStatus): string {
  return (
    {
      open: "处理中",
      pending: "等用户回复",
      resolved: "已解决",
      closed: "已关闭",
      unverified: "待验证",
    } as const
  )[s];
}

export function priorityLabel(p: TicketPriority): string {
  return ({ low: "低", normal: "普通", high: "高", urgent: "紧急" } as const)[p];
}

export type CreateTicketInput = {
  userId?: number | null;
  contactEmail: string;
  contactName?: string;
  category: TicketCategory;
  subject: string;
  body: string;
  priority?: TicketPriority;
  refTable?: string;
  refId?: number;
  verifyToken?: string | null;
};

export function createTicket(input: CreateTicketInput): Ticket {
  const now = Math.floor(Date.now() / 1000);
  const isAnonymous = input.userId == null;
  const t = db
    .insert(schema.tickets)
    .values({
      userId: input.userId ?? null,
      contactEmail: input.contactEmail.trim().toLowerCase(),
      contactName: (input.contactName || "").trim(),
      category: input.category,
      subject: input.subject.trim(),
      body: input.body.trim(),
      priority: input.priority ?? "normal",
      status: isAnonymous ? "unverified" : "open",
      refTable: input.refTable,
      refId: input.refId,
      verifyToken: isAnonymous ? input.verifyToken ?? null : null,
      verifiedAt: isAnonymous ? null : now,
      lastMessageAt: now,
      createdAt: now,
    })
    .returning()
    .get();
  // first message mirrors body so the timeline is complete
  if (input.body.trim().length > 0) {
    db.insert(schema.ticketMessages)
      .values({
        ticketId: t.id,
        fromUserId: input.userId ?? null,
        fromRole: "user",
        body: input.body.trim(),
        createdAt: now,
      })
      .run();
  }
  return t;
}

export function listTicketsForUser(userId: number): Ticket[] {
  return db
    .select()
    .from(schema.tickets)
    .where(eq(schema.tickets.userId, userId))
    .orderBy(desc(schema.tickets.lastMessageAt))
    .all();
}

export function listAllTickets(filter?: {
  status?: TicketStatus;
  includeUnverified?: boolean;
  category?: TicketCategory;
  priority?: TicketPriority;
  assignedTo?: number | "self" | "unassigned" | "all";
  sort?: "lastMessageAt_desc" | "priority_desc" | "createdAt_asc";
  selfId?: number;
}): Ticket[] {
  const base = db.select().from(schema.tickets);
  let rows = filter?.status
    ? base.where(eq(schema.tickets.status, filter.status)).all()
    : base.all();

  if (!filter?.status && !filter?.includeUnverified) {
    rows = rows.filter((r) => r.status !== "unverified");
  }
  if (filter?.category) rows = rows.filter((r) => r.category === filter.category);
  if (filter?.priority) rows = rows.filter((r) => r.priority === filter.priority);
  if (filter?.assignedTo && filter.assignedTo !== "all") {
    if (filter.assignedTo === "unassigned") {
      rows = rows.filter((r) => r.assignedTo == null);
    } else if (filter.assignedTo === "self" && filter.selfId) {
      rows = rows.filter((r) => r.assignedTo === filter.selfId);
    } else if (typeof filter.assignedTo === "number") {
      rows = rows.filter((r) => r.assignedTo === filter.assignedTo);
    }
  }

  const sort = filter?.sort || "lastMessageAt_desc";
  if (sort === "lastMessageAt_desc") {
    rows.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  } else if (sort === "priority_desc") {
    const pri: Record<string, number> = { urgent: 3, high: 2, normal: 1, low: 0 };
    rows.sort((a, b) => (pri[b.priority] ?? 0) - (pri[a.priority] ?? 0) || b.lastMessageAt - a.lastMessageAt);
  } else if (sort === "createdAt_asc") {
    rows.sort((a, b) => a.createdAt - b.createdAt);
  }

  return rows;
}

export function verifyAnonymousTicket(id: number, token: string): boolean {
  const t = db.select().from(schema.tickets).where(eq(schema.tickets.id, id)).get();
  if (!t) return false;
  if (t.status !== "unverified") return false;
  if (!t.verifyToken || t.verifyToken !== token) return false;
  const now = Math.floor(Date.now() / 1000);
  db.update(schema.tickets)
    .set({ status: "open", verifiedAt: now })
    .where(eq(schema.tickets.id, id))
    .run();
  return true;
}

export function batchUpdateTickets(
  ids: number[],
  op: { kind: "assign"; userId: number } | { kind: "status"; status: TicketStatus }
): number {
  if (ids.length === 0) return 0;
  const now = Math.floor(Date.now() / 1000);
  let n = 0;
  for (const id of ids) {
    const t = db.select().from(schema.tickets).where(eq(schema.tickets.id, id)).get();
    if (!t) continue;
    if (op.kind === "assign") {
      db.update(schema.tickets)
        .set({ assignedTo: op.userId, lastMessageAt: now })
        .where(eq(schema.tickets.id, id))
        .run();
    } else {
      db.update(schema.tickets)
        .set({
          status: op.status,
          lastMessageAt: now,
          resolvedAt: op.status === "resolved" || op.status === "closed" ? now : t.resolvedAt,
        })
        .where(eq(schema.tickets.id, id))
        .run();
    }
    n++;
  }
  return n;
}

export function getTicket(id: number): Ticket | null {
  return (
    db.select().from(schema.tickets).where(eq(schema.tickets.id, id)).get() ?? null
  );
}

export function listMessages(ticketId: number): TicketMessage[] {
  return db
    .select()
    .from(schema.ticketMessages)
    .where(eq(schema.ticketMessages.ticketId, ticketId))
    .orderBy(schema.ticketMessages.createdAt)
    .all();
}

export function addMessage(
  ticketId: number,
  fromUserId: number | null,
  fromRole: "user" | "admin" | "system",
  body: string
): TicketMessage {
  const now = Math.floor(Date.now() / 1000);
  const m = db
    .insert(schema.ticketMessages)
    .values({
      ticketId,
      fromUserId,
      fromRole,
      body: body.trim(),
      createdAt: now,
    })
    .returning()
    .get();
  // bump ticket lastMessageAt + flip status based on who replied
  const nextStatus: TicketStatus = fromRole === "admin" ? "pending" : "open";
  db.update(schema.tickets)
    .set({ lastMessageAt: now, status: nextStatus })
    .where(eq(schema.tickets.id, ticketId))
    .run();
  return m;
}

export function setTicketStatus(ticketId: number, status: TicketStatus): void {
  const now = Math.floor(Date.now() / 1000);
  db.update(schema.tickets)
    .set({
      status,
      resolvedAt: status === "resolved" || status === "closed" ? now : null,
      lastMessageAt: now,
    })
    .where(eq(schema.tickets.id, ticketId))
    .run();
}

export function assignTicket(ticketId: number, adminId: number): void {
  db.update(schema.tickets)
    .set({ assignedTo: adminId })
    .where(eq(schema.tickets.id, ticketId))
    .run();
}

export function ticketStats(): {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  avgResolveHours: number;
} {
  const all = db.select().from(schema.tickets).all();
  const open = all.filter((t) => t.status === "open").length;
  const pending = all.filter((t) => t.status === "pending").length;
  const resolved = all.filter((t) => t.status === "resolved").length;
  const closed = all.filter((t) => t.status === "closed").length;
  const done = all.filter((t) => t.resolvedAt);
  const avg =
    done.length === 0
      ? 0
      : done.reduce((s, t) => s + ((t.resolvedAt ?? t.lastMessageAt) - t.createdAt), 0) /
        done.length /
        3600;
  return {
    total: all.length,
    open,
    pending,
    resolved,
    closed,
    avgResolveHours: Math.round(avg * 10) / 10,
  };
}

export function recentTicketsForRef(refTable: string, refId: number): Ticket[] {
  return db
    .select()
    .from(schema.tickets)
    .where(and(eq(schema.tickets.refTable, refTable), eq(schema.tickets.refId, refId)))
    .orderBy(desc(schema.tickets.createdAt))
    .all();
}
