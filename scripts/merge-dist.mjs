/**
 * 合并部署构建脚本(方案 A:单域名静态托管)
 * ===============================================================
 * 【用途】把基座 + 8 个子应用构建到同一个 dist,按子路径组织:
 *
 *   dist-merged/
 *   ├── index.html              # 基座(部署在站点根)
 *   ├── assets/                 # 基座静态资源
 *   ├── _headers                # Cloudflare Pages 自定义响应头(缓存策略)
 *   └── subapps/
 *       ├── app-vue2-user/      # 子应用各自独立目录
 *       ├── app-vue2-order/
 *       └── ...
 *
 * 【为什么这样做】
 *   1. 全程同源(基座与子应用在同一域名下)→ qiankun fetch 子应用
 *      入口不再跨域,彻底免除 CORS 配置;
 *   2. 子路径互不冲突:子应用目录在 /subapps/* 下,而基座路由是
 *      /app-* 前缀(activeRule),两者天然隔离;
 *   3. 一个链接即可体验整个平台,最适合公开样板项目展示。
 *
 * 【构建时环境变量】
 *   - MERGE_BASE    站点根路径前缀。Cloudflare Pages 根域部署用默认
 *                   '/';若部署到 GitHub Pages 项目站(/<repo>/)则
 *                   设 MERGE_BASE=/<repo>/(脚本会传导给所有 vite base)。
 *   - VITE_DEPLOY=merge / VITE_MERGE_BASE 同步注入给 portal,
 *                   使 registry.js 的 ENTRIES 切换为相对路径模式。
 *   - 各子应用注入 VITE_BASE=<MERGE_BASE>subapps/<name>/,
 *                   使构建产物中的资源引用带上正确前缀。
 *
 * 【用法】
 *   node scripts/merge-dist.mjs          # 默认根路径 '/'
 *   MERGE_BASE=/myrepo/ node scripts/merge-dist.mjs
 *   npm run build:merge                  # package.json 快捷方式
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
/** monorepo 根目录(脚本位于 <root>/scripts/ 下) */
const ROOT = resolve(__dirname, '..')

/** 参与合并部署的子应用目录名(与 apps/ 目录名、registry.js 的 name 一致) */
const SUB_APPS = [
  'app-vue2-user',
  'app-vue2-order',
  'app-vue3-dashboard',
  'app-vue3-report',
  'app-react-mall',
  'app-react-cms',
  'app-svelte-monitor',
  'app-svelte-log'
]

/** 合并产物输出目录(加入 .gitignore,不进版本库) */
const OUTPUT_DIR = join(ROOT, 'dist-merged')

/** Cloudflare Pages 自定义响应头源文件,原样拷入产物根目录 */
const HEADERS_SRC = join(ROOT, 'deploy', '_headers')

/**
 * 归一化部署前缀:保证形如 "/xxx/"(前后都有斜杠)。
 * '/' → '/', 'myrepo' → '/myrepo/', '/myrepo' → '/myrepo/'
 * @param {string} base 用户传入的根路径前缀
 * @returns {string} 归一化后的前缀
 */
function normalizeBase(base) {
  let b = base || '/'
  if (!b.startsWith('/')) b = '/' + b
  if (!b.endsWith('/')) b += '/'
  return b
}

/** 站点根路径前缀(影响所有 vite base 与子应用 entry 路径) */
const MERGE_BASE = normalizeBase(process.env.MERGE_BASE || '/')

/**
 * 执行一个 workspace 的生产构建。
 * 串行构建(而非并行):9 个 vite build 并行对 CI 内存压力过大,
 * 串行总耗时可接受且日志可读性好。
 * @param {string} workspace apps/ 下的应用目录名
 * @param {Record<string,string>} env 附加注入的环境变量
 */
function buildWorkspace(workspace, env = {}) {
  console.log(`\n========== 构建 apps/${workspace} ==========`)
  execSync(`npm run build -w apps/${workspace}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  })
}

/**
 * 递归统计目录体积(仅用于最后的产物报告)。
 * @param {string} dir 目录路径
 * @returns {number} 字节数
 */
function dirSize(dir) {
  let total = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size
  }
  return total
}

/** 字节数格式化为 MB(保留 2 位) */
const fmtMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

// ---------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------

// 1. 构建基座:base 用站点前缀;同时注入 VITE_DEPLOY/VITE_MERGE_BASE,
//    让 registry.js 在构建期把 ENTRIES 切到相对路径模式(同源加载,免 CORS)
buildWorkspace('portal', {
  VITE_BASE: MERGE_BASE,
  VITE_DEPLOY: 'merge',
  VITE_MERGE_BASE: MERGE_BASE
})

// 2. 逐个构建子应用:base 指向各自子路径,
//    如 MERGE_BASE='/' 时 app-vue2-user 的 base 为 '/subapps/app-vue2-user/'
for (const name of SUB_APPS) {
  buildWorkspace(name, {
    VITE_BASE: `${MERGE_BASE}subapps/${name}/`
  })
}

// 3. 清空并重建合并产物目录(避免历史产物残留)
if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true, force: true })
mkdirSync(join(OUTPUT_DIR, 'subapps'), { recursive: true })

// 4. 基座产物平铺到站点根(index.html / assets/ 直接位于根)
cpSync(join(ROOT, 'apps/portal/dist'), OUTPUT_DIR, { recursive: true })

// 5. 各子应用产物拷入 /subapps/<name>/
for (const name of SUB_APPS) {
  cpSync(join(ROOT, 'apps', name, 'dist'), join(OUTPUT_DIR, 'subapps', name), { recursive: true })
}

// 6. 拷入 Cloudflare Pages 响应头配置(存在才拷,其他平台忽略此文件)
if (existsSync(HEADERS_SRC)) {
  cpSync(HEADERS_SRC, join(OUTPUT_DIR, '_headers'))
}

// 7. 产物报告
console.log('\n========== 合并部署构建完成 ==========')
console.log(`部署前缀   : ${MERGE_BASE}`)
console.log(`产物目录   : ${OUTPUT_DIR}`)
console.log(`基座体积   : ${fmtMB(dirSize(OUTPUT_DIR))}(含全部子应用)`)
console.log('\n部署后的访问地址:')
console.log(`  平台首页  : ${MERGE_BASE}`)
for (const name of SUB_APPS) {
  console.log(`  ${name.padEnd(22)} ${MERGE_BASE}subapps/${name}/`)
}
console.log('\n本地预览: npm run preview:merge')
console.log('线上部署: push 到 GitHub → Actions 自动部署到 Cloudflare Pages')
