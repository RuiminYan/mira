# Mira 镜界 使用说明

> AIGC 时代的数字资产与 IP 创作平台
> 让每个人的脸成为可流通可分账的数字资产

这是 Mira 镜界 BP 配套的演示站点。既能给投资人 / 合作方做产品演示,也能让创作者和制作方真正完成一次「上链 → 选角 → 议价 → 下单 → 支付 → 审核 → 交付 → 上链 → 分发 → 分账 → NFT」的完整闭环。

数据落在项目根目录的 SQLite 文件 `data.db`,关掉浏览器再来,你看到的状态还在。所有外部依赖(支付 / 链 / 大厂分发 / 生成 API)在这一版里都是平台内置的 mock 实现,可独立离线运行。

---

## 一、一句话定位

Mira 把人脸 IP 做成像音乐版权一样,可以自由交易、可以重复授权、可以分账到原创作者、可以在二级市场流通,并把每一步盖上区块链时间戳与电子合同。

我们对应的不是某一个工具(选角 / 生成 / IM),而是 **人脸 IP 的交易所 + 结算清算所 + 内容分发网关**。

---

## 二、网站做了什么

这个项目同时是一份 BP,也是一个能跑的业务平台原型,也包含若干进阶生态模块。下面分三段说明。

### 2.1 BP 展示页

不需要登录,任何人都可以浏览。

| 页面 | 看到什么 |
| --- | --- |
| `/` 首页 | 一句话定位 + AI 演员脸库视觉 + 三端架构 + 痛点对照 + 市场规模 + 护城河 + 三阶段里程碑 + 行动入口 |
| `/product` | 创作者端 / 制作方端 / 结算系统的四步流程,4K 采集标准,五步法审核,三阶段定价表 |
| `/market` | SAM / TAM 数据,供需画像,PEST 驱动力,风险与应对,竞品对比,融资规划 |
| `/team` | 公司、核心团队、行业顾问(段和段律所 / 江传荣),核心资产(东方星链 / 5000 万粉丝矩阵 / 政府资源) |
| `/contact` | 三个独立入口表单 创作者 / 制作方 / 投资人,所有线索进管理后台 |
| `/insights` | 行业洞察专栏,长文形式给出合规指南、案例研究、SOP、案例对照 |

### 2.2 业务平台原型

数据真实写入 SQLite,刷新页面也在。每一个角色都能完整走通一条业务线。

| 模块 | 路由起点 | 关键能力 |
| --- | --- | --- |
| 选角广场 | `/marketplace` | 多维筛选 + 标签搜索 + 余弦相似度排序 |
| 演员详情 | `/marketplace/[id]` | 风格画像 / 价格规则 / 一键下单 / 议价入口 / 预览片轮播 / NFT 关联 |
| 套餐市场 | `/marketplace/bundles` | 闺蜜包 / 职场包 / 路人包等预设 SKU,折扣价批量授权 |
| 图搜脸 | `/marketplace/search/face` | 上传一张参考图,平台用脸部特征向量推荐相似人选 |
| 议价工坊 | `/partner/quotes/new` | 制作方发起报价 → 创作者反报 → 双方收敛到一个价格 |
| 订单流转 | `/partner/orders` → `/admin` → 创作者 | 待支付 → 已支付 → 已批准 → 已交付 → 已结算,全程链上留痕 |
| 支付页 | `/partner/orders/[id]/pay` | mock 微信 / 支付宝 / 余额三种通道,落 payments 表 |
| 实名认证 | `/creator/verify` | 身份证 SHA256 哈希 + 持证视频上传 + 平台审核 |
| 合同管理 | `/creator/contracts` 与 `/contracts/[id]` | 电子授权书 PDF 模板 + 关键 hash 上链 |
| 链上证据 | `/chain` 与 `/chain/[id]` | mock 区块链浏览器,把订单 / 形象 / 下架 / 合同的 sha256 落块查询 |
| 争议仲裁 | `/admin/disputes` | 制作方发起争议,平台仲裁,可全额或部分退款 |
| 下架请求 | `/admin/takedowns` | 创作者行使被遗忘权,审批后形象停售 + 区块链留痕 |
| 发票开具 | `/admin/invoices` 与 `/invoices/[id]` | 增值税专 / 普,PDF 输出,sha256 留痕 |
| 站内信 | `/messages` | 三方协同的私信中心,关联订单 / 议价 / 系统通知 |
| 通知中心 | `/notifications` | 全角色统一通知收件箱 |
| AI 工坊 | `/studio` | 制作方对已授权形象做二次生成(图 / 视频 / 音色),按积分扣费 |
| 工坊积分 | `/studio/credits` | RMB → credits 充值,任务级扣费明细 |
| MCN 后台 | `/mcn` | 经纪公司一号管多创作者,签约比例 + 抽成,生成统一对账 |
| 创作者驾驶舱 | `/creator/analytics` | SVG 自绘多种图表:30 天趋势 / 形象热度 / 场景分布 / 独家对照 / 同行对标 |
| 大厂分发 | `/admin/distributions` | 红果 / 抖音 / 快手 / 视频号四个渠道的素材推送和上线状态 |
| 平台对账 | `/admin/reconciliation` | 按日 / 渠道 / 类型对账面板 |
| 审计日志 | `/admin/audit` | 关键管控行为(批准 / 结算 / 下架 / 退款)留痕,可按 actor 过滤 |
| 活动流 | `/activity` | 全局滚动条 + 详情页,展示最新成交 / 上架 / 实名通过 / 上线 |
| 帮助中心 | `/help` | 12 篇站内 FAQ,中英双语,GA Stage 起步必看 |
| Onboarding 引导 | 首次访问触发 | 三步浮层教学,介绍主要入口 |

