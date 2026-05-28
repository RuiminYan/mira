import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nickname: text("nickname").notNull(),
  role: text("role", { enum: ["creator", "partner", "admin", "mcn"] }).notNull(),
  verified: integer("verified").notNull().default(0),
  banned: integer("banned", { mode: "boolean" }).notNull().default(false),
  publicSlug: text("public_slug").unique(),
  lastLoginDate: text("last_login_date"),
  streakDays: integer("streak_days").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const talents = sqliteTable("talents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  stageName: text("stage_name").notNull(),
  gender: text("gender", { enum: ["female", "male", "neutral"] }).notNull(),
  ageBand: text("age_band").notNull(),
  styleTags: text("style_tags").notNull(),
  cover: text("cover").notNull(),
  avatarUrl: text("avatar_url"),
  videoUrl: text("video_url"),
  bio: text("bio").notNull(),
  followers: integer("followers").notNull().default(0),
  grade: text("grade", { enum: ["S", "A", "B"] }).notNull().default("B"),
  priceOnce: integer("price_once").notNull(),
  revenueShare: integer("revenue_share").notNull(),
  exclusive: integer("exclusive", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["draft", "review", "live", "taken_down"] })
    .notNull()
    .default("live"),
  createdAt: integer("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  projectName: text("project_name").notNull(),
  scope: text("scope").notNull(),
  amount: integer("amount").notNull(),
  share: integer("share").notNull(),
  status: text("status", {
    enum: [
      "pending",
      "paid",
      "approved",
      "delivered",
      "settled",
      "disputed",
      "refunded",
      "cancelled",
    ],
  })
    .notNull()
    .default("pending"),
  contractId: integer("contract_id"),
  bundleId: integer("bundle_id"),
  deliveryPackId: integer("delivery_pack_id"),
  createdAt: integer("created_at").notNull(),
});

export const revenues = sqliteTable("revenues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  kind: text("kind", { enum: ["license", "share", "refund", "withholding"] }).notNull(),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["creator", "partner", "invest"] }).notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const verifications = sqliteTable(
  "verifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    realName: text("real_name").notNull(),
    idCardHashSHA256: text("id_card_hash_sha256").notNull(),
    idCardLast4: text("id_card_last4").notNull(),
    phone: text("phone").notNull(),
    status: text("status", { enum: ["submitted", "approved", "rejected"] })
      .notNull()
      .default("submitted"),
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reason: text("reason"),
    createdAt: integer("created_at").notNull(),
    reviewedAt: integer("reviewed_at"),
  },
  (t) => ({
    userIdx: uniqueIndex("verifications_user_idx").on(t.userId),
  })
);

export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  talentId: integer("talent_id").references(() => talents.id),
  kind: text("kind", {
    enum: ["avatar", "video", "photo", "contract_pdf", "payment_proof", "delivery_pack"],
  }).notNull(),
  url: text("url").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  mimeType: text("mime_type").notNull(),
  sha256: text("sha256").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const contracts = sqliteTable("contracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id),
  kind: text("kind", { enum: ["kyc_license", "order_license"] }).notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  talentId: integer("talent_id").references(() => talents.id),
  partyAName: text("party_a_name").notNull(),
  partyBName: text("party_b_name").notNull(),
  scope: text("scope").notNull(),
  amount: integer("amount").notNull().default(0),
  share: integer("share").notNull().default(0),
  pdfUrl: text("pdf_url"),
  signedAt: integer("signed_at").notNull(),
  sha256: text("sha256").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const chainRecords = sqliteTable("chain_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  refTable: text("ref_table").notNull(),
  refId: integer("ref_id").notNull(),
  sha256: text("sha256").notNull(),
  mockBlockHeight: integer("mock_block_height").notNull(),
  mockTxHash: text("mock_tx_hash").notNull(),
  mockChain: text("mock_chain").notNull().default("mira-chain"),
  payload: text("payload"),
  createdAt: integer("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: integer("amount").notNull(),
  channel: text("channel", { enum: ["wechat", "alipay", "balance"] }).notNull(),
  status: text("status", { enum: ["created", "succeeded", "refunded"] })
    .notNull()
    .default("created"),
  mockTradeNo: text("mock_trade_no").notNull(),
  mockBuyerNo: text("mock_buyer_no").notNull(),
  couponId: integer("coupon_id"),
  discountAmount: integer("discount_amount").notNull().default(0),
  paidAt: integer("paid_at"),
  createdAt: integer("created_at").notNull(),
});

export const takedowns = sqliteTable("takedowns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  chainRecordId: integer("chain_record_id"),
  createdAt: integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
});

