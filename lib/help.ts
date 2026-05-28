import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type HelpCategory = "start" | "creator" | "partner" | "mcn" | "legal" | "billing";

export type HelpArticle = {
  slug: string;
  category: HelpCategory;
  question: { zh: string; en: string };
  body: { zh: string; en: string };
};

export const HELP_CATEGORIES: HelpCategory[] = [
  "start",
  "creator",
  "partner",
  "mcn",
  "legal",
  "billing",
];

export function helpCategoryLabel(c: HelpCategory, locale: "zh" | "en"): string {
  const zh: Record<HelpCategory, string> = {
    start: "新手入门",
    creator: "创作者",
    partner: "制作方",
    mcn: "MCN 经纪",
    legal: "法律合规",
    billing: "支付计费",
  };
  const en: Record<HelpCategory, string> = {
    start: "Getting started",
    creator: "Creators",
    partner: "Studios",
    mcn: "MCN",
    legal: "Legal",
    billing: "Billing",
  };
  return locale === "en" ? en[c] : zh[c];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "what-is-mira",
    category: "start",
    question: { zh: "Mira 镜界 是什么?", en: "What is Mira?" },
    body: {
      zh: "Mira 镜界 是面向 AIGC 时代的人脸 IP 授权与分账平台。创作者把自己的脸资产化,制作方按场景下单授权,智能合约自动完成分账与确权,所有关键事件上链留痕。",
      en: "Mira is a face-IP license & royalty platform built for the AIGC era. Creators turn their likeness into assets, studios license them per scene, and smart contracts settle royalties automatically — every key event hashed on-chain.",
    },
  },
  {
    slug: "how-to-sign-up",
    category: "start",
    question: { zh: "如何快速开始?", en: "How do I get started?" },
    body: {
      zh: "右上角点登录,选择身份(创作者 / 制作方 / 经纪 / 管理员)即可邮箱免密注册进入对应后台。创作者建议先完成实名认证再上传形象。",
      en: "Click sign-in, pick a role (creator / studio / agency / admin) and you get an instant email-only account. Creators should finish KYC before uploading their first face.",
    },
  },
  {
    slug: "supported-roles",
    category: "start",
    question: { zh: "平台支持哪几种身份?", en: "Which roles does the platform support?" },
    body: {
      zh: "目前支持 4 种身份:创作者(上传形象 / 收分账)、制作方(下单授权)、MCN 经纪(代理签约 + 抽成)、管理员(审核)。同一邮箱可在不同身份间申请切换。",
      en: "Four roles today: creator (upload faces, earn royalties), studio (order licenses), MCN (sign creators, take commission), admin (review). The same email can request role switch.",
    },
  },
  {
    slug: "languages-and-region",
    category: "start",
    question: { zh: "支持哪些语言 / 地区?", en: "Which languages and regions?" },
    body: {
      zh: "页面同时支持中文 / 英文,顶部右上角切换。法律条款以中国大陆版本为准;出海项目走标准合同 SCC 路径。",
      en: "All pages ship in Chinese and English (toggle top-right). Legal terms default to mainland China; cross-border projects follow the SCC route.",
    },
  },
  {
    slug: "mobile-support",
    category: "start",
    question: { zh: "是否支持移动端?", en: "Does Mira work on mobile?" },
    body: {
      zh: "全部页面默认响应式,在窄屏(<480px)可正常浏览、议价、查看订单与分账。PWA 可加桌面图标,离线也可访问已缓存页面。",
      en: "Every page is responsive and usable on narrow screens. Mira is also a PWA — install to home screen for offline access to cached pages.",
    },
  },
  {
    slug: "kyc-process",
    category: "creator",
    question: { zh: "实名认证流程是怎样的?", en: "What is the KYC flow?" },
    body: {
      zh: "进入「创作者后台 → 实名认证」,提交真名 / 身份证号(本地哈希,不存原文)/ 手机号。管理员审核通过后,系统会自动生成 KYC 授权合同,并上链留痕。",
      en: "Go to Creator → Verify, submit real name / national ID (hashed locally) / phone. After admin review, a KYC license is auto-issued and hashed on-chain.",
    },
  },
  {
    slug: "upload-talent",
    category: "creator",
    question: { zh: "如何上传形象?", en: "How do I upload a face?" },
    body: {
      zh: "「创作者后台 → 新建形象」填艺名 / 性别 / 年龄段 / 风格标签,上传封面图 + 短视频 + 试播 4 段。提交后进入 review,管理员通过即上架。建议拍摄前阅读 4K 视频采集 SOP。",
      en: "Creator → New face. Fill stage name / gender / age band / style tags, upload cover + short video + 4 preview clips. Admin reviews, then goes live. Read the 4K capture SOP first.",
    },
  },
  {
    slug: "royalty-rules",
    category: "creator",
    question: { zh: "授权费 + 分账比例怎么设置?", en: "How do I set price & royalty?" },
    body: {
      zh: "上传形象时填写「单部起拍价」与「分账百分比」。建议 S 级 7%-10%,A 级 5%-7%,B 级 3%-5%。独家档期可上浮 50%-100%。",
      en: "When uploading a face, set per-show base price and share percentage. Suggested: S 7-10%, A 5-7%, B 3-5%. Exclusive can carry a 50-100% premium.",
    },
  },
  {
    slug: "exclusive-vs-nonexclusive",
    category: "creator",
    question: { zh: "独家 vs 非独家怎么选?", en: "Exclusive or non-exclusive?" },
    body: {
      zh: "独家档期限制时间内仅一家可下单,溢价高 50%-100%,适合短期爆款。非独家档期允许多家并行,稳定细水长流。Mira 默认非独家,可在「档期管理」切换。",
      en: "Exclusive blocks all but one buyer for a window with 50-100% premium — good for hot bursts. Non-exclusive runs in parallel, steady cashflow. Default is non-exclusive; toggle in Schedule.",
    },
  },
  {
    slug: "right-to-be-forgotten",
    category: "creator",
    question: { zh: "形象上架后还能撤回吗?", en: "Can I take down a listed face?" },
    body: {
      zh: "可以。「我的形象 → 申请下架」,填写理由提交后管理员复核。下架通过的形象将不再接受新订单,历史订单仍按合同履行,下架事件单独上链。",
      en: "Yes. My faces → Request takedown. Admin reviews; once approved no new orders are accepted, in-flight contracts continue, and the takedown is hashed on-chain.",
    },
  },
  {
    slug: "creator-withdraw",
    category: "creator",
    question: { zh: "我的分账什么时候到账?", en: "When do I get paid?" },
    body: {
      zh: "订单结算后分账秒入钱包;钱包 → 提现 可申请到银行卡 / 微信 / 支付宝,管理员审核通过后 1-3 工作日到账。每月最低提现 ¥100。",
      en: "Royalties land in your wallet the moment an order settles. Wallet → Withdraw to bank / WeChat / Alipay; admin approves then 1-3 business days. Minimum ¥100.",
    },
  },
  {
    slug: "creator-bundle-permission",
    category: "creator",
    question: { zh: "我可以拒绝被打包进套餐吗?", en: "Can I opt out of bundles?" },
    body: {
      zh: "可以。「形象设置 → 套餐授权」关闭即可。已上架的套餐不会撤回,但新套餐不再纳入。",
      en: "Yes. Face settings → Bundle permission, turn off. Existing bundles stay live, future bundles will skip you.",
    },
  },
  {
    slug: "studio-order-flow",
    category: "partner",
    question: { zh: "制作方下单流程?", en: "What is the studio order flow?" },
    body: {
      zh: "选角广场挑形象 → 议价 / 下单 → 支付 → 管理员审核 → 拿到带水印交付包 → 自动结算分账。所有状态变更都会发通知。",
      en: "Browse the casting plaza → negotiate / order → pay → admin approval → watermarked delivery → automatic settlement. Every state change pings you.",
    },
  },
  {
    slug: "bundles",
    category: "partner",
    question: { zh: "什么是套餐 SKU?", en: "What are SKU bundles?" },
    body: {
      zh: "套餐把多张脸打包成一个 SKU(如「闺蜜包」「路人包」),折扣价拿到一组形象。适合短剧、群演脸库、批量配角。",
      en: "Bundles group multiple faces into one SKU (e.g. 'Best friends pack') at a discount. Great for short drama and bulk supporting cast.",
    },
  },
  {
    slug: "negotiate-quote",
    category: "partner",
    question: { zh: "议价工作台怎么用?", en: "How does the quote desk work?" },
    body: {
      zh: "「选角详情 → 议价」发起,系统建立独立 thread,双方可多次往返报价 / 还价。任一方接受即生成草签订单,需在 48 小时内付款。",
      en: "Talent detail → Negotiate. A thread is created; both sides can counter-offer freely. Accept generates a draft order, payable within 48 hours.",
    },
  },
  {
    slug: "delivery-pack",
    category: "partner",
    question: { zh: "交付包里都有什么?", en: "What is in the delivery pack?" },
    body: {
      zh: "ZIP 包含:1)4K 原图 / 视频源(已嵌入元数据水印);2)1080p 网络版(带可见角标);3)KYC 授权快照 PDF;4)链上交易凭证;5)使用说明 README。",
      en: "ZIP includes: 1) 4K original (metadata watermark), 2) 1080p web version (visible watermark), 3) KYC license PDF, 4) on-chain receipt, 5) README.",
    },
  },
  {
    slug: "watermark-howto",
    category: "partner",
    question: { zh: "水印能不能去掉?", en: "Can I remove the watermark?" },
    body: {
      zh: "可见角标可以在 1080p 之外用 4K 原图自行裁切;元数据水印不可剥离,这是合规要求,也是溯源凭证。任何强行去除元数据的行为属于违约。",
      en: "Visible watermark can be cropped on the 4K original. Metadata watermark is non-removable by design — it is compliance evidence; stripping it breaches the license.",
    },
  },
  {
    slug: "studio-refund",
    category: "partner",
    question: { zh: "可以退款吗?", en: "Can I refund an order?" },
    body: {
      zh: "已审核但未下载交付包前可申请全额退款;交付包下载后只能走争议工作台。低于 ¥10000 由平台先行垫付,后续追偿。",
      en: "Before delivery download, full refund. After download, file a dispute. Under ¥10,000, the platform fronts the refund and chases recovery later.",
    },
  },
  {
    slug: "studio-bulk-invoice",
    category: "partner",
    question: { zh: "批量发票怎么开?", en: "How do batch invoices work?" },
    body: {
      zh: "「我的订单 → 发票管理 → 批量开具」,选择已结算订单合并申请。增值税专用 / 普通发票均可,管理员开具后链上留痕。",
      en: "My orders → Invoices → Batch issue. Select settled orders to combine. VAT special / general both supported; admin issues and the hash is recorded on-chain.",
    },
  },
  {
    slug: "mcn-commission",
    category: "mcn",
    question: { zh: "MCN 如何收抽成?", en: "How do MCN commissions work?" },
    body: {
      zh: "MCN 邀请创作者签约,默认抽成 15%(可在签约时自定义)。系统按订单结算时自动从创作者分账中切出抽成,实时显示在 MCN 后台。",
      en: "MCN invites a creator and sets commission (default 15%). On each settled order, Mira auto-deducts the commission and shows it in the MCN console.",
    },
  },
  {
    slug: "mcn-invite",
    category: "mcn",
    question: { zh: "如何邀请创作者上链?", en: "How do I invite a creator?" },
    body: {
      zh: "/mcn/creators/invite 填邮箱 + 抽成比例,系统发邀请链接;创作者点击同意即生效。被邀请方需先完成 KYC。",
      en: "/mcn/creators/invite — enter email + commission. We email the link; the creator must finish KYC before accepting.",
    },
  },
  {
    slug: "mcn-terminate",
    category: "mcn",
    question: { zh: "MCN 解约会发生什么?", en: "What happens on MCN termination?" },
    body: {
      zh: "任一方可随时发起解约,7 日生效。生效后未结算订单仍按原抽成结到 MCN,新订单创作者拿 100%。脸资产版权始终归创作者。",
      en: "Either side can terminate with 7-day notice. In-flight orders keep the original commission; new orders go 100% to the creator. The face IP always stays with the creator.",
    },
  },
  {
    slug: "mcn-transparency",
    category: "mcn",
    question: { zh: "创作者能看到我的抽成吗?", en: "Can creators see the commission?" },
    body: {
      zh: "可以。Mira 默认透明:每笔分账都拆成「创作者净收入 + MCN 抽成」两栏显示。这是行业自律公约的硬性要求,无法关闭。",
      en: "Yes. Mira is transparent by default — every payout shows creator-net and MCN-cut side by side. Required by the industry charter; cannot be disabled.",
    },
  },
  {
    slug: "compliance-base",
    category: "legal",
    question: { zh: "Mira 的法律框架是什么?", en: "What is the legal framework?" },
    body: {
      zh: "Mira 基于《民法典》肖像权可授权条款 + 《个人信息保护法》敏感信息条款 + 《生成式 AI 服务管理暂行办法》深度合成标识条款,联合段和段律所定制全套电子合同与维权流程。",
      en: "Mira operates under the Civil Code likeness clauses, PIPL, and the Generative AI Service Regulations of China, with contracts and enforcement co-designed with Duan & Duan Law Firm.",
    },
  },
  {
    slug: "watermark-and-traceability",
    category: "legal",
    question: { zh: "脸被盗用怎么办?", en: "What if my face is misused?" },
    body: {
      zh: "所有交付包带不可见数字水印 + 可见角标,误用方可通过「水印解码」工具溯源到原始订单。平台也提供「图搜脸」反向定位疑似盗用素材。",
      en: "Every delivery has invisible + visible watermarks. Anyone can decode them back to the original order. The 'face search' tool also locates suspicious assets.",
    },
  },
  {
    slug: "minors-policy",
    category: "legal",
    question: { zh: "未成年人能上链吗?", en: "Can minors sign up?" },
    body: {
      zh: "不能。Mira 拒绝任何 18 岁以下用户的脸资产化注册,即使监护人同意也不收。这是高于法律的平台底线。",
      en: "No. Mira refuses any face-asset registration under 18, even with guardian consent. A platform red line above the law.",
    },
  },
  {
    slug: "deepfake-risk",
    category: "legal",
    question: { zh: "如何防止平台脸被用来做 deepfake?", en: "How does Mira prevent deepfake misuse?" },
    body: {
      zh: "1)交付包强制水印;2)合同显式禁用「色情 / 涉政 / 涉宗教 / 与负面新闻拼接」;3)平台周期性扫描互联网入库脸命中度,发现可疑素材发律师函;4)严重情况由公安机关介入。",
      en: "1) Mandatory watermarks. 2) Contracts explicitly ban porn / politics / religion / negative-news collage. 3) Periodic web crawl matches; misuse triggers C&D. 4) Police escalation when severe.",
    },
  },
  {
    slug: "cross-border",
    category: "legal",
    question: { zh: "出海项目合规怎么走?", en: "How does cross-border compliance work?" },
    body: {
      zh: "Mira 默认走 PIPL 标准合同(SCC)路径,在下单时自动生成中英双语模板。新加坡 / 香港 / 日本 / 越南 等高频目的地叠加当地数据保护法本地审查;美国线路谨慎使用。",
      en: "Mira defaults to the PIPL Standard Contractual Clauses, generated bilingually at order time. SG / HK / JP / VN need local law review; US is handled cautiously due to state-level statutes.",
    },
  },
  {
    slug: "dispute-flow",
    category: "legal",
    question: { zh: "出现纠纷怎么仲裁?", en: "How are disputes arbitrated?" },
    body: {
      zh: "三级 SLA:T0 一线人工 24 小时;T1 法务 + 律师 48 小时;T2 仲裁机构 30 天(默认上海仲裁委员会网络仲裁院)。低于 ¥10000 由平台垫付。",
      en: "Three-tier SLA: T0 first-line (24h), T1 legal team (48h), T2 arbitration (30 days, default Shanghai Arbitration Commission online tribunal). Under ¥10,000 prefunded by Mira.",
    },
  },
  {
    slug: "data-retention",
    category: "legal",
    question: { zh: "我的个人数据保留多久?", en: "How long is my data kept?" },
    body: {
      zh: "KYC 证据链永久留存(法律要求);训练素材在下架后 90 天内从训练集移除;支付凭证按《电子签名法》保留 10 年;一般行为日志保留 24 个月。",
      en: "KYC evidence is kept indefinitely (law). Training material is removed within 90 days after takedown. Payment proofs kept 10 years (E-Signature Law). General logs 24 months.",
    },
  },
  {
    slug: "withholding-tax",
    category: "billing",
    question: { zh: "税费怎么扣?", en: "How is tax withheld?" },
    body: {
      zh: "结算时按 20% 个税代扣并显示在收益流水中;制作方端可申请增值税专用 / 普通发票,管理员开具后上链留痕。",
      en: "20% withholding tax is auto-deducted at settlement and shown on the ledger. Studios can request VAT special / general invoices; admin issues them and hashes on-chain.",
    },
  },
  {
    slug: "studio-credits",
    category: "billing",
    question: { zh: "AI 工坊的 credits 是什么?", en: "What are Studio credits?" },
    body: {
      zh: "Credits 是 AI 工坊的算力单位。文生图 10 credits / 文生视频 50 / TTS 20。在「工坊 → 充值」选档位充值,所有充值上链。",
      en: "Credits are the AI Studio compute unit: 10 / image, 50 / video, 20 / TTS. Top up at Studio → Recharge; every recharge is hashed on-chain.",
    },
  },
  {
    slug: "wallet-balance-vs-credits",
    category: "billing",
    question: { zh: "钱包余额和 credits 有什么区别?", en: "Wallet vs credits?" },
    body: {
      zh: "钱包余额是可提现的法币(¥),来自订单分账 / 退款 / 平台奖励;credits 是 AI 工坊内部算力凭证,只能在工坊消耗、不能提现。两套体系互不串通。",
      en: "Wallet balance is withdrawable fiat (CNY) from royalties, refunds, rewards. Credits are internal compute tokens for Studio only, non-withdrawable. The two ledgers do not mix.",
    },
  },
  {
    slug: "coupon-rules",
    category: "billing",
    question: { zh: "优惠码怎么用?", en: "How do coupons work?" },
    body: {
      zh: "下单结算页输入优惠码,系统按规则核销:百分比折扣 / 固定立减 / 赠送 credits。每张优惠码可有最低消费门槛与生效期。",
      en: "Enter the code at checkout. Coupons support % discount, flat-off, or bonus credits, with optional minimum spend and validity window.",
    },
  },
  {
    slug: "invoice-issue-time",
    category: "billing",
    question: { zh: "发票多久能开?", en: "How fast are invoices issued?" },
    body: {
      zh: "管理员审核通过后 3 工作日内开具电子发票;若需纸质发票 8 工作日邮寄。开票事件上链留痕。",
      en: "Electronic invoices within 3 business days of admin approval; paper invoices mailed in 8 days. Issuance is hashed on-chain.",
    },
  },
  {
    slug: "subscription-cancel",
    category: "billing",
    question: { zh: "订阅可以取消吗?", en: "Can I cancel a subscription?" },
    body: {
      zh: "可以。「定价 → 我的订阅 → 取消续费」,当前周期继续可用,到期后自动降级为 Free。已支付费用不退。",
      en: "Yes. Pricing → My subscription → Cancel renewal. The current cycle continues; auto-downgrades to Free at expiry. No refund for paid period.",
    },
  },
];

