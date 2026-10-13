# 企业级微前端整合样板

> **qiankun + npm workspaces monorepo**，8 个子应用（Vue2 / Vue3+Vite / React / Svelte），完整覆盖沙箱隔离、跨应用通信、样式污染治理、路由冲突修复等企业级微前端核心命题。

---

## 为什么需要这个项目？

微前端不是"选一个框架装上就完事"——它是一组**工程决策**：

- 老项目（Vue2）和新项目（Vue3/React/Svelte）如何共存？
- 全局 CSS 怎么互相不干扰？标签选择器穿透 scoped 隔离怎么办？
- 子应用路由和基座路由共享 `history` API 导致导航卡死怎么修？
- Shadow DOM 隔离下 Vite dev 模式样式丢失怎么补？
- 跨应用数据怎么传？Store 怎么共享？事件怎么发？

本项目用 **8 个真实可运行的子应用**回答了以上全部问题，每个坑点都有**可复现的对照实验**和**带注释的修复代码**。

---

## 架构概览

```
frontend-micro-apps/                  # npm workspaces monorepo
├── apps/
│   ├── portal/                       # 基座(主应用) · Vue3 + Vite · :8000
│   │   └── src/micro/
│   │       ├── registry.js           # 子应用注册表(唯一事实来源)
│   │       ├── setup.js              # qiankun 装配(start / registerMicroApps)
│   │       └── instances.js          # 共享 Store + 事件总线(唯一实例)
│   ├── app-vue2-user/                # 用户中心   · Vue2.7 + Vite · :8081
│   ├── app-vue2-order/               # 订单管理   · Vue2.7 + Vite · :8082
│   ├── app-vue3-dashboard/          # 数据看板   · Vue3 + Vite   · :8083
│   ├── app-vue3-report/              # 报表中心   · Vue3 + Vite   · :8084
│   ├── app-react-mall/               # 积分商城   · React18 + Vite · :8085
│   ├── app-react-cms/                # 内容管理   · React18 + Vite · :8086
│   ├── app-svelte-monitor/           # 监控告警   · Svelte4 + Vite · :8087
│   └── app-svelte-log/               # 日志中心   · Svelte4 + Vite · :8088
├── packages/
│   └── shared/                       # 框架无关共享包
│       ├── store/                    #   全局 Store(框架无关,九端同步)
│       ├── event-bus/                #   事件总线(发布订阅)
│       ├── adapters/                 #   四框架适配器(Vue2/Vue3/React/Svelte)
│       └── constants/                #   Token / 事件名 / 全局状态键
├── scripts/
│   └── merge-dist.mjs                # 合并部署构建脚本(单域名方案 A)
├── deploy/
│   └── _headers                      # Cloudflare Pages 响应头(缓存策略)
├── .github/workflows/
│   └── deploy.yml                    # CI/CD:push 自动部署到 Cloudflare Pages
└── package.json                      # workspaces 根配置(npm workspaces)
```

---

## 8 个子应用一览

| 应用 | 技术栈 | 端口 | 挂载方式 | 沙箱策略 | 演示坑点 |
|---|---|---|---|---|---|
| 用户中心 | Vue 2.7 + Vite | 8081 | 路由 | scoped | 老项目 `window.LEGACY_GLOBAL` + filters + Options API |
| 订单管理 | Vue 2.7 + Vite | 8082 | 路由 | scoped | Vue2 老项目表格 + 全局 mixin |
| 数据看板 | Vue 3 + Vite | 8083 | 路由 + Widget | scoped | 双模式路由(history/memory) |
| 报表中心 | Vue 3 + Vite + Pinia | 8084 | 路由 + Widget | scoped | 本地 Pinia vs 共享 Store 边界 |
| 积分商城 | React 18 + Vite + CSS Modules | 8085 | 路由 | scoped | CSS Modules 编译期隔离 |
| 内容管理 | React 18 + Vite | 8086 | 路由 + Widget | **Shadow DOM** | Shadow DOM + Vite 样式同步 |
| 监控告警 | Svelte 4 + Vite | 8087 | 路由 + Widget | scoped | 定时器清理(onDestroy) |
| 日志中心 | Svelte 4 + Vite | 8088 | 路由 | scoped | 手动订阅退订 + 日志总线消费 |

