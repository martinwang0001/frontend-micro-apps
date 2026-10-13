/**
 * qiankun 装配中心
 * ---------------------------------------------------------------
 * 职责:
 *  1. initGlobalState  —— 初始化 qiankun 官方全局状态(机制②)
 *  2. registerMicroApps —— 注册 8 个子应用,统一下发共享实例(props)
 *  3. start             —— 启动 qiankun(预加载 / 沙箱 / 全局错误处理)
 *
 * 【坑点备忘】
 *  - start({ prefetch: 'all' }) 在首屏空闲时预取所有子应用资源,加快切换;
 *    但低端机/弱网下可改为 prefetch: true(只预取"即将进入"的应用)。
 *  - 生命周期钩子(beforeMount/afterUnmount 等)是企业级埋点、Loading、
 *    权限回收的挂点,本 demo 用它们维护"应用挂载状态表"。
 */
import {
  registerMicroApps,
  start,
  initGlobalState,
  addGlobalUncaughtErrorHandler
} from 'qiankun'
import { microApps } from './registry'
import { appStore, eventBus } from './instances'
import { GLOBAL_STATE_KEYS, GLOBAL_EVENTS } from '@micro/shared'
import { useGlobalStore } from '../store/global'
import { qiankunActionsRef } from './actions-holder'

/**
 * 装配并启动微前端运行时
 * @param {{ onStatusChange: (name: string, phase: string) => void }} hooks 挂载状态回调
 */
export function setupMicroApps(hooks = {}) {
  const global = useGlobalStore()

  // ---------- ① qiankun 官方 GlobalState(机制②) ----------
  // 与共享 Store 的区别:GlobalState 是 qiankun 内置的"主从双向通道",
  // 适合小而关键的全局字段(主题、消息);复杂领域状态走共享 Store(机制①)。
  const qiankunActions = initGlobalState({
    [GLOBAL_STATE_KEYS.THEME]: 'light',
    [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: '',
    [GLOBAL_STATE_KEYS.ONLINE_COUNT]: microApps.length
  })

  // 主应用监听:任何子应用 setGlobalState 都会触发
  qiankunActions.onGlobalStateChange((state, prev) => {
    // 同步进 Pinia,驱动基座 UI(如顶栏主题、消息条)
    global.setQiankunState(state)

    // 主题字段变化时同时写入共享 Store,保证两种机制数据一致(防漂移)
    if (state[GLOBAL_STATE_KEYS.THEME] !== prev[GLOBAL_STATE_KEYS.THEME]) {
      appStore.actions.setTheme(state[GLOBAL_STATE_KEYS.THEME])
    }

    // 全局消息字段变化时落入消息中心
    const msg = state[GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]
    if (msg && msg !== prev[GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]) {
      appStore.actions.pushMessage({ from: 'GlobalState', text: msg, level: 'info' })
    }
  })

  // 暴露给页面组件使用(通信实验室等需要主动 setGlobalState)
  qiankunActionsRef.value = qiankunActions

  // ---------- ② 事件总线订阅(机制③) ----------
  // 基座自身也订阅总线,把子应用事件汇聚到消息中心 / 事件日志
  eventBus.on(GLOBAL_EVENTS.NOTIFY, (payload) => {
    appStore.actions.pushMessage({ from: payload?.from || 'unknown', text: payload?.text || '', level: 'info' })
    global.appendEventLog({ type: GLOBAL_EVENTS.NOTIFY, payload })
  })
  eventBus.on(GLOBAL_EVENTS.LOG_WRITE, (payload) => {
    global.appendEventLog({ type: GLOBAL_EVENTS.LOG_WRITE, payload })
  })

  // ---------- ③ 注册子应用 ----------
  // 【关键坑点】qiankun registerMicroApps 路由模式只读 start() 的全局 sandbox 配置,
  // 不读 registerMicroApps 中的应用级 sandbox 字段!因此:
  // - 大多数应用通过全局 start({ sandbox: { experimentalStyleIsolation } }) 启用 scoped 隔离
  // - react-cms 需要 Shadow DOM(strictStyleIsolation),必须从 registerMicroApps 中移除,
  //   改由 SubappView.vue 中 loadMicroApp 手动加载(loadMicroApp 支持应用级 sandbox 配置)
  registerMicroApps(
    microApps
      .filter((app) => app.name !== 'app-react-cms')
      .map((app) => ({
        name: app.name,
        entry: app.entry,
        // 路由挂载的统一容器(由 SubappView 渲染)
        container: '#subapp-viewport',
        activeRule: (location) => location.pathname.startsWith(app.activeRule),
        // 关键:把共享实例与 qiankun 能力通过 props 注入每个子应用
        props: {
          store: appStore,
          eventBus,
          appTitle: app.title
        }
      })),
    {
      /** 挂载前(可在此处展示 Loading、做权限校验) */
      beforeMount: (app) => {
        hooks.onStatusChange?.(app.name, 'beforeMount')
        global.markAppStatus(app.name, 'mounting')
        return Promise.resolve()
      },
      /** 挂载完成 */
      afterMount: (app) => {
        hooks.onStatusChange?.(app.name, 'afterMount')
        global.markAppStatus(app.name, 'mounted')
        return Promise.resolve()
      },
      /** 卸载完成(适合回收权限、上报停留时长) */
      afterUnmount: (app) => {
        hooks.onStatusChange?.(app.name, 'afterUnmount')
        global.markAppStatus(app.name, 'unmounted')
        return Promise.resolve()
      }
    }
  )

  // ---------- ④ 全局错误处理(子应用脚本异常不会拖垮基座) ----------
  addGlobalUncaughtErrorHandler((event) => {
    // eslint-disable-next-line no-console
    console.error('[qiankun] 全局捕获到子应用异常:', event)
    global.appendEventLog({ type: 'error', payload: String(event?.reason || event) })
  })

  // ---------- ⑤ 启动 ----------
  start({
    // 预加载:首屏空闲时预取子应用资源,切换秒开(可部署性/性能工程的一环)
    prefetch: 'all',
    // 允许多个微应用同时处于激活状态(聚合页手动挂载多个 widget 的前提)
    singular: false,
    // 【关键坑点修复】全局 sandbox 配置 —— registerMicroApps 路由模式只读这里!
    // 设为 experimentalStyleIsolation( scoped 隔离):给子应用所有 CSS 选择器加
    // div[data-qiankun] 前缀,防子应用样式泄漏到基座/其他应用
    // (react-cms 的 Shadow DOM 隔离由 SubappView loadMicroApp 手动加载实现)
    sandbox: { experimentalStyleIsolation: true }
  })

  return { qiankunActions }
}
