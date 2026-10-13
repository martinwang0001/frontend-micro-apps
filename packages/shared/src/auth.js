import { STORAGE_KEYS } from './constants.js'

/**
 * 鉴权凭证管理器
 * ---------------------------------------------------------------
 * 【跨应用登录态同步策略】
 * 各子应用部署在不同端口/子路径,Cookie 域控复杂,demo 采用 localStorage:
 *   1. 任一应用登录成功后调用 TokenManager.set(),写入 localStorage;
 *   2. 同时通过事件总线广播 USER_LOGIN,通知在线应用即时刷新;
 *   3. 未在线的应用下次挂载时从 localStorage 读取,实现"后挂载同步";
 *   4. localStorage 的 key 统一走 STORAGE_KEYS,带 MICRO_DEMO_ 前缀防止污染。
 *
 * 【坑点】
 * localStorage 的 storage 事件只在"其它"页签/上下文触发,同一页面内
 * 写入方自己是收不到 storage 事件的,所以必须配合事件总线做页内同步。
 */
export class TokenManager {
  /**
   * @param {{ eventBus?: import('./event-bus.js').createEventBus extends () => infer R ? R : never }} [options]
   *        可选注入事件总线,注入后 set/clear 会自动广播登录态变化
   */
  constructor(options = {}) {
    this.eventBus = options.eventBus || null
  }

  /**
   * 读取 token
   * @returns {string} token 字符串,不存在时返回空串
   */
  get() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || ''
  }

  /**
   * 写入 token(模拟登录成功)
   * @param {string} token
   */
  set(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }

  /** 清除 token(登出) */
  clear() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  /** 是否已登录 */
  isLogin() {
    return !!this.get()
  }
}
