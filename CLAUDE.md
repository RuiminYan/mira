# CLAUDE.md — Mira 镜界

AIGC 数字资产 + AI 人脸授权平台原型。Next.js 16 + React 19 + TS + Tailwind v4 + SQLite(better-sqlite3)+ drizzle-orm + cookie session。四端:创作者 / 制作方 / MCN / 管理员。中文为主,i18n 简中+英文。

## 运行
- dev:`pnpm dev` → http://127.0.0.1:3200(host/port 固定,勿改)。
- pnpm 起不来时直接 `node_modules\.bin\next dev -H 127.0.0.1 -p 3200`。
- 不要 `pnpm install`,除非 `pnpm-lock.yaml` / `package.json` 变动。
- 不引入外部 CDN / 第三方 API / 远程字体图标;站点自成一体。

## 数据库
- `data.db`(已 gitignore,勿提交);改 schema 后 `pnpm db:generate` → `pnpm db:migrate`。
- 重建演示数据 `pnpm db:seed`;dev API key 明文落 `.tmp/dev-keys.txt`(勿提交)。

## 校验
- typecheck 用 tsgo:`pnpm typecheck`;纯 CSS / 文本 / 注释改动跳过。
- 冒烟:`pnpm smoke`(改 route / server action / API 后跑)。

## 约定
- 区块链存证 / 支付 / AI 生成 / webhook 投递全为模拟,勿接真服务。
- Server Action 表单返回 `void`,错误走 redirect `?err=`。
- 图表自绘,无 markdown 库,文章正文用 JSX。
- 提交只 add 自己改的文件,先 `git status` 看别人改动;远端 `RuiminYan/mira`(public)。
