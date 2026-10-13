/**
 * 应用级共享上下文(模块级持有者)
 * ---------------------------------------------------------------
 * 【为什么需要它】
 * 主应用下发的 store / eventBus / qiankun 方法只在入口 mount 的 props 里出现一次,
 * React 组件树不可能层层 props 透传,因此挂载时写入本模块,页面中随时取用。
 *
 * 【坑点 —— 为什么各页面不能直接 import '@micro/shared' 后 new 一个实例】
 * 每个子应用是独立的构建产物 / 独立的源,浏览器中各有一份 @micro/shared 模块副本,
 * 各自 new 出来的 store 互不相同,跨应用共享立即失效。
 * => 必须由主应用创建唯一实例,经 qiankun props 下发(见 main.jsx),
 *    本应用仅在独立运行(standalone)时才 new 一份兜底。
 */

/** 模块级上下文对象 */
let context = {
  /** 全局共享 store(主应用下发;独立运行时为本应用自建兜底实例) */
  store: null,
  /** 全局事件总线(主应用下发;独立运行时为本应用自建兜底实例) */
  eventBus: null,
  /** qiankun 能力 { powered, setGlobalState, onGlobalStateChange } */
  qiankun: { powered: false },
  /** 是否以 ID 容器 widget 模式挂载(商城暂不使用,但保留字段保持范式一致) */
  widgetMode: false
}

/**
 * 入口挂载时写入上下文(main.jsx render 时调用)
 * @param {object} ctx
 */
export function setSharedContext(ctx) {
  context = { ...context, ...ctx }
}

/**
 * 页面/组件中读取上下文
 * 注意:必须在 main.jsx 的 render() 之后调用(组件渲染期间满足该条件)
 * @returns {typeof context}
 */
export function getSharedContext() {
  return context
}