export const disputes = sqliteTable("disputes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  kind: text("kind", { enum: ["quality", "non_delivery", "misuse"] }).notNull(),
  description: text("description").notNull(),
  status: text("status", {
    enum: ["submitted", "in_review", "upheld_partner", "upheld_creator", "closed"],
  })
    .notNull()
    .default("submitted"),
  decisionNote: text("decision_note"),
  refundAmount: integer("refund_amount"),
  arbitratorId: integer("arbitrator_id").references(() => users.id),
  createdAt: integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  taxNumber: text("tax_number").notNull(),
  titleType: text("title_type", { enum: ["vat_special", "vat_general"] }).notNull(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["requested", "issued", "void"] })
    .notNull()
    .default("requested"),
  pdfUrl: text("pdf_url"),
  sha256: text("sha256").notNull().default(""),
  invoiceNo: text("invoice_no"),
  createdAt: integer("created_at").notNull(),
  issuedAt: integer("issued_at"),
});

export const previews = sqliteTable("previews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  scene: text("scene").notNull(),
  posterUrl: text("poster_url"),
  videoUrl: text("video_url"),
  durationSec: integer("duration_sec").notNull().default(15),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const bundles = sqliteTable("bundles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["preset", "custom"] }).notNull().default("preset"),
  creatorId: integer("creator_id").references(() => users.id),
  priceTotal: integer("price_total").notNull(),
  talentCount: integer("talent_count").notNull(),
  discountPct: integer("discount_pct").notNull().default(0),
  coverHint: text("cover_hint").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["live", "archived"] }).notNull().default("live"),
  createdAt: integer("created_at").notNull(),
});

export const bundleItems = sqliteTable("bundle_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bundleId: integer("bundle_id").notNull().references(() => bundles.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  creatorId: integer("creator_id").references(() => users.id),
  talentId: integer("talent_id").references(() => talents.id),
  bundleId: integer("bundle_id").references(() => bundles.id),
  projectName: text("project_name").notNull(),
  scope: text("scope").notNull(),
  offerAmount: integer("offer_amount").notNull(),
  offerShare: integer("offer_share").notNull(),
  status: text("status", {
    enum: ["submitted", "counter", "accepted", "rejected", "expired"],
  })
    .notNull()
    .default("submitted"),
  lastMessageBy: text("last_message_by", { enum: ["partner", "creator"] })
    .notNull()
    .default("partner"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const quoteMessages = sqliteTable("quote_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  share: integer("share").notNull(),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const threads = sqliteTable("threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["dm", "order", "quote", "system"] }).notNull(),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  title: text("title").notNull(),
  lastMessageAt: integer("last_message_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const threadParticipants = sqliteTable("thread_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  userId: integer("user_id").notNull().references(() => users.id),
  unread: integer("unread").notNull().default(0),
  role: text("role", { enum: ["creator", "partner", "admin", "system"] }).notNull(),
  joinedAt: integer("joined_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull().references(() => threads.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  kind: text("kind", {
    enum: [
      "verification_approved",
      "verification_rejected",
      "talent_approved",
      "order_pending",
      "order_paid",
      "order_approved",
      "order_delivered",
      "order_settled",
      "order_refunded",
      "dispute_opened",
      "dispute_resolved",
      "invoice_requested",
      "invoice_issued",
      "takedown_requested",
      "takedown_decision",
      "new_message",
      "quote_offer",
      "quote_accepted",
      "quote_rejected",
      "mcn_invite",
      "mcn_invite_response",
      "distribution_live",
      "wallet_credit",
      "wallet_debit",
      "withdraw_submitted",
      "withdraw_approved",
      "withdraw_rejected",
      "withdraw_paid",
      "coupon_redeemed",
      "referral_reward",
      "review_received",
      "favorite_added",
      "risk_flagged",
      "org_invite",
      "csm_assigned",
      "system",
    ],
  }).notNull(),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  readAt: integer("read_at"),
  createdAt: integer("created_at").notNull(),
});

