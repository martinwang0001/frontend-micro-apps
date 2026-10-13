/**
 * 发布订阅事件总线(跨应用解耦通信)
 * ---------------------------------------------------------------
 * 【与全局 Store 的分工】
 *   - Store: 管"状态"——需要被多端持续展示、可回放的数据(用户、主题、购物车)
 *   - Bus:   管"事件"——一次性动作通知(埋点上报、日志写入、即时通知)
 *
 * 【坑点提示】
 * 1. 同样存在多实例问题,必须由主应用创建后经 qiankun props 下发;
 * 2. 组件卸载时必须 off,否则微应用反复挂载会叠加监听器(消息被消费 N 次),
 *    这是微前端通信最高频的 bug 之一;
 * 3. 事件名统一使用 constants.js 中的 GLOBAL_EVENTS,杜绝魔法字符串。
 */

/**
 * 创建一个事件总线
 * @returns {{
 *   on(event: string, fn: Function): () => void,
 *   once(event: string, fn: Function): () => void,
 *   off(event: string, fn?: Function): void,
 *   emit(event: string, payload?: any): void,
 *   clear(): void
 * }}
 */
export function createEventBus() {
  /** 事件名 -> 回调集合(Map<event, Set<fn>>) */
  const pool = new Map()

  /**
   * 订阅事件
   * @param {string} event 事件名(建议取自 GLOBAL_EVENTS)
   * @param {Function} fn 回调,接收 emit 时传入的 payload
   * @returns {() => void} 退订函数,等价于 off(event, fn),便于组件卸载时调用
   */
  const on = (event, fn) => {
    if (!pool.has(event)) pool.set(event, new Set())
    pool.get(event).add(fn)
    return () => off(event, fn)
  }

  /**
   * 只订阅一次:触发后自动退订
   * @param {string} event 事件名
   * @param {Function} fn 回调
   * @returns {() => void} 退订函数
   */
  const once = (event, fn) => {
    /** 包装一层,触发后先退订再执行,避免重复触发 */
    const wrapper = (payload) => {
      off(event, wrapper)
      fn(payload)
    }
    return on(event, wrapper)
  }

  /**
   * 取消订阅
   * @param {string} event 事件名
   * @param {Function} [fn] 指定回调;不传则清空该事件的所有订阅(慎用)
   */
  const off = (event, fn) => {
    const set = pool.get(event)
    if (!set) return
    if (fn) set.delete(fn)
    else set.clear()
    if (set.size === 0) pool.delete(event)
  }

  /**
   * 发布事件
   * 单个订阅者异常不应阻断其余订阅者,也不应影响发布方
   * @param {string} event 事件名
   * @param {*} [payload] 事件载荷
   */
  const emit = (event, payload) => {
    const set = pool.get(event)
    if (!set) return
    // 拷贝一份再遍历,防止回调中 off/on 导致遍历过程中集合被修改
    ;[...set].forEach((fn) => {
      try {
        fn(payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[event-bus] 事件「${event}」的订阅回调执行异常:`, err)
      }
    })
  }

  /** 清空全部订阅(一般只在主应用销毁/测试场景使用) */
  const clear = () => pool.clear()

  return { on, once, off, emit, clear }
}
