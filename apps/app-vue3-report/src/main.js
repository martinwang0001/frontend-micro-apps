/**
 * 报表中心子应用入口
 * ---------------------------------------------------------------
 * 【qiankun 生命周期接入 —— 所有子应用的统一范式】
 * renderWithQiankun 由 vite-plugin-qiankun 提供,注册 bootstrap/mount/unmount/update;
 * 独立运行(standalone)时不走 qiankun,直接 render() 挂载到本页面 #app。
 *
 * 【两种挂载方式都走这里】
 *   A. 路由挂载:主应用 activeRule 命中 /app-vue3-report 时 mount,props.container 为 null,
 *      此时容器由主应用提供,内部包含本应用 index.html 的 #app 节点;
 *   B. ID 容器挂载(聚合页 loadMicroApp):props.container 指向主应用指定的 div,
 *      且 props.widgetMode = true,此时使用 memory 路由直接落在 /widget 页。
 *
 * 【坑点清单】
 * 1. 路由 base 必须区分:qiankun 模式下 base 为 '/app-vue3-report',
 *    独立运行为 '/',否则路由 404;
 * 2. widgetMode 下不能用 history 路由(URL 是主应用的,子应用改了会互相打架),
 *    必须用 memory 路由;
 * 3. unmount 必须销毁 app 实例并清空副作用,否则内存泄漏;
 * 4. 主应用下发的 store/eventBus 通过 props 拿到后,要放进模块级上下文供各页面使用
 *    (见 shared-context.js,解决模块多实例问题);
 * 5. Pinia 实例也必须每次 mount 时新建并随 app 销毁,不能把 pinia 做成模块级单例,
 *    否则上一次挂载残留的状态会泄漏到下一次挂载(微应用反复进出的高频坑点)。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createAppStore, createEventBus } from '@micro/shared'
import App from './App.vue'
import routes from './router'
import { setSharedContext } from './shared-context'
import './styles/index.css'

/** 当前 Vue 应用实例(unmount 时销毁) */
let app = null
/** 当前路由实例(unmount 后置空,便于 GC) */
let router = null

/**
 * 渲染函数:qiankun mount 与 standalone 启动共用
 * @param {object} props qiankun 下发的 props(含 container / store / eventBus / widgetMode 等)
 */
function render(props = {}) {
  const { container } = props

  // ---------- 1. 建立应用内共享上下文 ----------
  // 主应用下发(qiankun 模式):实现"一份 store 九端共享"
  // 本地创建(独立运行兜底):注意!独立运行时本地实例无法与其它应用通信
  setSharedContext({
    store: props.store || createAppStore(),
    eventBus: props.eventBus || createEventBus(),
    qiankun: {
      powered: !!qiankunWindow.__POWERED_BY_QIANKUN__,
      setGlobalState: props.setGlobalState,
      onGlobalStateChange: props.onGlobalStateChange
    },
    widgetMode: !!props.widgetMode
  })

  // ---------- 2. 创建路由(坑点:base 与 history 模式分流) ----------
  if (props.widgetMode) {
    // ID 容器挂载:URL 属于主应用,子应用必须用内存路由并直接定位到 /widget
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    router.push('/widget')
  } else {
    // 【关键坑点修复】qiankun 模式下使用 memory history,不操作 history API,
    // 避免子应用 vue-router 与基座 vue-router 共享 history.state 互相覆盖,
    // 导致基座 replaceState 安全错误 + 侧边栏导航间歇性卡死(高频坑点)
    // standalone 模式保留 web history,独立开发时 URL 正常变化可刷新
    router = createRouter({
      history: qiankunWindow.__POWERED_BY_QIANKUN__
        ? createMemoryHistory()
        : createWebHistory('/'),
      routes
    })
  }

  // ---------- 3. 创建并挂载 Vue 应用 ----------
  // widgetMode 透传给根组件,用于隐藏应用内导航(见 App.vue)
  app = createApp(App, { widgetMode: !!props.widgetMode })
  // Pinia 挂在 app 实例上(而非模块级单例),随 unmount 一起销毁,杜绝状态残留
  app.use(createPinia())
  app.use(router)
  // 坑点:容器选择 —— qiankun 模式下必须从 props.container 内部找 #app,
  // 直接用 document.querySelector('#app') 可能命中其它应用或主应用的同名节点
  app.mount(container ? container.querySelector('#app') : '#app')
}

// ---------- qiankun 生命周期注册 ----------
renderWithQiankun({
  /** 首次加载前调用(仅一次),适合做全局准备工作 */
  bootstrap() {
    // eslint-disable-next-line no-console
    console.log('[app-vue3-report] bootstrap')
  },
  /** 每次进入应用调用(可能多次) */
  mount(props) {
    // eslint-disable-next-line no-console
    console.log('[app-vue3-report] mount', props)
    render(props)
  },
  /** 每次离开应用调用(可能多次),必须做完整清理 */
  unmount() {
    // eslint-disable-next-line no-console
    console.log('[app-vue3-report] unmount')
    // 【坑点】先清理 router 再销毁 Vue 应用,避免操作已卸载的组件
    router?.destroy()
    app?.unmount()
    app = null
    router = null
  },
  /** props 更新时调用(可选) */
  update() {}
})

// ---------- 独立运行(非 qiankun 环境)直接渲染 ----------
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
