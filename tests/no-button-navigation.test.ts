// 链接导航约定守卫:站内"可点即跳 URL"的元素必须是真 <a> / next <Link>(带 href),
// 禁在 onClick 里直接 router.push / router.replace 当导航 —— 否则鼠标中键 / Ctrl 点
// 开新标签页失效,复制链接 / SEO / 爬虫可达全丢。约定见仓库根 CLAUDE.md「链接支持中键新开」。
//
// 三层防御:① 写入即拦 (~/.claude/hooks/block-button-navigation.ps1, PreToolUse) ② 本测试
// (CI deploy.yml build 前跑 pnpm test,任何来源的最终兜底) ③ 人工 review。与 cuberoot.me
// 的 packages/client-next/tests/no-button-navigation.test.ts 同语义,便于以后同步。
//
// 合理例外(提交后程序化重定向、disabled 门控的动作、纯动作按钮、已是真 <a href> 的
// 渐进增强)走 ALLOWLIST,每条带理由。
//
// 限制:只抓字面量 onClick={ ... router.push/replace( ... };经命名函数 (logout/submit 等)
// 间接调 router.push 抓不到 —— 那类多是 POST 后程序化重定向 / 表单提交,属合理例外。
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, relative, sep } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // 仓库根
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];

// 相对仓库根的 posix 路径 → 豁免。当前为空:无文件命中下方正则。
// 已审阅的合理例外(均经命名函数间接跳转,不被正则捕获,无需入表):
//   - components/SiteHeader.tsx       登出是 POST mutation,fetch 后 router.push("/") 程序化重定向
//   - components/CommandPalette.tsx   搜索表单 onSubmit,目标含动态 query,非静态链接
// 若将来出现"字面量 onClick 里 router.push 但确属例外(disabled 门控 / 纯动作按钮)",
// 把相对路径加进本表并写理由。
const ALLOWLIST = new Set<string>([]);

// onClick={ ... router.push( / router.replace( ... } —— [^}]* 跨行匹配到首个 }(单个 handler 内)
const FORBIDDEN = /onClick=\{[^}]*\brouter\s*\.\s*(?:push|replace)\s*\(/;

function safeReaddir(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const ent of safeReaddir(dir)) {
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      out = out.concat(walk(join(dir, ent.name)));
    } else if (/\.tsx$/.test(ent.name) && !/\.test\.tsx?$/.test(ent.name)) {
      out.push(join(dir, ent.name));
    }
  }
  return out;
}

describe('Link navigation convention — no <button> + router.push (use real <a> / next <Link>)', () => {
  const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));

  it('scans a meaningful number of source files', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it('has no onClick router.push/replace navigation outside the allowlist', () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file).split(sep).join('/');
      if (ALLOWLIST.has(rel)) continue;
      const src = readFileSync(file, 'utf8');
      if (FORBIDDEN.test(src)) violations.push(rel);
    }
    expect(
      violations,
      '站内导航请用真 <a> / next <Link>(带 href),勿在 onClick 里 router.push/replace 当跳转\n' +
        '(否则中键 / Ctrl 点开新标签页失效)。若确属例外(提交后程序化重定向 / disabled 门控 /\n' +
        '纯动作按钮 / 已是真 <a href> 渐进增强),把文件加进本测试 ALLOWLIST 并写理由。\n' +
        '命中:\n' +
        violations.join('\n'),
    ).toEqual([]);
  });
});