---

## 核心特性

### 1. 双轨制样式隔离

| 隔离方式 | 适用应用 | 原理 | 局限 |
|---|---|---|---|
| `experimentalStyleIsolation` (scoped) | 7 个普通应用 | 给子应用 CSS 选择器加 `div[data-qiankun]` 前缀 | **挡不住全局标签选择器穿透**（`p`/`h1`/`a` + `!important`） |
| `strictStyleIsolation` (Shadow DOM) | react-cms | 子应用整体挂载进 Shadow DOM，内外样式完全互不可见 | **Vite dev 模式 CSS 注入到 `document.head`，Shadow DOM 内看不到** |

**对照实验**：样式隔离实验室页面（`/app-style-lab`）提供一键注入/移除污染样式按钮，可直观对比两种隔离效果。

### 2. 三种跨应用通信机制

| 机制 | 原理 | 适用场景 |
|---|---|---|
| **共享 Store**（机制①） | 框架无关的全局状态对象，通过 qiankun `props` 下发 | 购物车角标、主题、用户信息、消息中心 |
| **qiankun GlobalState**（机制②） | `initGlobalState` / `setGlobalState` / `onGlobalStateChange` | 小而关键的双向同步字段（主题、在线数） |
| **事件总线**（机制③） | 发布订阅模式，`eventBus.emit` / `eventBus.on` | 一次性通知（`NOTIFY`）、日志写入（`LOG_WRITE`）、购物车同步（`CART_SYNC`） |

### 3. 路由模式分流

| 环境 | Vue3 (vue-router 4) | Vue2 (vue-router 3) | React (react-router 6) |
|---|---|---|---|
| **qiankun 模式** | `createMemoryHistory()` | `mode: 'abstract'` + 手动 `push('/')` | `<MemoryRouter>` |
| standalone 模式 | `createWebHistory('/')` | `mode: 'history'` | `<BrowserRouter>` |

**为什么不用 web history？** 两个 router 实例共享 `history.pushState/replaceState` 和 `history.state`，互相覆盖导致 `SecurityError: replaceState` + 基座侧边栏导航间歇性卡死。

### 4. 双挂载模式

- **路由挂载**（`registerMicroApps`）：基座侧边栏切换应用，URL 反映当前应用
- **ID 容器挂载**（`loadMicroApp`）：聚合页（`/app-aggregate`）同时展示多个子应用 Widget

---

## 坑点清单（12 条实战经验）

每条坑点在代码中都有**详细注释**和**可复现的修复方案**：

