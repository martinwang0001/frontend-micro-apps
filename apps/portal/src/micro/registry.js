/**
 * 子应用注册表
 * ---------------------------------------------------------------
 * 【企业级实践】注册表是唯一事实来源,菜单、路由、qiankun 注册、聚合页
 * 全部从该表派生;新增子应用时只需在此追加一条记录 + 新建应用目录。
 *
 * 字段说明:
 *  - name        应用名,必须与子应用 vite.config 中 qiankun(appName) 一致
 *  - entry       子应用入口(开发环境为各 vite dev server;生产环境为独立部署地址)
 *  - activeRule  路由挂载规则(前缀匹配)
 *  - title       展示名
 *  - tech        技术栈标注
 *  - sandbox     沙箱配置(样式隔离策略按应用粒度定制,见各注释)
 *  - widget      是否支持以 ID 容器方式被聚合页手动挂载(loadMicroApp + widgetMode)
 */

/** 开发环境各应用端口(各 vite dev server) */
const DEV_ENTRIES = {
  vue2User: '//localhost:8081',
  vue2Order: '//localhost:8082',
  vue3Dashboard: '//localhost:8083',
  vue3Report: '//localhost:8084',
  reactMall: '//localhost:8085',
  reactCms: '//localhost:8086',
  svelteMonitor: '//localhost:8087',
  svelteLog: '//localhost:8088'
}

/**
 * 【合并部署模式】(方案 A:单域名静态托管)
 * scripts/merge-dist.mjs 构建基座时注入 VITE_DEPLOY=merge 与
 * VITE_MERGE_BASE(站点根前缀),此时 ENTRIES 使用站点内相对路径:
 * 子应用与基座同源 → qiankun fetch 不跨域,彻底免除 CORS 配置。
 * 独立域名部署(方案 B)时不注入该变量,仍走 DEV_ENTRIES 或手工替换。
 */
const MERGE_DEPLOY = import.meta.env.VITE_DEPLOY === 'merge'
const MERGE_BASE = import.meta.env.VITE_MERGE_BASE || '/'
const MERGED_ENTRIES = {
  vue2User: `${MERGE_BASE}subapps/app-vue2-user/`,
  vue2Order: `${MERGE_BASE}subapps/app-vue2-order/`,
  vue3Dashboard: `${MERGE_BASE}subapps/app-vue3-dashboard/`,
  vue3Report: `${MERGE_BASE}subapps/app-vue3-report/`,
  reactMall: `${MERGE_BASE}subapps/app-react-mall/`,
  reactCms: `${MERGE_BASE}subapps/app-react-cms/`,
  svelteMonitor: `${MERGE_BASE}subapps/app-svelte-monitor/`,
  svelteLog: `${MERGE_BASE}subapps/app-svelte-log/`
}

/** 构建期分流:合并部署用相对路径,开发/独立部署用端口地址 */
const ENTRIES = MERGE_DEPLOY ? MERGED_ENTRIES : DEV_ENTRIES

export const microApps = [
  {
    name: 'app-vue2-user',
    entry: ENTRIES.vue2User,
    activeRule: '/app-vue2-user',
    title: '用户中心',
    tech: 'Vue 2.7 + Vite(老项目)',
    // 老项目样式债务多:开启 scoped 样式隔离(给所有选择器加属性前缀)
    sandbox: { experimentalStyleIsolation: true },
    widget: false
  },
  {
    name: 'app-vue2-order',
    entry: ENTRIES.vue2Order,
    activeRule: '/app-vue2-order',
    title: '订单管理',
    tech: 'Vue 2.7 + Vite(老项目)',
    sandbox: { experimentalStyleIsolation: true },
    widget: false
  },
  {
    name: 'app-vue3-dashboard',
    entry: ENTRIES.vue3Dashboard,
    activeRule: '/app-vue3-dashboard',
    title: '数据看板',
    tech: 'Vue 3 + Vite',
    sandbox: { experimentalStyleIsolation: true },
    widget: true
  },
  {
    name: 'app-vue3-report',
    entry: ENTRIES.vue3Report,
    activeRule: '/app-vue3-report',
    title: '报表中心',
    tech: 'Vue 3 + Vite + Pinia',
    sandbox: { experimentalStyleIsolation: true },
    widget: true
  },
  {
    name: 'app-react-mall',
    entry: ENTRIES.reactMall,
    activeRule: '/app-react-mall',
    title: '积分商城',
    tech: 'React 18 + Vite + CSS Modules',
    sandbox: { experimentalStyleIsolation: true },
    widget: false
  },
  {
    name: 'app-react-cms',
    entry: ENTRIES.reactCms,
    activeRule: '/app-react-cms',
    title: '内容管理',
    tech: 'React 18 + Vite',
    // 演示最严格的 Shadow DOM 隔离:JS 与 CSS 双重隔离,但第三方弹窗类库需注意挂载点
    sandbox: { strictStyleIsolation: true },
    widget: true
  },
  {
    name: 'app-svelte-monitor',
    entry: ENTRIES.svelteMonitor,
    activeRule: '/app-svelte-monitor',
    title: '监控告警',
    tech: 'Svelte 4 + Vite',
    sandbox: { experimentalStyleIsolation: true },
    widget: true
  },
  {
    name: 'app-svelte-log',
    entry: ENTRIES.svelteLog,
    activeRule: '/app-svelte-log',
    title: '日志中心',
    tech: 'Svelte 4 + Vite',
    sandbox: { experimentalStyleIsolation: true },
    widget: false
  }
]

/** 供聚合页使用的可 widget 化应用 */
export const widgetApps = microApps.filter((app) => app.widget)
