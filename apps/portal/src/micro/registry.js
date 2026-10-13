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

/** 开发环境各应用端口;生产部署时替换为真实 CDN/域名即可 */
const ENTRIES = {
  vue2User: '//localhost:8081',
  vue2Order: '//localhost:8082',
  vue3Dashboard: '//localhost:8083',
  vue3Report: '//localhost:8084',
  reactMall: '//localhost:8085',
  reactCms: '//localhost:8086',
  svelteMonitor: '//localhost:8087',
  svelteLog: '//localhost:8088'
}

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
