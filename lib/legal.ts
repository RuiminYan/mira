// 法律页静态内容(中英双语,各 6-12 段)

export type LegalDoc = {
  slug: "terms" | "privacy" | "portrait-license" | "minors" | "dpa";
  titleZh: string;
  titleEn: string;
  updatedAt: string;
  sectionsZh: { h: string; p: string }[];
  sectionsEn: { h: string; p: string }[];
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    titleZh: "用户服务协议",
    titleEn: "Terms of Service",
    updatedAt: "2026-03-01",
    sectionsZh: [
      {
        h: "一、定义与适用范围",
        p: "本协议由「上海浦光星奕文化科技有限公司」(以下简称「甲方」/「平台」/「Mira 镜界」)与注册并使用 Mira 镜界平台的用户(以下简称「乙方」/「用户」)签订。本协议项下「丙方」指通过乙方授权使用 AI 肖像素材的第三方制作方或品牌方。本协议适用于通过 Mira 镜界 Web、PWA、API、SDK 等渠道访问的全部服务。",
      },
      {
        h: "二、注册与账户",
        p: "乙方应使用真实邮箱完成注册,并按平台要求完成实名认证(身份证 / 营业执照)。乙方应妥善保管账户凭证,不得转借、出售。一身份证号原则上只能绑定一个创作者账户,违反时平台有权封禁。",
      },
      {
        h: "三、肖像授权与分账",
        p: "乙方通过本平台上传形象数据并完成实名后,即视为同意签署平台基础授权(KYC License),允许 Mira 镜界 在合规范围内代为接受订单。每笔订单生成一份独立的「订单授权合同」,载明授权范围、期限、地域、媒介、独家性、分账比例。",
      },
      {
        h: "四、平台佣金与结算",
        p: "Mira 镜界对每笔订单收取交易额 8%–15% 的服务费用,具体标准在订单确认页明示。结算周期为订单交付并验收后 T+7 工作日,平台会代扣代缴 20% 个税(自然人创作者),并出具完税凭证。",
      },
      {
        h: "五、知识产权",
        p: "乙方对其上传的肖像数据、声音数据及衍生 AI 内容保留人格权与作品权;平台仅在乙方授权范围内行使经纪及发行权。丙方使用授权素材时,著作财产权按合同约定归属。",
      },
      {
        h: "六、禁止行为",
        p: "用户不得利用平台从事:(1) 涉及未成年人不当形象的生成或传播;(2) 使用真人肖像合成色情、暴力、违法内容;(3) 仿冒、抢注他人形象;(4) 通过技术手段绕过水印或合规标识。违反者平台有权立即停止服务、追究法律责任。",
      },
      {
        h: "七、违约责任",
        p: "任何一方违约,守约方有权要求继续履行、采取补救措施或赔偿损失。乙方因虚假实名、提供虚假授权信息造成丙方或平台损失的,应承担全部赔偿责任。",
      },
      {
        h: "八、不可抗力",
        p: "因战争、自然灾害、政府行为、网络运营商重大故障、互联网基础设施重大事件等不可抗力或情势变更原因,致使本协议无法履行或暂停履行的,双方互不承担违约责任,但应及时通知对方。",
      },
      {
        h: "九、争议解决",
        p: "本协议适用中华人民共和国法律。因本协议产生的争议,双方应友好协商;协商不成的,任何一方可向甲方住所地(上海市)有管辖权的人民法院起诉。出海业务涉及境外用户的,按用户所属司法辖区适用法律。",
      },
      {
        h: "十、协议变更",
        p: "平台有权根据法律法规变化、业务调整等修订本协议,变更后将在网站显著位置公示并通过站内信通知。用户继续使用即视为接受变更;不接受可注销账户。",
      },
    ],
    sectionsEn: [
      {
        h: "1. Definitions & Scope",
        p: "This Agreement is entered into between Shanghai Puguang Xingyi Cultural Technology Co., Ltd. (\"Party A\", \"Platform\", \"Mira\") and the user (\"Party B\") who registers for and uses the Mira platform. \"Party C\" refers to third-party studios or brands authorized by Party B through the platform. The Agreement applies to all services accessed via the Mira web, PWA, API and SDK channels.",
      },
      {
        h: "2. Registration & Accounts",
        p: "Party B shall register with a valid email and complete identity verification as required. Party B must safeguard account credentials and shall not transfer, lend or sell the account. One national ID may only be bound to one creator account; violation may result in suspension.",
      },
      {
        h: "3. Portrait License & Revenue Share",
        p: "Once Party B uploads portrait data and completes KYC, Party B is deemed to have signed the platform base KYC License authorizing Mira to accept orders within the agreed scope. Each order generates an individual Order License Agreement specifying scope, term, territory, media, exclusivity and revenue-share ratio.",
      },
      {
        h: "4. Platform Fees & Settlement",
        p: "Mira charges a platform service fee of 8%–15% per transaction, disclosed at order confirmation. Settlement occurs T+7 business days after delivery and acceptance. Mira withholds 20% personal income tax for natural-person creators and issues tax certificates.",
      },
      {
        h: "5. Intellectual Property",
        p: "Party B retains personality and authorship rights over portrait and voice data and derivative AI content. The Platform exercises agency and distribution rights only within Party B's authorized scope. Copyright in licensed materials is governed by individual contracts.",
      },
      {
        h: "6. Prohibited Conduct",
        p: "Users shall not: (1) generate or distribute improper content involving minors; (2) synthesize pornographic, violent, or illegal content using real-person likeness; (3) impersonate or squat on another person's identity; (4) bypass watermarks or compliance markings. Violators may be terminated and face legal liability.",
      },
      {
        h: "7. Liability",
        p: "Either party in breach shall continue performance, take remedial action or compensate losses. Party B is fully liable for losses caused by false identity or fraudulent authorization.",
      },
      {
        h: "8. Force Majeure",
        p: "Neither party is liable for failure or delay caused by war, natural disaster, government action, major network failure or other force majeure, provided timely notice is given.",
      },
      {
        h: "9. Governing Law & Disputes",
        p: "This Agreement is governed by the laws of the People's Republic of China. Disputes shall first be resolved through friendly negotiation; failing that, either party may bring suit before the people's court with jurisdiction at Party A's domicile (Shanghai). For overseas business, local jurisdiction may apply.",
      },
      {
        h: "10. Amendments",
        p: "The Platform may revise this Agreement to reflect legal changes or business adjustments. Updates are posted prominently and announced via in-app notifications. Continued use constitutes acceptance.",
      },
    ],
  },
  {
    slug: "privacy",
    titleZh: "隐私政策",
    titleEn: "Privacy Policy",
    updatedAt: "2026-03-01",
    sectionsZh: [
      {
        h: "1. 我们如何收集你的信息",
        p: "Mira 镜界仅在你主动注册、上传素材、下单、支付、申请发票等场景下收集必要信息,包括:邮箱、昵称、实名信息(身份证号 SHA256 哈希,后 4 位明文)、手机号、上传的肖像/声音素材、设备类型、浏览器 UA、IP 地理位置(精确到城市)、订单流水。",
      },
      {
        h: "2. PII 类目清单",
        p: "敏感个人信息(以《个保法》定义):身份证号(仅存哈希)、手机号、生物识别数据(人脸 / 声纹,加密存储)。一般个人信息:邮箱、昵称、订单记录、设备信息、Cookie 标识符。我们不收集精确地理位置、不读取通讯录、不调用麦克风(除非你主动录制)。",
      },
      {
        h: "3. SDK / 第三方组件清单",
        p: "本平台当前不接入第三方营销 SDK。基础设施使用:阿里云 OSS(对象存储)、阿里云 RDS(数据库)、阿里云内容审核(图片机审)、SF Express(物料邮寄)、招商银行 / 微信支付 / 支付宝(支付通道)。出海版本可能接入 Cloudflare / Stripe,会在变更时另行告知。",
      },
      {
        h: "4. 我们如何使用",
        p: "用于:(a) 履行授权与分账合同;(b) 内容机审与人审;(c) 风控与防欺诈;(d) 平台运营统计(脱敏后);(e) 法律法规要求的留存。我们不会将你的肖像数据用于训练第三方通用模型。",
      },
      {
        h: "5. 第三方共享",
        p: "我们仅在以下情形与第三方共享:(a) 制作方在你授权范围内调用素材;(b) 监管部门依法调取;(c) 支付通道处理交易;(d) 经你单独同意的发行平台分发(红果 / 抖音 / 快手 / 视频号)。",
      },
      {
        h: "6. 你的权利",
        p: "你享有:查阅权、复制权、更正权、删除权(被遗忘权)、撤回授权、注销账户、对自动化决策提出申诉。可通过「设置 → 删除我的数据」入口或邮件 privacy@mira.test 行使。我们将在 15 个工作日内响应。",
      },
      {
        h: "7. 未成年人保护",
        p: "Mira 镜界不向未满 16 周岁的未成年人提供创作者注册服务。如发现未成年人误注册,我们将在收到通知后 7 日内删除数据。详见《未成年人保护规则》。",
      },
      {
        h: "8. 数据存储与跨境",
        p: "数据存储于中国大陆(上海)主区,出海版本数据存储于法兰克福区。跨境传输仅在用户主动选择「出海发行」时发生,且会进行匿名化与最小化处理,符合《数据出境安全评估办法》。",
      },
      {
        h: "9. Cookie 与同类技术",
        p: "我们使用必要 Cookie(登录会话、CSRF)与可选 Cookie(语言偏好、主题)。可在 Cookie 同意条中选择「仅必要」。我们不投放跨站点广告 Cookie。",
      },
      {
        h: "10. 联系我们",
        p: "数据保护负责人(DPO):privacy@mira.test。地址:上海市浦东新区张江高科技园区。",
      },
    ],
    sectionsEn: [
      {
        h: "1. Information we collect",
        p: "Mira collects necessary information only when you actively register, upload assets, place orders, pay, or request invoices: email, nickname, KYC identity (national ID SHA256 hash + last 4 digits), phone number, uploaded portrait/voice assets, device type, browser UA, city-level IP geolocation, transaction history.",
      },
      {
        h: "2. PII categories",
        p: "Sensitive PII: national ID (hash only), phone, biometric (face/voice, encrypted). General PII: email, nickname, order history, device info, cookie identifiers. We do not collect precise GPS, contacts, or microphone (unless you initiate recording).",
      },
      {
        h: "3. SDK / third-party components",
        p: "We currently do not embed third-party marketing SDKs. Infrastructure: Alibaba Cloud OSS, RDS, content moderation, SF Express, China Merchants Bank / WeChat Pay / Alipay. The overseas edition may use Cloudflare / Stripe; users will be notified of any change.",
      },
      {
        h: "4. How we use",
        p: "(a) perform licensing and revenue-share contracts; (b) content moderation; (c) risk control and anti-fraud; (d) anonymized operational statistics; (e) compliance with legal retention. Your portrait data will not be used to train third-party general-purpose models.",
      },
      {
        h: "5. Third-party sharing",
        p: "We share only when: (a) Party C uses assets within your authorized scope; (b) lawful requests from regulators; (c) payment processors handle the transaction; (d) you opt-in to distribution channels (Hongguo / Douyin / Kuaishou / Video Account).",
      },
      {
        h: "6. Your rights",
        p: "You can access, copy, correct, delete (right to be forgotten), withdraw authorization, deregister, and contest automated decisions. Use Settings → Delete my data or email privacy@mira.test. We respond within 15 business days.",
      },
      {
        h: "7. Minors",
        p: "Mira does not offer creator registration to anyone under 16. If a minor account is identified, data will be deleted within 7 days of notice. See the Minor Protection page.",
      },
      {
        h: "8. Storage & cross-border",
        p: "Data is stored in mainland China (Shanghai). Overseas edition stores data in Frankfurt. Cross-border transfer occurs only with your opt-in and applies anonymization and minimization.",
      },
      {
        h: "9. Cookies",
        p: "We use essential cookies (session, CSRF) and optional cookies (language, theme). You can choose Essential Only in the consent banner. No cross-site advertising cookies.",
      },
      {
        h: "10. Contact",
        p: "Data Protection Officer (DPO): privacy@mira.test. Address: Zhangjiang Hi-Tech Park, Pudong New Area, Shanghai.",
      },
    ],
  },
  {
    slug: "portrait-license",
    titleZh: "肖像授权说明",
    titleEn: "Portrait License",
    updatedAt: "2026-03-01",
    sectionsZh: [
      {
        h: "一、肖像权法律基础",
        p: "依据《中华人民共和国民法典》第 1018-1023 条,自然人对自己的肖像享有制作、使用、公开或者许可他人使用的权利。AI 合成肖像未经许可不得使用。",
      },
      {
        h: "二、基础授权(KYC License)",
        p: "完成实名后,你授权 Mira 镜界 作为你的独家经纪代理人,代为接受订单、签订订单合同、收取费用、分配收益。该授权不剥夺你的人格权与撤回权。",
      },
      {
        h: "三、订单授权范围",
        p: "每笔订单合同载明:授权时长(单部 / 季度 / 年度 / 永久)、地域(中国大陆 / 港澳台 / 海外)、用途(短剧 / 广告 / 直播 / 衍生品)、媒介(线上视频 / 户外广告 / 印刷品)、是否独家、是否允许二次创作。",
      },
      {
        h: "四、二次创作限制",
        p: "未经创作者额外同意,丙方不得:(a) 将素材用于违法、色情、暴力内容;(b) 将素材用于训练第三方模型;(c) 进行恶意丑化或政治化处理。",
      },
      {
        h: "五、撤回机制",
        p: "你可以通过「创作者后台 → 形象 → 申请下架(被遗忘权)」提交撤回。撤回提交后,该形象立即停止接受新订单,但已签订的订单合同仍按原约定执行直至期满。",
      },
      {
        h: "六、未成年保护",
        p: "16 周岁以下未成年人不得在本平台注册创作者。已存在的素材如发现包含未成年人形象,平台将立即下架并通知公安机关。",
      },
      {
        h: "七、违规处理",
        p: "如丙方超出授权范围使用素材,你有权向平台提交「滥用」类型争议,平台将协助维权,最高可处订单金额 3 倍违约金。",
      },
      {
        h: "八、合同存证",
        p: "所有 KYC 与订单合同均自动生成 SHA256 哈希并写入 mira-chain 区块,任何人可在「链上浏览器」查询验证。",
      },
    ],
    sectionsEn: [
      {
        h: "1. Legal Basis",
        p: "Per Articles 1018-1023 of the PRC Civil Code, individuals hold the right to create, use, disclose or license their portrait. AI-synthesized likeness requires authorization.",
      },
      {
        h: "2. KYC License",
        p: "Upon KYC completion you appoint Mira as your exclusive agency representative to accept orders, sign order contracts, collect fees, and distribute revenue. Personality rights and revocation rights are not waived.",
      },
      {
        h: "3. Order License Scope",
        p: "Each order contract specifies term (per project / quarterly / annually / perpetual), territory (mainland / HKMT / overseas), use (short drama / ad / live / derivatives), media (online / OOH / print), exclusivity, and derivative permission.",
      },
      {
        h: "4. Derivative Restrictions",
        p: "Without additional consent, Party C shall not: (a) use the asset for illegal, pornographic or violent content; (b) train third-party models; (c) maliciously distort or politicize the image.",
      },
      {
        h: "5. Revocation",
        p: "You may submit revocation via Creator Console → Talent → Request Takedown (Right to be Forgotten). Existing signed orders remain valid until expiration.",
      },
      {
        h: "6. Minor Protection",
        p: "Anyone under 16 may not register as a creator. If minor likeness is detected, the asset will be immediately removed and reported to authorities.",
      },
      {
        h: "7. Violation Handling",
        p: "If Party C exceeds the licensed scope, you may file a Misuse Dispute. Penalty may reach 3× the order amount.",
      },
      {
        h: "8. On-chain Evidence",
        p: "All KYC and order contracts are SHA256-hashed and written to mira-chain. Anyone may verify via the on-chain explorer.",
      },
    ],
  },
  {
    slug: "minors",
    titleZh: "未成年人保护规则",
    titleEn: "Minor Protection",
    updatedAt: "2026-03-01",
    sectionsZh: [
      {
        h: "一、明文禁止条款",
        p: "Mira 镜界 严禁任何形式的未成年人肖像授权与 AI 合成。本平台不接受未满 16 周岁创作者注册,不接受任何包含未成年人面孔的素材上传、AI 生成或订单授权。",
      },
      {
        h: "二、举报通道",
        p: "如发现未成年人形象违规使用,请立即:(1) 通过「帮助中心 → 内容举报」提交;(2) 邮件至 abuse@mira.test;(3) 拨打全国未成年人保护热线 12355。平台承诺 24 小时内响应。",
      },
      {
        h: "三、自动机审",
        p: "所有上传素材将经过基于人脸年龄估计模型的机审,系统对预测年龄 < 18 周岁的素材自动拦截并人工二审。模型误判率公示在「合规白皮书」。",
      },
      {
        h: "四、应急下架",
        p: "确认违规后,平台将在 1 小时内下架素材、冻结相关账户、通知公安机关并配合调查。",
      },
      {
        h: "五、家长权利",
        p: "如家长发现未成年子女误注册或上传素材,可邮件至 minor-guardian@mira.test 提交监护证明,平台将无条件、立即、不可逆地删除全部相关数据。",
      },
      {
        h: "六、教育与培训",
        p: "我们与上海段和段律师事务所合作,在帮助中心提供「未成年人形象使用法律指引」白皮书,持续更新。",
      },
    ],
    sectionsEn: [
      {
        h: "1. Strict Prohibition",
        p: "Mira strictly prohibits any authorization or AI synthesis of minor portraits. We do not accept creator registration under 16, nor any uploads or orders containing minor faces.",
      },
      {
        h: "2. Reporting Channels",
        p: "If you detect a violation: (1) submit via Help Center → Content Report; (2) email abuse@mira.test; (3) call China's minor-protection hotline 12355. We respond within 24h.",
      },
      {
        h: "3. Automated Moderation",
        p: "All uploads are screened by an age-estimation model. Predicted age < 18 triggers automatic block and human re-review. Model error rate is published in the Compliance Whitepaper.",
      },
      {
        h: "4. Emergency Removal",
        p: "Upon confirmation, the asset is removed within 1 hour, related accounts frozen, and authorities notified.",
      },
      {
        h: "5. Guardian Rights",
        p: "Guardians may email minor-guardian@mira.test with proof of guardianship to obtain unconditional, immediate, irreversible deletion of all related data.",
      },
      {
        h: "6. Education",
        p: "In partnership with Duan & Duan Law Firm, we publish the Minor Portrait Use Legal Guide in the Help Center, with ongoing updates.",
      },
    ],
  },
  {
    slug: "dpa",
    titleZh: "数据处理协议(DPA)",
    titleEn: "Data Processing Agreement",
    updatedAt: "2026-03-01",
    sectionsZh: [
      {
        h: "一、目的",
        p: "本数据处理协议适用于企业客户在使用 Mira 镜界 API / SDK 处理终端用户个人信息时,平台作为「受托处理人」与企业作为「个人信息处理者」的合作关系。",
      },
      {
        h: "二、处理目的与范围",
        p: "平台仅根据企业指令处理数据,处理范围限于:身份验证、AI 内容生成、订单管理、合规审计。不得用于企业指令之外的目的。",
      },
      {
        h: "三、安全措施",
        p: "传输加密(TLS 1.3)、存储加密(AES-256)、访问控制(RBAC + 4 眼原则)、操作审计(全链路日志)、定期安全测试(每年 1 次第三方渗透)。",
      },
      {
        h: "四、子处理者",
        p: "如使用阿里云、腾讯云等子处理者,平台保证签订同等约束的子处理协议,并在企业要求时提供清单。",
      },
      {
        h: "五、数据主体权利响应",
        p: "企业有义务向平台转达终端用户的查阅、更正、删除请求,平台在 7 个工作日内响应。",
      },
      {
        h: "六、事件响应",
        p: "发生数据泄露事件后 24 小时内通知企业,72 小时内提供事件评估报告,并配合监管要求。",
      },
      {
        h: "七、终止与返还",
        p: "合作终止后 30 天内,按企业指令删除或返还所有数据,并出具销毁证明。",
      },
    ],
    sectionsEn: [
      {
        h: "1. Purpose",
        p: "This DPA governs enterprise customers using Mira API/SDK to process end-user personal data, with Mira as Processor and the enterprise as Controller.",
      },
      {
        h: "2. Scope",
        p: "Mira processes data only on documented instructions of the Controller, limited to identity, AI generation, order management, audit compliance.",
      },
      {
        h: "3. Security",
        p: "TLS 1.3 in transit, AES-256 at rest, RBAC + four-eyes review, full-trail audit logs, annual third-party penetration test.",
      },
      {
        h: "4. Sub-processors",
        p: "Mira ensures equivalent-binding contracts with any sub-processor (Alibaba Cloud, Tencent Cloud, etc.) and provides the list upon request.",
      },
      {
        h: "5. Data Subject Rights",
        p: "Controller forwards data subject requests; Mira responds within 7 business days.",
      },
      {
        h: "6. Incident Response",
        p: "Breach notification within 24 hours, assessment within 72 hours, full regulator cooperation.",
      },
      {
        h: "7. Termination",
        p: "Within 30 days of termination, Mira deletes or returns data per Controller's instruction, with certificate of destruction.",
      },
    ],
  },
];

export function getLegalDoc(slug: LegalDoc["slug"]): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