### 2.3 进阶生态

下面这些是 BP 之外、原型已经实装的「平台护城河」,主要目的是验证商业模型完整性。

| 模块 | 入口 | 价值 |
| --- | --- | --- |
| NFT 化资产 | `/nft/[tokenId]` 与 `/creator/nfts` | 每张已审核形象 mock 铸造一枚 NFT,owner 默认为原创作者,转让 / 燃烧操作落 nft_transfers |
| 多语言 i18n | 右上角语言切换 | 简中 / English 双语,文案表分文件管理,无任何第三方依赖 |
| 平台水印 | 上传与生成路径均自动加 | 落 watermark 字段 + sha256,争议溯源用 |
| SEO 完整体 | `/robots.txt` `/sitemap.xml` `/opengraph-image` 等 | 完整搜索引擎适配 |
| PWA | `/manifest.webmanifest` `/offline` | 桌面 / 手机可安装,断网兜底页 |
| 暗色 / 浅色 / 跟随系统 | 右上角主题切换 | 三态切换 + 本地记忆 |
| 浏览器活动流广播 | 首页 ticker | 5 秒一条,SSE 风格视觉 |
| 推荐算法 | 选角广场和详情页 | 基于标签的余弦相似度,带 「同标签头部 Top 3」 |

---

## 三、动线演示

下面这条 12 步流程是一次完整业务流,需要交替切换三个体验账号。建议第一次跑就照这个走,所有页面都会涉及。

### 3.1 体验账号

进 `/login`,选身份,输入下表任一邮箱,昵称随意。

| 角色 | 邮箱 | 进入后默认看见 |
| --- | --- | --- |
| 创作者 | `yuhan@mira.test` | 「温雨涵 YUHAN」这张脸的资产,有累计分账历史 |
| 制作方 | `studio@xinghe.test` | 「星河影业」的待支付订单 / 已支付订单 / 已交付订单各若干 |
| 管理员 | `admin@mira.test` | 全平台数据全景,待审议价 / 待审实名 / 待审下架 |
| MCN | `mcn@xinglian.test` | 「星联 MCN」 旗下的若干签约创作者 + 当月分成抽成 |

> 原型阶段免密登录,只看邮箱;线上版本会接手机号 + 实名 + 短信验证。

### 3.2 推荐动线(2 分钟版)