export const mcnCreators = sqliteTable("mcn_creators", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mcnId: integer("mcn_id").notNull().references(() => users.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  commissionPct: integer("commission_pct").notNull().default(15),
  status: text("status", { enum: ["pending", "active", "paused", "rejected"] })
    .notNull()
    .default("pending"),
  inviteToken: text("invite_token"),
  createdAt: integer("created_at").notNull(),
  respondedAt: integer("responded_at"),
});

export const distributions = sqliteTable("distributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  channel: text("channel", { enum: ["hongguo", "douyin", "kuaishou", "videoaccount"] }).notNull(),
  status: text("status", { enum: ["queued", "pushed", "live", "rejected"] })
    .notNull()
    .default("queued"),
  externalRefId: text("external_ref_id"),
  playUrl: text("play_url"),
  rejectReason: text("reject_reason"),
  payload: text("payload"),
  createdAt: integer("created_at").notNull(),
  pushedAt: integer("pushed_at"),
  publishedAt: integer("published_at"),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id").references(() => users.id),
  actorRole: text("actor_role").notNull().default(""),
  action: text("action").notNull(),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  before: text("before"),
  after: text("after"),
  note: text("note").notNull().default(""),
  ip: text("ip"),
  createdAt: integer("created_at").notNull(),
});

export const nfts = sqliteTable("nfts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  tokenId: integer("token_id").notNull().unique(),
  contractAddress: text("contract_address").notNull().default("0xMIRACHAIN0001"),
  chainRecordId: integer("chain_record_id"),
  metadataUri: text("metadata_uri").notNull(),
  status: text("status", { enum: ["minted", "transferred", "burned"] })
    .notNull()
    .default("minted"),
  mintedAt: integer("minted_at").notNull(),
  lastTransferAt: integer("last_transfer_at"),
});

export const nftTransfers = sqliteTable("nft_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nftId: integer("nft_id").notNull().references(() => nfts.id),
  fromUserId: integer("from_user_id"),
  toUserId: integer("to_user_id").notNull(),
  txHash: text("tx_hash").notNull(),
  blockHeight: integer("block_height").notNull(),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const studioJobs = sqliteTable("studio_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  kind: text("kind", { enum: ["image", "video", "tts"] }).notNull(),
  prompt: text("prompt").notNull(),
  status: text("status", { enum: ["queued", "running", "done", "failed"] })
    .notNull()
    .default("queued"),
  outputUrl: text("output_url"),
  costCredits: integer("cost_credits").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  chainRecordId: integer("chain_record_id"),
  createdAt: integer("created_at").notNull(),
  finishedAt: integer("finished_at"),
});

export const studioCredits = sqliteTable("studio_credits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  lifetimeRecharged: integer("lifetime_recharged").notNull().default(0),
  lifetimeUsed: integer("lifetime_used").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const studioRecharges = sqliteTable("studio_recharges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  rmb: integer("rmb").notNull(),
  credits: integer("credits").notNull(),
  chainRecordId: integer("chain_record_id"),
  createdAt: integer("created_at").notNull(),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", {
    enum: [
      "order_settled",
      "talent_listed",
      "verification_approved",
      "distribution_live",
    ],
  }).notNull(),
  actorId: integer("actor_id").references(() => users.id),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  displayText: text("display_text").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ---- Phase 6 tables ----

