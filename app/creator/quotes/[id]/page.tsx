import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { QuoteThread } from "@/components/QuoteThread";

export const metadata = { title: "议价详情" };

export default async function CreatorQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=creator");
  const p = await params;
  const id = Number(p.id);
  const q = db.select().from(schema.quotes).where(eq(schema.quotes.id, id)).get();
  if (!q) notFound();
  if (q.creatorId !== u.id && u.role !== "admin") redirect("/creator/quotes");
  return <QuoteThread quote={q} me={u} backHref="/creator/quotes" />;
}