1. 制作方登录(`studio@xinghe.test`)→ `/marketplace` → 任选一张脸(如温雨涵)
2. 详情页点 `我想议价` → `/partner/quotes/new` 自动填好对方 → 提交报价
3. 退出 → 创作者登录(`yuhan@mira.test`) → `/creator/quotes` → 接受或反报
4. 再次以制作方身份回到 `/partner/quotes` → 看到接受状态 → 一键转订单
5. 进入 `/partner/orders/[id]/pay` → 选 `余额` 或 `微信` 通道 → 支付成功 → 状态切换为 已支付
6. 退出 → 管理员登录(`admin@mira.test`) → `/admin` 看到这一单 → 点 批准
7. 制作方再点 标记交付 → 状态切到 已交付
8. 管理员点 结算分账 → orders 状态切到 已结算,revenues 表多两条记录(授权费 + 平台抽成)
9. `/admin/distributions` 看到这张脸已自动推送到四个渠道
10. `/chain` 看到刚结算的订单 sha256 已上链
11. `/admin/invoices` 制作方申请增值税专票,管理员开具,生成 PDF 并 sha256 留痕
12. 创作者再次登录 → `/creator/revenue` 流水多了两笔,`/creator/analytics` 30 天趋势线被点亮

整个链路覆盖了 BP 里讲到的所有要素:授权、分账、透明结算、合同、确权、可追溯。

### 3.3 高级动线

完成基础动线后,可以再玩这些:

- **AI 工坊**: 用制作方账号进 `/studio` → 选已授权的形象 → 创建图像 / 视频 / 音色任务 → 看 `/studio/credits` 扣费 → 任务完成时,`/admin/studio` 后台显示治理列表
- **NFT 转移**: 管理员账号进 `/creator/nfts`(管理员可看所有)→ 任意一枚 → 看 transfer log
- **被遗忘权**: 创作者进 `/creator/talents/[id]` → 申请下架 → 管理员 `/admin/takedowns` 审批 → 此形象 status 改 taken_down,下架后任何人都无法再下单,链上留痕
- **争议**: 制作方在已交付订单上提争议 → 管理员 `/admin/disputes` 仲裁,可全额或部分退款,refunds 表自动产生
- **MCN 抽成**: MCN 账号进 `/mcn/creators/invite` → 邀请 token 复制给创作者 → 创作者接受后,后续每笔订单按 commissionPct 自动扣给 MCN

---

## 四、视觉与体验

### 4.1 主题三态切换

右上角 太阳 / 月亮 / 显示器 三态图标,点击切换:

- 浅色 light
- 深色 dark
- 跟随系统 system(订阅 `prefers-color-scheme` 实时切)

切换状态写本地 `localStorage`,刷新仍然生效。所有页面与组件已对两套色板完整调通,不存在仅在某个主题下可读的元素。

### 4.2 中英双语切换

右上角 `中 / EN` 切换,文案表在 `lib/i18n/` 下,完全自研,无任何第三方依赖:

- 简体中文 zh
- English en

切换会落 cookie,SSR 阶段就能读到正确语言。所有公开页 BP 展示页 + 选角广场都已双语化;后台管理类页面仍以中文为主(平台运营所在地)。

### 4.3 移动端

所有 UI 已在 <480px 完整测试,无水平溢出:

- 后台表格统一 `overflow-x-auto + min-w-[X]`,在小屏可横滚
- SVG 图表使用 `viewBox + 100%` 宽度等比缩放,小屏可读
- 网格布局默认 1 列,通过 `sm:` `md:` `lg:` 断点渐进式扩展
- 顶部 nav 在 <768px 自动收起为横向 overflow-x-auto 滑动条
- Onboarding 浮层位置自适应,不遮主操作区

### 4.4 暗色优先,玻璃质感

整站默认深色 `bg-[#0B0B14]`,前景为玻璃磨砂质感 `backdrop-blur`,核心 CTA 使用 `linear-gradient(135deg, #6E59F6 → #FF6FB4)` 紫粉双色渐变,弱视觉文字使用 `text-ink-3 / text-ink-4` 灰阶,符合后端 SaaS 现代审美。

---

## 五、平台所有入口

下面按角色分组列出全部 50+ 路由。原则上每一条都已经通过烟测(`.tmp/result.md`)。