| # | 坑点 | 修复方案 | 代码位置 |
|---|---|---|---|
| 1 | **registerMicroApps 不读应用级 sandbox 字段**（只读 `start()` 全局配置） | 全局 `start({ sandbox })` 给多数应用 scoped 隔离；Shadow DOM 应用用 `loadMicroApp` 手动加载 | `setup.js` + `SubappView.vue` |
| 2 | **全局标签选择器穿透 scoped 隔离**（`p { color: red !important }`） | 用 `strictStyleIsolation`(Shadow DOM) 阻断；scoped 只防"泄漏"不防"灌入" | `StyleLabView.vue` 污染对照实验 |
| 3 | **Shadow DOM 下 Vite dev 模式样式丢失** | `MutationObserver` 监听 `document.head` 新增 `<style>`，按 `data-vite-dev-id` 过滤后克隆到 Shadow DOM | `app-react-cms/src/main.jsx` |
| 4 | **子应用 router 与基座共享 history API → 导航卡死** | qiankun 模式下子应用一律用 memory/abstract 路由，不操作 `history` | 各子应用 `main.js` 路由模式分流 |
| 5 | **Vue2 abstract 模式不触发首次路由** | 手动 `router.push('/')` 初始化导航 | `app-vue2-user/main.js` |
| 6 | **React plugin-react 注入的 `react-refresh` 前导脚本被 qiankun eval 报 SyntaxError** | `server.hmr: false` 触发插件 `skipFastRefresh` | 各 React 子应用 `vite.config.js` |
| 7 | **`loadMicroApp` 并行挂载多个 widget 时 `vite-plugin-qiankun` 全局插槽竞争** | 按 `mountPromise` 串行挂载 | `WidgetHubView.vue` |
| 8 | **模块多实例（各应用各自 new store 互不相通）** | 主应用创建唯一实例，qiankun `props` 下发 | `instances.js` → `setup.js` |
| 9 | **路由 base 冲突（history 模式 404）** | qiankun 模式 `base=activeRule`；widget 模式用 memory 路由 | 各子应用 `main.js` |
| 10 | **定时器/监听器泄漏（反复挂载叠加）** | `unmount` 统一清理；适配器自动退订；注意 vue-router 4 **没有 `router.destroy()`**，误调会导致应用被标记 dead 无法再挂载 | 各应用 `unmount` + `@micro/shared` 适配器 |
| 11 | **Shadow DOM 内弹窗类库挂载点丢失** | `createPortal` 指定 `container` 为 Shadow DOM 内元素 | `app-react-cms` 组件 |
| 12 | **CSS 变量（自定义属性）互相覆盖** | 变量挂应用根类（非 `:root`），各应用独立命名空间 | 各应用 `styles/index.css` |

---

## 快速开始

### 环境要求

- **Node.js ≥ 18**（推荐 20 LTS）
- **npm ≥ 9**（workspaces 需要）

### 一键启动

```bash
# 1. 克隆项目
git clone <repo-url>
cd frontend-micro-apps

# 2. 安装依赖（自动为所有 workspace 安装）
npm install

# 3. 一键启动全部 9 个服务（基座 + 8 个子应用）
npm run dev
```

启动完成后访问 **http://localhost:8000/** 即可。

### 端口分配

| 服务 | 端口 |
|---|---|
| 基座 (portal) | 8000 |
| app-vue2-user | 8081 |
| app-vue2-order | 8082 |
| app-vue3-dashboard | 8083 |
| app-vue3-report | 8084 |
| app-react-mall | 8085 |
| app-react-cms | 8086 |
| app-svelte-monitor | 8087 |
| app-svelte-log | 8088 |

### 单独启动某个子应用

```bash
npm run dev:vue3-dashboard    # 只启动数据看板
npm run dev:react-cms         # 只启动内容管理
```

子应用独立运行时（非 qiankun 环境）会自动用 `web history` 路由 + `BrowserRouter`，可直接访问 `http://localhost:8083/` 开发调试。

---

## 功能导览

| 页面 | 路由 | 看什么 |
|---|---|---|
| **首页/架构总览** | `/` | 子应用注册表、沙箱配置、坑点清单 |
| **通信实验室** | `/app-comm` | 三种通信机制对比（Store / GlobalState / 事件总线） |
| **样式隔离实验室** | `/app-style-lab` | 污染对照实验（注入/移除全局 `p` 样式，对比 scoped vs Shadow DOM） |
| **聚合页** | `/app-aggregate` | 5 个子应用 Widget 同屏展示（`loadMicroApp` + 串行挂载） |
| **数据看板** | `/app-vue3-dashboard` | Vue3 子应用内部导航 + 通信演示 |
| **内容管理** | `/app-react-cms` | Shadow DOM 隔离 + Vite 样式同步修复 |
| ... | `/app-*` | 其余子应用各有通信演示 + 样式演示 |

---

## 共享包 `@micro/shared`

框架无关的共享逻辑，通过 npm workspaces 被所有子应用引用：