export const wallets = sqliteTable(
  "wallets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    balance: integer("balance").notNull().default(0),
    lifetimeIn: integer("lifetime_in").notNull().default(0),
    lifetimeOut: integer("lifetime_out").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    userIdx: uniqueIndex("wallets_user_idx").on(t.userId),
  })
);

export const walletTxns = sqliteTable("wallet_txns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  kind: text("kind", {
    enum: [
      "recharge",
      "order_pay",
      "revenue_in",
      "withdraw_out",
      "refund_in",
      "fee_out",
      "adjust",
    ],
  }).notNull(),
  amount: integer("amount").notNull(),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  note: text("note").notNull().default(""),
  chainRecordId: integer("chain_record_id"),
  createdAt: integer("created_at").notNull(),
});

export const withdrawals = sqliteTable("withdrawals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  channel: text("channel", { enum: ["bank", "wechat", "alipay"] }).notNull(),
  accountInfo: text("account_info").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "paid"] })
    .notNull()
    .default("pending"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reason: text("reason"),
  chainRecordId: integer("chain_record_id"),
  createdAt: integer("created_at").notNull(),
  paidAt: integer("paid_at"),
});

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  kind: text("kind", { enum: ["discount_pct", "discount_fix", "credits"] }).notNull(),
  value: integer("value").notNull(),
  minSpend: integer("min_spend").notNull().default(0),
  scope: text("scope", { enum: ["global", "bundle", "talent"] })
    .notNull()
    .default("global"),
  scopeRefId: integer("scope_ref_id"),
  quota: integer("quota").notNull().default(0),
  used: integer("used").notNull().default(0),
  status: text("status", { enum: ["live", "archived"] }).notNull().default("live"),
  startsAt: integer("starts_at").notNull(),
  endsAt: integer("ends_at"),
  createdAt: integer("created_at").notNull(),
});

export const couponRedemptions = sqliteTable("coupon_redemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id"),
  discountAmount: integer("discount_amount").notNull().default(0),
  redeemedAt: integer("redeemed_at").notNull(),
});

export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  inviteCode: text("invite_code").notNull(),
  inviteeEmail: text("invitee_email"),
  inviteeId: integer("invitee_id").references(() => users.id),
  rewardCredits: integer("reward_credits").notNull().default(100),
  status: text("status", { enum: ["pending", "redeemed", "expired"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at").notNull(),
  redeemedAt: integer("redeemed_at"),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["partner_to_creator", "creator_to_partner"] }).notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  createdAt: integer("created_at").notNull(),
});

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  list: text("list").notNull().default("default"),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const shortlists = sqliteTable("shortlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  shareToken: text("share_token"),
  shareExpiresAt: integer("share_expires_at"),
  createdAt: integer("created_at").notNull(),
});

export const shortlistItems = sqliteTable("shortlist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shortlistId: integer("shortlist_id").notNull().references(() => shortlists.id),
  talentId: integer("talent_id").notNull().references(() => talents.id),
  note: text("note").notNull().default(""),
  order: integer("order").notNull().default(0),
});

export const riskFlags = sqliteTable("risk_flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id"),
  kind: text("kind", {
    enum: [
      "multi_account",
      "rapid_order",
      "high_amount",
      "rejected_kyc",
      "suspicious_ip",
    ],
  }).notNull(),
  severity: text("severity", { enum: ["low", "med", "high"] }).notNull(),
  detail: text("detail").notNull().default("{}"),
  status: text("status", { enum: ["open", "reviewing", "cleared", "banned"] })
    .notNull()
    .default("open"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
});

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["studio", "mcn", "brand", "agency"] }).notNull(),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const orgMembers = sqliteTable("org_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "member"] }).notNull(),
  invitedBy: integer("invited_by").references(() => users.id),
  joinedAt: integer("joined_at").notNull(),
});