### 5.1 任何人可访问 不需登录

```
/                            首页
/product                     产品详情
/market                      市场分析
/team                        团队介绍
/contact                     合作 / 投资意向表单
/marketplace                 选角广场
/marketplace/[id]            演员详情
/marketplace/bundles         套餐 SKU
/marketplace/bundles/[id]    套餐详情
/insights                    行业洞察列表
/insights/[slug]             洞察长文详情
/activity                    活动流
/chain                       链上证据浏览器
/chain/[id]                  单条上链详情
/help                        帮助中心
/help/[slug]                 单篇 FAQ
/nft/[tokenId]               NFT 详情
/login                       登录
/login?role=mcn              带角色参数的登录
/offline                     PWA 离线兜底页
/robots.txt                  SEO
/sitemap.xml                 SEO
/manifest.webmanifest        PWA
/opengraph-image             OG 主图
/twitter-image               Twitter 卡片图
/icon                        favicon
/apple-icon                  iOS 桌面图标
```

### 5.2 创作者(creator)

```
/creator                     总览
/creator/analytics           数据驾驶舱
/creator/talents             我的形象列表
/creator/talents/new         上传新形象
/creator/talents/[id]        形象编辑 + 下架申请
/creator/nfts                我的 NFT 收藏
/creator/quotes              收到的议价
/creator/quotes/[id]         议价对话
/creator/revenue             收益与分账流水
/creator/contracts           我的合同
/creator/mcn                 我的经纪 / 解约
/creator/verify              实名认证
/verify                      实名入口(老路径,保留兼容)
/notifications               通知中心
/messages                    站内信收件箱
/messages/[id]               站内信会话
```

### 5.3 制作方(partner)

```
/partner                     总览
/partner/orders              我的订单
/partner/orders/[id]         订单详情
/partner/orders/[id]/pay     支付页
/partner/quotes              议价记录
/partner/quotes/new          发起议价
/partner/quotes/[id]         议价对话
/studio                      AI 工坊总览
/studio/jobs                 任务列表
/studio/jobs/new             新建任务
/studio/jobs/[id]            任务详情
/studio/credits              工坊积分充值历史
/invoices/[id]               发票预览
```

### 5.4 管理员(admin)

```
/admin                       总览 + 订单审批
/admin/verifications         实名审核
/admin/takedowns             下架申请仲裁
/admin/disputes              争议仲裁
/admin/invoices              发票开具
/admin/distributions         大厂分发推送
/admin/reconciliation        对账面板
/admin/studio                AI 工坊治理
/admin/audit                 审计日志
```

### 5.5 MCN(mcn)

```
/mcn                         总览
/mcn/creators                旗下创作者
/mcn/creators/invite         邀请新创作者
/mcn/revenue                 我的抽成分账
```

### 5.6 API 端点

```
POST /api/upload                上传文件(签名校验 sha256)
POST /api/contract/[id]/verify  合同验签
POST /api/auth/logout           退出登录
```

---

## 六、本地启动

> 当前环境的 pnpm 链路异常,因此命令绕过 npm scripts,直接走二进制。如果你在干净环境上 clone,优先 `pnpm install` 之后再走脚本(`pnpm db:migrate / db:seed / dev`)。

```powershell
# 1. 第一次:生成迁移文件(改动 db/schema.ts 后再跑)
node_modules\.bin\drizzle-kit.cmd generate

# 2. 执行迁移(每次拉新代码后跑一次)
node_modules\.bin\tsx.cmd db/migrate.ts

# 3. 注入种子数据(谨慎,会清空原数据)
node_modules\.bin\tsx.cmd db/seed.ts

# 4. 启动开发服务器
node_modules\.bin\next.cmd dev -H 127.0.0.1 -p 3200
```

启动后访问 http://127.0.0.1:3200 ,默认进首页。

### 6.1 typecheck

我们用 `tsgo`(`@typescript/native-preview`)做类型检查,比 `tsc` 快 10 倍:

```powershell
node_modules\.bin\tsgo.cmd --noEmit
```

### 6.2 SQLite 数据库