```
packages/shared/
├── src/
│   ├── store/              # 全局 Store（框架无关状态管理）
│   │   └── index.js        #   createAppStore() → { state, actions, subscribe }
│   ├── event-bus/          # 事件总线（发布订阅）
│   │   └── index.js        #   createEventBus() → { on, off, emit }
│   ├── adapters/           # 四框架适配器（自动退订/清理）
│   │   ├── vue2.js         #   Vue2: new Vue({ data, computed, beforeDestroy })
│   │   ├── vue3.js         #   Vue3: reactive() + onScopeDispose()
│   │   ├── react.js        #   React: useSyncExternalStore()
│   │   └── svelte.js       #   Svelte: writable() + onDestroy()
│   └── constants/          # Token / 事件名 / 全局状态键
│       └── index.js        #   GLOBAL_STATE_KEYS / GLOBAL_EVENTS / TOKENS
└── package.json
```

### 适配器设计

每种框架对"响应式状态"和"生命周期清理"的实现不同，适配器抹平差异：

```js
// 子应用中使用（以 Vue3 为例）
import { createVue3Adapter } from '@micro/shared/adapters/vue3'

const store = useSharedStore()    // 从 qiankun props 获取
const { state, actions } = createVue3Adapter(store)

// state 是响应式的，模板中自动更新
// 组件卸载时自动退订，无需手动清理
```

---

## 部署指南

### 生产构建

```bash
# 构建全部 9 个应用
npm run build

# 各应用产物在各自 dist/ 目录下
# apps/portal/dist/          ← 基座
# apps/app-vue2-user/dist/   ← 子应用
# ...
```

### 免费云端部署（方案 A：合并部署到 Cloudflare Pages）

**单域名、全同源、零 CORS**，一个链接即可体验整个平台，最适合公开演示：

```bash
npm run build:merge     # 构建 9 个应用并合并到 dist-merged/
npm run preview:merge   # 本地预览合并产物(http://localhost:4173)
```

合并产物结构：

```
dist-merged/
├── index.html              # 基座(站点根)
├── assets/                 # 基座资源
├── _headers                # Cloudflare Pages 缓存策略
└── subapps/
    ├── app-vue2-user/      # 子应用按子路径组织
    ├── app-vue3-dashboard/
    └── ...
```

**工作原理**：构建脚本注入 `VITE_DEPLOY=merge`，[registry.js](apps/portal/src/micro/registry.js) 在构建期把子应用 ENTRIES 切换为站点内相对路径（`/subapps/app-xxx/`）；子应用 vite `base` 同步指向各自子路径。基座路由是 `/app-*` 前缀，与 `/subapps/*` 天然隔离，互不冲突。

**上线步骤（全自动 CI/CD）**：

1. Push 本仓库到 GitHub
2. Cloudflare 面板创建 API Token（模板选 `Cloudflare Pages — Edit`），拿到 `Account ID`
3. GitHub 仓库 → Settings → Secrets → Actions 添加 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`
4. 完成 —— 之后每次 push 到 master/main，[.github/workflows/deploy.yml](.github/workflows/deploy.yml) 自动构建并部署到 `https://frontend-micro-apps.pages.dev`

> 免费额度：Cloudflare Pages 带宽与请求不限量、500 次构建/月；`pages.dev` 域名国内可直接访问。
> 若部署到 GitHub Pages 项目站（`/<repo>/` 路径前缀），构建时改用 `MERGE_BASE=/<repo>/ npm run build:merge`。

**替代方式（更简，推荐）—— Cloudflare Workers Git 集成**：新版控制台支持直连 GitHub 构建，无需 Actions 与任何 Secret。填法：

| 表单项 | 填写值 | 说明 |
|---|---|---|
| 构建命令 | `npm run build:merge` | 产物输出到 dist-merged/ |
| 部署命令 | `npx wrangler deploy -c wrangler.jsonc` | **必须带 `-c`**：wrangler 在 monorepo 根目录会触发应用自动检测并报错，显式指定配置即视为"已定位具体项目"，跳过检测 |
| 预览命令 | `npx wrangler versions upload -c wrangler.jsonc` | 同上,非生产分支预览部署 |
| 高级设置 → 路径 | `/` | 保持默认 |

