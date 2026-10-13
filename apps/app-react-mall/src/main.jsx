/**
 * 积分商城子应用入口(React 版)
 * ---------------------------------------------------------------
 * 【qiankun 生命周期接入 —— 所有子应用的统一范式】
 * renderWithQiankun 由 vite-plugin-qiankun 提供,注册 bootstrap/mount/unmount;
 * 独立运行(standalone)时不走 qiankun,直接 render() 挂载到本页面 #root。
 *
 * 【React 18 专属坑点清单】
 * 1. createRoot 创建的 root 在 unmount 时必须调用 root.unmount(),
 *    否则 React 组件树、effect 定时器、订阅全部泄漏,且下次 mount 时
 *    对已挂载容器再次 createRoot 会抛警告(高频坑点);
 * 2. 容器查找:qiankun 模式下必须 props.container.querySelector('#root'),
 *    直接用 document.querySelector('#root') 可能命中主应用或其它子应用的同名节点;
 * 3. 路由 base:qiankun 模式下 basename 为 '/app-react-mall'(与主应用
 *    activeRule 一致),独立运行为 '/',否则刷新后路由 404;
 * 4. 不使用 <React.StrictMode>:dev 下它会双调用 effect,
 *    会让"订阅/退订"演示日志翻倍,干扰对通信机制的理解;
 * 5. 共享 store/eventBus 必须优先取 props 下发值,standalone 才本地兜底。
 */
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createAppStore, createEventBus } from '@micro/shared'
import App from './App.jsx'
import { setSharedContext } from './shared-context'
import './styles/global.css'

/** 当前 React root 实例(unmount 时必须销毁并置空) */
let root = null

/**
 * 渲染函数:qiankun mount 与 standalone 启动共用
 * @param {object} props qiankun 下发的 props(含 container / store / eventBus / setGlobalState 等)
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

  // ---------- 2. 查找挂载容器 ----------
  // 坑点:qiankun 模式下 props.container 是主应用提供的包裹节点,
  // 本应用的 index.html 片段已被插入其中,必须在其内部找 #root
  const mountNode = container
    ? container.querySelector('#root')
    : document.querySelector('#root')

  // ---------- 3. 创建 React root 并渲染 ----------
  // 【关键坑点修复】qiankun 模式下用 MemoryRouter,不操作 history API,
  // 避免子应用 react-router 与基座 vue-router 共享 history.state 互相覆盖,
  // 导致基座 replaceState 安全错误 + 侧边栏导航间歇性卡死(高频坑点)
  // standalone 模式保留 BrowserRouter,独立开发时 URL 正常变化可刷新
  const powered = !!qiankunWindow.__POWERED_BY_QIANKUN__
  root = createRoot(mountNode)
  root.render(
    powered ? (
      <MemoryRouter>
        <App widgetMode={!!props.widgetMode} />
      </MemoryRouter>
    ) : (
      <BrowserRouter>
        <App widgetMode={!!props.widgetMode} />
      </BrowserRouter>
    )
  )
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
    // 关键:销毁 React root,触发所有组件的 effect 清理函数
    root?.unmount()
    root = null
  }
})

// ---------- 独立运行(非 qiankun 环境)直接渲染 ----------
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
