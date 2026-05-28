import { db, schema } from "@/db";

type ActivityKind =
  | "order_settled"
  | "talent_listed"
  | "verification_approved"
  | "distribution_live";

const CHANNEL_LABEL: Record<string, string> = {
  hongguo: "红果短剧",
  douyin: "抖音",
  kuaishou: "快手",
  videoaccount: "视频号",
};

export function recordActivity(
  kind: ActivityKind,
  actorId: number | null,
  refTable: string | null,
  refId: number | null,
  displayText: string
): void {
  db.insert(schema.activities)
    .values({
      kind,
      actorId,
      refTable,
      refId,
      displayText,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
}

export function activityForOrderSettled(opts: {
  creatorNickname: string;
  talentName: string;
  projectName: string;
  amount: number;
}): string {
  return `「${opts.talentName}」完成《${opts.projectName}》,${opts.creatorNickname} 获得授权 ¥${opts.amount.toLocaleString()}`;
}

export function activityForTalentListed(opts: {
  talentName: string;
  creatorNickname: string;
  grade: string;
}): string {
  return `新形象「${opts.talentName}」入驻 · ${opts.grade} 级 · ${opts.creatorNickname}`;
}

export function activityForVerificationApproved(opts: { nickname: string }): string {
  return `用户 ${opts.nickname} 完成实名认证 · 基础授权已上链`;
}

export function activityForDistributionLive(opts: {
  talentName: string;
  channel: string;
  projectName: string;
}): string {
  const label = CHANNEL_LABEL[opts.channel] ?? opts.channel;
  return `「${opts.talentName}」《${opts.projectName}》在「${label}」上线`;
}
