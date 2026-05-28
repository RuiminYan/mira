import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, schema } from "./index";
import { generateUserSlug } from "../lib/userSlug";

const now = () => Math.floor(Date.now() / 1000);

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function txHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function reset() {
  db.delete(schema.ticketMessages).run();
  db.delete(schema.tickets).run();
  db.delete(schema.helpVotes).run();
  db.delete(schema.csmTouches).run();
  db.delete(schema.exportJobs).run();
  db.delete(schema.leaderboards).run();
  db.delete(schema.achievements).run();
  db.delete(schema.userBadges).run();
  db.delete(schema.badges).run();
  db.delete(schema.enterpriseLeads).run();
  db.delete(schema.subscriptions).run();
  db.delete(schema.plans).run();
  db.delete(schema.webhookDeliveries).run();
  db.delete(schema.webhooks).run();
  db.delete(schema.apiKeys).run();
  db.delete(schema.csmAssignments).run();
  db.delete(schema.orgMembers).run();
  db.delete(schema.organizations).run();
  db.delete(schema.riskFlags).run();
  db.delete(schema.shortlistItems).run();
  db.delete(schema.shortlists).run();
  db.delete(schema.favorites).run();
  db.delete(schema.reviews).run();
  db.delete(schema.referrals).run();
  db.delete(schema.couponRedemptions).run();
  db.delete(schema.coupons).run();
  db.delete(schema.withdrawals).run();
  db.delete(schema.walletTxns).run();
  db.delete(schema.wallets).run();
  db.delete(schema.activities).run();
  db.delete(schema.auditLogs).run();
  db.delete(schema.distributions).run();
  db.delete(schema.mcnCreators).run();
  db.delete(schema.notifications).run();
  db.delete(schema.messages).run();
  db.delete(schema.threadParticipants).run();
  db.delete(schema.threads).run();
  db.delete(schema.quoteMessages).run();
  db.delete(schema.quotes).run();
  db.delete(schema.bundleItems).run();
  db.delete(schema.bundles).run();
  db.delete(schema.previews).run();
  db.delete(schema.studioRecharges).run();
  db.delete(schema.studioJobs).run();
  db.delete(schema.studioCredits).run();
  db.delete(schema.nftTransfers).run();
  db.delete(schema.nfts).run();
  db.delete(schema.chainRecords).run();
  db.delete(schema.payments).run();
  db.delete(schema.disputes).run();
  db.delete(schema.invoices).run();
  db.delete(schema.takedowns).run();
  db.delete(schema.contracts).run();
  db.delete(schema.uploads).run();
  db.delete(schema.verifications).run();
  db.delete(schema.revenues).run();
  db.delete(schema.orders).run();
  db.delete(schema.talents).run();
  db.delete(schema.leads).run();
  db.delete(schema.users).run();
}

let nextHeight = 8800000;
function mintRecord(refTable: string, refId: number, payload: unknown) {
  const ps = JSON.stringify(payload ?? {});
  const r = db
    .insert(schema.chainRecords)
    .values({
      refTable,
      refId,
      sha256: sha256(ps),
      mockBlockHeight: nextHeight++,
      mockTxHash: txHash(),
      mockChain: "mira-chain",
      payload: ps,
      createdAt: now(),
    })
    .returning()
    .get();
  return r;
}