[wrangler.jsonc](wrangler.jsonc) 已内置静态资产目录与 SPA 回退配置；静态资产请求免费不限量，部署地址为 `https://frontend-micro-apps.<账户子域>.workers.dev`。

### 独立部署（方案 B）

每个子应用独立部署到不同域名/CDN，修改 `registry.js` 中的 `ENTRIES` 即可：

```js
const ENTRIES = {
  vue2User: 'https://user.example.com',
  vue2Order: 'https://order.example.com',
  vue3Dashboard: 'https://dash.example.com',
  // ...
}
```

### Nginx 配置示例

```nginx
# 基座
server {
  listen 80;
  server_name portal.example.com;
  root /var/www/portal/dist;
  location / { try_files $uri /index.html; }
}

# 子应用（每个一个 server 或一个 location）
server {
  listen 80;
  server_name user.example.com;
  root /var/www/app-vue2-user/dist;
  location / { try_files $uri /index.html; }
  # 关键:允许跨域被 qiankun fetch
  add_header Access-Control-Allow-Origin *;
  add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
}
```

### 容器化部署

项目内置**一份通用 Dockerfile + docker-compose 编排**，9 个应用（基座 + 8 子应用）共用同一构建流程，通过构建参数差异化：

```
Dockerfile                  # 通用多阶段构建(ARG APP_NAME / NGINX_CONF)
docker-compose.yml          # 9 个容器编排,端口与 registry.js 严格对齐
docker/nginx/portal.conf    # 基座 nginx(SPA 回退 + 静态资源长缓存)
docker/nginx/subapp.conf    # 子应用 nginx(CORS + gzip + 哈希资源强缓存)
.dockerignore               # 构建上下文瘦身
```

**一键容器化启动**：

```bash
npm run docker:build   # 构建全部 9 个镜像(multi-stage:node 构建 → nginx 运行)
npm run docker:up      # 后台启动全部容器
npm run docker:down    # 停止并移除
```

启动后访问 `http://localhost:8000/`，端口映射与本地开发完全一致（8000 / 8081~8088），`registry.js` 无需任何修改。

**关键设计**：

| 设计点 | 说明 |
|---|---|
| 分层缓存 | Dockerfile 先只 COPY 各 workspace 的 `package.json` 再 `npm ci`，源码变更不触发依赖重装 |
| 端口契约 | qiankun 从**浏览器**跨端口 fetch 子应用，所以宿主机发布端口必须等于 `registry.js` 的 ENTRIES 端口 |
| CORS | 子应用 nginx 必须放行跨域（qiankun fetch 入口 HTML 的硬性要求），见 `subapp.conf` |
| 缓存策略 | `/assets/` 哈希资源 `immutable` 一年强缓存；入口 HTML `no-cache` 保证发版即时生效 |
| 端口可调 | 宿主机端口通过环境变量覆盖（如 `VUE2_USER_PORT=9081 docker compose up`），容器内恒为 80 |

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 微前端框架 | qiankun 2.x |
| Monorepo | npm workspaces |
| 基座 | Vue 3 + Vue Router 4 + Pinia + Vite |
| 子应用 - Vue2 | Vue 2.7 + Vue Router 3 + Vite |
| 子应用 - Vue3 | Vue 3 + Vue Router 4 + Vite |
| 子应用 - React | React 18 + React Router 6 + Vite |
| 子应用 - Svelte | Svelte 4 + Vite |
| 共享包 | 框架无关（纯 JS） |

---

## 项目约定

### 注释规范

- 所有代码注释使用**中文**，注释占比 ≥ 1/3
- 每个坑点修复处标注 `【坑点】` 或 `【关键坑点修复】` 前缀，附详细原因分析
- 公共函数 / 适配器接口写 JSDoc

### 新增子应用

1. 在 `apps/` 下新建目录，用 `npm init -w apps/app-xxx` 初始化
2. 配置 `vite.config.js`（参考现有子应用，注意 `qiankun()` 插件 + `server.hmr: false`）
3. 在 `registry.js` 追加一条注册记录
4. 完成 —— 菜单、路由、qiankun 注册自动生效

---

## License

MIT