数据落在项目根 `data.db`,单文件,可直接复制做备份;附带 `data.db-shm` / `data.db-wal` 是 WAL 模式的中间文件,删除前先 `pnpm db:migrate` 关闭进程。

### 6.3 端口与主机

强制绑定 `127.0.0.1:3200`,避免与本机其他 Next 项目串端口。可用通过修改 `package.json` 的 `dev` 脚本调整。

---

## 七、数据模型概览

后端 30 张表,使用 Drizzle ORM + SQLite。中文名速览:

- **users** 平台账号(创作者 / 制作方 / 管理员 / MCN 四种角色)
- **talents** AI 演员形象
- **orders** 订单
- **revenues** 分账流水(授权费 / 平台抽成 / 退款 / 代扣)
- **leads** 合作 / 投资意向线索
- **verifications** 创作者实名认证
- **uploads** 上传文件元数据(头像 / 视频 / 合同 / 支付凭证 / 交付包)
- **contracts** 电子合同(KYC 授权 + 单次订单授权)
- **chainRecords** 区块链证据(mock)
- **payments** 支付记录(微信 / 支付宝 / 余额)
- **takedowns** 下架申请(被遗忘权)
- **disputes** 争议仲裁
- **invoices** 发票申请与开具
- **previews** 演员预览片(多场景示范)
- **bundles** 套餐 SKU
- **bundleItems** 套餐成员关联
- **quotes** 议价主表
- **quoteMessages** 议价往返报价记录
- **threads** 站内信会话
- **threadParticipants** 站内信参与人
- **messages** 站内信消息
- **notifications** 通知中心
- **mcnCreators** MCN 与创作者签约关系
- **distributions** 大厂分发记录
- **auditLogs** 审计日志
- **nfts** NFT 资产
- **nftTransfers** NFT 转移记录
- **studioJobs** AI 工坊任务
- **studioCredits** 工坊积分账户
- **studioRecharges** 工坊充值记录
- **activities** 全平台动态流

所有关键写操作都会同步落一条 `auditLogs` 和(必要时) `chainRecords`,保证可追溯。

---

## 八、下一步路线图

下面这两段是 Phase 5 之外的补充,不属于 BP 的 P0 - P3 主线。这些是 **「让平台走向产品化、走向公开发布」** 所需的工程模块,Phase 6 / Phase 7 会陆续补齐。

> 提示: 这里描述的功能尚未实装。当前仓库的代码截止于 Phase 4 的所有 P0 - P3 主线交付。

### Phase 6 计划

| 模块 | 目标 |
| --- | --- |
| 钱包 | 创作者 / 制作方各自的内部钱包账户,余额可看可冻结可解冻 |
| 提现 | 创作者将余额提现到银行卡 / 微信钱包,可走 T+1 也可加急 |
| 评价 | 订单完成后双方互评,落到形象详情页的口碑分 |
| 收藏 | 制作方收藏夹,把心仪形象 / 套餐留档稍后下单 |
| 公开主页 | 创作者 / MCN 的公开 profile 页 `/u/[slug]`,匿名访客可浏览作品集与已授权案例 |
| 法律页 | `/legal/privacy` 隐私政策、`/legal/terms` 用户协议、`/legal/cookies` cookie 说明、`/legal/aigc` AIGC 合规声明 |
| 风控 | 注册节流 + 异常下单监测 + IP / 设备指纹 + 高风险订单人工复核队列 |
| 团队管理 | 制作方账号下可添加成员,设置部门 / 角色 / 权限,统一对账 |

### Phase 7 已交付

| 模块 | 状态 |
| --- | --- |
| Open API `/api/v1/*` | ✓ Bearer Key 鉴权 · 7 端点 · scope 控制 |
| Webhook | ✓ HMAC-SHA256 签名 · 失败 5 次自动暂停 · 投递记录 |
| SaaS 定价 `/pricing` | ✓ 三档套餐 · 特性对比 · 企业咨询表单 |
| 徽章 + 成就 `/me/badges` | ✓ 8 张徽章 · 自动颁发 · 主页 pin |
| 排行榜 `/leaderboard` | ✓ 月度三榜 · 历史回看 |
| 数据导出 `/me/exports` | ✓ CSV / JSON / 发票 HTML 可打印 PDF |
| CSM 360 视图 | ✓ tier / 标签 / 下次回访 / 触点时间线 |
| 全站搜索 + 命令面板 | ✓ Ctrl/⌘K 唤起 · 多 Tab 结果 |

