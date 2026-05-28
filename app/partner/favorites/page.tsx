import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell, PanelTitle } from "@/components/DashboardLayout";
import { PARTNER_NAV as NAV } from "@/lib/nav";
import { TalentCard } from "@/components/TalentCard";

export const metadata = { title: "我的收藏" };

export default async function PartnerFavoritesPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?role=partner&next=/partner/favorites");
  if (u.role !== "partner" && u.role !== "admin") redirect("/");
  const favs = db
    .select({ f: schema.favorites, t: schema.talents })
    .from(schema.favorites)
    .leftJoin(schema.talents, eq(schema.talents.id, schema.favorites.talentId))
    .where(eq(schema.favorites.userId, u.id))
    .orderBy(desc(schema.favorites.createdAt))
    .all();

  return (
    <DashboardShell role={`制作方 · ${u.nickname}`} nav={NAV}>
      <PanelTitle hint={`${favs.length} 个`}>收藏的形象</PanelTitle>
      {favs.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-4 py-12 text-center text-ink-3 text-[13px]">
          还没有收藏任何形象 ·{" "}
          <Link href="/marketplace" className="text-ink hover:underline">
            去选角广场
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {favs.map((row) =>
            row.t ? <TalentCard key={row.f.id} talent={row.t} /> : null
          )}
        </div>
      )}
    </DashboardShell>
  );
}