export const csmAssignments = sqliteTable("csm_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectKind: text("subject_kind", { enum: ["org", "user"] }).notNull(),
  orgId: integer("org_id"),
  userId: integer("user_id"),
  csmId: integer("csm_id").notNull().references(() => users.id),
  note: text("note").notNull().default(""),
  tier: text("tier", { enum: ["vip", "standard", "inactive"] }).notNull().default("standard"),
  nextCheckinAt: integer("next_checkin_at"),
  tags: text("tags").notNull().default("[]"),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
});

// ---- Phase 7 tables ----

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  prefix: text("prefix").notNull(),
  hash: text("hash").notNull(),
  scope: text("scope").notNull().default("[]"),
  lastUsedAt: integer("last_used_at"),
  revokedAt: integer("revoked_at"),
  createdAt: integer("created_at").notNull(),
});

export const webhooks = sqliteTable("webhooks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  event: text("event").notNull().default("[]"),
  secret: text("secret").notNull(),
  status: text("status", { enum: ["active", "paused", "failed"] }).notNull().default("active"),
  failCount: integer("fail_count").notNull().default(0),
  lastDeliveredAt: integer("last_delivered_at"),
  createdAt: integer("created_at").notNull(),
});

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  webhookId: integer("webhook_id").notNull().references(() => webhooks.id),
  event: text("event").notNull(),
  payload: text("payload").notNull().default("{}"),
  status: text("status", { enum: ["ok", "fail", "pending"] }).notNull().default("pending"),
  httpCode: integer("http_code"),
  responseSnippet: text("response_snippet"),
  attemptCount: integer("attempt_count").notNull().default(1),
  nextRetryAt: integer("next_retry_at"),
  createdAt: integer("created_at").notNull(),
});

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  priceMonth: integer("price_month").notNull().default(0),
  priceYear: integer("price_year").notNull().default(0),
  quotaOrders: integer("quota_orders").notNull().default(0),
  quotaApiCalls: integer("quota_api_calls").notNull().default(0),
  quotaSeats: integer("quota_seats").notNull().default(1),
  features: text("features").notNull().default("[]"),
  status: text("status", { enum: ["live", "archived"] }).notNull().default("live"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  status: text("status", { enum: ["trial", "active", "cancelled", "expired"] })
    .notNull()
    .default("active"),
  startedAt: integer("started_at").notNull(),
  endsAt: integer("ends_at"),
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  nextChargeAt: integer("next_charge_at"),
  createdAt: integer("created_at").notNull(),
});

export const enterpriseLeads = sqliteTable("enterprise_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  employees: text("employees").notNull().default(""),
  industry: text("industry").notNull().default(""),
  requirement: text("requirement").notNull().default(""),
  source: text("source").notNull().default("pricing_form"),
  status: text("status", { enum: ["new", "contacted", "won", "lost"] })
    .notNull()
    .default("new"),
  createdAt: integer("created_at").notNull(),
});

export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("Award"),
  rarity: text("rarity", { enum: ["common", "rare", "epic", "legendary"] })
    .notNull()
    .default("common"),
  tone: text("tone", { enum: ["brand", "pink", "cyan", "amber"] }).notNull().default("brand"),
  criteria: text("criteria").notNull().default(""),
});

export const userBadges = sqliteTable(
  "user_badges",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    badgeId: integer("badge_id").notNull().references(() => badges.id),
    earnedAt: integer("earned_at").notNull(),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  },
  (t) => ({
    pairIdx: uniqueIndex("user_badges_pair_idx").on(t.userId, t.badgeId),
  })
);

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  progress: integer("progress").notNull().default(0),
  completedAt: integer("completed_at"),
  createdAt: integer("created_at").notNull(),
});