export function getHelp(slug: string): HelpArticle | null {
  return HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function helpsByCategory(c: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === c);
}

export type HelpVoteSummary = { up: number; down: number };

export function helpVoteSummary(slug: string): HelpVoteSummary {
  const rows = db
    .select({ vote: schema.helpVotes.vote, c: sql<number>`count(*)` })
    .from(schema.helpVotes)
    .where(eq(schema.helpVotes.slug, slug))
    .groupBy(schema.helpVotes.vote)
    .all();
  let up = 0;
  let down = 0;
  for (const r of rows) {
    if (r.vote === "up") up = Number(r.c);
    else if (r.vote === "down") down = Number(r.c);
  }
  return { up, down };
}

export function helpAllVoteSummary(): Record<string, HelpVoteSummary> {
  const rows = db
    .select({
      slug: schema.helpVotes.slug,
      vote: schema.helpVotes.vote,
      c: sql<number>`count(*)`,
    })
    .from(schema.helpVotes)
    .groupBy(schema.helpVotes.slug, schema.helpVotes.vote)
    .all();
  const map: Record<string, HelpVoteSummary> = {};
  for (const r of rows) {
    const k = r.slug;
    if (!map[k]) map[k] = { up: 0, down: 0 };
    if (r.vote === "up") map[k]!.up = Number(r.c);
    else if (r.vote === "down") map[k]!.down = Number(r.c);
  }
  return map;
}

export function recordHelpVote(
  slug: string,
  fingerprint: string,
  vote: "up" | "down",
  userId?: number | null
): boolean {
  if (!HELP_ARTICLES.find((a) => a.slug === slug)) {
    throw new Error("UNKNOWN_SLUG");
  }
  // 让 UNIQUE 索引在重复投票时直接抛错(由 action 层 catch → 跳 err=already_voted)
  db.insert(schema.helpVotes)
    .values({
      slug,
      fingerprint,
      vote,
      userId: userId ?? null,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();
  return true;
}

export function topHelpfulHelp(n = 5): { article: HelpArticle; up: number; down: number }[] {
  const summary = helpAllVoteSummary();
  return HELP_ARTICLES.map((a) => ({
    article: a,
    up: summary[a.slug]?.up ?? 0,
    down: summary[a.slug]?.down ?? 0,
  }))
    .sort((a, b) => b.up - a.up || a.down - b.down)
    .slice(0, n);
}

// helper for components that just want a list ordered by category
export function helpListByOrder(): HelpArticle[] {
  return [...HELP_ARTICLES].sort(
    (a, b) =>
      HELP_CATEGORIES.indexOf(a.category) - HELP_CATEGORIES.indexOf(b.category)
  );
}

void desc;