function seed() {
  reset();

  const u = (email: string, nickname: string, role: "creator" | "partner" | "admin" | "mcn") => {
    const r = db
      .insert(schema.users)
      .values({ email, nickname, role, createdAt: now() })
      .returning()
      .get();
    return r.id;
  };

  const admin = u("admin@mira.test", "Mira 管理员", "admin");
  const partner1 = u("studio@xinghe.test", "星河短剧工作室", "partner");
  const partner2 = u("brand@xinpinpai.test", "新品牌实验室", "partner");
  const mcn1 = u("mcn@xinglian.test", "星链 MCN", "mcn");

  const creators: { id: number; name: string }[] = [
    { id: u("yuhan@mira.test", "温雨涵", "creator"), name: "温雨涵" },
    { id: u("ziyi@mira.test", "林子伊", "creator"), name: "林子伊" },
    { id: u("anran@mira.test", "苏安然", "creator"), name: "苏安然" },
    { id: u("kayla@mira.test", "Kayla", "creator"), name: "Kayla" },
    { id: u("mengqi@mira.test", "陈梦琪", "creator"), name: "陈梦琪" },
    { id: u("yifan@mira.test", "周一帆", "creator"), name: "周一帆" },
    { id: u("hanmo@mira.test", "顾寒墨", "creator"), name: "顾寒墨" },
    { id: u("ruoxi@mira.test", "白若曦", "creator"), name: "白若曦" },
  ];

  // 前 4 个创作者实名通过 + KYC 合同 + chain record
  for (let i = 0; i < 4; i++) {
    const c = creators[i]!;
    const fakeId = "31010119900101" + String(1000 + i).padStart(4, "0");
    const v = db
      .insert(schema.verifications)
      .values({
        userId: c.id,
        realName: c.name,
        idCardHashSHA256: sha256(fakeId),
        idCardLast4: fakeId.slice(-4),
        phone: "138" + String(10000000 + i * 1111).padStart(8, "0"),
        status: "approved",
        reviewedBy: admin,
        reviewedAt: now(),
        createdAt: now(),
      })
      .returning()
      .get();
    db.update(schema.users).set({ verified: 1 }).where(eq(schema.users.id, c.id)).run();

    const signedAt = now();
    const kycPayload = {
      kind: "kyc_license",
      partyA: "Mira 镜界平台",
      partyB: c.name,
      userId: c.id,
      last4: fakeId.slice(-4),
      signedAt,
    };
    const kycSha = sha256(JSON.stringify(kycPayload));
    const kycContract = db
      .insert(schema.contracts)
      .values({
        orderId: null,
        kind: "kyc_license",
        userId: c.id,
        talentId: null,
        partyAName: "Mira 镜界平台",
        partyBName: c.name,
        scope: "AI 肖像基础授权与平台代理发行",
        amount: 0,
        share: 0,
        signedAt,
        sha256: kycSha,
        createdAt: now(),
      })
      .returning()
      .get();
    mintRecord("contracts", kycContract.id, kycPayload);
    mintRecord("verifications", v.id, {
      userId: c.id,
      nickname: c.name,
      last4: fakeId.slice(-4),
      approvedAt: now(),
    });
  }

  const TALENTS = [
    {
      idx: 0, stage: "温雨涵 · YUHAN", gender: "female" as const, age: "25-30",
      tags: "都市丽人,知性,职场,口播", grade: "S" as const, followers: 1020000,
      price: 1200, share: 6, exclusive: true,
      cover: "linear-gradient(135deg,#6E59F6 0%,#FF6FB4 100%)",
      bio: "上海财大硕士,百万粉丝知识博主,适合精英人设、职场剧、知识口播。",
    },
    {
      idx: 1, stage: "林子伊 · ZIYI", gender: "female" as const, age: "20-25",
      tags: "甜美,校园,闺蜜,治愈", grade: "A" as const, followers: 380000,
      price: 600, share: 5, exclusive: false,
      cover: "linear-gradient(135deg,#FF8FB1 0%,#FFC796 100%)",
      bio: "校园风女主路线,清新治愈系,小红书 38 万粉丝。",
    },
    {
      idx: 2, stage: "苏安然 · ANRAN", gender: "female" as const, age: "28-35",
      tags: "御姐,霸总,商战,中年", grade: "S" as const, followers: 720000,
      price: 1500, share: 8, exclusive: true,
      cover: "linear-gradient(135deg,#5340D9 0%,#1E1B4B 100%)",
      bio: "御姐霸总专业户,适合商战剧、爽剧女主、商务广告。",
    },
    {
      idx: 3, stage: "Kayla · K-POP", gender: "female" as const, age: "22-28",
      tags: "国际感,出海,虚拟主播,英语", grade: "A" as const, followers: 240000,
      price: 800, share: 5, exclusive: false,
      cover: "linear-gradient(135deg,#22D3EE 0%,#6E59F6 100%)",
      bio: "国际感强,适合出海短剧、虚拟主播、Cross-border 直播。",
    },
    {
      idx: 4, stage: "陈梦琪 · MENGQI", gender: "female" as const, age: "18-23",
      tags: "学生,路人,闺蜜,日常", grade: "B" as const, followers: 56000,
      price: 200, share: 3, exclusive: false,
      cover: "linear-gradient(135deg,#FBBF24 0%,#F87171 100%)",
      bio: "学生气质,路人妹路线,适合大批量配角、群演脸库。",
    },
    {
      idx: 5, stage: "周一帆 · YIFAN", gender: "male" as const, age: "25-32",
      tags: "霸总,精英,医生,律师", grade: "A" as const, followers: 410000,
      price: 1000, share: 6, exclusive: false,
      cover: "linear-gradient(135deg,#0EA5E9 0%,#6E59F6 100%)",
      bio: "霸总精英脸,医生律师商务都能演,男频短剧主角候选。",
    },
    {
      idx: 6, stage: "顾寒墨 · HANMO", gender: "male" as const, age: "26-34",
      tags: "古风,武侠,病娇,玄幻", grade: "S" as const, followers: 880000,
      price: 1800, share: 8, exclusive: true,
      cover: "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 100%)",
      bio: "古风玄幻脸,病娇病弱皇子专业户,漫剧主角顶配。",
    },
    {
      idx: 7, stage: "白若曦 · RUOXI", gender: "female" as const, age: "25-32",
      tags: "古装,大女主,女王,大气", grade: "S" as const, followers: 950000,
      price: 1600, share: 7, exclusive: false,
      cover: "linear-gradient(135deg,#FF6FB4 0%,#6E59F6 60%,#1E1B4B 100%)",
      bio: "古装大女主气场,女王/女帝/正派宗主,适合古装爽剧。",
    },
  ];

  const talentIds: number[] = [];
  for (const t of TALENTS) {
    const r = db
      .insert(schema.talents)
      .values({
        creatorId: creators[t.idx]!.id,
        stageName: t.stage,
        gender: t.gender,
        ageBand: t.age,
        styleTags: t.tags,
        cover: t.cover,
        bio: t.bio,
        followers: t.followers,
        grade: t.grade,
        priceOnce: t.price,
        revenueShare: t.share,
        exclusive: t.exclusive,
        status: "live",
        createdAt: now(),
      })
      .returning()
      .get();
    talentIds.push(r.id);
  }

  const ORDERS = [
    { partner: partner1, t: 0, project: "《财阀千金回归》第 12 集", scope: "短剧配角 · 单部", amount: 1200, share: 6, status: "settled" as const },
    { partner: partner1, t: 2, project: "《女总裁的契约老公》", scope: "短剧女主 · 单部", amount: 1500, share: 8, status: "approved" as const },
    { partner: partner2, t: 3, project: "新品牌 SkinAura 出海 TVC", scope: "TVC · 季度框", amount: 4500, share: 5, status: "settled" as const },
    { partner: partner1, t: 6, project: "《暗夜帝君归来》漫剧", scope: "漫剧男主 · 12 集", amount: 12800, share: 8, status: "pending" as const },
    { partner: partner2, t: 7, project: "云裳古风家居代言", scope: "TVC + 直播 · 半年", amount: 6800, share: 7, status: "approved" as const },
  ];

  const seededOrderIds: number[] = [];
  for (const o of ORDERS) {
    const tid = talentIds[o.t]!;
    const r = db
      .insert(schema.orders)
      .values({
        partnerId: o.partner,
        talentId: tid,
        projectName: o.project,
        scope: o.scope,
        amount: o.amount,
        share: o.share,
        status: o.status,
        createdAt: now(),
      })
      .returning()
      .get();
    seededOrderIds.push(r.id);

    const t = db.select().from(schema.talents).where(eq(schema.talents.id, tid)).get();
    if (t) {
      db.insert(schema.revenues)
        .values({
          orderId: r.id,
          creatorId: t.creatorId,
          amount: o.amount,
          kind: "license",
          note: `授权费 · ${o.project}`,
          createdAt: now(),
        })
        .run();
      if (o.status === "settled") {
        const shareAmount = Math.floor((o.amount * o.share) / 100);
        db.insert(schema.revenues)
          .values({
            orderId: r.id,
            creatorId: t.creatorId,
            amount: shareAmount,
            kind: "share",
            note: `分账 ${o.share}% · ${o.project}`,
            createdAt: now(),
          })
          .run();
        const withholding = Math.floor(shareAmount * 0.2);
        db.insert(schema.revenues)
          .values({
            orderId: r.id,
            creatorId: t.creatorId,
            amount: -withholding,
            kind: "withholding",
            note: `个税代扣 20% · ${o.project}`,
            createdAt: now(),
          })
          .run();

        // payment record for settled orders
        db.insert(schema.payments)
          .values({
            orderId: r.id,
            amount: o.amount,
            channel: "wechat",
            status: "succeeded",
            mockTradeNo: "MIRA-SEED-" + r.id,
            mockBuyerNo: "WXSEED" + r.id,
            paidAt: now(),
            createdAt: now(),
          })
          .run();
      }
    }
  }

  // Generate an invoice (issued) for first settled order
  const firstSettled = seededOrderIds[0]!;
  const invPayload = {
    invoiceNo: "MIRA-SEED-INV-001",
    orderId: firstSettled,
    companyName: "星河文化传媒有限公司",
    taxNumber: "91310000MA1ABCD123",
    amount: 1200,
    titleType: "vat_general",
    issuedAt: now(),
  };
  const invSha = sha256(JSON.stringify(invPayload));
  const inv = db
    .insert(schema.invoices)
    .values({
      orderId: firstSettled,
      partnerId: partner1,
      companyName: "星河文化传媒有限公司",
      taxNumber: "91310000MA1ABCD123",
      titleType: "vat_general",
      amount: 1200,
      status: "issued",
      sha256: invSha,
      invoiceNo: "MIRA-SEED-INV-001",
      issuedAt: now(),
      createdAt: now(),
    })
    .returning()
    .get();
  mintRecord("invoices", inv.id, invPayload);

  // A closed dispute (upheld_creator) on order #1
  db.insert(schema.disputes)
    .values({
      orderId: seededOrderIds[2]!,
      partnerId: partner2,
      talentId: talentIds[3]!,
      kind: "quality",
      description: "TVC 中某镜头表情僵硬,要求微调。经协商已修改完毕。",
      status: "upheld_creator",
      decisionNote: "经审查素材合规,创作者后续微调达到要求。",
      arbitratorId: admin,
      resolvedAt: now(),
      createdAt: now(),
    })
    .run();

  // A pending takedown申请 for one talent (Kayla)
  db.insert(schema.takedowns)
    .values({
      userId: creators[3]!.id,
      talentId: talentIds[3]!,
      reason: "个人发展方向调整,希望对此形象停止新订单授权。",
      status: "pending",
      createdAt: now(),
    })
    .run();

  // Previews: 3-5 scenes per talent
  const SCENES = ["都市", "古风", "直播", "商务", "校园", "玄幻", "TVC"];
  for (let i = 0; i < talentIds.length; i++) {
    const tid = talentIds[i]!;
    const t = TALENTS[i]!;
    const cnt = 3 + (i % 3);
    // pick scenes based on tags
    const baseScenes: string[] = [];
    if (t.tags.includes("都市") || t.tags.includes("职场") || t.tags.includes("商务")) baseScenes.push("都市", "商务");
    if (t.tags.includes("古风") || t.tags.includes("古装") || t.tags.includes("武侠") || t.tags.includes("玄幻")) baseScenes.push("古风", "玄幻");
    if (t.tags.includes("校园") || t.tags.includes("学生")) baseScenes.push("校园");
    if (t.tags.includes("直播") || t.tags.includes("主播") || t.tags.includes("口播")) baseScenes.push("直播");
    if (baseScenes.length < cnt) {
      for (const s of SCENES) if (!baseScenes.includes(s) && baseScenes.length < cnt) baseScenes.push(s);
    }
    const used = baseScenes.slice(0, cnt);
    for (let j = 0; j < used.length; j++) {
      db.insert(schema.previews)
        .values({
          talentId: tid,
          scene: used[j]!,
          posterUrl: null,
          videoUrl: null,
          durationSec: 12 + ((i + j) % 6) * 3,
          order: j,
          createdAt: now(),
        })
        .run();
    }
  }

  // Bundles
  const BUNDLES = [
    {
      name: "闺蜜包",
      idxs: [1, 4, 0],
      discount: 15,
      total: 1700,
      cover: "linear-gradient(135deg,#FF8FB1 0%,#FFC796 100%)",
      desc: "三人闺蜜局,女主 + 闺蜜 + 路人甲。适合都市情感、合租日常、闺蜜逆袭短剧。",
    },
    {
      name: "职场包",
      idxs: [0, 2, 5],
      discount: 12,
      total: 3500,
      cover: "linear-gradient(135deg,#5340D9 0%,#1E1B4B 100%)",
      desc: "霸总 + 女总裁 + 知性精英,撑起办公室爽剧 / 商业纪录片半壁江山。",
    },
    {
      name: "路人包",
      idxs: [4, 1, 5, 4],
      discount: 25,
      total: 950,
      cover: "linear-gradient(135deg,#FBBF24 0%,#F87171 100%)",
      desc: "批量配角脸,大数据训练素材或群演脸库专用,按面孔数计费。",
    },
    {
      name: "古装爽剧主角包",
      idxs: [6, 7, 2],
      discount: 18,
      total: 4500,
      cover: "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 60%,#FF6FB4 100%)",
      desc: "病娇皇子 + 女帝宗主 + 商战御姐,古装漫剧或长剧主线全员就位。",
    },
  ];
  const bundleIds: number[] = [];
  for (const b of BUNDLES) {
    const inserted = db
      .insert(schema.bundles)
      .values({
        name: b.name,
        kind: "preset",
        creatorId: null,
        priceTotal: b.total,
        talentCount: b.idxs.length,
        discountPct: b.discount,
        coverHint: b.cover,
        description: b.desc,
        status: "live",
        createdAt: now(),
      })
      .returning()
      .get();
    bundleIds.push(inserted.id);
    const seen = new Set<number>();
    for (const ix of b.idxs) {
      const tid = talentIds[ix]!;
      if (seen.has(tid)) continue;
      seen.add(tid);
      db.insert(schema.bundleItems)
        .values({ bundleId: inserted.id, talentId: tid })
        .run();
    }
  }

  // Quotes (one submitted, one counter)
  const q1 = db
    .insert(schema.quotes)
    .values({
      partnerId: partner1,
      creatorId: creators[6]!.id,
      talentId: talentIds[6]!,
      bundleId: null,
      projectName: "《长生劫》12 集漫剧主角",
      scope: "漫剧男主 · 12 集 · 全网独播",
      offerAmount: 10800,
      offerShare: 7,
      status: "submitted",
      lastMessageBy: "partner",
      createdAt: now(),
      updatedAt: now(),
    })
    .returning()
    .get();
  db.insert(schema.quoteMessages)
    .values({
      quoteId: q1.id,
      fromUserId: partner1,
      amount: 10800,
      share: 7,
      note: "希望以略低于挂牌价 + 7 分账拿下 12 集主角档期。",
      createdAt: now(),
    })
    .run();

  const q2 = db
    .insert(schema.quotes)
    .values({
      partnerId: partner2,
      creatorId: creators[7]!.id,
      talentId: null,
      bundleId: bundleIds[3]!,
      projectName: "《九重凤阙》古装长剧整包",
      scope: "古装爽剧主角包整体 · 季度档",
      offerAmount: 4000,
      offerShare: 8,
      status: "counter",
      lastMessageBy: "creator",
      createdAt: now() - 86400,
      updatedAt: now(),
    })
    .returning()
    .get();
  db.insert(schema.quoteMessages)
    .values({
      quoteId: q2.id,
      fromUserId: partner2,
      amount: 4000,
      share: 7,
      note: "首轮报价,争取更高分账空间。",
      createdAt: now() - 86400,
    })
    .run();
  db.insert(schema.quoteMessages)
    .values({
      quoteId: q2.id,
      fromUserId: creators[7]!.id,
      amount: 4500,
      share: 8,
      note: "套餐内三位都是独家档期,8 分账可接。",
      createdAt: now(),
    })
    .run();

  // Notifications: 2 unread for yuhan (creators[0])
  const yuhanId = creators[0]!.id;
  db.insert(schema.notifications)
    .values({
      userId: yuhanId,
      kind: "order_paid",
      refTable: "orders",
      refId: seededOrderIds[0]!,
      title: "订单已支付",
      body: `${ORDERS[0]!.project} · ¥${ORDERS[0]!.amount.toLocaleString()}`,
      createdAt: now(),
    })
    .run();
  db.insert(schema.notifications)
    .values({
      userId: yuhanId,
      kind: "invoice_issued",
      refTable: "invoices",
      refId: inv.id,
      title: "发票已开具",
      body: `${inv.companyName} · ¥${inv.amount.toLocaleString()}`,
      createdAt: now(),
    })
    .run();

  // MCN signing: mcn1 takes over yuhan (creators[0]) + ziyi (creators[1])
  for (const cIdx of [0, 1]) {
    db.insert(schema.mcnCreators)
      .values({
        mcnId: mcn1,
        creatorId: creators[cIdx]!.id,
        commissionPct: 15,
        status: "active",
        inviteToken: null,
        createdAt: now(),
        respondedAt: now(),
      })
      .run();
  }

  // Distributions: each settled order gets 2-3 mixed distributions
  const DIST_CHANNELS = ["hongguo", "douyin", "kuaishou", "videoaccount"] as const;
  const DIST_STATUSES: ("queued" | "pushed" | "live")[] = ["queued", "pushed", "live"];
  for (let idx = 0; idx < seededOrderIds.length; idx++) {
    const oid = seededOrderIds[idx]!;
    const orderRow = db.select().from(schema.orders).where(eq(schema.orders.id, oid)).get();
    if (!orderRow) continue;
    if (orderRow.status !== "settled" && orderRow.status !== "delivered") continue;
    const cnt = 2 + (idx % 2);
    for (let j = 0; j < cnt; j++) {
      const channel = DIST_CHANNELS[(idx + j) % DIST_CHANNELS.length]!;
      const status = DIST_STATUSES[(idx + j) % DIST_STATUSES.length]!;
      const ext =
        status === "queued"
          ? null
          : (channel === "hongguo" ? "RG" : channel === "douyin" ? "DY" : channel === "kuaishou" ? "KS" : "VA") +
            "-2026-" +
            crypto.randomBytes(2).toString("hex").toUpperCase();
      db.insert(schema.distributions)
        .values({
          orderId: oid,
          channel,
          status,
          externalRefId: ext,
          playUrl: ext ? `https://example.invalid/play/${ext}` : null,
          payload: JSON.stringify({ projectName: orderRow.projectName, scope: orderRow.scope }),
          createdAt: now(),
          pushedAt: status !== "queued" ? now() : null,
          publishedAt: status === "live" ? now() : null,
        })
        .run();
    }
  }

  // Activities: seed some recent events
  const activitySeed: { kind: "order_settled" | "talent_listed" | "verification_approved" | "distribution_live"; text: string }[] = [
    { kind: "verification_approved", text: `用户 ${creators[0]!.name} 完成实名认证 · 基础授权已上链` },
    { kind: "verification_approved", text: `用户 ${creators[1]!.name} 完成实名认证 · 基础授权已上链` },
    { kind: "talent_listed", text: `新形象「温雨涵 · YUHAN」入驻 · S 级 · 温雨涵` },
    { kind: "talent_listed", text: `新形象「苏安然 · ANRAN」入驻 · S 级 · 苏安然` },
    { kind: "talent_listed", text: `新形象「顾寒墨 · HANMO」入驻 · S 级 · 顾寒墨` },
    { kind: "order_settled", text: `「温雨涵 · YUHAN」完成《财阀千金回归》第 12 集,温雨涵 获得授权 ¥1,200` },
    { kind: "order_settled", text: `「Kayla · K-POP」完成《SkinAura 出海 TVC》,Kayla 获得授权 ¥4,500` },
    { kind: "distribution_live", text: `「温雨涵 · YUHAN」《财阀千金回归》第 12 集 在「红果短剧」上线` },
    { kind: "distribution_live", text: `「Kayla · K-POP」《SkinAura 出海 TVC》 在「抖音」上线` },
  ];
  for (let i = 0; i < activitySeed.length; i++) {
    const a = activitySeed[i]!;
    db.insert(schema.activities)
      .values({
        kind: a.kind,
        actorId: creators[i % creators.length]!.id,
        refTable: null,
        refId: null,
        displayText: a.text,
        createdAt: now() - i * 7200,
      })
      .run();
  }

  // NFT 化:为每个 talent 铸造 NFT 给原创作者
  const TOKEN_ID_START = 100001;
  const NFT_CONTRACT = "0xMIRACHAIN0001";
  for (let i = 0; i < talentIds.length; i++) {
    const tid = talentIds[i]!;
    const tl = db.select().from(schema.talents).where(eq(schema.talents.id, tid)).get();
    if (!tl) continue;
    const tokenId = TOKEN_ID_START + i;
    const mintedAt = now();
    const inserted = db
      .insert(schema.nfts)
      .values({
        talentId: tid,
        ownerId: tl.creatorId,
        tokenId,
        contractAddress: NFT_CONTRACT,
        metadataUri: `/nfts/${tokenId}.json`,
        status: "minted",
        mintedAt,
      })
      .returning()
      .get();
    const chain = mintRecord("nfts", inserted.id, {
      op: "mint",
      tokenId,
      contract: NFT_CONTRACT,
      talentId: tid,
      talentName: tl.stageName,
      ownerId: tl.creatorId,
      mintedAt,
    });
    db.update(schema.nfts)
      .set({ chainRecordId: chain.id })
      .where(eq(schema.nfts.id, inserted.id))
      .run();
    db.insert(schema.nftTransfers)
      .values({
        nftId: inserted.id,
        fromUserId: null,
        toUserId: tl.creatorId,
        txHash: chain.mockTxHash,
        blockHeight: chain.mockBlockHeight,
        note: "mint",
        createdAt: mintedAt,
      })
      .run();
  }

  // Studio credits: give yuhan, partner1, ziyi, anran initial credits + jobs
  const studioBeneficiaries = [creators[0]!.id, partner1, creators[1]!.id, creators[2]!.id];
  for (const uid of studioBeneficiaries) {
    db.insert(schema.studioCredits)
      .values({
        userId: uid,
        balance: 1000,
        lifetimeRecharged: 1000,
        lifetimeUsed: 0,
        updatedAt: now(),
      })
      .run();
  }

  const KIND_COST: Record<"image" | "video" | "tts", number> = {
    image: 10,
    video: 50,
    tts: 20,
  };
  const STUDIO_PROMPTS = [
    "夜晚都市霓虹下女主特写,转头微笑,胶片质感。",
    "古风宫殿大殿,主角缓步走向王座,光影戏剧。",
    "商务办公室,女总裁桌前签字,镜头横移。",
    "校园午后,女主翻书抬头,光斑柔和。",
    "TVC 主形象,品牌色背景,半身构图。",
    "出海风格街景,女主行走,镜头跟随。",
  ];
  const JOB_KINDS: ("image" | "video" | "tts")[] = ["image", "video", "tts"];
  const JOB_STATUSES: ("queued" | "running" | "done" | "failed")[] = [
    "done",
    "done",
    "done",
    "running",
    "queued",
    "failed",
  ];
  let promptIdx = 0;
  let jobCount = 0;
  for (const uid of studioBeneficiaries) {
    const personalCount = 3 + ((uid * 7) % 4);
    for (let k = 0; k < personalCount; k++) {
      const kind = JOB_KINDS[(uid + k) % 3]!;
      const status = JOB_STATUSES[(uid * 3 + k) % JOB_STATUSES.length]!;
      const tid = talentIds[(uid + k) % talentIds.length]!;
      const cost = KIND_COST[kind];
      const createdAt = now() - (k + 1) * 3600;
      const finishedAt = status === "done" ? createdAt + 4 : null;
      const outputUrl =
        status === "done"
          ? kind === "image"
            ? `/studio/output/img_${1000 + jobCount}.png`
            : kind === "video"
              ? `/studio/output/clip_${1000 + jobCount}.mp4`
              : `/studio/output/tts_${1000 + jobCount}.mp3`
          : null;
      const inserted = db
        .insert(schema.studioJobs)
        .values({
          userId: uid,
          talentId: tid,
          kind,
          prompt: STUDIO_PROMPTS[promptIdx % STUDIO_PROMPTS.length]!,
          status,
          outputUrl,
          costCredits: cost,
          durationMs: status === "done" ? 4000 + (k % 3) * 1000 : 0,
          chainRecordId: null,
          createdAt,
          finishedAt,
        })
        .returning()
        .get();
      promptIdx++;
      jobCount++;
      if (status === "done" && kind === "video") {
        const cr = mintRecord("studio_jobs", inserted.id, {
          userId: uid,
          talentId: tid,
          kind,
          outputUrl,
          at: createdAt,
        });
        db.update(schema.studioJobs)
          .set({ chainRecordId: cr.id })
          .where(eq(schema.studioJobs.id, inserted.id))
          .run();
      }
      // adjust credits used
      const cr = db.select().from(schema.studioCredits).where(eq(schema.studioCredits.userId, uid)).get();
      if (cr) {
        db.update(schema.studioCredits)
          .set({
            balance: Math.max(0, cr.balance - cost),
            lifetimeUsed: cr.lifetimeUsed + cost,
            updatedAt: now(),
          })
          .where(eq(schema.studioCredits.userId, uid))
          .run();
      }
    }
  }

  // ---- Phase 6 seed ----

  // Wallets for yuhan(creator[0]) and partner1
  const yuhanUid = creators[0]!.id;
  function ensureWallet(uid: number) {
    let w = db.select().from(schema.wallets).where(eq(schema.wallets.userId, uid)).get();
    if (!w) {
      w = db
        .insert(schema.wallets)
        .values({ userId: uid, balance: 0, lifetimeIn: 0, lifetimeOut: 0, updatedAt: now() })
        .returning()
        .get();
    }
    return w!;
  }
  function walletTxn(
    uid: number,
    kind: "recharge" | "order_pay" | "revenue_in" | "withdraw_out" | "refund_in" | "fee_out" | "adjust",
    amountFen: number,
    note: string,
    refTable: string | null,
    refId: number | null
  ) {
    const w = ensureWallet(uid);
    const txn = db
      .insert(schema.walletTxns)
      .values({
        walletId: w.id,
        kind,
        amount: amountFen,
        refTable,
        refId,
        note,
        createdAt: now(),
      })
      .returning()
      .get();
    // refId 指向这条流水本身,(refTable, refId) 才是有效的回查指针
    const cr = mintRecord("wallet_txns", txn.id, {
      userId: uid,
      walletId: w.id,
      kind,
      amount: amountFen,
      refTable,
      refId,
      note,
      at: now(),
    });
    db.update(schema.walletTxns)
      .set({ chainRecordId: cr.id })
      .where(eq(schema.walletTxns.id, txn.id))
      .run();
    db.update(schema.wallets)
      .set({
        balance: w.balance + amountFen,
        lifetimeIn: w.lifetimeIn + (amountFen > 0 ? amountFen : 0),
        lifetimeOut: w.lifetimeOut + (amountFen < 0 ? -amountFen : 0),
        updatedAt: now(),
      })
      .where(eq(schema.wallets.id, w.id))
      .run();
  }

  // yuhan: 5 wallet txns simulating settled revenue history → final balance ¥520
  walletTxn(yuhanUid, "revenue_in", 12000, "分账 · 《财阀千金回归》第 1 集", "orders", null);
  walletTxn(yuhanUid, "revenue_in", 24000, "分账 · 《财阀千金回归》第 2-5 集", "orders", null);
  walletTxn(yuhanUid, "fee_out", -1000, "平台服务费", null, null);
  walletTxn(yuhanUid, "revenue_in", 18000, "分账 · 商务合作", "orders", null);
  walletTxn(yuhanUid, "adjust", -1000, "新人福利发放", null, null);

  // partner1: ¥10,000 recharge then a few order_pay txns ending at positive balance
  walletTxn(partner1, "recharge", 1000000, "微信充值 ¥10,000", "wallet_recharge", null);
  walletTxn(partner1, "order_pay", -120000, "订单 · 《财阀千金回归》第 12 集", "orders", null);
  walletTxn(partner1, "order_pay", -150000, "订单 · 《女总裁的契约老公》", "orders", null);
  walletTxn(partner1, "refund_in", 30000, "争议退款", "orders", null);
  walletTxn(partner1, "recharge", 500000, "支付宝充值 ¥5,000", "wallet_recharge", null);

  // Pending withdrawal for yuhan ¥200 bank card (freeze immediately)
  const wdAmount = 20000; // ¥200
  walletTxn(yuhanUid, "withdraw_out", -wdAmount, "提现申请 ¥200 · bank", "withdrawals", null);
  db.insert(schema.withdrawals)
    .values({
      userId: yuhanUid,
      amount: wdAmount,
      channel: "bank",
      accountInfo: JSON.stringify({
        channel: "bank",
        accountName: "温雨涵",
        accountNo: "6225760012345678",
        bankName: "招商银行 上海分行",
      }),
      status: "pending",
      createdAt: now(),
    })
    .run();

  // Coupons
  const coupon1 = db
    .insert(schema.coupons)
    .values({
      code: "WELCOME10",
      kind: "discount_pct",
      value: 10,
      minSpend: 0,
      scope: "global",
      scopeRefId: null,
      quota: 0,
      used: 0,
      status: "live",
      startsAt: now() - 86400,
      endsAt: now() + 86400 * 60,
      createdAt: now(),
    })
    .returning()
    .get();
  db.insert(schema.coupons)
    .values({
      code: "BUNDLE100",
      kind: "discount_fix",
      value: 10000, // ¥100 立减
      minSpend: 50000, // 起订 ¥500
      scope: "global",
      scopeRefId: null,
      quota: 100,
      used: 0,
      status: "live",
      startsAt: now() - 86400,
      endsAt: now() + 86400 * 30,
      createdAt: now(),
    })
    .run();
  db.insert(schema.coupons)
    .values({
      code: "S_TIER20",
      kind: "discount_pct",
      value: 20,
      minSpend: 0,
      scope: "global",
      scopeRefId: null,
      quota: 50,
      used: 0,
      status: "live",
      startsAt: now() - 86400,
      endsAt: now() + 86400 * 14,
      createdAt: now(),
    })
    .run();
  void coupon1;

  // Referrals: yuhan invited studio@xinghe (partner1)
  function inviteCodeFor(id: number) {
    const h = crypto.createHash("sha256").update("mira-ref-" + id).digest("hex");
    return "MIRA-" + h.slice(0, 6).toUpperCase();
  }
  db.insert(schema.referrals)
    .values({
      referrerId: yuhanUid,
      inviteCode: inviteCodeFor(yuhanUid),
      inviteeEmail: "studio@xinghe.test",
      inviteeId: partner1,
      rewardCredits: 100,
      status: "redeemed",
      createdAt: now() - 86400 * 30,
      redeemedAt: now() - 86400 * 15,
    })
    .run();

  // Reviews: two settled orders → double-sided reviews
  const settledOrders = seededOrderIds.filter((oid) => {
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, oid)).get();
    return o?.status === "settled";
  });
  let reviewIdx = 0;
  for (const oid of settledOrders.slice(0, 3)) {
    const o = db.select().from(schema.orders).where(eq(schema.orders.id, oid)).get();
    if (!o) continue;
    const t = db.select().from(schema.talents).where(eq(schema.talents.id, o.talentId)).get();
    if (!t) continue;
    db.insert(schema.reviews)
      .values({
        orderId: oid,
        fromUserId: o.partnerId,
        toUserId: t.creatorId,
        role: "partner_to_creator",
        rating: 5 - (reviewIdx % 2),
        body:
          reviewIdx % 2 === 0
            ? "拍摄非常配合,完成度高于预期,后续会优先回访。"
            : "演技在线、按时交付,沟通顺畅,合规无瑕疵。",
        tags: JSON.stringify(
          reviewIdx % 2 === 0 ? ["专业", "按时", "形象贴合"] : ["演技好", "配合度高", "效率快"]
        ),
        createdAt: now() - 86400 * (reviewIdx + 1),
      })
      .run();
    db.insert(schema.reviews)
      .values({
        orderId: oid,
        fromUserId: t.creatorId,
        toUserId: o.partnerId,
        role: "creator_to_partner",
        rating: 5,
        body: "结算及时、需求清晰,期待再次合作。",
        tags: JSON.stringify(["结算及时", "需求清晰", "尊重创作者"]),
        createdAt: now() - 86400 * (reviewIdx + 1) + 3600,
      })
      .run();
    reviewIdx++;
  }

  // Favorites: partner1 收藏 talent[0], talent[2], talent[6]
  for (const tIdx of [0, 2, 6]) {
    db.insert(schema.favorites)
      .values({
        userId: partner1,
        talentId: talentIds[tIdx]!,
        list: "default",
        note: "",
        createdAt: now(),
      })
      .run();
  }

  // Shortlist for partner1
  const sl = db
    .insert(schema.shortlists)
    .values({
      userId: partner1,
      name: "古装爽剧候选人",
      description: "Q2 古装漫剧主角候选 · 待议价",
      shareToken: null,
      shareExpiresAt: null,
      createdAt: now(),
    })
    .returning()
    .get();
  for (let i = 0; i < 3; i++) {
    const tIdx = [6, 7, 2][i]!;
    db.insert(schema.shortlistItems)
      .values({
        shortlistId: sl.id,
        talentId: talentIds[tIdx]!,
        note: "",
        order: i,
      })
      .run();
  }

  // Risk flags
  db.insert(schema.riskFlags)
    .values({
      userId: partner2,
      orderId: null,
      kind: "high_amount",
      severity: "high",
      detail: JSON.stringify({ amount: 12800, threshold: 10000 }),
      status: "open",
      createdAt: now() - 7200,
    })
    .run();
  db.insert(schema.riskFlags)
    .values({
      userId: creators[3]!.id,
      orderId: null,
      kind: "multi_account",
      severity: "med",
      detail: JSON.stringify({
        idCardHash: "demo-hash",
        bindingUsers: [creators[3]!.id, creators[4]!.id],
      }),
      status: "open",
      createdAt: now() - 3600,
    })
    .run();

  // Organization: 星河影业 owned by partner1, csm assigned to admin
  const org = db
    .insert(schema.organizations)
    .values({
      name: "星河影业",
      kind: "studio",
      description: "星河旗下短剧 + TVC 制作中心,合作 30+ 项目。",
      createdAt: now(),
    })
    .returning()
    .get();
  db.insert(schema.orgMembers)
    .values({
      orgId: org.id,
      userId: partner1,
      role: "owner",
      invitedBy: null,
      joinedAt: now(),
    })
    .run();
  db.insert(schema.csmAssignments)
    .values({
      subjectKind: "org",
      orgId: org.id,
      userId: null,
      csmId: admin,
      note: "微信:mira-csm-1",
      startedAt: now(),
    })
    .run();

  // ---- Phase 7 seed ----

  // Plans
  const planStarter = db
    .insert(schema.plans)
    .values({
      code: "starter",
      name: "Starter",
      priceMonth: 0,
      priceYear: 0,
      quotaOrders: 10,
      quotaApiCalls: 1000,
      quotaSeats: 1,
      features: JSON.stringify([
        "选角广场全量访问",
        "10 单 / 月",
        "1k API 调用 / 月",
        "1 个团队席位",
        "邮件工单支持",
      ]),
      status: "live",
      sortOrder: 1,
      createdAt: now(),
    })
    .returning()
    .get();
  const planGrowth = db
    .insert(schema.plans)
    .values({
      code: "growth",
      name: "Growth",
      priceMonth: 19900,
      priceYear: 199000,
      quotaOrders: 200,
      quotaApiCalls: 100000,
      quotaSeats: 5,
      features: JSON.stringify([
        "200 单 / 月",
        "100k API 调用 / 月",
        "5 个团队席位",
        "Webhook 订阅",
        "数据导出 (CSV / JSON)",
        "邮件 + 工单优先级",
      ]),
      status: "live",
      sortOrder: 2,
      createdAt: now(),
    })
    .returning()
    .get();
  db.insert(schema.plans)
    .values({
      code: "enterprise",
      name: "Enterprise",
      priceMonth: 99900,
      priceYear: 999000,
      quotaOrders: 0,
      quotaApiCalls: 0,
      quotaSeats: 999,
      features: JSON.stringify([
        "无限订单 / 调用 / 席位",
        "专属 CSM",
        "4h 合规 SLA",
        "私有化部署可选",
        "AI Gateway + Audit Log API",
        "白手套接入",
      ]),
      status: "live",
      sortOrder: 3,
      createdAt: now(),
    })
    .run();

  // Subscriptions
  db.insert(schema.subscriptions)
    .values({
      userId: yuhanUid,
      planId: planGrowth.id,
      status: "trial",
      startedAt: now() - 86400 * 3,
      endsAt: now() + 86400 * 11,
      autoRenew: true,
      nextChargeAt: now() + 86400 * 11,
      createdAt: now(),
    })
    .run();
  db.insert(schema.subscriptions)
    .values({
      userId: partner1,
      planId: planStarter.id,
      status: "active",
      startedAt: now() - 86400 * 30,
      endsAt: null,
      autoRenew: true,
      nextChargeAt: null,
      createdAt: now(),
    })
    .run();

  // Enterprise leads
  db.insert(schema.enterpriseLeads)
    .values({
      company: "光影传媒(上海)有限公司",
      contactName: "王思源",
      email: "siyuan.wang@guangying.example",
      phone: "13800000000",
      employees: "200-500",
      industry: "短剧 / 综艺",
      requirement: "需要每月 5000 次 API 调用 + 私有化部署评估。",
      source: "pricing_form",
      status: "new",
      createdAt: now() - 3600,
    })
    .run();

  // Badges
  const BADGE_SEED: { code: string; name: string; description: string; icon: string; rarity: "common" | "rare" | "epic" | "legendary"; tone: "brand" | "pink" | "cyan" | "amber"; criteria: string }[] = [
    { code: "verified", name: "已实名", description: "完成实名认证并签订基础授权", icon: "ShieldCheck", rarity: "common", tone: "cyan", criteria: "完成 KYC" },
    { code: "first_order", name: "首单达成", description: "完成第一笔订单", icon: "Sparkles", rarity: "common", tone: "brand", criteria: "至少 1 笔订单" },
    { code: "top_creator", name: "Top 创作者", description: "进入月度创作者收益榜单 Top 10", icon: "Crown", rarity: "epic", tone: "amber", criteria: "进入月榜 Top 10" },
    { code: "rising_star", name: "新星", description: "30 天内涨粉迅速且首次结算", icon: "Flame", rarity: "rare", tone: "pink", criteria: "新人结算" },
    { code: "million_revenue", name: "百万累计", description: "累计授权与分账金额突破 100 万", icon: "DollarSign", rarity: "legendary", tone: "amber", criteria: "累计收入 ≥ 100 万" },
    { code: "platinum_partner", name: "白金制作方", description: "累计花费突破 50 万", icon: "Gem", rarity: "epic", tone: "cyan", criteria: "累计花费 ≥ 50 万" },
    { code: "compliance_hero", name: "合规先锋", description: "实名 + 内容审核零驳回", icon: "Award", rarity: "rare", tone: "brand", criteria: "零驳回记录" },
    { code: "mcn_certified", name: "MCN 认证", description: "由认证 MCN 签约管理", icon: "Building2", rarity: "rare", tone: "pink", criteria: "MCN 签约 active" },
  ];
  const badgeIdMap = new Map<string, number>();
  for (const def of BADGE_SEED) {
    const r = db.insert(schema.badges).values(def).returning().get();
    badgeIdMap.set(def.code, r.id);
  }

  function award(uid: number, code: string, pinned = false) {
    const bid = badgeIdMap.get(code);
    if (!bid) return;
    db.insert(schema.userBadges)
      .values({ userId: uid, badgeId: bid, earnedAt: now(), pinned })
      .run();
  }
  // yuhan 4 张 (verified/top_creator/first_order/rising_star,前 3 pinned)
  award(yuhanUid, "verified", true);
  award(yuhanUid, "top_creator", true);
  award(yuhanUid, "first_order", true);
  award(yuhanUid, "rising_star", false);

  // studio@xinghe (partner1) 3 张
  award(partner1, "first_order", true);
  award(partner1, "platinum_partner", true);
  award(partner1, "compliance_hero", false);

  // Achievements for yuhan
  const ACH_SEED: { code: string; progress: number }[] = [
    { code: "first_upload", progress: 100 },
    { code: "first_order", progress: 100 },
    { code: "first_settled", progress: 100 },
    { code: "10_orders", progress: 30 },
    { code: "100k_revenue", progress: 65 },
  ];
  for (const a of ACH_SEED) {
    db.insert(schema.achievements)
      .values({
        userId: yuhanUid,
        code: a.code,
        progress: a.progress,
        completedAt: a.progress >= 100 ? now() : null,
        createdAt: now(),
      })
      .run();
  }

  // Leaderboards: 2 期 × 3 kinds × Top 10
  const LB_PERIODS = ["2026-04", "2026-05"];
  for (const period of LB_PERIODS) {
    for (const kind of ["creator_revenue", "partner_spend", "talent_orders"] as const) {
      for (let i = 0; i < 10; i++) {
        const rank = i + 1;
        const idx = (rank + (period === "2026-04" ? 0 : 1)) % creators.length;
        const ptIdx = (rank + (period === "2026-04" ? 1 : 0)) % 2;
        const ptId = ptIdx === 0 ? partner1 : partner2;
        const value =
          kind === "talent_orders"
            ? Math.max(1, 30 - rank * 2)
            : kind === "partner_spend"
              ? Math.max(1000, 200000 - rank * 12000)
              : Math.max(500, 100000 - rank * 7000);
        db.insert(schema.leaderboards)
          .values({
            period,
            kind,
            userId: kind === "talent_orders" ? null : kind === "partner_spend" ? ptId : creators[idx]!.id,
            talentId: kind === "talent_orders" ? talentIds[rank % talentIds.length]! : null,
            rank,
            value,
            createdAt: now(),
          })
          .run();
      }
    }
  }

  // Export jobs
  db.insert(schema.exportJobs)
    .values({
      userId: yuhanUid,
      kind: "revenues_csv",
      status: "ready",
      payloadKey: crypto.randomBytes(12).toString("hex"),
      size: null,
      requestedAt: now() - 7200,
      completedAt: now() - 7200,
    })
    .run();
  db.insert(schema.exportJobs)
    .values({
      userId: partner1,
      kind: "orders_csv",
      status: "ready",
      payloadKey: crypto.randomBytes(12).toString("hex"),
      size: null,
      requestedAt: now() - 3600,
      completedAt: now() - 3600,
    })
    .run();

  // CSM extras: set tier on existing assignment + 2 touches
  const existingAssignment = db.select().from(schema.csmAssignments).get();
  if (existingAssignment) {
    db.update(schema.csmAssignments)
      .set({
        tier: "vip",
        nextCheckinAt: now() + 86400 * 7,
        tags: JSON.stringify(["大额客户", "续约重点"]),
      })
      .where(eq(schema.csmAssignments.id, existingAssignment.id))
      .run();
    db.insert(schema.csmTouches)
      .values({
        assignmentId: existingAssignment.id,
        csmId: admin,
        kind: "call",
        summary: "电话沟通 Q3 投放计划,确认两个新项目接入时间;讨论结算节奏。",
        nextAction: "周四前发送续约方案",
        createdAt: now() - 86400 * 2,
      })
      .run();
    db.insert(schema.csmTouches)
      .values({
        assignmentId: existingAssignment.id,
        csmId: admin,
        kind: "meeting",
        summary: "线下季度复盘会,客户对合规审核 SLA 满意,提出更细粒度的发票回查需求。",
        nextAction: "对接合规团队评估",
        createdAt: now() - 86400 * 14,
      })
      .run();
  }

  // API Keys (one for yuhan, one for partner1) — print plain for copy
  const yuhanPrefix = crypto.randomBytes(4).toString("hex").slice(0, 8);
  const yuhanSecret = crypto.randomBytes(16).toString("hex").slice(0, 32);
  db.insert(schema.apiKeys)
    .values({
      userId: yuhanUid,
      name: "温雨涵 · 个人调试 Key",
      prefix: yuhanPrefix,
      hash: sha256(yuhanSecret),
      scope: JSON.stringify(["talents:read", "orders:read", "me:read", "webhooks:read"]),
      lastUsedAt: now() - 600,
      createdAt: now() - 86400,
    })
    .run();
  const partnerPrefix = crypto.randomBytes(4).toString("hex").slice(0, 8);
  const partnerSecret = crypto.randomBytes(16).toString("hex").slice(0, 32);
  db.insert(schema.apiKeys)
    .values({
      userId: partner1,
      name: "星河 · 自动化 Bot",
      prefix: partnerPrefix,
      hash: sha256(partnerSecret),
      scope: JSON.stringify(["talents:read", "orders:read", "orders:write", "me:read", "webhooks:read"]),
      lastUsedAt: now() - 60,
      createdAt: now() - 86400 * 5,
    })
    .run();
  const keyDir = path.join(process.cwd(), ".tmp");
  if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir, { recursive: true });
  const keyFile = path.join(keyDir, "dev-keys.txt");
  const keyText =
    `# Mira dev API keys (DO NOT COMMIT)\n` +
    `# Generated by db/seed.ts at ${new Date().toISOString()}\n` +
    `yuhan@mira.test:  mira_live_${yuhanPrefix}_${yuhanSecret}\n` +
    `studio@xinghe.test:  mira_live_${partnerPrefix}_${partnerSecret}\n`;
  fs.writeFileSync(keyFile, keyText, "utf8");
  console.log("[seed] dev API keys written to .tmp/dev-keys.txt (gitignored)");

  // Webhook for partner1 → httpbin (示例 endpoint) + 3 historical deliveries
  const hook = db
    .insert(schema.webhooks)
    .values({
      userId: partner1,
      url: "https://httpbin.org/post",
      event: JSON.stringify(["order.paid", "order.settled", "review.created"]),
      secret: crypto.randomBytes(8).toString("hex"),
      status: "active",
      failCount: 0,
      lastDeliveredAt: now() - 3600,
      createdAt: now() - 86400 * 3,
    })
    .returning()
    .get();
  const DELIVERIES: { event: string; ok: boolean; code: number; mins: number }[] = [
    { event: "order.paid", ok: true, code: 200, mins: 60 },
    { event: "order.settled", ok: true, code: 200, mins: 30 },
    { event: "review.created", ok: false, code: 500, mins: 5 },
  ];
  for (const d of DELIVERIES) {
    db.insert(schema.webhookDeliveries)
      .values({
        webhookId: hook.id,
        event: d.event,
        payload: JSON.stringify({ sample: true, event: d.event }),
        status: d.ok ? "ok" : "fail",
        httpCode: d.code,
        responseSnippet: d.ok ? "{\"ok\": true}" : "Internal Server Error",
        attemptCount: 1,
        nextRetryAt: d.ok ? null : now() + 300,
        createdAt: now() - d.mins * 60,
      })
      .run();
  }

  // 模拟 3 条到期 pending deliveries(nextRetryAt 已过)
  const PENDING_RETRIES: { event: string; attempt: number; ageMin: number }[] = [
    { event: "order.paid", attempt: 1, ageMin: 10 },
    { event: "talent.approved", attempt: 2, ageMin: 25 },
    { event: "order.settled", attempt: 3, ageMin: 60 },
  ];
  for (const p of PENDING_RETRIES) {
    db.insert(schema.webhookDeliveries)
      .values({
        webhookId: hook.id,
        event: p.event,
        payload: JSON.stringify({ sample: true, event: p.event, attempt: p.attempt }),
        status: "pending",
        httpCode: 500,
        responseSnippet: `prior attempt #${p.attempt} returned 500`,
        attemptCount: p.attempt,
        nextRetryAt: now() - 30,
        createdAt: now() - p.ageMin * 60,
      })
      .run();
  }

  // backfill publicSlug 给所有 seed 用户
  const allUsers = db.select().from(schema.users).all();
  for (const usr of allUsers) {
    if (usr.publicSlug) continue;
    const slug = generateUserSlug(usr.id, usr.nickname);
    db.update(schema.users).set({ publicSlug: slug }).where(eq(schema.users.id, usr.id)).run();
  }

  // ---- Phase 8 seed: help votes + tickets ----
  const VOTE_SAMPLE: { slug: string; up: number; down: number }[] = [
    { slug: "what-is-mira", up: 312, down: 4 },
    { slug: "kyc-process", up: 218, down: 9 },
    { slug: "right-to-be-forgotten", up: 195, down: 2 },
    { slug: "royalty-rules", up: 174, down: 7 },
    { slug: "studio-order-flow", up: 165, down: 6 },
    { slug: "watermark-and-traceability", up: 158, down: 3 },
    { slug: "withholding-tax", up: 141, down: 8 },
    { slug: "creator-withdraw", up: 132, down: 5 },
    { slug: "mcn-commission", up: 108, down: 11 },
    { slug: "deepfake-risk", up: 98, down: 1 },
    { slug: "bundles", up: 88, down: 4 },
    { slug: "negotiate-quote", up: 76, down: 3 },
  ];
  let vc = 0;
  for (const v of VOTE_SAMPLE) {
    for (let i = 0; i < v.up; i++) {
      db.insert(schema.helpVotes)
        .values({
          slug: v.slug,
          fingerprint: sha256(`up-${v.slug}-${i}`).slice(0, 32),
          vote: "up",
          createdAt: now() - i * 60,
        })
        .run();
      vc++;
    }
    for (let i = 0; i < v.down; i++) {
      db.insert(schema.helpVotes)
        .values({
          slug: v.slug,
          fingerprint: sha256(`down-${v.slug}-${i}`).slice(0, 32),
          vote: "down",
          createdAt: now() - i * 90,
        })
        .run();
      vc++;
    }
  }

  const TICKETS_SEED: {
    userId: number | null;
    contactEmail: string;
    contactName: string;
    category: "account" | "kyc" | "order" | "payout" | "legal" | "tech" | "other";
    subject: string;
    body: string;
    status: "open" | "pending" | "resolved" | "closed";
    priority: "low" | "normal" | "high" | "urgent";
    replies: { role: "user" | "admin"; body: string; offset: number }[];
  }[] = [
    {
      userId: yuhanId,
      contactEmail: "yuhan@mira.test",
      contactName: "温雨涵",
      category: "payout",
      subject: "提现一直在审核中,3 天了",
      body: "我 4-25 申请提现 ¥3,200 到工商银行,到现在还显示 pending,有人能看一下吗?",
      status: "pending",
      priority: "high",
      replies: [
        { role: "admin", body: "已分配给财务复核,今天会有结论。", offset: 3600 },
      ],
    },
    {
      userId: partner1,
      contactEmail: "studio@xinghe.test",
      contactName: "星河短剧工作室",
      category: "order",
      subject: "套餐订单交付包下载失败 504",
      body: "订单 #1024 套餐「闺蜜包」,点击下载交付包返回 504。",
      status: "resolved",
      priority: "normal",
      replies: [
        { role: "admin", body: "下载 CDN 已扩容,请重试。", offset: 7200 },
        { role: "user", body: "OK 下回来了。", offset: 8000 },
      ],
    },
    {
      userId: null,
      contactEmail: "anon@example.com",
      contactName: "匿名访客",
      category: "legal",
      subject: "我想了解出海项目能不能用 Mira 演员",
      body: "我们是一家做东南亚出海短剧的工作室,想知道你们的合同是不是支持 SCC。",
      status: "open",
      priority: "normal",
      replies: [],
    },
    {
      userId: creators[1]!.id,
      contactEmail: "ziyi@mira.test",
      contactName: "林子伊",
      category: "kyc",
      subject: "实名认证被驳回,理由没看懂",
      body: "提示身份证人像比对失败,但我用的就是本人身份证。",
      status: "open",
      priority: "high",
      replies: [],
    },
    {
      userId: partner2,
      contactEmail: "brand@xinpinpai.test",
      contactName: "新品牌实验室",
      category: "tech",
      subject: "Webhook 收不到 order.settled 事件",
      body: "我们后台部署 Webhook 接收器,签名校验通过,但 order.settled 事件没收到。",
      status: "pending",
      priority: "normal",
      replies: [
        {
          role: "admin",
          body: "我们这边查询日志,3 次 retry 都返回 500,请检查接收器是否对 application/json 做了解析。",
          offset: 5400,
        },
      ],
    },
    {
      userId: yuhanId,
      contactEmail: "yuhan@mira.test",
      contactName: "温雨涵",
      category: "account",
      subject: "想把我账号绑定的邮箱换成新邮箱",
      body: "原邮箱是公司邮箱,现在离职了,想换成个人 Gmail。",
      status: "closed",
      priority: "low",
      replies: [
        { role: "admin", body: "已为你切换;请用新邮箱重新登录。", offset: 4200 },
      ],
    },
    {
      userId: mcn1,
      contactEmail: "mcn@xinglian.test",
      contactName: "星链 MCN",
      category: "other",
      subject: "希望增加 MCN 后台的批量导出 Excel",
      body: "目前只能逐条下载,做月度对账特别累。",
      status: "open",
      priority: "low",
      replies: [],
    },
    {
      userId: creators[2]!.id,
      contactEmail: "anran@mira.test",
      contactName: "苏安然",
      category: "legal",
      subject: "下架后训练素材会被删掉吗?",
      body: "我看 FAQ 写 90 天,但希望确认一下我个人的素材会不会真的清除。",
      status: "resolved",
      priority: "normal",
      replies: [
        {
          role: "admin",
          body: "确认会在下架后 90 天内从训练集物理删除,KYC 证据链保留(法律要求)。",
          offset: 4800,
        },
      ],
    },
  ];

  for (const ts of TICKETS_SEED) {
    const created = now() - 86400 * 2;
    const t = db
      .insert(schema.tickets)
      .values({
        userId: ts.userId,
        contactEmail: ts.contactEmail,
        contactName: ts.contactName,
        category: ts.category,
        subject: ts.subject,
        body: ts.body,
        priority: ts.priority,
        status: ts.status,
        assignedTo: ts.status === "open" ? null : admin,
        lastMessageAt: created,
        createdAt: created,
        resolvedAt:
          ts.status === "resolved" || ts.status === "closed" ? created + 7200 : null,
      })
      .returning()
      .get();
    db.insert(schema.ticketMessages)
      .values({
        ticketId: t.id,
        fromUserId: ts.userId,
        fromRole: "user",
        body: ts.body,
        createdAt: created,
      })
      .run();
    for (const r of ts.replies) {
      db.insert(schema.ticketMessages)
        .values({
          ticketId: t.id,
          fromUserId: r.role === "admin" ? admin : ts.userId,
          fromRole: r.role,
          body: r.body,
          createdAt: created + r.offset,
        })
        .run();
    }
  }

  console.log(
    "[seed] users:",
    creators.length + 4,
    "talents:",
    talentIds.length,
    "orders:",
    ORDERS.length,
    "chain records:",
    nextHeight - 8800000,
    "nfts:",
    talentIds.length,
    "studio jobs:",
    jobCount,
    "mcn:",
    1,
    "phase6:",
    "wallets + coupons + reviews + favorites + shortlists + risk + org + csm",
    "phase7:",
    "apikeys + webhooks + plans + badges + leaderboards + exports + csm-touches",
    "phase8:",
    `helpVotes=${vc} tickets=${TICKETS_SEED.length}`
  );
  void admin;
}

seed();
