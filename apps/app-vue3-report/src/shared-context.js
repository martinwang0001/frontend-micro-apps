/**
 * 应用级共享上下文(模块级持有者)
 * ---------------------------------------------------------------
 * 【为什么需要它】
 * 主应用下发的 store / eventBus / qiankun 方法只在入口 mount 的 props 里出现一次,
 * 各页面组件不可能层层 props 传递,因此挂载时写入本模块,页面中随时取用。
 *
 * 【坑点 —— 为什么各页面不能直接 import '@micro/shared' 后 new 一个实例】
 * 每个子应用是独立的构建产物 / 独立的源,浏览器中各有一份 @micro/shared 模块副本,
 * 各自 new 出来的 store 互不相同,跨应用共享立即失效。
 * => 必须由主应用创建唯一实例,经 qiankun props 下发(见 main.js)。
 *
 * 【与本地 Pinia 的边界】
 * 本上下文里的 store 是"跨应用共享"的唯一通道(九端同步);
 * 本应用私有的业务状态(如报表列表)请走 src/store/report.js 的本地 Pinia,
 * 二者互不替代,详见 HomeView 的对比展示。
 */

/** 模块级上下文对象 */
let context = {
  /** 全局共享 store(主应用下发) */
  store: null,
  /** 全局事件总线(主应用下发) */
  eventBus: null,
  /** qiankun 能力 { powered, setGlobalState, onGlobalStateChange } */
  qiankun: { powered: false },
  /** 是否以 ID 容器 widget 模式挂载 */
  widgetMode: false
}

/**
 * 入口挂载时写入上下文
 * @param {object} ctx
 */
export function setSharedContext(ctx) {
  context = { ...context, ...ctx }
}

/**
 * 页面/组件中读取上下文
 * @returns {typeof context}
 */
export function getSharedContext() {
  return context
}