export const leaderboards = sqliteTable(
  "leaderboards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    period: text("period").notNull(),
    kind: text("kind", { enum: ["creator_revenue", "partner_spend", "talent_orders"] }).notNull(),
    userId: integer("user_id"),
    talentId: integer("talent_id"),
    rank: integer("rank").notNull(),
    value: integer("value").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    triple: uniqueIndex("leaderboards_triple_idx").on(t.period, t.kind, t.rank),
  })
);

export const exportJobs = sqliteTable("export_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  kind: text("kind", {
    enum: ["gdpr_all", "orders_csv", "revenues_csv", "invoices_pdf", "wallet_csv"],
  }).notNull(),
  status: text("status", { enum: ["queued", "running", "ready", "failed"] })
    .notNull()
    .default("queued"),
  payloadKey: text("payload_key").notNull(),
  size: integer("size"),
  requestedAt: integer("requested_at").notNull(),
  completedAt: integer("completed_at"),
});

export const csmTouches = sqliteTable("csm_touches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id").notNull().references(() => csmAssignments.id),
  csmId: integer("csm_id").notNull().references(() => users.id),
  kind: text("kind", { enum: ["call", "email", "meeting", "note"] }).notNull(),
  summary: text("summary").notNull().default(""),
  nextAction: text("next_action"),
  createdAt: integer("created_at").notNull(),
});

// ---- Phase 8 tables ----

export const helpVotes = sqliteTable(
  "help_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    userId: integer("user_id").references(() => users.id),
    fingerprint: text("fingerprint").notNull().default(""),
    vote: text("vote", { enum: ["up", "down"] }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    slugFpIdx: uniqueIndex("help_votes_slug_fp_idx").on(t.slug, t.fingerprint),
  })
);

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name").notNull().default(""),
  category: text("category", {
    enum: ["account", "kyc", "order", "payout", "legal", "tech", "other"],
  })
    .notNull()
    .default("other"),
  subject: text("subject").notNull(),
  body: text("body").notNull().default(""),
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] })
    .notNull()
    .default("normal"),
  status: text("status", { enum: ["open", "pending", "resolved", "closed", "unverified"] })
    .notNull()
    .default("open"),
  assignedTo: integer("assigned_to").references(() => users.id),
  refTable: text("ref_table"),
  refId: integer("ref_id"),
  verifyToken: text("verify_token"),
  verifiedAt: integer("verified_at"),
  lastMessageAt: integer("last_message_at").notNull(),
  createdAt: integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  fromRole: text("from_role", { enum: ["user", "admin", "system"] }).notNull(),
  body: text("body").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export type HelpVote = typeof helpVotes.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type ApiKey = typeof apiKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type EnterpriseLead = typeof enterpriseLeads.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type ExportJob = typeof exportJobs.$inferSelect;
export type CsmTouch = typeof csmTouches.$inferSelect;

export type Wallet = typeof wallets.$inferSelect;
export type WalletTxn = typeof walletTxns.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Shortlist = typeof shortlists.$inferSelect;
export type ShortlistItem = typeof shortlistItems.$inferSelect;
export type RiskFlag = typeof riskFlags.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrgMember = typeof orgMembers.$inferSelect;
export type CsmAssignment = typeof csmAssignments.$inferSelect;

export type MCNCreator = typeof mcnCreators.$inferSelect;
export type Distribution = typeof distributions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Activity = typeof activities.$inferSelect;

export type User = typeof users.$inferSelect;
export type Talent = typeof talents.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Revenue = typeof revenues.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type ChainRecord = typeof chainRecords.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Takedown = typeof takedowns.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Preview = typeof previews.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;
export type BundleItem = typeof bundleItems.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteMessage = typeof quoteMessages.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type ThreadParticipant = typeof threadParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Nft = typeof nfts.$inferSelect;
export type NftTransfer = typeof nftTransfers.$inferSelect;
export type StudioJob = typeof studioJobs.$inferSelect;
export type StudioCredit = typeof studioCredits.$inferSelect;
export type StudioRecharge = typeof studioRecharges.$inferSelect;
