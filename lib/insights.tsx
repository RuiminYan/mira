import type { ReactNode } from "react";

export type ArticleCategory = "法律" | "产业" | "技术" | "案例";

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  author: string;
  publishedAt: string;
  readingMin: number;
  hero: string;
  body: () => ReactNode;
  tags?: string[];
};

const CATEGORIES: ArticleCategory[] = ["法律", "产业", "技术", "案例"];

// shared paragraph & heading helpers — no markdown lib, just JSX
function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[22px] md:text-[26px] font-semibold text-ink mt-12 mb-5 leading-tight">
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-5">{children}</p>;
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-7 border-l-2 border-brand pl-5 italic text-ink-2">
      {children}
    </blockquote>
  );
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mb-6 list-disc pl-6 space-y-2 text-ink-2">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="my-7 space-y-4">
      {items.map((it, i) => (
        <li key={i} className="glass rounded-[12px] p-5">
          <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-1.5">
            Step {String(i + 1).padStart(2, "0")}
          </div>
          <div className="text-[16px] font-semibold text-ink mb-2">{it.title}</div>
          <div className="text-[14px] leading-7 text-ink-2">{it.body}</div>
        </li>
      ))}
    </ol>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-[12px] p-5">
      <div className="text-[24px] md:text-[28px] font-semibold text-gradient leading-none">
        {value}
      </div>
      <div className="mt-2 text-[12px] text-ink-3">{label}</div>
    </div>
  );
}

function StatRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="my-7 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      {stats.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  );
}

function Callout({
  tone = "brand",
  title,
  children,
}: {
  tone?: "brand" | "warn";
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={
        "my-7 rounded-[12px] p-5 border " +
        (tone === "brand"
          ? "border-brand/40 bg-brand-soft/40"
          : "border-amber-400/40 bg-amber-400/10")
      }
    >
      {title && (
        <div className="text-[12px] uppercase tracking-widest text-ink-3 mb-2">{title}</div>
      )}
      <div className="text-[14px] leading-7 text-ink">{children}</div>
    </aside>
  );
}

