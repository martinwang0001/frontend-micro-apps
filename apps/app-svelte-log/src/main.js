/**
 * 日志中心子应用入口(Svelte 版)
 * ---------------------------------------------------------------
 * 【qiankun 生命周期接入 —— 所有子应用的统一范式】
 * renderWithQiankun 由 vite-plugin-qiankun 提供,注册 bootstrap/mount/unmount;
 * 独立运行(standalone)时不走 qiankun,直接 render() 挂载到本页面 #app。
 *
 * 【Svelte 与 Vue 范式的差异点】
 * 1. Svelte 组件是"类",通过 new App({ target, props }) 挂载,destroy 用 app.$destroy();
 * 2. Svelte 无官方路由库 —— 本应用用本地状态切换页签(App.svelte 中的 activeTab)。
 *    这反而是微前端友好点:子应用没有路由,就不会与主应用路由产生任何冲突,
 *    也不需要像 Vue 子应用那样区分 history/memory 路由与 base 路径。
 *
 * 【坑点清单】
 * 1. unmount 必须调用 app.$destroy() 并置空 —— 它会级联触发所有组件的 onDestroy,
 *    事件总线的手动订阅(LogList.svelte)正是在那里退订;
 * 2. 容器选择:qiankun 模式下必须从 props.container 内部找 #app,
 *    直接用 document.querySelector('#app') 可能命中其它应用或主应用的同名节点;
 * 3. 主应用下发的 store/eventBus 通过 props 拿到后,要放进模块级上下文供各组件使用。
 */
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createAppStore, createEventBus } from '@micro/shared'
import App from './App.svelte'
import { setSharedContext } from './shared-context'
import './styles/index.css'

/** 当前 Svelte 组件实例(unmount 时销毁) */
let app = null

/**
 * 渲染函数:qiankun mount 与 standalone 启动共用
 * @param {object} props qiankun 下发的 props(含 container / store / eventBus / widgetMode 等)
 */
function render(props = {}) {
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

  // ---------- 2. 创建并挂载 Svelte 根组件 ----------
  // Svelte 挂载 API:new Component({ target, props })
  app = new App({
    // 坑点:容器选择(见文件头坑点清单第 2 条)
    target: props.container
      ? props.container.querySelector('#app')
      : document.querySelector('#app'),
    props: { widgetMode: !!props.widgetMode }
  })
}

// ---------- qiankun 生命周期注册 ----------
renderWithQiankun({
  /** 首次加载前调用(仅一次),适合做全局准备工作 */
  bootstrap() {},
  /** 每次进入应用调用(可能多次) */
  mount(props) {
    render(props)
  },
  /** 每次离开应用调用(可能多次),必须做完整清理 */
  unmount() {
    // $destroy() 会触发所有组件的 onDestroy,订阅/定时器在那里统一清理
    app?.$destroy()
    app = null
  }
})

// ---------- 独立运行(非 qiankun 环境)直接渲染 ----------
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
