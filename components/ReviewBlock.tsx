import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { canReview, parseTags, REVIEW_TAGS } from "@/lib/review";
import { submitReview } from "@/app/actions/reviews";
import { Star } from "lucide-react";

export async function ReviewBlock({
  orderId,
  fromUserId,
  role,
}: {
  orderId: number;
  fromUserId: number;
  role: "partner_to_creator" | "creator_to_partner";
}) {
  const can = canReview(orderId, fromUserId, role);
  const existingMine = db
    .select()
    .from(schema.reviews)
    .where(
      and(
        eq(schema.reviews.orderId, orderId),
        eq(schema.reviews.fromUserId, fromUserId),
        eq(schema.reviews.role, role)
      )
    )
    .get();
  const otherSide = db
    .select({ r: schema.reviews, fromName: schema.users.nickname })
    .from(schema.reviews)
    .leftJoin(schema.users, eq(schema.users.id, schema.reviews.fromUserId))
    .where(
      and(
        eq(schema.reviews.orderId, orderId),
        eq(
          schema.reviews.role,
          role === "partner_to_creator" ? "creator_to_partner" : "partner_to_creator"
        )
      )
    )
    .get();

  const tagOptions = REVIEW_TAGS[role];

  return (
    <div className="glass rounded-[14px] p-5">
      <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-3 inline-flex items-center gap-2">
        <Star size={14} /> 订单评价
      </div>

      {existingMine ? (
        <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3">
          <div className="text-[12.5px] text-emerald-300 mb-1">你已评价 ({existingMine.rating}/5)</div>
          {existingMine.body && <p className="text-[13px] text-ink-2 leading-6">{existingMine.body}</p>}
          {parseTags(existingMine.tags).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parseTags(existingMine.tags).map((tag) => (
                <span key={tag} className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-ink-3">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : can.ok ? (
        <form action={submitReview} className="grid gap-3">
          <input type="hidden" name="orderId" value={orderId} />
          <fieldset className="grid gap-1.5">
            <legend className="text-[12px] text-ink-3">评分(1-5 星)</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    defaultChecked={n === 5}
                    className="sr-only peer"
                  />
                  <Star
                    size={22}
                    className="text-ink-4 peer-checked:text-amber-300 peer-checked:fill-amber-300 hover:text-amber-200"
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1.5">
            <span className="text-[12px] text-ink-3">评价内容(选填)</span>
            <textarea
              name="body"
              rows={3}
              maxLength={500}
              placeholder="简单说几句这次合作"
              className="rounded-md bg-bg/40 border border-line px-3 py-2 text-[13.5px]"
            />
          </label>
          <fieldset className="grid gap-1.5">
            <legend className="text-[12px] text-ink-3">标签(可多选)</legend>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <label
                  key={tag}
                  className="cursor-pointer rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[12px] text-ink-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-ink"
                >
                  <input type="checkbox" name="tags" value={tag} className="sr-only" />
                  {tag}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="justify-self-start rounded-md bg-gradient-to-r from-[#6E59F6] to-[#FF6FB4] px-4 py-2 text-[13px] text-white">
            提交评价
          </button>
        </form>
      ) : (
        <div className="text-[12.5px] text-ink-4">{can.reason}</div>
      )}

      {otherSide && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="text-[12px] text-ink-3 mb-2">对方对你的评价</div>
          <div className="rounded-md bg-white/[0.03] p-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < otherSide.r.rating ? "text-amber-300 fill-amber-300" : "text-ink-4"}
                  />
                ))}
              </div>
              <div className="text-[12.5px] text-ink-4 ml-auto">
                {new Date(otherSide.r.createdAt * 1000).toLocaleDateString("zh-CN")}
              </div>
            </div>
            {otherSide.r.body && (
              <p className="mt-2 text-[13px] text-ink-2 leading-6">{otherSide.r.body}</p>
            )}
            {parseTags(otherSide.r.tags).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parseTags(otherSide.r.tags).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-ink-3">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
