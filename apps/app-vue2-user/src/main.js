/**
 * 用户中心子应用入口(Vue2.7 + vue-router@3,Options API)
 * ---------------------------------------------------------------
 * 【qiankun 生命周期接入 —— Vue2 版统一范式】
 * renderWithQiankun 由 vite-plugin-qiankun 提供,注册 bootstrap/mount/unmount;
 * 独立运行(standalone)时不走 qiankun,直接 render() 挂载到本页面 #app。
 *
 * 【与 Vue3 新项目的差异点(老项目接入关键)】
 *   1. 创建实例方式:new Vue({ router, render: h => h(App) }).$mount(el)
 *      而不是 createApp().use(router).mount(el);
 *   2. 路由:new VueRouter({ mode: 'history', base, routes }),
 *      base 同样在 qiankun / standalone 两种模式下分流;
 *   3. 卸载:instance.$destroy() 销毁实例,并手动清空容器 innerHTML
 *      (Vue2 的 $destroy 不会移除 DOM,这是与 Vue3 app.unmount() 的差异坑点)。
 *
 * 【坑点清单】
 * 1. 路由 base 必须区分:qiankun 模式下 base 为 '/app-vue2-user',独立运行为 '/';
 * 2. router 实例在每次 render 时新建,避免反复 mount 时路由状态残留;
 * 3. unmount 必须 $destroy + 清空容器,否则内存泄漏、DOM 残留;
 * 4. 主应用下发的 store/eventBus 通过 props 拿到后,放进模块级上下文供各页面使用。
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createAppStore, createEventBus } from '@micro/shared'
import App from './App.vue'
import routes from './router'
import { setSharedContext } from './shared-context'
import './styles/index.css'

// Vue2 路由以插件方式全局安装(Vue3 则是 app.use(router))
Vue.use(VueRouter)
// 关闭生产环境提示,老项目常见配置
Vue.config.productionTip = false

/** 当前 Vue 根实例(unmount 时销毁) */
let instance = null

/**
 * 渲染函数:qiankun mount 与 standalone 启动共用
 * @param {object} props qiankun 下发的 props(含 container / store / eventBus 等)
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
    }
  })

  // ---------- 2. 创建路由(坑点:base 必须按运行模式分流) ----------
  // 【关键坑点修复】qiankun 模式下用 abstract(内存)路由,不操作 history API,
  // 避免子应用 vue-router 与基座 vue-router 共享 history.state 互相覆盖,
  // 导致基座 replaceState 安全错误 + 侧边栏导航间歇性卡死(高频坑点)
  // standalone 模式保留 history,独立开发时 URL 正常变化可刷新
  const router = new VueRouter({
    mode: qiankunWindow.__POWERED_BY_QIANKUN__ ? 'abstract' : 'history',
    base: qiankunWindow.__POWERED_BY_QIANKUN__ ? '/app-vue2-user' : '/',
    routes
  })
  // 【坑点】abstract 模式不监听 URL,必须手动 push 一次触发首次路由匹配,
  // 否则 <router-view> 不渲染(history 模式自动匹配当前 URL,不需要)
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    router.push('/')
  }

  // ---------- 3. 创建并挂载 Vue 根实例 ----------
  // 坑点:容器选择 —— qiankun 模式下必须从 props.container 内部找 #app,
  // 直接用 document.querySelector('#app') 可能命中其它应用或主应用的同名节点
  instance = new Vue({
    router,
    render: (h) => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

// ---------- qiankun 生命周期注册 ----------
renderWithQiankun({
  /** 首次加载前调用(仅一次),适合做全局准备工作 */
  bootstrap() {
    // eslint-disable-next-line no-console
    console.log('[app-vue2-user] bootstrap')
  },
  /** 每次进入应用调用(可能多次) */
  mount(props) {
    // eslint-disable-next-line no-console
    console.log('[app-vue2-user] mount', props)
    render(props)
  },
  /** 每次离开应用调用(可能多次),必须做完整清理 */
  unmount() {
    // eslint-disable-next-line no-console
    console.log('[app-vue2-user] unmount')
    // Vue2 的 $destroy 只销毁实例与监听,不会移除已挂载的 DOM,需手动清空
    instance.$destroy()
    instance.$el.innerHTML = ''
    instance = null
  }
})

// ---------- 独立运行(非 qiankun 环境)直接渲染 ----------
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