### Phase 8 已交付

| 模块 | 入口 | 关键能力 |
| --- | --- | --- |
| 帮助中心 30+ FAQ | `/help` `/help/[slug]` | 4 大类 36 条问答 · 投票 / 反馈 · `helpVotes` 表实时累计 · 最有用 Top 6 |
| 工单系统 | `/help/contact` `/help/tickets` `/admin/tickets` | 7 类 · 4 优先级 · 4 状态 · `tickets` + `ticketMessages` 表 · 双向回复 |
| 透明度报告 | `/transparency` | 累计用户 / 在架形象 / GMV / 链上记录 / 实名通过率 / 工单 SLA / 数据治理承诺 |
| 系统状态 | `/admin/system` | 进程 uptime / 内存 / 全部表行数 / 工单 SLA / 对外接口 |
| 健康端点 | `/api/health` | db ping + 计数器 + env,JSON 200/503 |
| RSS 订阅 | `/insights/rss.xml` | RSS 2.0 · 6 篇洞察 |
| 洞察重写 | `/insights/[slug]` | ReactNode body · `<H>` / `<P>` / `<UL>` / `<Steps>` / `<Stat>` / `<Table>` / `<Callout>` 等 helper,FAQ + Article JSON-LD |
| SEO 升级 | `app/sitemap.ts` `app/robots.ts` `lib/seo.ts` | Organization / WebSite JSON-LD,所有公开页统一 base url |
| 主页润色 | `/` | 顶部 banner、TrustBar、平台实时数据、精选洞察 3 卡 |
| 烟测 | `pnpm smoke` | 14 个 curl 级测试,验收 PASS 14/14 |

#### Phase 8 快速验收

```powershell
# 1. 升级 schema + seed(每次跑会重置 data.db)
node_modules\.bin\drizzle-kit.cmd generate
node_modules\.bin\tsx.cmd db/migrate.ts
node_modules\.bin\tsx.cmd db/seed.ts

# 2. 类型检查(必须 EXIT 0)
node_modules\.bin\tsgo.cmd --noEmit

# 3. 启动 dev,另开 shell 跑 smoke
node_modules\.bin\next.cmd dev -H 127.0.0.1 -p 3200
node_modules\.bin\tsx.cmd scripts/smoke.ts   # 14/14 PASS
```

## 无障碍承诺

Mira 致力于让每位用户都能高效使用平台:

- **键盘可达**:全部交互元素可经 Tab / Shift+Tab / Enter / Esc 操作;`<a href="#main">` 跳过导航直达正文。
- **焦点环可见**:`focus-visible` 使用品牌色 2px outline,在任何主题下都不会失踪。
- **屏幕阅读器**:icon-only 按钮均带 `aria-label`,表单 `label[for]` 与 `input[id]` 严格成对;Chart 输出附 `role="img"` + 描述。
- **用户偏好** `/me/accessibility`:支持「减弱动效 / 高对比度 / 大号字体」三档,写入 cookie `mira.a11y`,服务端读取后通过 `<html data-a11y-*>` 注入对应 CSS。
- **系统级**:`@media (prefers-reduced-motion)` 自动关闭装饰性动画。
- **键盘快捷键**:`Ctrl/⌘K` 唤起全站搜索;`Esc` 关闭浮层。

我们以 WCAG 2.1 AA 为目标持续完善,如发现可访问性障碍,请通过 `/contact` 反馈。

---

## 九、联系

| 用途 | 入口 |
| --- | --- |
| 合作意向 | `/contact` 表单(三类身份独立填写) |
| 投资意向 | `/contact#invest` |
| 产品反馈 | `/notifications` 后台留言或 GitHub Issues |
| 媒体 | 邮件至 `media@mira.cc` (待填) |
| 法务 | 邮件至 `legal@mira.cc` (待填) |

— Mira 镜界 团队
