import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import chalk from 'chalk';

const rootDir = process.cwd();
const WORKSPACE_FILE = join(rootDir, 'pnpm-workspace.yaml');

// 并发请求数量，避免瞬间打爆 registry
const CONCURRENCY = 10;
// 单个请求超时时间(ms)
const TIMEOUT = 15_000;

// 命令行参数
const args = new Set(process.argv.slice(2));
const ONLY_OUTDATED = !args.has('--all'); // 默认只展示可升级的，--all 展示全部
const WANT_JSON = args.has('--json'); // 输出机器可读 JSON

/**
 * 从 registry 读取地址
 * @returns {Promise<string>}
 */
async function resolveRegistry() {
  try {
    const npmrc = await readFile(join(rootDir, '.npmrc'), 'utf8');
    const match = npmrc.match(/^\s*registry\s*=\s*(.+)$/m);
    if (match) return match[1].trim().replace(/\/+$/, '');
  } catch {
    // 忽略，走默认
  }
  return (
    process.env.npm_config_registry?.replace(/\/+$/, '') ||
    'https://registry.npmmirror.com'
  );
}

/**
 * 解析 pnpm-workspace.yaml 中的 catalog 区块
 * 不引入 yaml 依赖，按缩进块手动解析。
 * @param {string} content
 * @returns {Record<string, string>} 包名 -> 版本范围
 */