function Table({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="my-7 overflow-x-auto -mx-2 sm:mx-0">
      <table className="min-w-full text-[13.5px]">
        <thead>
          <tr className="text-ink-3 text-[12px] uppercase tracking-widest">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5 whitespace-nowrap">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const ARTICLES: Article[] = [
  {
    slug: "ai-portrait-compliance-2026",
    title: "AI 肖像授权合规指南:从《民法典》到《生成式 AI 服务管理办法》",
    excerpt:
      "把 AI 演员业务做成万亿赛道,合规是第一个分水岭。把民法典、AIGC 备案、深度合成标识、用户授权、平台责任拆成可执行清单。",
    category: "法律",
    author: "段和段律师事务所 · Mira 法务团队",
    publishedAt: "2026-04-12",
    readingMin: 11,
    hero: "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 60%,#FF6FB4 100%)",
    tags: ["合规", "PIPL", "民法典", "深度合成"],
    body: () => (
      <>
        <P>
          一段 AI 生成视频出现真实存在的人脸时,中国现行法律会立刻挂上至少四块牌子:《民法典》第 1019 条肖像权、第 1032 条隐私权、《个人信息保护法》第 28 条敏感个人信息、《生成式人工智能服务管理暂行办法》第 12 条深度合成标识。哪一块没拧紧,平台都要替创作者背锅。
        </P>
        <P>
          Mira 把这些散落条款拆解为「采集 — 授权 — 训练 — 生成 — 发行 — 下架」六阶段流水线,每一步必须留证。本文是给 KOC、制作方、平台运营、法务的同一张实操地图。
        </P>

        <H>一、采集阶段:四要素同意</H>
        <P>
          依据《个保法》第 14 条,采集人脸需要单独同意。Mira 实践中要求一次性收齐四件套:身份证哈希(SHA256 不存原文)、本人手持身份证活体视频、签字版《肖像授权 + 数据处理同意书》、备用紧急联系电话。
        </P>
        <UL
          items={[
            "授权书必须列明用途清单:训练 / 推理 / 商业演绎 / 二次创作 / 数据集流通 / 跨境传输,逐条勾选",
            "底层数据落 SQLite + WAL,身份证号永远不进数据库原文,只存 last4 与 SHA256",
            "证据链 hash 上链(MVP 阶段使用平台模拟链,后续可桥接到 蚂蚁链 / 长安链 / 至信链)",
          ]}
        />

        <H>二、授权阶段:可撤回 + 边界明确</H>
        <P>
          民法典 1021 条规定肖像权许可使用合同的解释发生争议时,作出有利于肖像权人的解释。这意味着合同条款必须显式列出「不允许的用途」,而不仅是「允许的用途」。
        </P>
        <Callout tone="warn" title="Mira 默认禁用清单">
          色情 / 涉政 / 涉宗教争议 / 涉医疗诊断 / 涉军事 / 涉未成年人擦边 / 与负面新闻拼接 — 任一项触发即合同自动作废。
        </Callout>
        <P>
          授权可撤回是法律要求。Mira 实现了被遗忘权工作台,创作者一键发起下架,平台 24 小时内审核,通过即写入下架链上记录、所有新订单冻结、历史素材打标。
        </P>

        <H>三、训练 / 生成阶段:深度合成强制标识</H>
        <P>
          依据《互联网信息服务深度合成管理规定》第 16 条,生成式 AI 内容必须显著标识。Mira 的交付包默认带两道水印:视频右下角 6% 透明度浮水印,以及音轨末尾的 1.2 秒哔声提示;另带可剥离的 KYC 证书 + 区块链查询链接。
        </P>

        <H>四、发行阶段:渠道连带责任</H>
        <P>
          红果、抖音、快手、视频号等大厂明确要求 AIGC 内容溯源到自然人。Mira 的订单详情页直接推送结构化授权数据(creator + KYC last4 + chain TX)到渠道,作为渠道侧的合规背书。下游侵权时,Mira 的合规快照可在 1 小时内提取并提交,作为 ISP 通知 — 删除程序的反通知材料。
        </P>

        <H>五、跨境传输:出海合规分级</H>
        <P>
          出海短剧爆发后,跨境传输面临 PIPL 三条路径:个人信息保护认证、标准合同、安全评估。Mira 默认采用标准合同路径,对每张被发往境外的 AI 演员脸,在下单时自动生成中英双语《Standard Contractual Clauses for the Export of Personal Information》模板。
        </P>

        <H>六、未成年人:绝对禁区</H>
        <P>
          KYC 时显示年龄不足 18 周岁的用户,Mira 直接拒绝接入。即使家长同意,我们也不收。这条比法律本身更严,但它是平台长期生存的底线。
        </P>

        <H>七、纠纷:三级 SLA</H>
        <Table
          head={["级别", "处理方", "时限", "适用范围"]}
          rows={[
            ["T0", "一线人工", "24 小时", "操作类问题"],
            ["T1", "法务 + 律师", "48 小时", "合同 / 边界争议"],
            ["T2", "仲裁机构", "30 天", "金额 / 责任纠纷"],
          ]}
        />
        <P>金额低于 ¥10,000 的争议,平台先行垫付,后续向责任方追偿。</P>

        <H>八、监管协作</H>
        <P>
          Mira 与 网信办 AIGC 备案窗口、市监局广告局、版权局 保持季度沟通。底层备案号显示在站点底部,出海版本另行备案。
        </P>
        <Callout title="免责说明">
          本文不构成正式法律意见,具体案件请联系 legal@mira.example。下一期我们将上线《AI 演员授权合同样本》开源版,适用于个人开发者与中小制作方。
        </Callout>
      </>
    ),
  },
  {
    slug: "microdrama-2026-trillion-window",
    title: "2026 微短剧风口:1200 亿赛道下的人脸授权机会",
    excerpt:
      "微短剧 ARPU 越来越高,但真人演员反而是最贵的成本项。一张 AI 演员脸把单集成本从 8 万压到 2 万,变现率反而翻倍。",
    category: "产业",
    author: "Mira 产业研究 · 东方星链",
    publishedAt: "2026-05-02",
    readingMin: 9,
    hero: "linear-gradient(135deg,#6E59F6 0%,#FF6FB4 100%)",
    tags: ["微短剧", "市场", "GMV"],
    body: () => (
      <>
        <StatRow
          stats={[
            { value: "¥1,206 亿", label: "2026 Q1 微短剧总规模" },
            { value: "6.3 亿", label: "付费用户" },
            { value: "17 天", label: "Top 100 平均回收周期" },
            { value: "35–45%", label: "演员费占总成本" },
          ]}
        />
        <P>
          DataEye 报告没说的另一面是:演员费占总成本 35-45%,其中配角档期撞档严重,经常 1 个真人演员同时签 8 部剧,导致档期冲突 → 延期 → 退款。
        </P>
        <P>
          AI 演员把这道乘法拆开。Mira 模式里,演员 ≠ 自然人。一张 KOC 的脸资产化后,可同时授权给 20 部短剧的配角档口,创作者本人完全不出镜,但每部剧分账 5-8%。
        </P>

        <H>把 1200 亿拆成可定价的格子</H>
        <Table
          head={["细分", "份额", "脸需求 / 部", "Mira 单部成本"]}
          rows={[
            ["女频甜宠", "32%", "3 主 + 5 配 + 10 路", "¥12,000"],
            ["男频战神", "28%", "2 主 + 4 配 + 8 路", "¥9,500"],
            ["霸总", "16%", "2 主 + 3 配 + 6 路", "¥7,800"],
            ["家庭伦理", "9%", "4 主 + 2 配", "¥6,000"],
            ["古风玄幻", "8%", "2 主 + 4 配", "¥9,200"],
            ["其它", "7%", "—", "—"],
          ]}
        />
        <P>
          我们和星河、寒拾、青柠 三家头部短剧工作室做过实际测算:把真人配角全部换成 AI 配角,单部成本下降 38%,生产周期从 12 天压到 5 天,回收周期从 17 天压到 9 天。
        </P>

        <H>为什么 KOC 端供给更愿意上链</H>
        <UL
          items={[
            "中腰部 KOC(5 万 – 50 万粉)是中国数量最庞大、变现最艰难的一群人",
            "把脸授权给 Mira,基础保底 ¥0,但每接一单分一笔",
            "一张 A 级脸接 8 部短剧 + 2 部漫剧 + 1 支 TVC,月被动收益 8000 – 25000",
            "Mira 默认不要求独家,脸是版税资产而不是雇佣关系",
          ]}
        />

        <H>制作方端:从买演员到买素材</H>
        <P>
          短剧制作方的预算结构正在重构:演员费 → 算力费 + 素材授权费。后者比前者透明、稳定、可批量。
          Mira 的套餐 SKU 设计直接对标短剧脚本结构:闺蜜包(3 张)、职场包(3 张)、路人包(5 张以上)、古装爽剧主角包(3 张)。
        </P>

        <H>平台护城河:数据飞轮</H>
        <P>
          Mira 每完成一单授权,留下两条数据:1)单部剧成败 vs 演员脸选择;2)分账历史 → 创作者信用分。三年后,Mira 将是中国 AI 演员领域最大的分账数据库。
        </P>

        <H>三年判断</H>
        <Quote>
          2026 年微短剧 AI 演员渗透率 8%,2027 年 25%,2028 年 50%。Mira 抢占的是 25% 渗透率拐点之前的窗口期。
        </Quote>
      </>
    ),
  },
  {
    slug: "case-yuhan-monthly-50k",
    title: "yuri 数字人:一张脸如何接 12 部短剧、月入 5 万",
    excerpt:
      "yuri 是 Mira 上 yuhan 创作者的二代形象。本文复盘她 90 天里 12 部短剧的接单结构,以及分账如何打通带货之外的第二条收入曲线。",
    category: "案例",
    author: "Mira 案例研究室",
    publishedAt: "2026-04-20",
    readingMin: 8,
    hero: "linear-gradient(135deg,#FF8FB1 0%,#FFC796 100%)",
    tags: ["案例", "KOC", "S 级"],
    body: () => (
      <>
        <P>
          yuhan 是上海财大硕士,在小红书做职场知识分享,粉丝 102 万,公众号月广告收入 1.5-3 万,带货月分润 5,000 – 12,000。这是中国头部 KOC 的典型收入结构。
        </P>
        <P>
          2025 Q4 她把脸授权给 Mira,90 天后被动收入超过她过去的主动收入。本文公开她的 12 部接单流水。
        </P>

        <H>脸资产档案</H>
        <Table
          head={["项目", "数值"]}
          rows={[
            ["形象代号", "yuri · YUHAN"],
            ["等级", "S 级 · 独家"],
            ["面孔特征", "都市丽人 / 职场精英 / 知性 / 25-30"],
            ["起拍价", "¥1,200 / 单部"],
            ["分账比例", "6%"],
            ["上架日", "2026-01-08"],
          ]}
        />

        <H>12 部短剧接单流水</H>
        <Table
          head={["剧目", "角色", "授权 + 分账", "回款"]}
          rows={[
            ["财阀千金回归 第 12 集", "配角", "¥1,200 + 6%", "¥1,920"],
            ["总裁的契约新娘", "女主", "¥2,400 + 8%", "¥10,400"],
            ["我的金融狼人老公", "女配", "¥1,200 + 6%", "¥3,000"],
            ["婚后心动", "路人", "¥600 + 4%", "¥1,400"],
            ["重生归来撕女主", "反派配角", "¥1,200 + 5%", "¥2,700"],
            ["白月光归来(漫剧)", "女主独白", "¥1,500 + 7%", "¥7,200"],
            ["7-12 配角 / 路人 / 客串", "平均", "¥800 + 4%", "¥1,400 × 6"],
          ]}
        />
        <Callout>90 天授权 + 分账 收入合计:<strong className="text-ink">¥45,820</strong></Callout>

        <H>为什么能做到这个量</H>
        <Steps
          items={[
            { title: "S 级独家", body: "Mira 默认推送 S 级供给到 Top 20 制作方的精选库,曝光优先级高。" },
            { title: "套餐捆绑", body: "yuri 被打包进职场包一起售卖,套餐买家直接锁定全部 3 张脸。" },
            { title: "分账长尾", body: "短剧上线后 30 天内分账;部分剧二次发行(海外 / 港澳台)还能持续 90 天分账。" },
          ]}
        />

        <H>yuhan 的角色</H>
        <P>
          yuhan 本人在这 90 天里没拍过一次戏。她只在 Mira 平台做了三件事:1)上传第二轮训练视频 4 段;2)拒绝 2 单不符合人设的剧本;3)对所有签约剧本做一次性 OK 签字。时间投入: 每月不到 4 小时。
        </P>
        <Quote>
          以前我以为自己是个博主,后来发现我是个 IP。Mira 让我意识到一张脸可以变成像音乐版权一样的资产。
        </Quote>
      </>
    ),
  },
  {
    slug: "4k-capture-sop",
    title: "4K 视频采集 SOP:从光线到打码,达标率 95% 的拍法",
    excerpt:
      "脸资产化的瓶颈不在模型,在素材。把训练素材的标准提前定死,生成阶段的成片率从 60% 拉到 95%。",
    category: "技术",
    author: "Mira 技术工程 · 视觉组",
    publishedAt: "2026-03-28",
    readingMin: 7,
    hero: "linear-gradient(135deg,#0EA5E9 0%,#6E59F6 100%)",
    tags: ["SOP", "拍摄", "训练"],
    body: () => (
      <>
        <P>
          我们把过去 6 个月入库的 412 张脸的素材合规率做了一个分布:60% 一次过、25% 需要补拍一轮、15% 直接退回。退回主因前三:光线不均(40%)、表情样本不足(25%)、有未授权第三方出现在背景(18%)。
        </P>
        <P>本文是 Mira 视觉组提炼出的「3-小时,1-地点,1-台机」拍摄 SOP。任何中腰部 KOC 在不增加设备投入的前提下可以执行。</P>

        <H>一、设备:别上贵的,稳定就好</H>
        <UL
          items={[
            "推荐 iPhone 15 Pro 或更高 · ProRes 4K 60fps · 30 mm 等效焦段",
            "光源 = 自然光 + 1 个 60W 柔光灯。柔光灯放置在 45 度斜上方,色温 5500K",
            "三脚架 + 防抖云台。手持必然抖,模型会学到抖动",
          ]}
        />

        <H>二、采集清单(15 段共 18 分钟)</H>
        <Table
          head={["分段", "时长", "要点"]}
          rows={[
            ["正面静态", "30s", "直视镜头,微微微笑,不说话"],
            ["侧脸 30°/45°/60°/90°", "4 min", "左右各一次"],
            ["仰俯角 ±15°", "1 min", "缓慢过渡"],
            ["口播段", "3 min", "中文,情绪平稳"],
            ["情绪样本", "3 min", "高兴/难过/惊讶/愤怒/沉思/严肃"],
            ["微表情", "2 min", "眨眼/抿嘴/笑出酒窝/撇嘴"],
            ["遮挡测试", "30s", "手或物体遮住部分面部"],
            ["运动样本", "3 min", "走动/转头/抬手"],
            ["服化样本", "1 min × N", "不同妆容 / 发型(可选)"],
          ]}
        />

        <H>三、环境合规</H>
        <Callout tone="warn" title="禁忌">
          背景出现品牌 logo、有版权美术作品(画 / 雕塑)、未授权第三方人脸 — 三者中任一项即退回。
        </Callout>
        <UL
          items={[
            "推荐:纯色背景墙(灰 / 米白 / 深蓝)或绿幕",
            "禁止户外拍摄。户外光线不可控,且容易拍进路人",
          ]}
        />

        <H>四、上传前的脱敏处理</H>
        <P>
          把每段素材的元数据(GPS / 设备 / 拍摄时间)去掉。Mira 的上传页面会自动剥离,但建议本地先做。如果素材里有家人意外入镜,务必本地剪掉。
        </P>

        <H>五、达标率提升</H>
        <P>按本 SOP 拍摄,首次入库通过率从 60% 提升到 95%。重拍成本从平均 1.8 次降到 1.05 次。</P>
        <Callout>
          不确定的话,先用手机自拍 1 分钟样片,通过 Mira 的「素材自检工具」预审。
        </Callout>
      </>
    ),
  },
  {
    slug: "right-to-be-forgotten-takedown",
    title: "被遗忘权落地:创作者怎么让自己的脸全网下架",
    excerpt:
      "签约容易撤约难,这是肖像授权最大的痛点。Mira 把被遗忘权拆成 4 步,24 小时内全网生效。",
    category: "法律",
    author: "Mira 法务团队",
    publishedAt: "2026-04-05",
    readingMin: 8,
    hero: "linear-gradient(135deg,#1E1B4B 0%,#6E59F6 100%)",
    tags: ["被遗忘权", "合规", "下架"],
    body: () => (
      <>
        <Quote>
          我的脸被授权出去之后,如果有一天想撤回,该怎么办? — 这是 Mira 用户调研里出现频率最高的问题。
        </Quote>
        <P>
          《民法典》第 1022 条规定:肖像权人有权随时解除当事人未约定肖像使用期限或者约定期限不明确的合同。Mira 把这条法律落地成 4 个步骤,24 小时内全网生效。
        </P>

        <Steps
          items={[
            {
              title: "创作者后台发起申请",
              body: "进入「我的形象 → 申请下架」,填写理由。Mira 不审查理由内容,只要求长度 > 5 字符,以避免误点。提交后该形象状态切换为 review。",
            },
            {
              title: "平台审核(24h)",
              body: "审核团队检查:1)申请人确实是脸的所有人;2)没有未结清纠纷;3)没有正在被仲裁的诉讼。三条都通过 → 批准。",
            },
            {
              title: "链上留痕 + 跨渠道下架",
              body: "下架决定写入区块链:talentSnapshot + reason + approvedAt + chainRecordId。同时触发跨渠道通知(红果 / 抖音 / 快手 / 视频号)24 小时内停止后续推送。",
            },
            {
              title: "创作者收益结算",
              body: "已签订单按原合同结算到合同自然到期。创作者可下载完整流水作为下架前最后一笔结算单。",
            },
          ]}
        />

        <H>FAQ 常见疑问</H>
        <Table
          head={["问题", "回答"]}
          rows={[
            ["已签订单能撤回吗", "不能(法律上不构成未约定期限),但可与制作方协商终止"],
            ["下架后还能再上架吗", "可以,需要重新走 KYC"],
            ["数据会不会留在服务器", "chainRecord 留,训练素材 90 天内移除"],
            ["有人继续盗用怎么办", "Mira 法务团队发律师函,严重情形公安机关介入"],
            ["独家合约反悔违约金多少", "默认 1 个月平均分账"],
          ]}
        />

        <Quote>
          把脸授权出去,本质上是一种深度的信任行为。Mira 把这种信任结构化成 4 步流程 + 24 小时 SLA,既是合规,也是对创作者的承诺。
        </Quote>
      </>
    ),
  },
  {
    slug: "mcn-x-mira-shift",
    title: "MCN × Mira:从带货返佣到肖像版税分账的模式跃迁",
    excerpt:
      "传统 MCN 抽 KOC 带货 GMV 的 20-40%,模型脆弱。Mira 把 MCN 抽成嵌入到分账层,KOC 永远在抽水,但抽得更轻更细水长流。",
    category: "产业",
    author: "Mira BD · 行业生态",
    publishedAt: "2026-05-15",
    readingMin: 9,
    hero: "linear-gradient(135deg,#5340D9 0%,#1E1B4B 100%)",
    tags: ["MCN", "经纪", "模式"],
    body: () => (
      <>
        <StatRow
          stats={[
            { value: "3.7 万", label: "国内 MCN 总量" },
            { value: "81%", label: "微利或亏损" },
            { value: "< 18 月", label: "KOC 平均签约时长" },
            { value: "20–40%", label: "传统抽成区间" },
          ]}
        />

        <H>传统 MCN 的瓶颈</H>
        <P>
          传统模式下,MCN 给 KOC 提供开号指导、对接广告主、剪辑代写、招商招租,换来 20-40% 广告分润 + 15-30% 带货分润。瓶颈在于 KOC 的脸 / 内容 / 流量都是 KOC 本人,一旦解约,MCN 价值归零。
        </P>

        <H>Mira 模式:抽成嵌入分账</H>
        <P>
          Mira 给 MCN 设计了 /mcn/creators/invite。MCN 邀请 KOC 上链,设定一个抽成百分比(默认 15%)。
        </P>
        <UL
          items={[
            "KOC 接到一单 ¥1,200 + 6% 分账",
            "结算后,Mira 自动把 KOC 应得部分的 15% 划到 MCN 账户",
            "MCN 永远在抽水,但抽的是数字脸的版税,不是 KOC 本人的劳务",
          ]}
        />

        <H>案例:寒拾文化</H>
        <P>
          寒拾是杭州一家中型 MCN,签约 80 位中腰部 KOC。2026 Q1 把 12 位顶部 KOC 引入 Mira,平均每位的 Mira 月分账 ¥1.2 – 3 万,寒拾抽 15% = ¥1.8K – 4.5K / 位 / 月。
        </P>
        <Callout>
          12 位累计 / 月 ≈ <strong className="text-ink">¥3.6 万</strong>,90% 毛利。相当于他们做带货 GMV ¥1,500 万 的净利。
        </Callout>

        <H>对 KOC 的好处</H>
        <P>
          KOC 本人完全可见 MCN 抽走了多少。Mira 把每一笔分账拆成两条:KOC 净收入、MCN 抽成。这种透明度极大降低了「我被剥削」的感觉。KOC 离开 MCN 不会丢脸资产,Mira 默认脸的版权归 KOC。
        </P>

        <H>未来:MCN 的代际更替</H>
        <Steps
          items={[
            { title: "上半部:转型 AI 演员经纪公司", body: "旗下不是真人而是数字脸资产组合,服务于影视 / 出海 / 品牌。" },
            { title: "下半部:回归内容工厂", body: "做剪辑 / 投放 / 选品,放弃 KOC 经纪。" },
          ]}
        />
        <Quote>
          AI 演员不是替代 MCN,而是给 MCN 提供「数字时代的版权抽成模型」。在这个模型里,KOC 是合伙人、MCN 是版税代理、平台是交易所。
        </Quote>
      </>
    ),
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function neighbors(slug: string): { prev?: Article; next?: Article } {
  const i = ARTICLES.findIndex((a) => a.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? ARTICLES[i - 1] : undefined,
    next: i < ARTICLES.length - 1 ? ARTICLES[i + 1] : undefined,
  };
}

export function listByCategory(c: ArticleCategory | null): Article[] {
  return c ? ARTICLES.filter((a) => a.category === c) : ARTICLES;
}

export function categoryCount(c: ArticleCategory): number {
  return ARTICLES.filter((a) => a.category === c).length;
}

export const ARTICLE_CATEGORIES = CATEGORIES;

export function featuredArticles(n = 3): Article[] {
  // simple "latest first" pick
  return [...ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, n);
}
