/**
 * 内容管理子应用入口(React 版)
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
 * 3. widgetMode:主应用聚合页通过 loadMicroApp 以 ID 容器挂载本应用时置 true,
 *    此时使用 <MemoryRouter initialEntries={['/widget']}> 直接定位到 /widget,
 *    URL 属于主应用,不能用 BrowserRouter(否则刷新 404、回退影响主应用);
 * 4. 共享 store/eventBus 必须优先取 props 下发值,standalone 才本地兜底;
 * 5. 本应用被主应用以 strictStyleIsolation(Shadow DOM)挂载,见 StylePage 讲解。
 */
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createAppStore, createEventBus } from '@micro/shared'
import App from './App.jsx'
import AppRoutes from './AppRoutes.jsx'
import { setSharedContext } from './shared-context'
import './styles/global.css'

/** 当前 React root 实例(unmount 时必须销毁并置空) */
let root = null

/**
 * MutationObserver:同步 document.head 的 <style> 到 Shadow DOM
 * ---------------------------------------------------------------
 * 【Shadow DOM + Vite 经典坑点】
 * qiankun strictStyleIsolation 把子应用 DOM 挂载进 Shadow DOM,
 * 但 Vite dev 模式下 CSS 是通过 JS import 动态注入 <style> 到 document.head,
 * 这些样式在 Shadow DOM 外,无法命中 Shadow DOM 内的元素 → 样式丢失。
 * 用 MutationObserver 把 document.head 的新 <style> 克隆到 Shadow DOM 内即可修复。
 */
let styleObserver = null

/**
 * 查找本应用的 Shadow DOM root
 * qiankun 创建的 wrapper div(id 含 qiankun_microapp_wrapper)是 Shadow DOM 的 host
 * 需要处理多种 container 传入形式:ShadowRoot / wrapper div / 父容器
 */
function findShadowRoot(container) {
  // 情况1:container 本身就是 ShadowRoot(有 host 和 mode 属性)
  if (container?.host && container?.mode) return container
  // 情况2:container 自己有 shadowHost(wrapper div 本身)
  if (container?.shadowRoot) return container.shadowRoot
  // 情况3:container 的子元素中有 wrapper div(父容器 → wrapper div)
  const child = container?.querySelector?.('[id*="qiankun_microapp_wrapper"]')
  if (child?.shadowRoot) return child.shadowRoot
  // 情况4:全局查找 wrapper div(兜底)
  const globalEl = document.querySelector('[id*="qiankun_microapp_wrapper_for_app_react_cms"]')
  if (globalEl?.shadowRoot) return globalEl.shadowRoot
  // eslint-disable-next-line no-console
  console.warn('[app-react-cms] findShadowRoot: 未找到 Shadow DOM, container=', container)
  return null
}

/**
 * 启动样式同步:把 document.head 已有的 <style>/<link> 克隆到 Shadow DOM,
 * 并监听后续新增(Vite HMR 热更新样式时自动同步)
 */
function startStyleSync(container) {
  const shadowRoot = findShadowRoot(container)
  if (!shadowRoot) {
    // Shadow DOM 还没创建,延迟 200ms 重试(最多重试 5 次)
    let retries = (container._syncRetries = (container._syncRetries || 0) + 1)
    if (retries <= 5) {
      setTimeout(() => startStyleSync(container), 200)
    }
    return
  }

  // 同步已有的 <style> 标签(Vite 已注入的 CSS Modules)
  // 【关键】只克隆属于本应用(app-react-cms)的 Vite CSS,排除:
  // 1. 手动注入的全局污染样式(id 以 pf- 开头)
  // 2. 基座的 Vite 样式(data-vite-dev-id 路径含 apps/portal/)—— 可能含全局标签选择器
  // 3. 无 data-vite-dev-id 的样式(浏览器扩展注入等)
  // 否则基座的全局样式被克隆进 Shadow DOM,污染子应用,隔离形同虚设!
  const existing = document.head.querySelectorAll('style')
  let synced = 0
  existing.forEach((style) => {
    if (style.id && style.id.startsWith('pf-')) return
    const devId = style.getAttribute('data-vite-dev-id') || ''
    if (!devId || !devId.includes('app-react-cms')) return
    shadowRoot.appendChild(style.cloneNode(true))
    synced++
  })
  // eslint-disable-next-line no-console
  console.log(`[app-react-cms] 同步 ${synced}/${existing.length} 个 <style> 到 Shadow DOM`)

  // 监听 document.head 新增的 <style>/<link>(Vite HMR 热更新)
  styleObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName !== 'STYLE' && node.tagName !== 'LINK') continue
        if (node.id && node.id.startsWith('pf-')) continue
        const devId = node.getAttribute('data-vite-dev-id') || ''
        if (!devId || !devId.includes('app-react-cms')) continue
        shadowRoot.appendChild(node.cloneNode(true))
      }
    }
  })
  styleObserver.observe(document.head, { childList: true, subtree: false })
}

/**
 * 停止样式同步:断开 Observer(unmount 时调用)
 */
function stopStyleSync() {
  styleObserver?.disconnect()
  styleObserver = null
}

/**
 * 渲染函数:qiankun mount 与 standalone 启动共用
 * @param {object} props qiankun 下发的 props(含 container / store / eventBus / widgetMode 等)
 */
function render(props = {}) {
  const { container } = props

  // ---------- 1. 建立应用内共享上下文 ----------
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
  // 坑点:Router 必须包裹整个 App(App 内的 NavLink 依赖 Router 上下文),
  // 不能把 Router 作为 children 传进 App —— 那样导航区不在 Router 内会报错
  // 【关键坑点修复】qiankun 模式下一律用 MemoryRouter,避免与基座 vue-router
  // 共享 history API 导致 popstate/replaceState 冲突 + 侧边栏导航卡死
  // (widgetMode 定位 /widget;非 widget 但 qiankun 模式也从 / 开始)
  // standalone 模式保留 BrowserRouter,独立开发时 URL 正常变化可刷新
  root = createRoot(mountNode)
  const widgetMode = !!props.widgetMode
  const powered = !!qiankunWindow.__POWERED_BY_QIANKUN__
  root.render(
    widgetMode || powered ? (
      <MemoryRouter initialEntries={widgetMode ? ['/widget'] : ['/']}>
        <App widgetMode={widgetMode}>
          <AppRoutes />
        </App>
      </MemoryRouter>
    ) : (
      <BrowserRouter>
        <App widgetMode={false}>
          <AppRoutes />
        </App>
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
    // 【Shadow DOM 坑点修复】同步 document.head 的样式到 Shadow DOM 内,
    // 否则 Vite dev 模式下 CSS 注入到 document.head,Shadow DOM 内看不到样式
    startStyleSync(props.container)
  },
  /** 每次离开应用调用(可能多次),必须做完整清理 */
  unmount() {
    // 关键:销毁 React root,触发所有组件的 effect 清理函数
    root?.unmount()
    root = null
    // 断开样式同步 Observer(防泄漏)
    stopStyleSync()
  }
})

// ---------- 独立运行(非 qiankun 环境)直接渲染 ----------
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