function parseCatalog(content) {
  const lines = content.split('\n');
  const result = {};
  let inCatalog = false;

  for (const raw of lines) {
    // 去掉行内注释(简单处理，值里若含 # 需要谨慎，这里 catalog 值不含 #)
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // 顶层 key(无缩进)
    const isTopLevel = /^\S/.test(line);
    if (isTopLevel) {
      inCatalog = /^catalog\s*:/.test(line);
      continue;
    }

    if (!inCatalog) continue;

    // catalog 下的条目: 两个空格缩进  'name': version  或  name: version
    const entry = line.match(/^\s+(['"]?)([^'":]+)\1\s*:\s*(.+?)\s*$/);
    if (entry) {
      const name = entry[2].trim();
      let version = entry[3].trim().replaceAll(/^['"]|['"]$/g, '');
      result[name] = version;
    }
  }

  return result;
}

/**
 * 提取版本范围里的基准版本(去掉 ^ ~ >= 等前缀)
 * @param {string} range
 * @returns {string|null}
 */
function baseVersion(range) {
  const m = range.match(/(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return m ? m[1] : null;
}

/**
 * 语义化比较 a<b => -1, a==b => 0, a>b => 1
 * 忽略 prerelease 精细比较，够用即可
 * @param {string} a
 * @param {string} b
 */
function compareVersion(a, b) {
  const pa = a.split('-')[0].split('.').map(Number);
  const pb = b.split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  // 主版本相同，带 prerelease 的视为更小
  const preA = a.includes('-');
  const preB = b.includes('-');
  if (preA && !preB) return -1;
  if (!preA && preB) return 1;
  return 0;
}

/**
 * 取版本的大版本号(major)
 * @param {string} v
 * @returns {number}
 */
function majorOf(v) {
  return Number.parseInt(v.split('.')[0], 10) || 0;
}

/**
 * 是否为稳定版(不含 prerelease 标记)
 * @param {string} v
 */
function isStable(v) {
  return !v.includes('-');
}

/**
 * 从版本列表里取最大的一个
 * @param {string[]} list
 * @returns {string|null}
 */
function maxVersion(list) {
  let best = null;
  for (const v of list) {
    if (best === null || compareVersion(v, best) > 0) best = v;
  }
  return best;
}

/**
 * 拉取单个包在 registry 上的全部已发布版本
 * 使用 npm 精简版 packument(体积远小于完整 metadata)。
 * @param {string} registry
 * @param {string} name
 * @returns {Promise<{name:string, versions:string[], error?:string}>}
 */
async function fetchVersions(registry, name) {
  const url = `${registry}/${name.replace('/', '%2F')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.npm.install-v1+json' },
    });
    if (!res.ok) {
      return { name, versions: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { name, versions: Object.keys(data.versions || {}) };
  } catch (error) {
    return { name, versions: [], error: error.message || String(error) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 分批并发执行
 * @template T
 * @param {T[]} items
 * @param {(item:T)=>Promise<any>} worker
 * @param {number} limit
 */
async function runPool(items, worker, limit) {
  const out = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);

    out.push(...(await Promise.all(batch.map((it) => worker(it)))));
  }
  return out;
}

async function main() {
  const registry = await resolveRegistry();
  const content = await readFile(WORKSPACE_FILE, 'utf8');
  const catalog = parseCatalog(content);
  const names = Object.keys(catalog).sort();

  if (names.length === 0) {
    console.error(
      chalk.red('❌ 未在 pnpm-workspace.yaml 中解析到 catalog 依赖'),
    );
    process.exit(1);
  }

  if (!WANT_JSON) {
    console.log(
      chalk.cyan(
        `🔍 从 ${registry} 检测 ${names.length} 个 catalog 依赖的可升级版本...\n`,
      ),
    );
  }

  const results = await runPool(
    names,
    (name) => fetchVersions(registry, name),
    CONCURRENCY,
  );

  const rows = [];
  for (const { name, versions, error } of results) {
    const range = catalog[name];
    const current = baseVersion(range);

    if (error || versions.length === 0) {
      rows.push({
        name,
        range,
        current,
        minor: null,
        major: null,
        status: 'error',
        error,
      });
      continue;
    }

    // 只考虑稳定版;当前若已是 prerelease 才把 prerelease 纳入候选
    const stable = versions.filter((v) => isStable(v));
    const pool = stable.length > 0 ? stable : versions;

    if (!current) {
      rows.push({
        name,
        range,
        current,
        minor: maxVersion(pool),
        major: null,
        status: 'unknown',
        error,
      });
      continue;
    }

    const curMajor = majorOf(current);
    // 同大版本内的最新次/修订版本(安全升级)
    const minorLatest = maxVersion(pool.filter((v) => majorOf(v) === curMajor));
    // 存在的更高大版本里最新的那个
    const majorLatest = maxVersion(pool.filter((v) => majorOf(v) > curMajor));

    const minor =
      minorLatest && compareVersion(current, minorLatest) < 0
        ? minorLatest
        : null;
    const major = majorLatest || null;

    rows.push({
      name,
      range,
      current,
      minor,
      major,
      status: minor || major ? 'outdated' : 'ok',
      error,
    });
  }

  const outdated = rows.filter((r) => r.status === 'outdated');
  const errored = rows.filter((r) => r.status === 'error');

  if (WANT_JSON) {
    console.log(JSON.stringify({ registry, rows }, null, 2));
    return;
  }

  const shown = ONLY_OUTDATED ? outdated : rows;
  if (shown.length === 0) {
    console.log(chalk.green('✅ 所有 catalog 依赖均已是最新版本'));
  } else {
    const nameW = Math.max(...shown.map((r) => r.name.length), 4);
    const curW = Math.max(...shown.map((r) => (r.range || '').length), 7);
    console.log(
      `  ${'包名'.padEnd(nameW)}  ${'当前范围'.padEnd(curW)}  →  可升级`,
    );
    console.log(
      `  ${'-'.repeat(nameW)}  ${'-'.repeat(curW)}     ${'-'.repeat(10)}`,
    );
    for (const r of shown) {
      const namePad = r.name.padEnd(nameW);
      const rangePad = (r.range || '').padEnd(curW);
      if (r.status === 'error') {
        console.log(
          `  ${chalk.gray(namePad)}  ${chalk.gray(rangePad)}  →  ${chalk.red(`获取失败(${r.error})`)}`,
        );
      } else if (r.status === 'outdated') {
        // 优先展示同大版本内的次/修订升级,有大版本则追加提示
        const parts = [];
        if (r.minor) parts.push(chalk.green(r.minor));
        if (r.major) parts.push(chalk.magenta(`大版本 ${r.major}`));
        console.log(
          `  ${chalk.yellow(namePad)}  ${rangePad}  →  ${parts.join('  ')}`,
        );
      } else {
        console.log(
          `  ${namePad}  ${rangePad}  →  ${chalk.gray('已最新')}`,
        );
      }
    }
  }

  console.log(
    `\n${chalk.cyan('📊 汇总:')} 共 ${rows.length} 个，${chalk.yellow(`可升级 ${outdated.length}`)}，${chalk.red(`获取失败 ${errored.length}`)}`,
  );
  if (ONLY_OUTDATED && outdated.length > 0) {
    console.log(chalk.gray('   (加 --all 查看全部，--json 输出 JSON)'));
  }
}

main().catch((error) => {
  console.error(chalk.red(`💥 执行出错: ${error.stack || error.message}`));
  process.exit(1);
});
